import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ComparisonRow = {
  feature: string;
  sakigake: string;
  shipfast: string;
  supastarter: string;
  custom: string;
};

const rows: ComparisonRow[] = [
  {
    feature: "日本語ドキュメント",
    sakigake: "✅",
    shipfast: "❌",
    supastarter: "❌",
    custom: "—",
  },
  {
    feature: "Stripe JP 対応",
    sakigake: "✅",
    shipfast: "❌",
    supastarter: "❌",
    custom: "—",
  },
  {
    feature: "DDD アーキテクチャ",
    sakigake: "✅ 強制",
    shipfast: "❌",
    supastarter: "❌",
    custom: "—",
  },
  {
    feature: "Claude Code ネイティブ",
    sakigake: "✅",
    shipfast: "❌",
    supastarter: "❌",
    custom: "—",
  },
  {
    feature: "依存違反の自動検知",
    sakigake: "✅ depcruise CI",
    shipfast: "❌",
    supastarter: "❌",
    custom: "—",
  },
  {
    feature: "ADR テンプレ + サンプル",
    sakigake: "✅ 5 本同梱",
    shipfast: "❌",
    supastarter: "❌",
    custom: "—",
  },
  {
    feature: "価格(円換算)",
    sakigake: "¥9,800〜",
    shipfast: "$299 ≒ ¥45,000",
    supastarter: "$299 ≒ ¥45,000",
    custom: "100h × ¥3,000 = ¥300,000+",
  },
];

/**
 * 比較表。Sakigake / ShipFast / Supastarter / 自作 の 4 軸で並べる。
 *
 * 「自作」を含めるのが要点 — 機能比較ではなく「時間コスト」を可視化することで、
 * 既存の英語圏 boilerplate を買う層 + 自作派 の両方を同時に説得する。
 */
export function Comparison() {
  return (
    <section className="container mx-auto py-16 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>競合比較</CardTitle>
          <CardDescription>
            既存ソリューションとの違いを 1 表で
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">機能 / 観点</TableHead>
                  <TableHead className="font-bold">Sakigake</TableHead>
                  <TableHead>ShipFast</TableHead>
                  <TableHead>Supastarter</TableHead>
                  <TableHead>自作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.feature}</TableCell>
                    <TableCell>{r.sakigake}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.shipfast}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.supastarter}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.custom}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
