import { DomainError } from "../errors/DomainError";

export type TenantStatusValue = "active" | "suspended";

export class TenantStatus {
  private constructor(readonly value: TenantStatusValue) {}

  static active(): TenantStatus {
    return new TenantStatus("active");
  }

  static suspended(): TenantStatus {
    return new TenantStatus("suspended");
  }

  static from(value: string): TenantStatus {
    if (value !== "active" && value !== "suspended") {
      throw new DomainError(
        `Invalid TenantStatus: '${value}'. Must be 'active' or 'suspended'`,
      );
    }
    return new TenantStatus(value as TenantStatusValue);
  }

  isActive(): boolean {
    return this.value === "active";
  }

  isSuspended(): boolean {
    return this.value === "suspended";
  }

  equals(other: TenantStatus): boolean {
    return this.value === other.value;
  }
}
