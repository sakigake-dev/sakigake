import { DomainError } from "../errors/DomainError";

export type MemberRoleValue = "owner" | "admin" | "member";

export class MemberRole {
  private constructor(readonly value: MemberRoleValue) {}

  static owner(): MemberRole {
    return new MemberRole("owner");
  }

  static admin(): MemberRole {
    return new MemberRole("admin");
  }

  static member(): MemberRole {
    return new MemberRole("member");
  }

  static from(value: string): MemberRole {
    if (value !== "owner" && value !== "admin" && value !== "member") {
      throw new DomainError(
        `Invalid MemberRole: '${value}'. Must be 'owner', 'admin', or 'member'`,
      );
    }
    return new MemberRole(value as MemberRoleValue);
  }

  isOwner(): boolean {
    return this.value === "owner";
  }

  equals(other: MemberRole): boolean {
    return this.value === other.value;
  }
}
