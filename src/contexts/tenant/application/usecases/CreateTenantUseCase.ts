import { Tenant } from "../../domain/models/Tenant";
import { TenantName } from "../../domain/valueObjects/TenantName";
import { ClerkOrganizationId } from "../../domain/valueObjects/ClerkOrganizationId";
import { UserId } from "../../domain/valueObjects/UserId";
import { MemberRole } from "../../domain/valueObjects/MemberRole";
import type { ITenantRepository } from "../../domain/repositories/ITenantRepository";
import type { IEventPublisher } from "../events/IEventPublisher";

export type CreateTenantInput = {
  clerkOrganizationId: string;
  name: string;
  initialOwnerClerkUserId: string;
};

export type CreateTenantOutput = {
  tenantId: string;
};

/**
 * Clerk Webhook (organization.created) から呼ばれる UseCase。
 *
 * 冪等性: findByClerkOrganizationId でヒットした場合は既存の tenantId を返して終了する。
 * これにより Webhook の再送 (R-05) でも二重作成されない。
 *
 * IEventPublisher は optional で、未注入時は no-op。
 * 将来 billing コンテキストの CreateInitialSubscriptionUseCase をここに subscribe させる。
 *
 * イベント発行失敗時の挙動 (現フェーズの設計判断):
 * save() 成功後の eventPublisher.publish() が throw した場合、UseCase 全体を
 * 失敗として例外を伝播させる。結果として「DB は更新済みだが event 未発行」の
 * 一時的なスキューが発生し得るが、Webhook 再送 (Plan 002 R-05) と Tenant の
 * 冪等性チェックにより最終的に整合する。
 *
 * 永続的 outbox pattern の導入は Recording context で Inngest を入れる時に
 * 検討する (本プロジェクトのロードマップ Phase 2-3 を参照)。
 */
export class CreateTenantUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly eventPublisher?: IEventPublisher,
  ) {}

  async execute(input: CreateTenantInput): Promise<CreateTenantOutput> {
    const clerkOrgId = ClerkOrganizationId.from(input.clerkOrganizationId);

    const existing = await this.tenantRepository.findByClerkOrganizationId(clerkOrgId);
    if (existing !== null) {
      return { tenantId: existing.id.value };
    }

    const name = TenantName.from(input.name);
    const tenant = Tenant.create(name, clerkOrgId);

    const initialOwnerUserId = UserId.from(input.initialOwnerClerkUserId);
    tenant.addMember(initialOwnerUserId, MemberRole.owner());

    await this.tenantRepository.save(tenant);

    const events = tenant.pullDomainEvents();
    await this.eventPublisher?.publish(events);

    return { tenantId: tenant.id.value };
  }
}
