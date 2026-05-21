import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="container mx-auto py-16 max-w-3xl">
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold">Sakigake (魁)</h1>
            <Badge variant="secondary">v0.1.0</Badge>
          </div>
          <p className="text-muted-foreground mt-3 text-lg">
            日本語ファースト × DDD × Claude Code ネイティブ の Next.js SaaS Boilerplate
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>セットアップ完了</CardTitle>
            <CardDescription>shadcn/ui + Tailwind v4 が動作しています</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>次のステップ</CardTitle>
            <CardDescription>Boilerplate を自分のプロダクトに育てる</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>📁 <code className="bg-muted px-1 rounded">src/contexts/example/</code> に自分のドメインを追加</div>
            <div>🔑 <code className="bg-muted px-1 rounded">.env.local</code> に Clerk / Supabase / Stripe のキーを設定</div>
            <div>🚀 <code className="bg-muted px-1 rounded">pnpm dev</code> で開発開始</div>
            <div>📖 <code className="bg-muted px-1 rounded">CLAUDE.md</code> と <code className="bg-muted px-1 rounded">docs/adr/</code> でアーキテクチャを理解</div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
