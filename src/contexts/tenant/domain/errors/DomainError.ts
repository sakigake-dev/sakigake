/**
 * Tenant context のドメインエラー基底クラス。
 *
 * 設計判断: 現時点では各 Bounded Context にコピーを置く方針 (shared kernel 化しない)。
 * 理由: コンテキスト間の結合を避けるため。3コンテキスト以上が同じ基底を必要とした時点で
 * src/shared/domain/DomainError.ts への昇格を検討する (Plan 002 R-04 と同じ判断)。
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
