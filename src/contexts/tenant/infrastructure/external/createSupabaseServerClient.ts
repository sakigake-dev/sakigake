/**
 * Supabase クライアントファクトリ — tenant context Infrastructure 層。
 *
 * createTenantAwareSupabaseClient:
 *   Clerk JWT ("supabase" テンプレート) を Authorization ヘッダに付与して
 *   Supabase Server Client を生成する。RLS が JWT の org_id クレームを参照し
 *   テナント分離を実現する。
 *
 * Service Role Key を使うクライアントは dangerouslyCreateServiceRoleClient.ts を参照。
 */

import { createServerClient } from "@supabase/ssr";
import { auth } from "@clerk/nextjs/server";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

export async function createTenantAwareSupabaseClient() {
  const { getToken } = await auth();
  const supabaseToken = await getToken({ template: "supabase" });

  if (!supabaseToken) {
    throw new Error(
      "Clerk session has no Supabase JWT. Ensure the user is authenticated and the 'supabase' JWT template is configured in Clerk.",
    );
  }

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      global: {
        headers: { Authorization: `Bearer ${supabaseToken}` },
      },
      // Cookie は使わない — Clerk JWT のみで認証する
      cookies: { getAll: () => [], setAll: () => {} },
    },
  );
}
