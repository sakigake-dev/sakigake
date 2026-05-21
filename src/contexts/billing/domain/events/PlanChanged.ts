import type { DomainEvent } from "./DomainEvent";
import type { SubscriptionId } from "../valueObjects/SubscriptionId";
import type { Plan } from "../valueObjects/Plan";

export class PlanChanged implements DomainEvent {
  readonly eventName = "PlanChanged";
  readonly occurredAt: Date;

  constructor(
    readonly subscriptionId: SubscriptionId,
    readonly oldPlan: Plan,
    readonly newPlan: Plan,
    occurredAt: Date = new Date(),
  ) {
    this.occurredAt = occurredAt;
  }
}
