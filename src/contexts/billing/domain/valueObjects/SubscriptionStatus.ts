import { DomainError } from "../errors/DomainError";

type SubscriptionStatusValue = "active" | "suspended" | "canceled";

export class SubscriptionStatus {
  private constructor(readonly value: SubscriptionStatusValue) {}

  static active(): SubscriptionStatus {
    return new SubscriptionStatus("active");
  }

  static suspended(): SubscriptionStatus {
    return new SubscriptionStatus("suspended");
  }

  static canceled(): SubscriptionStatus {
    return new SubscriptionStatus("canceled");
  }

  static from(value: string): SubscriptionStatus {
    if (value === "active" || value === "suspended" || value === "canceled") {
      return new SubscriptionStatus(value);
    }
    throw new DomainError(
      `Invalid SubscriptionStatus value: '${value}'. Must be one of: active, suspended, canceled`,
    );
  }

  isActive(): boolean {
    return this.value === "active";
  }

  isSuspended(): boolean {
    return this.value === "suspended";
  }

  isCanceled(): boolean {
    return this.value === "canceled";
  }

  equals(other: SubscriptionStatus): boolean {
    return this.value === other.value;
  }
}
