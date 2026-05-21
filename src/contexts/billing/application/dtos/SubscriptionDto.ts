import type { Subscription } from "../../domain/models/Subscription";

export type SubscriptionDto = {
  id: string;
  tenantId: string;
  plan: "free" | "starter" | "professional";
  status: "active" | "suspended" | "canceled";
  stripeSubscriptionId: string | null;
};

/**
 * Subscription Aggregate を Presentation 層へ渡すための plain object 表現。
 *
 * 次フェーズで GetSubscriptionUseCase / ダッシュボード API が実装される際に使用する。
 * Aggregate を直接 Presentation 層に露出させない方針の準備として先行配置している。
 */
export function toSubscriptionDto(subscription: Subscription): SubscriptionDto {
  return {
    id: subscription.id.value,
    tenantId: subscription.tenantId.value,
    plan: subscription.plan.value,
    status: subscription.status.value,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
  };
}
