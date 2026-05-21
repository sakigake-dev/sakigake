/**
 * テナント作成時の課金初期化フック (Context Boundary Interface)
 *
 * tenant context が billing context に直接依存しないようにするための境界。
 *
 * 設計判断: **primitive type (string) をパラメータに使う**
 * - bounded context 間で VO の参照を渡さない (各 context の VO は内部のみ)
 * - Composition Root の adapter が primitive ↔ 各 context の VO 変換を担う
 * - これにより billing 側の Plan / Subscription / 戻り値の subscriptionId 等を
 *   tenant が一切知らずに済む
 *
 * 関連: ADR-0003 (Bounded Context 間の通信、書き起こし予定)
 */
export interface CreateInitialSubscriptionUseCase {
  execute(input: { tenantId: string }): Promise<void>;
}
