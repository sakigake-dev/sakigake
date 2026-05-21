/**
 * @file clerkWebhookHandler.ts
 *
 * Clerk Webhook イベントを受け取り、適切な UseCase に dispatch する Presentation ハンドラ。
 *
 * セキュリティ設計:
 * - Svix ライブラリで署名検証を行い、検証失敗は即座に 400 を返す。
 * - 検証済みペイロードを zod でバリデーションし、型安全性を保証する。
 *
 * エラーハンドリング方針:
 * - DomainError (不変条件違反) → 400: 同じペイロードを再送されても永遠に失敗するため
 *   Clerk の retry を防ぐために 400 を返す。
 * - Repository / 接続エラー → 500: Clerk が retry する。冪等性の頼みの綱。
 * - 未知のイベント type → 200: Clerk 側のリトライ防止のため受信のみ。
 * - organization.updated → 200 (将来 UpdateTenantNameUseCase を実装予定)
 *
 * billing context との連携 (Plan 002 §1-3):
 * organization.created 処理後に CreateInitialSubscriptionUseCase を同期的に呼ぶ。
 * 失敗時は 500 を返し Clerk の retry に委ねる。冪等性により重複実行を安全に扱う。
 * 将来 Inngest 等の非同期 EventBus に移行する際はこの直接呼び出しを削除する。
 *
 * DI (依存注入):
 * テスト容易性のため createClerkWebhookHandler(useCases) ファクトリを公開する。
 * 合成ルート (production 用のデフォルト依存組み立て) は
 * src/app/api/webhooks/clerk/route.ts に置く。
 * これにより tenant/presentation が billing/infrastructure を直接 import することなく、
 * DDD の Bounded Context 越境ルール (Presentation → 他 context の Application のみ許可)
 * を遵守する。
 */

import { TenantId } from "../../domain/valueObjects/TenantId";
import { Webhook, type WebhookRequiredHeaders } from "svix";
import { z } from "zod";
import { CreateTenantUseCase } from "../../application/usecases/CreateTenantUseCase";
import { AddMemberUseCase } from "../../application/usecases/AddMemberUseCase";
import { RemoveMemberUseCase } from "../../application/usecases/RemoveMemberUseCase";
import { DomainError } from "../../domain/errors/DomainError";
import { ApplicationError } from "../../application/errors/ApplicationError";
import { ClerkOrganizationId } from "../../domain/valueObjects/ClerkOrganizationId";
import type { ITenantRepository } from "../../domain/repositories/ITenantRepository";
import type { CreateInitialSubscriptionUseCase } from "../../application/hooks/CreateInitialSubscriptionUseCase";

// ─── Clerk ロール → Domain MemberRole 変換マップ ──────────────────────────────
//
// Clerk が送信するロール文字列 (org:admin 等) を Domain の MemberRoleValue に変換する。
//
// Plan 002 §4-1 の JWT クレーム例では org_role = "{{org.role}}" となっており、
// Clerk の組織ロールは "org:admin" / "org:member" の形式で送信される。
// "org:admin" → Domain "admin"、"org:member" → Domain "member" にマッピングする。
//
// マッピング不明な値は Domain の最小権限原則に従い "member" にフォールバックする。
// (不明なロールに過大な権限を与えることを防ぐ設計判断)
//
// "org:admin" については Clerk の Org Creator には自動的に admin が付与される。
// "owner" ロールは organization.created イベントの created_by フィールドで
// 初期 owner として付与するため、membership イベントでは登場しない想定。
const CLERK_ROLE_TO_DOMAIN_ROLE = new Map<
  string,
  "owner" | "admin" | "member"
>([
  ["org:admin", "admin"],
  ["org:member", "member"],
]);

function mapClerkRoleToDomain(clerkRole: string): "owner" | "admin" | "member" {
  return CLERK_ROLE_TO_DOMAIN_ROLE.get(clerkRole) ?? "member";
}

// ─── zod スキーマ ────────────────────────────────────────────────────────────
//
// discriminatedUnion は zod v4 では各 option が literal type を持つ必要があるため、
// catch-all (z.string()) を含む場合は使用できない。
// 代わりにまず type フィールドを解析し、既知のイベントのみ詳細バリデーションする方式を採る。

const organizationEventDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_by: z.string(),
});

const organizationMembershipEventDataSchema = z.object({
  organization: z.object({ id: z.string() }),
  public_user_data: z.object({ user_id: z.string() }),
  role: z.string(),
});

const clerkWebhookBaseSchema = z.object({
  type: z.string(),
  data: z.unknown(),
});

const KNOWN_ORG_EVENT_TYPES = new Set([
  "organization.created",
  "organization.updated",
]);

const KNOWN_MEMBERSHIP_EVENT_TYPES = new Set([
  "organizationMembership.created",
  "organizationMembership.deleted",
]);

// ─── DI 型定義 ───────────────────────────────────────────────────────────────

