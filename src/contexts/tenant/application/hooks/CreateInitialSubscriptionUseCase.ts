import type { TenantId } from "../../domain/valueObjects/TenantId";

/**
 * テナント作成時の課金初期化フック (Context Boundary Interface)
 *
 * tenant context が billing context に直接依存しないようにするための境界。
 * billing context 側でこのインターフェースを実装したクラスを提供し、
 * Composition Root で注入する。
 *
 * Adapter パターンに近い構造で、bounded context 間の疎結合を保つ。
 *
 * 関連: ADR-0003 (Bounded Context 間の通信 — 予定)
 */
export interface CreateInitialSubscriptionUseCase {
  execute(input: { tenantId: TenantId }): Promise<void>;
}
