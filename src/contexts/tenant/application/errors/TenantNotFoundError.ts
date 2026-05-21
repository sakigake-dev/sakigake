import { ApplicationError } from "./ApplicationError";

/**
 * UseCase がテナントを検索したが見つからなかった場合のエラー。
 *
 * 設計判断: ドメインの不変条件違反 (DomainError → HTTP 422 相当) と、
 * ユースケース固有の前提条件違反「処理対象テナントが存在しない」(→ HTTP 404) を
 * 区別するために ApplicationError を継承する専用クラスを用意する。
 * Presentation 層は `instanceof TenantNotFoundError` または
 * `instanceof ApplicationError` で 404 にマッピングできる。
 * DomainError を継承しないことで `instanceof DomainError` のバケツに混入しない。
 */
export class TenantNotFoundError extends ApplicationError {
  constructor(tenantId: string) {
    super(`Tenant not found: ${tenantId}`);
    this.name = "TenantNotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
