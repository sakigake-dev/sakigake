
# Sakigake (魁)

> **日本語ファースト × DDD × Claude Code ネイティブ** の Next.js SaaS Boilerplate.
> ShipFast が「素早くローンチ」なら、Sakigake は **「素早く、かつスケールに耐える」**。

🚧 **開発中** — 2026年Q3 リリース予定 / Early Bird 先着 50 名 ¥9,800

[![ステータス](https://img.shields.io/badge/status-active%20development-orange)](https://github.com/sakigake-dev/sakigake)
[![Tests](https://img.shields.io/badge/tests-241%20passing-brightgreen)](https://github.com/sakigake-dev/sakigake)
[![DDD Enforced](https://img.shields.io/badge/DDD-enforced-blue)](https://github.com/sakigake-dev/sakigake)

---

## なぜ Sakigake か?

日本のエンジニアが副業 / 独立で SaaS を立ち上げる時、**最大の障害は「最初の 100 時間」** です:

- 認証 (Clerk Organizations の設定)、課金 (Stripe Subscription + Webhook + Customer Portal)、テナント分離、テスト基盤、ディレクトリ構造の試行錯誤
- これらは **どの SaaS でも同じ**なのに毎回ゼロから組む

既存の boilerplate (ShipFast / Supastarter / Makerkit) は英語圏向けで、かつ「素早くローンチ」を売りに **アーキテクチャを犠牲にしている**。結果、半年後にスケールできずに書き直す事例が後を絶ちません。

**Sakigake は逆を行きます**: ローンチも速いが、6 ヶ月後・12 ヶ月後にも触れる土台です。

## 3 つの差別化

### 1. Claude Code / AI Agent ネイティブ

- `CLAUDE.md` + `AGENTS.md` でプロジェクト指針を AI に共有
- `.claude/agents/` に **planner-researcher / implementer / tester / code-reviewer** の 4 体を標準装備
- `.claude/commands/` に `/plan` `/review` `/ship` (準備中)
- Cursor や Aider でも同じ context を参照できる

### 2. DDD アーキテクチャ + 機械的強制

- Bounded Context 分離 (`tenant` / `billing` / 顧客が追加するドメイン)
- 4 層レイヤリング (Domain / Application / Infrastructure / Presentation)
- **dependency-cruiser で違反を CI レベルで自動検知** — レビュー疲れによる構造劣化を防ぐ
- ADR (Architecture Decision Record) テンプレート + 設計判断 5 本のサンプル

### 3. 日本語ファースト

- すべてのドキュメント、コメント、サンプルが日本語
- Stripe JP 対応の決済フロー
- 日本のエンジニアが「翻訳して読む」ステップを挟まない
- 日本語の SaaS ユビキタス言語 (テナント / メンバー / プラン / サブスクリプション) をそのまま採用

## 何が入っているか
sakigake/
├── CLAUDE.md                    Claude Code 指針
├── AGENTS.md                    AI エージェント共通指示
├── .claude/agents/              4 体のサブエージェント
├── .dependency-cruiser.cjs      DDD 違反の自動検知ルール
├── docs/adr/                    設計判断 5 本 (DDD / Clerk / 境界 / 強制 / Inngest)
├── plans/_template.md           実装プランの雛形
│
├── src/contexts/
│   ├── tenant/                  テナント (組織) + メンバー管理
│   │   ├── domain/              Entity / Value Object / Repository interface / Domain Events
│   │   ├── application/         UseCase / DTO / 境界 hook
│   │   ├── infrastructure/      Supabase 実装
│   │   └── presentation/        Clerk Webhook ハンドラ
│   │
│   ├── billing/                 Stripe Subscription 管理
│   │   ├── domain/              Subscription / Plan / SubscriptionStatus VO
│   │   ├── application/         CreateInitial / ChangePlan UseCase
│   │   └── infrastructure/      Supabase 実装
│   │
│   └── example/                 顧客が自分のドメインを追加するためのテンプレ
│
├── src/lib/composition/         Composition Root (context adapters)
├── src/shared/                  共通基盤 (UI / kernel / lib)
└── tests/                       241 件の単体テスト + 統合テスト

## スタック

| 領域 | 採用技術 |
|---|---|
| Frontend / Backend | Next.js 16 (App Router) + TypeScript |
| 認証 | Clerk (Organizations) |
| DB | Supabase (Postgres + RLS) |
| 課金 | Stripe (Subscription + Webhook + Customer Portal) |
| 非同期処理 | Inngest |
| UI | Tailwind CSS + shadcn/ui |
| テスト | vitest + Playwright + happy-dom |
| 型 / Lint | TypeScript strict + ESLint + dependency-cruiser |
| Deploy | Vercel |

## クイックスタート (購入後)

```bash
# 1. リポジトリを fork
gh repo clone sakigake-dev/sakigake my-saas
cd my-saas

# 2. 依存インストール
pnpm install

# 3. 環境変数を設定 (.env.local)
cp .env.example .env.local
# Clerk / Supabase / Stripe の API キーを入れる

# 4. データベース migrate
pnpm supabase migration up

# 5. 開発サーバー起動
pnpm dev
```

5 分で localhost:3000 で動く SaaS が立ち上がります。

## 価格

| ティア | 価格 | 内容 |
|---|---|---|
| **Early Bird** | **¥9,800** (先着 50 名) | 買い切り / 無制限プロジェクト / 1 年無償アップデート |
| Standard | ¥19,800 | 買い切り / 無制限プロジェクト / 1 年無償アップデート |
| Agency | ¥39,800 | クライアントワーク利用可 / ホワイトラベル / 1 年無償アップデート |

買い切りモデルで、SaaS としての従量課金なし。**1 度買えば自分の SaaS をいくつでも立ち上げられる**。

## ロードマップ

- ✅ Phase 1: プロジェクト骨格 (Next.js + DDD 構造 + Claude Code)
- ✅ Phase 2: 認証 + tenant context + テスト基盤
- ✅ Phase 3: billing context + 境界 interface + Composition Root pattern
- 🚧 Phase 4: example context の実装 + UI components + Supabase migrations 一式
- 🚧 Phase 5: ドキュメントサイト (sakigake.dev/docs) + デモ動画
- 🚧 Phase 6: Early Bird ローンチ (2026年Q3)

## 連絡先

- **Web**: [sakigake.dev](https://sakigake.dev) (準備中)
- **X**: [@sakigake_dev](https://x.com/sakigake_dev)
- **GitHub**: [sakigake-dev/sakigake](https://github.com/sakigake-dev/sakigake)
- **早期割引の通知を受け取る**: 上記 X でアカウントをフォロー or DM

## ライセンス

購入者は自分のプロジェクトに自由に組み込み・改変可能。
再配布、boilerplate としての再販は禁止 (ライセンス詳細は LICENSE.md にて、追記予定)。

---

**「設計判断ができる SaaS を、日本語で、Claude と一緒に最速で。」**
