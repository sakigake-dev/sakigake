import { DomainError } from "../errors/DomainError";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * example context 内の TenantId。
 *
 * tenant / billing context にも同名 VO があるが、それぞれ独立に持つのが DDD の原則。
 * context 境界を越えるときは primitive (string) でやりとりし、各 context 内で
 * VO に変換する (詳細: ADR-0003)。
 */
export class TenantId {
  private constructor(readonly value: string) {}

  static from(value: string): TenantId {
    if (!UUID_REGEX.test(value)) {
      throw new DomainError(
        `Invalid TenantId: '${value}'. Must be a valid UUID.`,
      );
    }
    return new TenantId(value);
  }

  equals(other: TenantId): boolean {
    return this.value === other.value;
  }
}
