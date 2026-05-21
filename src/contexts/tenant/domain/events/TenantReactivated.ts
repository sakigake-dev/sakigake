import type { DomainEvent } from "./DomainEvent";
import type { TenantId } from "../valueObjects/TenantId";

export class TenantReactivated implements DomainEvent {
  readonly eventName = "TenantReactivated";
  readonly occurredAt: Date;

  constructor(
    readonly tenantId: TenantId,
    occurredAt: Date = new Date(),
  ) {
    this.occurredAt = occurredAt;
  }
}
