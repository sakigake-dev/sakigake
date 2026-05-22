import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProjectAction } from "./actions";

/**
 * 新規 Project 作成画面 (デモ)。
 *
 * フロー: Form submit → Server Action → Composition Root → UseCase → Repository
 *
 * 顧客拡張ヒント:
 * - エラー表示は `useActionState` (旧 useFormState) を使うのが推奨。
 *   その場合は 'use client' に切り替え、actions.ts を state を返す型に変更する。
 * - 現状は最小実装: エラー時は Next.js のエラー画面、成功時は一覧へリダイレクト。
 *
 * Note: Sakigake の Button は asChild 非対応のため、Link を「outline ボタン風」に
 * 見せる場合は `buttonVariants({ variant: "outline" })` を直接付与する。
 */
export default function NewProjectPage() {
  return (
    <main className="container mx-auto py-16 max-w-xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">新規 Project</h1>
          <p className="text-muted-foreground mt-2">
            CreateProjectUseCase を Server Action 経由で呼び出します
          </p>
        </div>

        <Card>
          <form action={createProjectAction}>
            <CardHeader>
              <CardTitle>Project 詳細</CardTitle>
              <CardDescription>
                Name は tenant 内で一意である必要があります
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  minLength={1}
                  maxLength={100}
                  placeholder="例: 新サービス検証PoC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (任意)</Label>
                <Input
                  id="description"
                  name="description"
                  maxLength={500}
                  placeholder="補足説明があれば"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">作成</Button>
                <Link
                  href="/dashboard/projects"
                  className={buttonVariants({ variant: "outline" })}
                >
                  キャンセル
                </Link>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </main>
  );
}
