/**
 * Application 層のエラー基底クラス。
 *
 * DomainError は不変条件違反 (技術的制約) を表すのに対し、
 * ApplicationError はユースケースとしての失敗 (e.g. 「すでに存在する」「見つからない」) を表す。
 * 上位層 (Presentation) はこの例外を HTTP ステータスにマップする。
 */
export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApplicationError";
  }
}