export type ClerkWebhookHandlerDeps = {
  createTenant: CreateTenantUseCase;
  addMember: AddMemberUseCase;
  removeMember: RemoveMemberUseCase;
  repository: ITenantRepository;
  createInitialSubscription: CreateInitialSubscriptionUseCase;
};

// ─── ファクトリ ───────────────────────────────────────────────────────────────

export function createClerkWebhookHandler(deps: ClerkWebhookHandlerDeps) {
  return async (request: Request): Promise<Response> => {
    // 1. Svix 署名検証
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!signingSecret) {
      console.error("[clerkWebhookHandler] CLERK_WEBHOOK_SIGNING_SECRET is not set");
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    let rawBody: string;
    try {
      rawBody = await request.text();
    } catch {
      return Response.json({ error: "Failed to read request body" }, { status: 400 });
    }

    const wh = new Webhook(signingSecret);
    const headers: WebhookRequiredHeaders = {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    };

    let unverifiedPayload: unknown;
    try {
      unverifiedPayload = wh.verify(rawBody, headers);
    } catch {
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 2. ベーススキーマバリデーション (type フィールドの存在確認)
    const baseResult = clerkWebhookBaseSchema.safeParse(unverifiedPayload);
    if (!baseResult.success) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { type, data } = baseResult.data;

    // 3. イベント type に応じて UseCase を呼び分け
    try {
      if (KNOWN_ORG_EVENT_TYPES.has(type)) {
        const dataResult = organizationEventDataSchema.safeParse(data);
        if (!dataResult.success) {
          return Response.json({ error: "Invalid payload" }, { status: 400 });
        }

        if (type === "organization.created") {
          const result = await deps.createTenant.execute({
            clerkOrganizationId: dataResult.data.id,
            name: dataResult.data.name,
            initialOwnerClerkUserId: dataResult.data.created_by,
          });

          // billing context との連携 (Plan 002 §1-3):
          // Tenant 作成後に初期サブスクリプション (free) を同期的に生成する。
          // CreateInitialSubscriptionUseCase は冪等なので Webhook 再送でも安全。
          await deps.createInitialSubscription.execute({
            tenantId: result.tenantId,
          });

          return Response.json({ ok: true }, { status: 200 });
        }

        // organization.updated: UpdateTenantNameUseCase は次フェーズで実装予定
        return Response.json({ ok: true }, { status: 200 });
      }

      if (KNOWN_MEMBERSHIP_EVENT_TYPES.has(type)) {
        const dataResult = organizationMembershipEventDataSchema.safeParse(data);
        if (!dataResult.success) {
          return Response.json({ error: "Invalid payload" }, { status: 400 });
        }

        const clerkOrgId = ClerkOrganizationId.from(dataResult.data.organization.id);
        const tenant = await deps.repository.findByClerkOrganizationId(clerkOrgId);
        if (tenant === null) {
          // Tenant が未作成の場合は organization.created が先に処理される想定。
          // Webhook 順序の逆転は稀だが、400 を返すと Clerk が retry しないため
          // 一時的な 500 で retry を促す。
          return Response.json({ error: "Tenant not found" }, { status: 500 });
        }

        if (type === "organizationMembership.created") {
          await deps.addMember.execute({
            tenantId: tenant.id.value,
            userClerkId: dataResult.data.public_user_data.user_id,
            role: mapClerkRoleToDomain(dataResult.data.role),
          });
          return Response.json({ ok: true }, { status: 200 });
        }

        // organizationMembership.deleted
        await deps.removeMember.execute({
          tenantId: tenant.id.value,
          userClerkId: dataResult.data.public_user_data.user_id,
        });
        return Response.json({ ok: true }, { status: 200 });
      }

      // 未知のイベント type は 200 で受信のみ (Clerk 側のリトライ防止)
      return Response.json({ ok: true }, { status: 200 });
    } catch (error) {
      if (error instanceof DomainError) {
        // 不変条件違反は同ペイロードを再送されても失敗し続けるため 400 を返す。
        // error.message は Domain 側で生成された短い英文 (例: "Cannot remove the
        // last owner") に限定されており、Webhook ペイロード由来の値は含まない。
        return Response.json({ error: error.message }, { status: 400 });
      }
      if (error instanceof ApplicationError) {
        // 現状 ApplicationError は永続的な前提崩れ (TenantNotFoundError) のみ。
        // 将来 ConcurrencyError 等 transient なサブクラスを追加する際は
        // PermanentApplicationError / TransientApplicationError に派生を分けて、
        // 後者は 500 で Clerk の retry に乗せる必要がある。
        return Response.json({ error: error.message }, { status: 400 });
      }
      // 予期しないエラー (Supabase 接続エラー等) は 500 で Clerk の retry を促す。
      // ペイロード由来の値はレスポンスに含めない (機微情報の漏洩防止)。
      console.error("[clerkWebhookHandler] Unexpected error:", error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

