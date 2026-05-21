import { DomainError } from "../errors/DomainError";

/**
 * 課金プランを表す Value Object。
 *
 * プラン名の設計判断 (ユビキタス言語との一時的な乖離):
 * AGENTS.md の Billing Context ユビキタス言語では 'individual' / 'team' で定義
 * しているが、本実装では DB CHECK 制約 ('free' | 'starter' | 'professional') と
 * Single Source of Truth を一致させる方針で 'starter' / 'professional' を採用。
 * Phase 4 (Stripe 導入時) に migration + リネームでユビキタス言語に揃える予定。
 * AGENTS.md の Plan 表は Phase 4 完了時点の状態を示している。
 * (supabase/migrations/003_create_subscriptions.sql 参照)
 *
 * 月額価格:
 * - free: ¥0 (初期サブスクリプション)
 * - starter: ¥3,980/月 (個人/小規模向け)
 * - professional: ¥15,000/月 (成長中チーム向け)
 */

type PlanValue = "free" | "starter" | "professional";

const MONTHLY_PRICES_JPY: Record<PlanValue, number> = {
  free: 0,
  starter: 3980,
  professional: 15000,
};

export class Plan {
  private constructor(readonly value: PlanValue) {}

  static free(): Plan {
    return new Plan("free");
  }

  static starter(): Plan {
    return new Plan("starter");
  }

  static professional(): Plan {
    return new Plan("professional");
  }

  static from(value: string): Plan {
    if (value === "free" || value === "starter" || value === "professional") {
      return new Plan(value);
    }
    throw new DomainError(
      `Invalid Plan value: '${value}'. Must be one of: free, starter, professional`,
    );
  }

  monthlyPriceJpy(): number {
    return MONTHLY_PRICES_JPY[this.value];
  }

  equals(other: Plan): boolean {
    return this.value === other.value;
  }
}
