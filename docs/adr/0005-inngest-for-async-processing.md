# ADR-0005: 非同期処理に Inngest を採用する

- **日付**: 2026-05-17
- **ステータス**: 採用

## 背景

SaaS では「重い処理」 (ファイル変換、AI 推論、メール送信、Stripe Webhook の重複検知 + 再送) を
HTTP request の中で同期で実行できない。Vercel Serverless Function の制限 (60 秒) も問題。

非同期処理の選択肢:
1. Inngest
2. Vercel Background Functions
3. Supabase Edge Functions (cron + queue)
4. BullMQ / Redis ベース
5. AWS SQS + Lambda
6. 何もしない (将来必要になってから入れる)

## 採用案

**Inngest** を採用する。Sakigake の boilerplate に standard で組み込む。

採用理由:
- ステップごとの状態管理、自動リトライ、可視化ダッシュボードが組み込み
- Next.js App Router との統合が公式に整備されている
- Free tier が generous (月 50,000 invocation) で indie 開発者の最初の障壁が低い
- 失敗の rerun が UI から押せる (運用が楽)

## 却下案

- **案 B: Vercel Background Functions**
  - 却下理由: ステップ管理・リトライ・可視化を自前で組む必要、Inngest の優位性を再発明する形になる

- **案 C: Supabase Edge Functions (cron + queue)**
  - 却下理由: ジョブ状態管理が弱い、長時間ジョブ前提の設計ではない

- **案 D: BullMQ + Redis**
  - 却下理由: Redis ホスティングコストが追加で発生、indie 向けに重い

- **案 E: AWS SQS + Lambda**
  - 却下理由: AWS 知識が前提、Sakigake の「Vercel + Supabase + Stripe の三種の神器で完結」コンセプトに反する

- **案 F: 何もしない**
  - 却下理由: 顧客が将来必要になった時に boilerplate を改修する負担が大きい

## 影響

良い影響:
- 重い処理を最初から正しく扱える形が提供される
- Stripe Webhook の重複処理、メール送信、ファイル処理が即実装可能
- 顧客は「非同期処理の設計」に時間を使わなくて済む

制約:
- Inngest のロックイン (= 月コストが上がる、移行コストが発生)
- Inngest dev server をローカルで起動する手間がある
- 学習コスト (function 定義、step 関数の使い方)

## 見直しトリガー

- Inngest の価格改定で indie に厳しくなった場合
- Vercel が同等の機能 (Workflow API 等) を提供開始した場合
- 顧客の使用例が cron 中心になった場合 (Supabase pg_cron で十分かも)
