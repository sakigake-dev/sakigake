# Sakigake — プロダクト指針

> このファイルは Claude Code が毎ターン参照する **always-on context**。
> 本ファイルは Sakigake の **プロダクトとしての意思決定** を記録する。
> コード規約 / DDD ルール / ユビキタス言語は `AGENTS.md` を参照。

## 目的(最重要)

このプロジェクトには 3 つの目的がある:

1. **収益化**: 5 週間でローンチし、3 ヶ月以内に月 10 万円、12 ヶ月以内に月 30-50 万円の MRR/売上を達成する
2. **エンジニア転職用ポートフォリオ**: 「設計判断ができる人」と評価される最強の証拠物件にする
3. **自分の他プロダクト (meeting-pro 等) の基盤**: Sakigake のメンテが、自分の SaaS のメンテに直結する状態を作る

提案・実装の方針判断ではこの 3 点を常に意識する。

## プロダクト概要

**「Claude Code ネイティブ × DDD × 日本語ファースト」の Next.js SaaS Boilerplate**。

既存のグローバル競合 (ShipFast / Supastarter / Makerkit 等) との差別化 3 軸:

1. **Claude Code / AI agent ネイティブ**: `.claude/agents/` 4 体 + slash command + `CLAUDE.md` + `AGENTS.md` を標準装備。Cursor / Aider 等 portable な agent 系もカバー
2. **DDD アーキテクチャ + 機械的強制**: bounded context による分離、4 層レイヤリング、dependency-cruiser での違反検知、ADR テンプレ付き
3. **日本語ファースト**: 日本語ドキュメント、日本語コメント、Stripe JP 対応、日本のエンジニアが迷わない

ターゲット顧客: 日本の indie 開発者、副業エンジニア、SaaS 立ち上げを考えている個人/小規模チーム。

## 価格設定

- **Early Bird**: ¥9,800 (先着 50 名、買い切り、無制限プロジェクト)
- **Standard**: ¥19,800 (通常価格、買い切り、無制限プロジェクト)
- **Agency**: ¥39,800 (クライアントワーク利用可、ホワイトラベル)

販売チャネル: Gumroad (海外) + Stripe Checkout (国内)。

## 技術スタック(概要)

詳細は `README.md` と各 ADR (`docs/adr/`) 参照。

- Frontend: Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (base-ui ベース)
- Auth: Clerk (Organizations 機能でテナント分離) — ADR-0002
- DB: Supabase (Postgres + RLS)
- 課金: Stripe (Subscription + Webhook + Customer Portal)
- 非同期処理: Inngest — ADR-0005
- Test: vitest (unit) + Playwright (E2E)
- DDD 強制: dependency-cruiser — ADR-0004

## アーキテクチャ(概要)

詳細規約は `AGENTS.md` 参照。要点:

- Bounded Context: `tenant` / `billing` / `example` (+ 顧客が追加するドメイン)
- 4 層レイヤリング: `Domain ← Infrastructure / Application → Domain / Presentation → Application`
- Composition Root: `src/lib/composition/` のみが全 context を知る (ADR-0003)
- bounded context 間通信: primitive 境界 + Adapter

新規設計判断は必ず ADR を起票 (`docs/adr/template.md` をコピー)。

## サブエージェント運用

`.claude/agents/` 配下の 4 体:

| Agent | 用途 |
|---|---|
| `planner-researcher` | 新機能 / 曖昧な要件を `./plans/YYYYMMDD-*.md` に分解 |
| `implementer` | プランに沿って実装 (DDD 規約遵守、TDD) |
| `tester` | テスト実行 + 失敗ログの要約と原因仮説 |
| `code-reviewer` | コミット前のレビュー (設計/テスタビリティ/セキュリティ観点) |

各 agent は `AGENTS.md` を always-on で参照する。
長い調査 (コード横断 grep、Web 検索) は必ず subagent に投げてメイン context を汚さない。

## 顧客への提供物

顧客が受け取る:

1. GitHub repo のアクセス権 (private template repo を fork 可能)
2. ドキュメントサイト (sakigake.dev/docs) — 計画中
3. Discord/Slack コミュニティ — 計画中
4. アップデート権 (買い切りだが、メジャーバージョン以内は無償アップデート)

顧客視点で「100 時間の boilerplate 構築コストが節約できる」と感じられる品質を維持する。

## 顧客向けテンプレート

顧客が clone した時に customize すべきファイル:

- `CLAUDE.md.template` → `CLAUDE.md` にコピーし、自分のプロダクトのストーリーを書き込む
- `AGENTS.md.template` → `AGENTS.md` にコピーし、自分のドメインのユビキタス言語を追記

Sakigake 自身の `CLAUDE.md` / `AGENTS.md` は **「customizing 済みの例」** として残す。

## 関連ドキュメント

- `AGENTS.md`: コード規約・DDD ルール・ユビキタス言語
- `README.md`: プロダクト紹介(顧客向け)
- `docs/adr/`: アーキテクチャ設計判断記録 (ADR-0001〜0005)
- `CLAUDE.md.template` / `AGENTS.md.template`: 顧客向けテンプレート
