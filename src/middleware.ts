import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Clerk Authentication Middleware.
 *
 * /dashboard 配下を認証必須にする。未認証アクセスは Clerk のサインイン画面に
 * 自動リダイレクトされる (Clerk hosted UI を使用)。
 *
 * 顧客が独自の保護ルートを増やす場合は createRouteMatcher の配列に追加する。
 * 関連: ADR-0002 (Clerk → Supabase 認証連携)
 */
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Next.js internals と静的ファイルをスキップ
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API/tRPC ルートは常に middleware を通す
    "/(api|trpc)(.*)",
  ],
};
