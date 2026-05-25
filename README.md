# Sakigake (魁)

> **日本語ファースト × DDD × Claude Code ネイティブ** の Next.js SaaS Boilerplate.
> ShipFast が「素早くローンチ」なら、Sakigake は **「素早く、かつスケールに耐える」**。

✅ **Early Bird 受付中**(先着 50 名 ¥9,800)— [sakigake.dev](https://sakigake.dev)

[![ステータス](https://img.shields.io/badge/status-Early%20Bird%20open-brightgreen)](https://sakigake.dev)
[![Tests](https://img.shields.io/badge/tests-318%20passing-brightgreen)](https://github.com/sakigake-dev/sakigake)
[![DDD Enforced](https://img.shields.io/badge/DDD-enforced-blue)](https://github.com/sakigake-dev/sakigake)
[![License](https://img.shields.io/badge/license-commercial-orange)](./LICENSE.md)

---

## なぜ Sakigake か?

日本のエンジニアが副業 / 独立で SaaS を立ち上げる時、**最大の障害は「最初の 100 時間」** です:

- 認証 (Clerk Organizations の設定)、課金 (Stripe Subscription + Webhook + Customer Portal)、テナント分離、テスト基盤、ディレクトリ構造の試行錯誤
- これらは **どの SaaS でも同じ**なのに毎回ゼロから組む

既存の boilerplate (ShipFast / Supastarter / Makerkit) は英語圏向けで、かつ「素早くローンチ」を売りに **アーキテクチャを犠牲にしている**。結果、半年後にスケールできずに書き直す事例が後を絶ちません。

**Sakigake は逆を行きます**: ローンチも速いが、6 ヶ月後・12 ヶ月後にも触れる土台です。

## 3 つの差別化

### 1. Claude Code / AI Agent ネイティブ

- `CLAUDE.md`(プロダクト指針)+ `AGENTS.md`(コード規約 + ユビキタス言語)で AI に context 共有
- `.claude/agents/` に **planner-researcher / implementer / tester / code-reviewer** の 4 体を標準装備
- `.claude/commands/` に `/plan` `/review` `/ship`(準備中)
- 顧客向け `CLAUDE.md.template` + `AGENTS.md.template` 同梱(プレースホルダ `{{}}` を埋めて開始)
- Cursor / Aider / Codex CLI でも同じ context を参照可能(AGENTS.md 規格に準拠)

### 2. DDD アーキテクチャ + 機械的強制

- Bounded Context 分離 (`tenant` / `billing` / 顧客が追加するドメイン)
- 4 層レイヤリング (Domain / Application / Infrastructure / Presentation)
- **dependency-cruiser で違反を CI レベルで自動検知** — レビュー疲れによる構造劣化を防ぐ
- ADR (Architecture Decision Record) テンプレート + 設計判断 5 本のサンプル
- Composition Root pattern による context 間の clean な配線(`src/lib/composition/`)

### 3. 日本語ファースト

- すべてのドキュメント、コメント、サンプルが日本語
- Stripe JP 対応の決済フロー(¥ 表記、税込/税抜、JCB 含む)
- 日本のエンジニアが「翻訳して読む」ステップを挟まない
- 日本語の SaaS ユビキタス言語 (テナント / メンバー / プラン / サブスクリプション) をそのまま採用

## 何が入っているか

```
sakigake/
├── CLAUDE.md                    プロダクト指針(目的 / 差別化 / 価格)
├── AGENTS.md                    エージェント運用ガイド(コード規約 / DDD / 用語)
├── CLAUDE.md.template           顧客向けテンプレ(プレースホルダ {{}} を埋めて使う)
├── AGENTS.md.template           顧客向けテンプレ
├── LICENSE.md                   商用ライセンス
├── .claude/agents/              4 体のサブエージェント
├── .dependency-cruiser.cjs      DDD 違反の自動検知ルール
├── docs/adr/                    設計判断 5 本 (DDD / Clerk / 境界 / 強制 / Inngest)
├── plans/_template.md           実装プランの雛形
│
├── src/contexts/
│   ├── tenant/                  テナント (組織) + メンバー管理
│   │   ├── domain/              Entity / Value Object / Repository interface / Domain Events
│   │   ├── application/         UseCase / DTO / 境界 hook
│   │   ├── infrastructure/      Supabase 実装 (Clerk JWT 経由)
│   │   └── presentation/        Clerk Webhook ハンドラ
│   │
│   ├── billing/                 Stripe Subscription 管理
│   │   ├── domain/              Subscription / Plan / SubscriptionStatus VO
│   │   ├── application/         CreateInitial / ChangePlan UseCase
│   │   └── infrastructure/      Supabase 実装
│   │
│   └── example/                 顧客が自分のドメインを追加するための参考実装
│
├── src/lib/composition/         Composition Root (context adapters + DI containers)
├── src/app/dashboard/           Server Component から UseCase を呼ぶ demo
├── src/app/_landing/            LP セクション群(顧客は削除可)
└── supabase/migrations/         RLS policies 含む schema
```

## スタック

| 領域 | 採用技術 |
|---|---|
| Frontend / Backend | Next.js 16 (App Router) + TypeScript |
| 認証 | Clerk (Organizations) |
| DB | Supabase (Postgres + RLS) |
| 課金 | Stripe (Subscription + Webhook + Customer Portal) |
| 非同期処理 | Inngest |
| UI | Tailwind v4 + shadcn/ui (base-ui ベース) |
| テスト | vitest + Playwright + happy-dom |
| 型 / Lint | TypeScript strict + ESLint + dependency-cruiser |
| Deploy | Vercel |

## クイックスタート(購入後)

```bash
# 1. 招待された private repo を clone(または public repo を fork)
git clone https://github.com/sakigake-dev/sakigake-customers.git my-saas
cd my-saas

# 2. 依存インストール
pnpm install

# 3. 環境変数を設定
cp .env.example .env.local
# .env.local に Clerk / Supabase / Stripe / Inngest のキーを記入

# 4. データベース migrate(Supabase プロジェクト作成後)
pnpm supabase migration up

# 5. テンプレートのカスタマイズ
cp CLAUDE.md.template CLAUDE.md     # 自分のプロダクト情報を {{}} に埋める
cp AGENTS.md.template AGENTS.md     # ユビキタス言語を追記

# 6. 開発サーバー起動
pnpm dev
```

5-10 分で localhost:3000 で動く SaaS が立ち上がります。

## 価格

| ティア | 価格 | 内容 |
|---|---|---|
| **Early Bird** | **¥9,800**(先着 50 名) | 1 開発者ライセンス / 無制限プロダクト / 永続アクセス / メジャーバージョン以内のアップデート無償 |
| Standard | ¥19,800 | 1 開発者ライセンス / 無制限プロダクト / 永続アクセス / メジャーバージョン以内のアップデート無償 |
| Agency | ¥39,800 | クライアントワーク利用可 / ホワイトラベル / 最大 3 開発者まで |

買い切りモデルで、月額サブスクなし。詳細は [LICENSE.md](./LICENSE.md) と [sakigake.dev](https://sakigake.dev) を参照。

## ロードマップ

- ✅ Phase 1: プロジェクト骨格 (Next.js + DDD 構造 + Claude Code)
- ✅ Phase 2: 認証 + tenant context + テスト基盤
- ✅ Phase 3: billing context + 境界 interface + Composition Root pattern
- ✅ Phase 4: example context 実装 (Project entity / 5 UseCase / RLS / Server Component demo)
- ✅ Phase 5: 顧客向け CLAUDE.md / AGENTS.md テンプレート同梱 + LP 公開
- 🚧 Phase 6: Early Bird 販売中 / ドキュメントサイト + デモ動画準備中

## ライセンス

[LICENSE.md](./LICENSE.md) に従います。要点:

- 購入者(1 開発者)は **自身が開発する商用プロダクトに無制限に組み込み可**
- **再販・再配布・boilerplate としての販売は禁止**
- **学習目的の閲覧は許可**(公開 repo は誰でも参照可、ただし商用利用には Personal License 以上の購入が必要)

## 連絡先

- **Web**: [sakigake.dev](https://sakigake.dev)
- **X**: [@sakigake_dev](https://x.com/sakigake_dev)
- **GitHub**: [sakigake-dev/sakigake](https://github.com/sakigake-dev/sakigake)
- **早期割引の通知**: 上記 X でアカウントをフォロー or LP の Early Bird 申込フォーム経由

---

**「設計判断ができる SaaS を、日本語で、Claude と一緒に最速で。」**
