import { TenantId } from "../../domain/valueObjects/TenantId";
import { UserId } from "../../domain/valueObjects/UserId";
import { MemberRole } from "../../domain/valueObjects/MemberRole";
import type { ITenantRepository } from "../../domain/repositories/ITenantRepository";
import type { IEventPublisher } from "../events/IEventPublisher";
import { TenantNotFoundError } from "../errors/TenantNotFoundError";

export type AddMemberInput = {
  tenantId: string;
  userClerkId: string;
  role: "owner" | "admin" | "member";
};

/**
 * 既存 Tenant にメンバーを追加する UseCase。
 *
 * Tenant が存在しない場合は TenantNotFoundError を投げる (→ Presentation 層で 404)。
 * 重複メンバー追加など不変条件違反は DomainError として伝播する (→ 422)。
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
export class AddMemberUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly eventPublisher?: IEventPublisher,
  ) {}

  async execute(input: AddMemberInput): Promise<void> {
    const tenantId = TenantId.from(input.tenantId);
    const tenant = await this.tenantRepository.findById(tenantId);
    if (tenant === null) {
      throw new TenantNotFoundError(input.tenantId);
    }

    const userId = UserId.from(input.userClerkId);
    const role = MemberRole.from(input.role);
    tenant.addMember(userId, role);

    await this.tenantRepository.save(tenant);

    const events = tenant.pullDomainEvents();
    await this.eventPublisher?.publish(events);
  }
}
