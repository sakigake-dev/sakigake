import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

/**
 * Hero — H1 + サブ + プライマリ / セカンダリ CTA + ソーシャル・プルーフ・バッジ。
 *
 * H1 は「速く出す」と「ちゃんと作る」両立の二軸を一発で示す。
 * 詳細な訴求は後続セクションで深掘りする。
 */
export function Hero() {
  return (
    <section className="container mx-auto py-20 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Badge variant="secondary">v0.1.0</Badge>
        <Badge variant="outline">Early Bird 受付中</Badge>
      </div>

      <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
        「速く出す」と「ちゃんと作る」を
        <br />
        両立する Next.js SaaS Boilerplate
      </h1>

      <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl">
        100 時間の設定を skip しつつ、6 ヶ月後も触れる土台を手に入れる。
        日本のエンジニアのための、DDD × Claude Code ネイティブの Sakigake。
      </p>

      <div className="flex flex-wrap gap-3 mt-8">
        <Link
          href="#pricing"
          className={buttonVariants({ size: "lg" })}
        >
          Early Bird ¥9,800 で購入
        </Link>
        <Link
          href="https://github.com/sakigake-dev/sakigake"
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          GitHub で見る
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mt-10">
        <Badge>318 tests passing</Badge>
        <Badge>0 DDD violations</Badge>
        <Badge>日本語ファースト</Badge>
        <Badge>Claude Code Native</Badge>
        <Badge>買い切り型</Badge>
      </div>
    </section>
  );
}
