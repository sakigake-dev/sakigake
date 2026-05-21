import { DomainError } from "../errors/DomainError";

export class SubscriptionId {
  private constructor(readonly value: string) {}

  static generate(): SubscriptionId {
    return new SubscriptionId(crypto.randomUUID());
  }

  static from(value: string): SubscriptionId {
    if (!value || value.trim().length === 0) {
      throw new DomainError("SubscriptionId cannot be empty");
    }
    return new SubscriptionId(value);
  }

  equals(other: SubscriptionId): boolean {
    return this.value === other.value;
  }
}
