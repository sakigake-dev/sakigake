import type { CreateInitialSubscriptionUseCase as BillingCreateInitialSubscriptionUseCase } from "@/contexts/billing/application/usecases/CreateInitialSubscriptionUseCase";
import type { CreateInitialSubscriptionUseCase as TenantCreateInitialSubscriptionHook } from "@/contexts/tenant/application/hooks/CreateInitialSubscriptionUseCase";

/**
 * tenant の境界 hook を billing の UseCase で実装する Adapter。
 *
 * 役割:
 * 1. 各 context が自身のドメインに集中できるようにする (bounded context 分離の維持)
 * 2. 戻り値の型差を吸収 — billing は `{ subscriptionId }` を返す、tenant 側は void で十分
 * 3. 将来 billing を Stripe → Paddle 等に差し替えても、tenant のコードは変更不要
 *
 * 配置場所の意図: Composition Root (src/lib/composition/) のみがこの adapter ファイルに触る。
 * tenant も billing もこのファイルを知らない (それぞれ独立した bounded context のまま)。
 *
 * 関連: ADR-0003 (Bounded Context 間の通信)
 */
export class TenantBillingAdapter implements TenantCreateInitialSubscriptionHook {
  constructor(
    private readonly billingUseCase: BillingCreateInitialSubscriptionUseCase,
  ) {}

  async execute(input: { tenantId: string }): Promise<void> {
    await this.billingUseCase.execute({ tenantId: input.tenantId });
    // billing が返す subscriptionId は tenant 側では使わないので破棄
  }
}
