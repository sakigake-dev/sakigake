# ADR-0002: B2B マルチテナンシーに Clerk + Organizations を採用する

- **日付**: 2026-05-17
- **ステータス**: 採用

## 背景

Sakigake は B2B SaaS 立ち上げ向けの boilerplate。
顧客 (boilerplate 利用者) のほとんどは「組織単位で顧客を持つ B2B」を作る想定。
よって認証は単純なユーザー認証ではなく、**ユーザー + 組織 + ロール** の三層が必要。

選択肢:
1. Clerk + Organizations 機能
2. Supabase Auth + 自前で organizations テーブル + RLS で実装
3. NextAuth + Prisma + 自前 organizations

## 採用案

**Clerk + Organizations** を採用する。

- Clerk が Organization、Invitation、Role assignment、SSO、MFA をすべて提供
- Clerk Webhook で tenant context にイベントを流す (本プロジェクトの `clerkWebhookHandler` で実装済)
- Domain 側では Clerk の concept を `ClerkOrganizationId` VO で受けて、内部の `TenantId` にマップ

## 却下案

- **案 B: Supabase Auth + 自前 organizations**
  - 却下理由: Invitation メール、role 管理 UI、SSO の自前実装に最低 2-4 週間
  - 顧客の「最速ローンチ」目的に反する

- **案 C: NextAuth**
  - 却下理由: Organizations の概念がなく、自前実装が必要 (案 B と同じ問題)

- **案 D: WorkOS**
  - 却下理由: SSO 中心で価格帯が高い (月 $500〜)、indie/小規模に過剰

## 影響

良い影響:
- 認証・組織管理に費やす実装時間がゼロに近い (重要)
- Sakigake の差別化「最速ローンチ」と整合

制約:
- Clerk のロックインがある (= テナント数増で料金上昇)
- 月 $25〜 から始まる Pro プランが必要 (Free は MAU 10,000 まで)
- 設計上、顧客が後で別認証 (例: 自前) に移行する場合は重い

## 見直しトリガー

- Clerk の価格改定で indie 開発者にとって受け入れ難くなった場合
- WorkOS が小規模 indie 向けに大幅に値下げした場合
- Better-auth の Organizations 機能が成熟した場合 (現状候補)
