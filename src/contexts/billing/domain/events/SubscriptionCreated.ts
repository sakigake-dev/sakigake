import type { DomainEvent } from "./DomainEvent";
import type { SubscriptionId } from "../valueObjects/SubscriptionId";
import type { TenantId } from "../valueObjects/TenantId";
import type { Plan } from "../valueObjects/Plan";

export class SubscriptionCreated implements DomainEvent {
  readonly eventName = "SubscriptionCreated";
  readonly occurredAt: Date;

  constructor(
    readonly subscriptionId: SubscriptionId,
    readonly tenantId: TenantId,
    readonly plan: Plan,
    occurredAt: Date = new Date(),
  ) {
    this.occurredAt = occurredAt;
  }
}
