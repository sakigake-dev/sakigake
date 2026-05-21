import { DomainError } from "../errors/DomainError";

export class UserId {
  private constructor(readonly value: string) {}

  static from(value: string): UserId {
    if (!value.startsWith("user_")) {
      throw new DomainError(
        "UserId must start with 'user_' (Clerk User ID format)",
      );
    }
    return new UserId(value);
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
