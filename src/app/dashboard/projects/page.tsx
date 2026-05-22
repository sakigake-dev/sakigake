import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createServerExampleContainer } from "@/lib/composition/exampleContainer";

/**
 * Projects 一覧画面 (デモ)。
 *
 * フロー:
 *   Server Component → Composition Root → UseCase → Repository → DB
 *
 * 顧客が自分のドメインを画面に出すときの参考実装。
 * - Server Component 内で `createServerExampleContainer()` を呼ぶ
 * - UseCase の execute() は primitive (string) で tenantId を受け取る (ADR-0003)
 * - RLS は Composition Root が生成する Clerk JWT 付き Supabase client が担保
 *
 * Note: Sakigake の Button (base-ui ベース) は asChild 非対応。
 * Link をボタン風に見せる場合は `buttonVariants()` を直接 className に渡す。
 */
export default async function ProjectsPage() {
  const { orgId } = await auth();

  if (!orgId) {
    return (
      <main className="container mx-auto py-16 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Organization が選択されていません</CardTitle>
            <CardDescription>
              Project を扱うには Clerk Organization (= Sakigake の Tenant) に
              参加または作成してください。
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  // demo 上の仮定: Clerk orgId をそのまま Sakigake の tenantId として使う。
  // 本番で別 ID 体系にする場合は tenant context で mapping する (ADR-0002 参照)。
  const tenantId = orgId;

  const container = await createServerExampleContainer();
  const { projects } = await container.listProjects.execute({ tenantId });

  return (
    <main className="container mx-auto py-16 max-w-3xl">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-2">
              example context のデモ (Server Component → UseCase 経由)
            </p>
          </div>
          <Link
            href="/dashboard/projects/new"
            className={buttonVariants()}
          >
            新規作成
          </Link>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Project がまだありません</CardTitle>
              <CardDescription>
                右上の「新規作成」から最初の Project を作成してください
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>{project.name}</CardTitle>
                    <Badge
                      variant={
                        project.status === "active" ? "default" : "secondary"
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                  {project.description ? (
                    <CardDescription>{project.description}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  作成: {new Date(project.createdAt).toLocaleString("ja-JP")}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
