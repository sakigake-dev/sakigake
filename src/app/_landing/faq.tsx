import { Card, CardContent } from "@/components/ui/card";

type FAQ = {
  q: string;
  a: string;
};

const faqs: FAQ[] = [
  {
    q: "¥19,800 って高くないですか?",
    a: "100 時間の設定 × フリーランス単価 ¥3,000/h で換算すると ¥300,000 の節約。加えて 6 ヶ月後の書き直しコストもゼロ。Early Bird (¥9,800) なら 1 日分の作業で元が取れる計算です。",
  },
  {
    q: "本当に動くんですか?",
    a: "GitHub repo を公開しており、現状 318 tests passing / 137 modules / 0 DDD violations を維持しています。/dashboard/projects で Server Component → Composition Root → UseCase → Supabase RLS の demo が実際に動きます。",
  },
  {
    q: "ShipFast との違いは?",
    a: "① 日本語ファースト ② DDD アーキテクチャを機械的に強制 ③ Claude Code / AI agent ネイティブ ④ Stripe JP 対応。上記の比較表を参照してください。",
  },
  {
    q: "サポートはありますか?",
    a: "購入者向けの Discord / Slack コミュニティを準備中です。バグ修正 + メジャーバージョン以内のアップデートは無償で提供します。",
  },
  {
    q: "更新が止まったらどうなりますか?",
    a: "買い切り型なので、購入時点の source code は手元に残ります。プラットフォーム依存(Clerk / Supabase / Stripe)はあっても、コード自体は永続的にあなたのものです。",
  },
  {
    q: "知らない人から買って大丈夫ですか?",
    a: "Sakigake repo そのものが品質の証拠です。加えて作者の GitHub(takepon7)で過去のプロダクト(kaigo-dx / biz-english-master 等)が確認可能。X (@sakigake_dev) で開発過程も公開中。",
  },
];

/**
 * FAQ セクション。
 *
 * 「買わない理由」を打ち消す 6 つの Q&A を網羅。
 * Card 1 つ = 1 Q&A の単純な構造で skim しやすくする。
 */
export function FAQ() {
  return (
    <section className="container mx-auto py-16 max-w-3xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">よくある質問</h2>
      </div>

      <div className="space-y-4">
        {faqs.map((f, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <h3 className="font-semibold">Q. {f.q}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                A. {f.a}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
