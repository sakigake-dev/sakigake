/**
 * Domain 層で投げられるエラーの基底クラス。
 *
 * Domain 不変条件違反 (Value Object の制約違反、ビジネスルール違反等) は
 * すべてこの例外として throw する。
 *
 * Application 層がこれを catch して、Web 層への変換 (ApplicationError) を担う。
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
