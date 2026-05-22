/**
 * Supabase client factories — Composition Root.
 *
 * 役割:
 * - 全 bounded context が `SupabaseClient` を primitive な依存として受け取れるよう、
 *   生成方法を Composition Root に集約する
 * - 各 context は「どう作るか」を知らない。Composition Root のみが知る
 *
 * 現状提供する factory:
 * - createServerSupabaseClient: Server Component / Route Handler 用 (Clerk JWT + RLS)
 *
 * 将来追加予定:
 * - createBrowserSupabaseClient: Client Component 用 (RLS 有効、ブラウザ側)
 * - createServiceRoleSupabaseClient: Webhook 用 (RLS bypass、server only)
 *
 * 関連:
 * - ADR-0002 (Clerk → Supabase 認証連携)
 * - ADR-0003 (Bounded Context 間の通信)
 */

import { createTenantAwareSupabaseClient } from "@/contexts/tenant/infrastructure/external/createSupabaseServerClient";

/**
 * Server-side Supabase client (Clerk JWT 経由、RLS 有効)。
 *
 * 使用箇所: Server Component, Route Handler, Server Action。
 * 前提: Clerk セッションが存在し、"supabase" JWT template が設定済みであること。
 * 取得方法は ADR-0002 を参照。
 */
export async function createServerSupabaseClient() {
  return createTenantAwareSupabaseClient();
}
