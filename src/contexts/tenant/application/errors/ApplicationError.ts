/**
 * Application 層固有の前提条件違反を表す基底クラス。
 *
 * 設計判断: DomainError (ドメインの不変条件違反 → HTTP 422 相当) と区別するために
 * Application 層専用の基底クラスを設ける。
 * Presentation 層は `instanceof ApplicationError` で 404 等にマッピングする。
 * `instanceof DomainError` を先に評価すると ApplicationError が同バケツに落ちるため、
 * 継承ツリーを完全に分離する。
 */
export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApplicationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
