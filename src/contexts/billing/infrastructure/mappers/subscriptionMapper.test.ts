/**
 * subscriptionMapper — Unit テスト
 *
 * Supabase HTTP 呼び出しを一切行わない純粋関数テスト。
 * DB 行 ↔ Subscription Aggregate のラウンドトリップを検証する。
 */

import { describe, it, expect } from "vitest";
import {
  subscriptionRowToDomain,
  subscriptionToRow,
  type SubscriptionRow,
} from "./subscriptionMapper";
import { DomainError } from "../../domain/errors/DomainError";

const BASE_SUBSCRIPTION_ROW: SubscriptionRow = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  tenant_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  plan: "free",
  status: "active",
  stripe_subscription_id: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("subscriptionRowToDomain", () => {
  it("有効な行から Subscription Aggregate を復元できる", () => {
    const sub = subscriptionRowToDomain(BASE_SUBSCRIPTION_ROW);

    expect(sub.id.value).toBe(BASE_SUBSCRIPTION_ROW.id);
    expect(sub.tenantId.value).toBe(BASE_SUBSCRIPTION_ROW.tenant_id);
    expect(sub.plan.value).toBe("free");
    expect(sub.status.value).toBe("active");
    expect(sub.stripeSubscriptionId).toBeNull();
  });

  it("stripe_subscription_id が設定された行を復元できる", () => {
    const rowWithStripe: SubscriptionRow = {
      ...BASE_SUBSCRIPTION_ROW,
      stripe_subscription_id: "sub_stripe_test_123",
    };

    const sub = subscriptionRowToDomain(rowWithStripe);

    expect(sub.stripeSubscriptionId).toBe("sub_stripe_test_123");
  });

  it("plan='starter' の行を復元できる", () => {
    const starterRow: SubscriptionRow = {
      ...BASE_SUBSCRIPTION_ROW,
      plan: "starter",
    };

    const sub = subscriptionRowToDomain(starterRow);

    expect(sub.plan.value).toBe("starter");
    expect(sub.plan.monthlyPriceJpy()).toBe(3980);
  });

  it("plan='professional' の行を復元できる", () => {
    const professionalRow: SubscriptionRow = {
      ...BASE_SUBSCRIPTION_ROW,
      plan: "professional",
    };

    const sub = subscriptionRowToDomain(professionalRow);

    expect(sub.plan.value).toBe("professional");
    expect(sub.plan.monthlyPriceJpy()).toBe(15000);
  });

  it("status='canceled' の行を復元できる", () => {
    const canceledRow: SubscriptionRow = {
      ...BASE_SUBSCRIPTION_ROW,
      status: "canceled",
    };

    const sub = subscriptionRowToDomain(canceledRow);

    expect(sub.status.isCanceled()).toBe(true);
  });

  it("無効な plan 文字列は DomainError を投げる", () => {
    const invalidRow: SubscriptionRow = {
      ...BASE_SUBSCRIPTION_ROW,
      plan: "invalid_plan",
    };

    expect(() => subscriptionRowToDomain(invalidRow)).toThrow(DomainError);
  });

  it("無効な status 文字列は DomainError を投げる", () => {
    const invalidRow: SubscriptionRow = {
      ...BASE_SUBSCRIPTION_ROW,
      status: "expired",
    };

    expect(() => subscriptionRowToDomain(invalidRow)).toThrow(DomainError);
  });

  it("reconstruct() を通じて復元するため ドメインイベントは発行されない", () => {
    const sub = subscriptionRowToDomain(BASE_SUBSCRIPTION_ROW);
    expect(sub.pullDomainEvents()).toHaveLength(0);
  });
});

describe("subscriptionToRow", () => {
  it("Subscription Aggregate から DB 行の plain object を返す", () => {
    const sub = subscriptionRowToDomain(BASE_SUBSCRIPTION_ROW);
    const row = subscriptionToRow(sub);

    expect(row).toEqual({
      id: BASE_SUBSCRIPTION_ROW.id,
      tenant_id: BASE_SUBSCRIPTION_ROW.tenant_id,
      plan: "free",
      status: "active",
      stripe_subscription_id: null,
    });
  });

  it("stripe_subscription_id が設定された Subscription を行に変換できる", () => {
    const rowWithStripe: SubscriptionRow = {
      ...BASE_SUBSCRIPTION_ROW,
      stripe_subscription_id: "sub_stripe_test_456",
    };
    const sub = subscriptionRowToDomain(rowWithStripe);
    const row = subscriptionToRow(sub);

    expect(row.stripe_subscription_id).toBe("sub_stripe_test_456");
  });

  it("返却オブジェクトに Domain Events は含まれない", () => {
    const sub = subscriptionRowToDomain(BASE_SUBSCRIPTION_ROW);
    const row = subscriptionToRow(sub);

    expect(Object.keys(row)).not.toContain("domainEvents");
    expect(Object.keys(row)).not.toContain("_domainEvents");
  });
});

describe("subscriptionRowToDomain → subscriptionToRow ラウンドトリップ", () => {
  it("DB 行 → Aggregate → DB 行 が等価な plain object を返す", () => {
    const sub = subscriptionRowToDomain(BASE_SUBSCRIPTION_ROW);
    const row = subscriptionToRow(sub);

    expect(row).toEqual({
      id: BASE_SUBSCRIPTION_ROW.id,
      tenant_id: BASE_SUBSCRIPTION_ROW.tenant_id,
      plan: BASE_SUBSCRIPTION_ROW.plan,
      status: BASE_SUBSCRIPTION_ROW.status,
      stripe_subscription_id: BASE_SUBSCRIPTION_ROW.stripe_subscription_id,
    });
  });

  it("starter plan の Subscription がラウンドトリップできる", () => {
    const starterRow: SubscriptionRow = {
      ...BASE_SUBSCRIPTION_ROW,
      plan: "starter",
      status: "active",
    };

    const sub = subscriptionRowToDomain(starterRow);
    const row = subscriptionToRow(sub);

    expect(row.plan).toBe("starter");
    expect(row.status).toBe("active");
  });
});
