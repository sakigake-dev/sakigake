import { ApplicationError } from "./ApplicationError";

/**
 * テナントに紐付くサブスクリプションが見つからない場合のエラー。
 *
 * ChangePlanUseCase が findByTenantId() で null を得た場合にスローする。
 * Presentation 層は 404 にマッピングする。
 */
export class SubscriptionNotFoundError extends ApplicationError {
  constructor(tenantId: string) {
    super(`Subscription not found for tenant: ${tenantId}`);
    this.name = "SubscriptionNotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
