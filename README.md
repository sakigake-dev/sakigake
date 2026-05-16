# Sakigake (魁)

> Next.js × DDD × Claude Code Agent ready.
> 日本語ファーストの SaaS Boilerplate.

🚧 **開発中** — 2026年Q3 リリース予定

## 何が違うか

- **Claude Code ネイティブ**: 4 つの subagent (planner / implementer / tester / reviewer) と slash command (`/plan`, `/review`, `/ship`) を標準装備
- **DDD アーキテクチャ**: bounded context による分離、4 層 (Domain / Application / Infrastructure / Presentation) のレイヤリング、ADR テンプレート付き
- **日本語ファースト**: ドキュメント、コメント、サンプル全て日本語で整備

## スタック (予定)

- Next.js 16 (App Router) + TypeScript
- Clerk (auth + Organizations)
- Supabase (Postgres + RLS)
- Stripe (Subscription + Webhook + Customer Portal)
- Inngest (非同期処理)
- Tailwind + shadcn/ui
- vitest + Playwright

## 連絡先

- X: [@sakigake_dev](https://x.com/sakigake_dev)
- Web: [sakigake.dev](https://sakigake.dev) (準備中)
