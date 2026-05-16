# ADR-0001: 戦術的 DDD を採用する

- **日付**: 2026-05-16
- **ステータス**: 採用

## 背景
SaaS Boilerplate の主要差別化軸として、長期メンテナンスに耐える設計を提供する必要がある。
ShipFast や Supastarter 等の既存競合は fat route handler + Prisma 直叩き型の構造を採用しており、
スケール時にビジネスロジックが Presentation 層に漏れる問題がある。

Sakigake の顧客 (日本の indie 開発者) は、副業から本業 SaaS への移行を視野に入れたい層が多い。
「最初は速く立ち上がるが、後で書き直しが必要」では刺さらない。

## 採用案
戦術的 DDD (Domain-Driven Design) を厳格に適用する:
- Bounded Context による分離 (`src/contexts/<context>/`)
- 4 層のレイヤリング: Presentation / Application / Domain / Infrastructure
- Domain 層は外部依存ゼロ (Next.js / Supabase / Stripe を import しない)
- Repository インターフェースは Domain、実装は Infrastructure
- Value Object で原始型を包む

## 却下案
- **案 A: シンプルな fat route handler + Prisma 直叩き**: ShipFast 型。最速だが、スケール時に破綻。差別化にならない。
- **案 B: クリーンアーキテクチャ完全準拠 (UseCase Interactor + Boundary 厳密)**: より厳格だが、学習コストが高すぎて顧客が定着しない。
- **案 C: フルスタック関数型 (Effect-TS など)**: 興味深いが、日本の開発者にはまだ早い。次バージョンで検討。

## 影響
- 良い影響:
  - 顧客が「設計判断ができる」プロダクトを最速で作れる
  - 既存競合との明確な差別化軸になる
  - Sakigake 自体のポートフォリオ価値が高まる
- 制約:
  - 学習コストはある (ただし AGENTS.md と CLAUDE.md でカバー)
  - Domain / Infrastructure マッピング層のコード量が増える

## 見直しトリガー
- 顧客 (boilerplate 購入者) の 50% 以上が「DDD が重い」と感じた場合
- Effect-TS のような関数型アプローチが日本で普及した場合
