/**
 * billing context 内の TenantId Value Object。
 *
 * 設計判断: これは billing context 内のコピーである。tenant context の
 * src/contexts/tenant/domain/valueObjects/TenantId.ts とは別の型として扱う。
 * コンテキスト間の結合を避けるためにコピーを置く方針 (Plan 002 R-04)。
 * billing context は TenantId の値 (UUID) のみを参照し、Tenant Aggregate は持たない。
 *
 * 3コンテキスト以上が TenantId を必要とした時点で src/shared/kernel/TenantId.ts
 * への昇格を検討する。
 */
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
