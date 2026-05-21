
# ADR-0003: Bounded Context 間は Primitive 境界 + Adapter で通信する

- **日付**: 2026-05-17
- **ステータス**: 採用

## 背景

Sakigake は複数の bounded context (tenant / billing / 顧客が後で追加するドメイン) を持つ DDD-first な boilerplate。
これらの context が「テナント作成時に課金初期化を呼ぶ」のような連携をする時、
**素直に他 context の UseCase を直 import すると DDD の context 境界が崩壊する**。

ShipFast / Supastarter 等の既存 boilerplate は context という概念を持たないため、
`createUser()` の中で直接 `createStripeCustomer()` を呼ぶような fat route handler 型のコードになりがち。
この結果、後でスケール時に「課金ロジックがユーザー管理に絡まって剥がせない」状態に陥る。

具体的にぶつかった事例 (本プロジェクト内):
tenant context の Clerk webhook handler が、Organization 作成時に
billing context の `CreateInitialSubscriptionUseCase` を呼ぶ必要がある。
これを素直に書くと:

```typescript
// ❌ Anti-pattern: tenant context が billing context を直接 import
import { CreateInitialSubscriptionUseCase } from "@/contexts/billing/...";
```

これは dependency-cruiser の `no-cross-context-direct` ルールに違反する。

## 採用案

**Primitive 境界 + Adapter パターン** を採用する。具体的に 3 つのルール:

### 1. Context が必要とする外部処理は、その context 内に interface を定義する

```typescript
// src/contexts/tenant/application/hooks/CreateInitialSubscriptionUseCase.ts
export interface CreateInitialSubscriptionUseCase {
  execute(input: { tenantId: string }): Promise<void>;
}
```

- ファイル名は呼び出す相手の UseCase 名に揃える (見つけやすさ)
- パラメータは **primitive type (string / number / Date)** のみ
- VO の参照を context 境界を越えて渡さない
- 戻り値は基本 `Promise<void>` か、呼び出し側が本当に必要とする最小情報のみ

### 2. 他 context の UseCase はそのまま実装する (interface を意識しない)

```typescript
// src/contexts/billing/application/usecases/CreateInitialSubscriptionUseCase.ts
export class CreateInitialSubscriptionUseCase {
  async execute(input: { tenantId: string }): Promise<{ subscriptionId: string }> {
    const tenantId = TenantId.from(input.tenantId);  // billing 内の VO に変換
    // ... billing 内のロジック
    return { subscriptionId: subscription.id.value };
  }
}
```

- billing は tenant の hook interface を知らない (= 完全に独立)
- billing 内では billing のドメイン語彙だけを使う
- 戻り値は billing 自身に必要な型 (tenant 側が使うかどうかは関係ない)

### 3. Composition Root に Adapter を置いて接続する

```typescript
// src/lib/composition/tenantBillingAdapter.ts
export class TenantBillingAdapter implements TenantHook {
  constructor(private readonly billingUseCase: BillingUseCase) {}

  async execute(input: { tenantId: string }): Promise<void> {
    await this.billingUseCase.execute({ tenantId: input.tenantId });
    // 戻り値は破棄
  }
}
```

- `src/lib/composition/` は context ではないので両 context を import 可能
- 戻り値の型差を吸収する
- 将来 billing を Stripe → Paddle 等に差し替えても、tenant のコード変更ゼロ
- ファイル名は `<from>_<to>Adapter.ts` の規約

## 却下案

- **案 A: 直 import** (`tenant → billing` を許可)
  - 却下理由: bounded context の存在意義が無くなる、`no-cross-context-direct` ルールに違反
  - これがまさに ShipFast 等の既存 boilerplate がやっていて差別化の対象

- **案 B: VO を境界で渡す** (`tenantId: TenantId` を hook の入力に)
  - 却下理由: tenant の `TenantId` と billing の `TenantId` が別クラスなので、
    結局 tenant が billing の VO を import する形になり cross-context が漏れる
  - structural typing でなんとか動かしても、ドメイン語彙の混入が起きる

- **案 C: Shared Kernel に共通 VO を置く** (`src/shared/kernel/valueObjects/TenantId.ts`)
  - 却下理由: 「shared kernel は最小限に」が DDD のセオリー。
    `TenantId` のような identity を shared に出すと、ほぼ全 context が依存する強結合になる
  - 一部の identity が本当に共通の場合は検討の余地あるが、本プロジェクトでは
    各 context が自分の `TenantId` を持つことで十分疎結合になっている

- **案 D: Event Bus (Inngest 等) 経由で非同期に通信**
  - 却下理由: 非同期にすると「テナント作成成功 → 課金初期化失敗 → どうする?」の
    補償処理 (Saga) が複雑化する
  - 同期で済む処理を無理に非同期にしない、というのが本プロジェクトの判断
  - 将来課金処理が重くなった場合は、本 ADR を更新して Inngest 経由に切り替える

## 影響

良い影響:
- 各 context が完全独立 → 単体で test 可能、削除・差し替え可能
- 顧客 (Sakigake 購入者) が「context を 1 つ追加する」時、既存 context を一切触らずに済む
- DDD の context 境界が機械的に検証可能 (`pnpm depcruise`)
- これが Sakigake の最大の差別化ポイントの 1 つ — ShipFast 等には無い概念

制約:
- 軽い mapping コスト (composition root で primitive ↔ VO 変換が走る)
- adapter ファイルが context 数 × 連携数 だけ増える
- 初学者にとっては「なぜ adapter?」が分かりづらい (このドキュメントで補完)

## 見直しトリガー

- adapter ファイル数が肥大化して把握困難になった場合 (10 個超えたら検討)
- 非同期 event-driven 通信が標準になってきた場合 (Inngest や Postgres LISTEN/NOTIFY)
- 顧客フィードバックで「この pattern が重い」が多数派になった場合

## 参考実装

- 境界 interface: `src/contexts/tenant/application/hooks/CreateInitialSubscriptionUseCase.ts`
- 実装側 UseCase: `src/contexts/billing/application/usecases/CreateInitialSubscriptionUseCase.ts`
- Adapter: `src/lib/composition/tenantBillingAdapter.ts`
- 自動検証ルール: `.dependency-cruiser.cjs` の `no-cross-context-direct`
