import { TenantId } from "../../domain/valueObjects/TenantId";
import { Plan } from "../../domain/valueObjects/Plan";
import type { ISubscriptionRepository } from "../../domain/repositories/ISubscriptionRepository";
import type { IEventPublisher } from "../events/IEventPublisher";
import { SubscriptionNotFoundError } from "../errors/SubscriptionNotFoundError";

export type ChangePlanInput = {
  tenantId: string;
  newPlanValue: "free" | "starter" | "professional";
};

export type ChangePlanOutput = {
  subscriptionId: string;
};

/**
 * テナントの課金プランを変更する UseCase。
 *
 * Phase 4 (Stripe 導入) の骨格として配置。現フェーズでは Stripe 連携なしで
 * プラン情報を DB に保存するのみ。Phase 4 で Stripe Checkout Session の
 * 作成・切り替え処理をここに追加する。
 *
 * エラーハンドリング:
 * - Subscription が存在しない → SubscriptionNotFoundError (Presentation は 404)
 * - canceled な Subscription に対する変更 → DomainError (Presentation は 400)
 */
export class ChangePlanUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly eventPublisher?: IEventPublisher,
  ) {}

  async execute(input: ChangePlanInput): Promise<ChangePlanOutput> {
    const tenantId = TenantId.from(input.tenantId);

    const subscription = await this.subscriptionRepository.findByTenantId(tenantId);
    if (subscription === null) {
      throw new SubscriptionNotFoundError(input.tenantId);
    }

    const newPlan = Plan.from(input.newPlanValue);
    subscription.upgradePlan(newPlan);

    await this.subscriptionRepository.save(subscription);

    const events = subscription.pullDomainEvents();
    await this.eventPublisher?.publish(events);

    return { subscriptionId: subscription.id.value };
  }
}
