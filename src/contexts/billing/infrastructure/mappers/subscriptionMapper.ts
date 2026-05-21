/**
 * Supabase DB 行 ↔ Subscription Aggregate マッピング関数。
 *
 * 純粋関数として export することで、Repository 本体を DI なしにテスト可能にする
 * (Unit テストで Supabase HTTP 呼び出しを避けるため)。
 */

import { Subscription } from "../../domain/models/Subscription";
import { SubscriptionId } from "../../domain/valueObjects/SubscriptionId";
import { TenantId } from "../../domain/valueObjects/TenantId";
import { Plan } from "../../domain/valueObjects/Plan";
import { SubscriptionStatus } from "../../domain/valueObjects/SubscriptionStatus";

export interface SubscriptionRow {
  id: string;
  tenant_id: string;
  plan: string;
  status: string;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionDbRow {
  id: string;
  tenant_id: string;
  plan: string;
  status: string;
  stripe_subscription_id: string | null;
}

/**
 * DB 行 → Subscription Aggregate。
 * Subscription.reconstruct() を通じてドメインオブジェクトを生成する。
 */
export function subscriptionRowToDomain(row: SubscriptionRow): Subscription {
  return Subscription.reconstruct(
    SubscriptionId.from(row.id),
    TenantId.from(row.tenant_id),
    Plan.from(row.plan),
    SubscriptionStatus.from(row.status),
    row.stripe_subscription_id,
  );
}

/**
 * Subscription Aggregate → DB 行。
 * Domain Events は永続化しない。
 * 将来 outbox pattern を導入する際はここで events を別テーブル行に変換する。
 */
export function subscriptionToRow(subscription: Subscription): SubscriptionDbRow {
  return {
    id: subscription.id.value,
    tenant_id: subscription.tenantId.value,
    plan: subscription.plan.value,
    status: subscription.status.value,
    stripe_subscription_id: subscription.stripeSubscriptionId,
  };
}
