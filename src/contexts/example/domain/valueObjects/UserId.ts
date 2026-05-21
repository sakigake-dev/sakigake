import { DomainError } from "../errors/DomainError";

// Clerk user ID は "user_xxxxx" 形式
const USER_ID_REGEX = /^user_[a-zA-Z0-9]+$/;

export class UserId {
  private constructor(readonly value: string) {}

  static from(value: string): UserId {
    if (!USER_ID_REGEX.test(value)) {
      throw new DomainError(
        `Invalid UserId: '${value}'. Must match Clerk user ID format (user_*).`,
      );
    }
    return new UserId(value);
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
