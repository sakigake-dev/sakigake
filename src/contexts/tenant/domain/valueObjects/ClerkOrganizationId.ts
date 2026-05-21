import { DomainError } from "../errors/DomainError";

export class ClerkOrganizationId {
  private constructor(readonly value: string) {}

  static from(value: string): ClerkOrganizationId {
    if (!value.startsWith("org_")) {
      throw new DomainError(
        "ClerkOrganizationId must start with 'org_' (Clerk Organization ID format)",
      );
    }
    return new ClerkOrganizationId(value);
  }

  equals(other: ClerkOrganizationId): boolean {
    return this.value === other.value;
  }
}
