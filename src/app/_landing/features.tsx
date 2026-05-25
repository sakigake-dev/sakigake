import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Feature = {
  num: string;
  title: string;
  description: string;
  bullets: string[];
};

const features: Feature[] = [
  {
    num: "01",
    title: "Claude Code が drift しない土台",
    description:
      "CLAUDE.md + AGENTS.md + 4 subagents で AI に context を共有。何度実装させても規約から外れない。",
    bullets: [
      "CLAUDE.md(プロダクト指針 99 行) + AGENTS.md(コード規約 + ユビキタス言語 219 行)",
      ".claude/agents/ に planner-researcher / implementer / tester / code-reviewer 4 体",
      "顧客向けの CLAUDE.md.template + AGENTS.md.template も同梱(プレースホルダ {{}} を埋めて開始)",
      "AGENTS.md 規格に準拠 → Cursor / Aider / Codex CLI でも portable",
    ],
  },
  {
    num: "02",
    title: "6 ヶ月後にも触れる土台",
    description:
      "DDD アーキテクチャを「構造」で強制。技術負債をレビュー疲れに頼らず防ぐ。",
    bullets: [
      "Bounded Context 分離(tenant / billing / 顧客のドメイン)",
      "4 層レイヤリング(Domain / Application / Infrastructure / Presentation)",
      "dependency-cruiser で違反を CI 検知(現状 137 modules / 0 violations 維持)",
      "ADR テンプレ + 設計判断 5 本のサンプル(DDD / Clerk / 境界通信 / depcruise / Inngest)",
    ],
  },
  {
    num: "03",
    title: "日本のエンジニア専用設計",
    description:
      "日本語ファーストで全てを書き直したのは Sakigake が初めて。文脈ロスゼロで読める。",
    bullets: [
      "日本語ドキュメント、日本語コメント、日本語の ADR サンプル",
      "Stripe JP 対応(¥ 表記、税込/税抜、JCB 含む)",
      "Clerk Japan ロケール対応",
      "日本のエンジニアが迷わないオンボーディング(Quick Start も日本語)",
    ],
  },
];

/**
 * 3 つの差別化軸を 1 セクション = 1 カードで深掘り。
 *
 * 「番号 + タイトル + 一行説明 + 具体的な箇条書き」の構成は読み手の
 * 認知負荷を下げ、各カードを skim しても訴求が落ちない。
 */
export function Features() {
  return (
    <section className="container mx-auto py-16 max-w-4xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">3 つの差別化</h2>
        <p className="text-muted-foreground mt-3">
          グローバル競合(ShipFast / Supastarter 等)と何が違うか
        </p>
      </div>

      <div className="space-y-6">
        {features.map((f) => (
          <Card key={f.num}>
            <CardHeader>
              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-bold text-muted-foreground">
                  {f.num}
                </span>
                <div>
                  <CardTitle>{f.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {f.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground pl-12">
                {f.bullets.map((b, j) => (
                  <li key={j}>・{b}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
