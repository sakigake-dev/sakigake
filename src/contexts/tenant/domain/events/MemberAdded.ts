import type { DomainEvent } from "./DomainEvent";
import type { TenantId } from "../valueObjects/TenantId";
import type { UserId } from "../valueObjects/UserId";
import type { MemberRole } from "../valueObjects/MemberRole";

export class MemberAdded implements DomainEvent {
  readonly eventName = "MemberAdded";
  readonly occurredAt: Date;

  constructor(
    readonly tenantId: TenantId,
    readonly userId: UserId,
    readonly role: MemberRole,
    occurredAt: Date = new Date(),
  ) {
    this.occurredAt = occurredAt;
  }
}
