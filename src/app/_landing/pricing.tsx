import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Tier = {
  name: string;
  price: string;
  badge: string;
  badgeVariant: "default" | "secondary" | "outline";
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
};

const TALLY_BASE = "https://tally.so/r/44p9bk?utm_source=lp&utm_medium=pricing";

const tiers: Tier[] = [
  {
    name: "Early Bird",
    price: "¥9,800",
    badge: "先着 50 名",
    badgeVariant: "default",
    features: [
      "1 開発者ライセンス",
      "private repository への永続アクセス",
      "自分のプロダクト(無制限)で利用可",
      "メジャーバージョン以内のアップデート",
      "初期フィードバック反映の優先",
    ],
    cta: "Early Bird を申込む",
    href: `${TALLY_BASE}&utm_term=early_bird`,
    highlighted: true,
  },
  {
    name: "Standard",
    price: "¥19,800",
    badge: "通常価格",
    badgeVariant: "secondary",
    features: [
      "1 開発者ライセンス",
      "private repository への永続アクセス",
      "自分のプロダクト(無制限)で利用可",
      "メジャーバージョン以内のアップデート",
    ],
    cta: "Standard を申込む",
    href: `${TALLY_BASE}&utm_term=standard`,
    highlighted: false,
  },
  {
    name: "Agency",
    price: "¥39,800",
    badge: "受託 / ホワイトラベル",
    badgeVariant: "outline",
    features: [
      "Standard の全機能",
      "クライアントワークでの利用可",
      "ホワイトラベル(自社製品としての提示可)",
      "最大 3 開発者まで(チーム利用可)",
    ],
    cta: "Agency を申込む",
    href: `${TALLY_BASE}&utm_term=agency`,
    highlighted: false,
  },
];

/**
 * 3-tier 価格セクション。
 *
 * Early Bird を highlighted で目立たせ、Standard を中央、Agency を右に配置。
 * 全て買い切り(サブスクなし)というメッセージを 1 行で添える。
 *
 * 申込フォームは Tally。Phase B で Stripe Checkout に置き換え予定。
 * ライセンス詳細は LICENSE.md を参照。
 */
export function Pricing() {
  return (
    <section id="pricing" className="container mx-auto py-16 max-w-5xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">価格</h2>
        <p className="text-muted-foreground mt-3">
          すべて買い切り。月額サブスクなし。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <Card
            key={t.name}
            className={t.highlighted ? "border-primary border-2" : ""}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t.name}</CardTitle>
                <Badge variant={t.badgeVariant}>{t.badge}</Badge>
              </div>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">
                  {t.price}
                </span>
                <span className="text-sm"> 買い切り</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm mb-6">
                {t.features.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={t.href}
                target="_blank"
                rel="noreferrer"
                className={`${buttonVariants({
                  variant: t.highlighted ? "default" : "outline",
                  size: "lg",
                })} w-full`}
              >
                {t.cta}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8">
        ※ ボタンをクリックすると申込フォームへ。確認次第、private repo へご招待します。
        <br />
        ※ ライセンス詳細は{" "}
        <Link
          href="https://github.com/sakigake-dev/sakigake/blob/main/LICENSE.md"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          LICENSE.md
        </Link>{" "}
        を参照。再販・再配布・競合 boilerplate としての販売は禁止です。
      </p>
    </section>
  );
}
