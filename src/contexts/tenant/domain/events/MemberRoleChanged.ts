import type { DomainEvent } from "./DomainEvent";
import type { TenantId } from "../valueObjects/TenantId";
import type { UserId } from "../valueObjects/UserId";
import type { MemberRole } from "../valueObjects/MemberRole";

export class MemberRoleChanged implements DomainEvent {
  readonly eventName = "MemberRoleChanged";
  readonly occurredAt: Date;

  constructor(
    readonly tenantId: TenantId,
    readonly userId: UserId,
    readonly oldRole: MemberRole,
    readonly newRole: MemberRole,
    occurredAt: Date = new Date(),
  ) {
    this.occurredAt = occurredAt;
  }
}
