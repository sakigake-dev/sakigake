import { DomainError } from "../errors/DomainError";

export class TenantId {
  private constructor(readonly value: string) {}

  static generate(): TenantId {
    return new TenantId(crypto.randomUUID());
  }

  static from(value: string): TenantId {
    if (!value || value.trim().length === 0) {
      throw new DomainError("TenantId cannot be empty");
    }
    return new TenantId(value);
  }

  equals(other: TenantId): boolean {
    return this.value === other.value;
  }
}
