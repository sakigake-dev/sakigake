import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/**
 * Final CTA — 質問形式で「自作する? それとも始める?」と問いを残す。
 *
 * Pricing で迷ったユーザーを引き戻すための「最後の一押し」。
 * 過剰な装飾は避け、Hero と同じ価格訴求で対称性を保つ。
 */
export function FinalCTA() {
  return (
    <section className="container mx-auto py-20 max-w-3xl text-center">
      <h2 className="text-3xl md:text-4xl font-bold leading-tight">
        次の SaaS を、100 時間かけて自作するか?
        <br />
        それとも今日始めるか?
      </h2>

      <p className="text-muted-foreground mt-6 text-lg max-w-xl mx-auto">
        Sakigake は「速く出す」と「ちゃんと作る」を両立する選択肢です。
        買い切りなので、後から減るコストはありません。
      </p>

      <div className="mt-10">
        <Link
          href="#pricing"
          className={`${buttonVariants({ size: "lg" })} text-base`}
        >
          Early Bird ¥9,800 で今日始める
        </Link>
      </div>
    </section>
  );
}
