import type { DomainEvent } from "./DomainEvent";
import type { TenantId } from "../valueObjects/TenantId";

export class TenantSuspended implements DomainEvent {
  readonly eventName = "TenantSuspended";
  readonly occurredAt: Date;

  constructor(
    readonly tenantId: TenantId,
    occurredAt: Date = new Date(),
  ) {
    this.occurredAt = occurredAt;
  }
}
