import type { DomainEvent } from "./DomainEvent";
import type { TenantId } from "../valueObjects/TenantId";
import type { UserId } from "../valueObjects/UserId";

export class MemberRemoved implements DomainEvent {
  readonly eventName = "MemberRemoved";
  readonly occurredAt: Date;

  constructor(
    readonly tenantId: TenantId,
    readonly userId: UserId,
    occurredAt: Date = new Date(),
  ) {
    this.occurredAt = occurredAt;
  }
}
