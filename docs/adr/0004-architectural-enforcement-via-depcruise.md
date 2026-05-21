# ADR-0004: アーキテクチャ違反を dependency-cruiser で機械的に検出する

- **日付**: 2026-05-17
- **ステータス**: 採用

## 背景

DDD レイヤー (Domain / Application / Infrastructure / Presentation) と
Bounded Context の境界は、**人間がレビューだけで守るのは困難**。
特に Claude Code 等の AI が大量にコードを書く時代、レビュー疲れで違反が混入しやすい。

ShipFast / Supastarter は構造自体をシンプルにしてこの問題を回避しているが、
Sakigake は DDD 構造を売りにしているので「強制力」が必要。

## 採用案

**dependency-cruiser** で以下のルールを CI レベルで強制する:

1. `no-domain-to-application` - Domain は Application に依存しない
2. `no-domain-to-infrastructure` - Domain は Infrastructure に依存しない
3. `no-domain-to-presentation` - Domain は Presentation に依存しない
4. `no-domain-to-framework` - Domain は Next.js / Supabase / Stripe / Clerk / Inngest 等を import しない
5. `no-application-to-infrastructure` - Application は Infrastructure を直接 import しない
6. `no-application-to-presentation` - Application は Presentation に依存しない
7. `no-cross-context-direct` - Bounded Context 間の直接 import 禁止
8. `no-circular` - 循環依存禁止

実装: `.dependency-cruiser.cjs`、`pnpm depcruise` で検証。

将来: pre-commit hook (Husky 等) と CI (GitHub Actions) で自動実行する。
顧客はこのルールセットを **そのまま使うか、自分のドメインに合わせて緩めるか** を選べる。

## 却下案

- **案 A: ESLint rule で同等のチェック**
  - 却下理由: ESLint の import 制限ルール (`import/no-restricted-paths`) は表現力が低い
    (named capture group や複雑な path pattern が書きづらい)、特に bounded context の
    「同じ context は OK、他は NG」のような条件が冗長になる

- **案 B: 人間のレビューに任せる**
  - 却下理由: スケールしない、AI コーディングと相性が悪い

- **案 C: 何もしない**
  - 却下理由: 半年で構造が崩れる、Sakigake の差別化軸が消える

## 影響

良い影響:
- 設計判断が機械的に守られる
- 顧客が安心して Claude Code / Cursor に大規模変更を任せられる (差別化)
- 新規メンバーのオンボーディングコスト低下

制約:
- ルール調整の学習コスト (顧客が自分のドメイン向けに緩める時)
- depcruise の起動が遅め (現状 250 modules で 5-10 秒)
- pre-commit hook を入れる場合、commit 時間が伸びる

## 見直しトリガー

- depcruise のメンテが止まった場合
- ESLint Flat Config + 良い import 制限プラグインが出てきた場合
- 顧客から「ルールが厳しすぎて使いづらい」が多数派になった場合 (緩いプリセットの提供を検討)
