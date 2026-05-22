"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerExampleContainer } from "@/lib/composition/exampleContainer";

/**
 * Create Project Server Action.
 *
 * Form の `action={createProjectAction}` から呼ばれる。
 * Composition Root で組み立てた UseCase を実行する。
 *
 * フロー:
 *   1. Clerk 認証情報取得 (orgId, userId)
 *   2. FormData から name, description を取り出し
 *   3. Container.createProject.execute() で UseCase 起動
 *   4. /dashboard/projects のキャッシュ破棄 → 一覧へリダイレクト
 *
 * エラー処理:
 * - 認証 / 入力エラーは throw → Next.js のエラー UI に出る
 * - 本番運用では useActionState による state-based UI を推奨 (ヒントは page.tsx 参照)
 *
 * 関連: ADR-0003 (Bounded Context 間の通信), exampleContainer.ts
 */
export async function createProjectAction(formData: FormData) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    throw new Error(
      "認証されていないか、Organization が選択されていません",
    );
  }

  const name = String(formData.get("name") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const description = descriptionRaw.length > 0 ? descriptionRaw : undefined;

  if (name.length === 0) {
    throw new Error("Name は必須です");
  }

  const container = await createServerExampleContainer();
  await container.createProject.execute({
    tenantId: orgId, // demo 上の仮定: Clerk orgId === tenantId
    name,
    description,
    ownerId: userId, // demo 上の仮定: Clerk userId === ownerId
  });

  revalidatePath("/dashboard/projects");
  redirect("/dashboard/projects");
}
