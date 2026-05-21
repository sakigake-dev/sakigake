/**
 * billing context Application 層固有の前提条件違反を表す基底クラス。
 *
 * 設計判断: DomainError (ドメインの不変条件違反) と区別するために
 * Application 層専用の基底クラスを設ける。Presentation 層は
 * `instanceof ApplicationError` で 404 等にマッピングする。
 *
 * tenant context の ApplicationError と同一の構造だが、コンテキスト間の
 * 結合を避けるためにコピーを置く方針 (Plan 002 R-04 と同じ判断)。
 * 3コンテキスト以上が同じ基底を必要とした時点で
 * src/shared/application/ApplicationError.ts への昇格を検討する。
 */
export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApplicationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
