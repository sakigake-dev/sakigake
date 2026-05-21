import { TenantId } from "../../domain/valueObjects/TenantId";
import { Subscription } from "../../domain/models/Subscription";
import type { ISubscriptionRepository } from "../../domain/repositories/ISubscriptionRepository";
import type { IEventPublisher } from "../events/IEventPublisher";

export type CreateInitialSubscriptionInput = {
  /**
   * 原始型で受ける — TenantCreated ドメインイベントのペイロードから直接渡される
   * (Plan 002 §1-3 の直接呼び出しフロー)。UseCase 内で TenantId VO に変換する。
   */
  tenantId: string;
};

export type CreateInitialSubscriptionOutput = {
  subscriptionId: string;
};

/**
 * Tenant 作成時に初期サブスクリプション (plan=free) を生成する UseCase。
 *
 * 連携フロー (Plan 002 §1-3):
 * tenant context の Webhook ハンドラが CreateTenantUseCase.execute() を呼んだ後、
 * 同期的にこの UseCase を呼び出す。将来 Inngest 等の非同期 EventBus に移行する際は
 * この UseCase を subscriber として登録する。
 *
 * 冪等性 (Plan 002 R-05):
 * findByTenantId() で既存 Subscription が見つかった場合は既存の subscriptionId を
 * 返して終了する。Webhook の重複送信でも二重作成されない。
 */
export class CreateInitialSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly eventPublisher?: IEventPublisher,
  ) {}

  async execute(
    input: CreateInitialSubscriptionInput,
  ): Promise<CreateInitialSubscriptionOutput> {
    const tenantId = TenantId.from(input.tenantId);

    const existing = await this.subscriptionRepository.findByTenantId(tenantId);
    if (existing !== null) {
      return { subscriptionId: existing.id.value };
    }

    const subscription = Subscription.createFree(tenantId);
    await this.subscriptionRepository.save(subscription);

    const events = subscription.pullDomainEvents();
    await this.eventPublisher?.publish(events);

    return { subscriptionId: subscription.id.value };
  }
}
