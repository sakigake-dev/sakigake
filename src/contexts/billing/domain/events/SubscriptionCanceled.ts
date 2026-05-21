import type { DomainEvent } from "./DomainEvent";
import type { SubscriptionId } from "../valueObjects/SubscriptionId";

export class SubscriptionCanceled implements DomainEvent {
  readonly eventName = "SubscriptionCanceled";
  readonly occurredAt: Date;

  constructor(
    readonly subscriptionId: SubscriptionId,
    occurredAt: Date = new Date(),
  ) {
    this.occurredAt = occurredAt;
  }
}
