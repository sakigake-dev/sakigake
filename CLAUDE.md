# Sakigake - プロジェクト指針

## 目的(最重要)
このプロジェクトには 3 つの目的がある:
1. **収益化**: 5 週間でローンチし、3 ヶ月以内に月 10 万円、12 ヶ月以内に月 30-50 万円の MRR/売上を達成する
2. **エンジニア転職用ポートフォリオ**: 「設計判断ができる人」と評価される最強の証拠物件にする
3. **自分の他プロダクト (meeting-pro 等) の基盤**: Sakigake のメンテが、自分の SaaS のメンテに直結する状態を作る

提案・実装の方針判断ではこの 3 点を常に意識する。

## プロダクト概要
**「Claude Code ネイティブ × DDD × 日本語ファースト」の Next.js SaaS Boilerplate**。

既存のグローバル競合 (ShipFast / Supastarter / Makerkit 等) との差別化 3 軸:

1. **Claude Code / AI agent ネイティブ**: `.claude/agents/` 4 体 + slash command + AGENTS.md を標準装備。Cursor や Claude Code で「drift しない」コードベース
2. **DDD アーキテクチャ**: bounded context による分離、4 層 (Domain / Application / Infrastructure / Presentation) のレイヤリング、ADR テンプレ付き
3. **日本語ファースト**: 日本語ドキュメント、日本語コメント、Stripe JP 対応、日本のエンジニアが迷わない

ターゲット顧客: 日本の indie 開発者、副業エンジニア、SaaS 立ち上げを考えている個人/小規模チーム。

## 価格設定
- **Early Bird**: ¥9,800 (先着 50 名、買い切り、無制限プロジェクト)
- **Standard**: ¥19,800 (通常価格、買い切り、無制限プロジェクト)
- **Agency**: ¥39,800 (クライアントワーク利用可、ホワイトラベル)

販売チャネル: Gumroad (海外) + Stripe Checkout (国内)。

## 技術スタック
- Frontend: Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui
- Auth: Clerk (Organizations 機能でテナント分離)
- DB: Supabase (Postgres + RLS)
- 課金: Stripe (Subscription + Webhook + Customer Portal)
- 非同期処理: Inngest
- Test: vitest (unit) + Playwright (E2E)
- Deploy: Vercel + Supabase

## アーキテクチャ
- **DDD** (戦術的設計) を厳格に適用
- レイヤー: Presentation → Application → Domain ← Infrastructure
- Domain 層は Next.js / Supabase / Stripe を import しない
- Repository インターフェースは Domain、実装は Infrastructure
- 原始型 (string, number) をドメイン境界に露出させない (Value Object で包む)

Bounded Contexts (初期):
- `tenant`: テナント (顧客組織) とメンバー管理 — マルチテナント SaaS の根幹
- `billing`: Stripe Subscription 管理 — 課金の汎用パターン
- `example`: 顧客が自分のドメインを足す時の参考になる空の context

## サブエージェント運用
実装フローは以下に従う:
- **新機能/曖昧な要件** → `planner-researcher` で `./plans/YYYYMMDD-*.md` にプラン
- **実装** → `implementer` がプランに沿って書く
- **テスト失敗の調査** → `tester`
- **コミット前のレビュー** → `code-reviewer`

長い調査 (コードベース横断 grep、ドキュメント調査) は必ず subagent に投げてメイン context を汚さない。

## コード規約
- TypeScript strict mode
- ドメイン用語は英語で統一、Value Object 化を徹底
- 1 ファイル 300 行を超えそうになったら分割
- console.log / TODO はリリースビルドに残さない
- API ルート (Route Handler) は UseCase を呼ぶだけ。ロジックを書かない

## やってはいけないこと
- ./plans/ を読まずに大きな実装に着手
- DDD レイヤーを跨いだ依存 (Domain が Infrastructure を直接 import 等)
- 貧血ドメインモデル (Entity を getter/setter だけにする)
- ORM / Supabase の型をそのままドメインに使う (マッピング層を挟む)
- meeting-pro の業務固有 (税理士) 用語・ロジックを誤って混入させる
- 顧客が読む README/ドキュメントに英語混じりの中途半端な日本語を残す (日本語ファーストが差別化)

## 顧客への提供物
最終的に顧客が受け取るのは:
1. GitHub repo のアクセス権 (private template repo を fork できる形式)
2. ドキュメントサイト (sakigake.dev/docs)
3. Discord/Slack コミュニティ (任意参加)
4. アップデート権 (買い切りだが、メジャーバージョン以内は無償アップデート)

顧客視点で「これを買えば 100 時間の boilerplate 構築コストが節約できる」と感じられる品質を維持する。
