import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

/**
 * Dashboard 共通レイアウト。
 *
 * ヘッダ + 子ページ。ヘッダには Sakigake ロゴ (ホームリンク) と
 * Clerk UserButton (サインアウト等を含む) を配置。
 *
 * UserButton は Client Component だが、ClerkProvider が root にあるため
 * Server Component の中から問題なくレンダリングできる。
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between py-4">
          <Link href="/" className="text-lg font-semibold">
            Sakigake
          </Link>
          <UserButton />
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
