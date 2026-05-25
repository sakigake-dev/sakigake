import { Comparison } from "./_landing/comparison";
import { Features } from "./_landing/features";
import { FAQ } from "./_landing/faq";
import { FinalCTA } from "./_landing/final-cta";
import { Hero } from "./_landing/hero";
import { PainPromise } from "./_landing/pain-promise";
import { Pricing } from "./_landing/pricing";

/**
 * Sakigake LP (Landing Page).
 *
 * 各セクションを `_landing/` 配下に分割し、本ファイルは composition のみに専念する。
 * セクションの追加・並び替え・差し替えはここで完結。
 */
export default function Home() {
  return (
    <main>
      <Hero />
      <PainPromise />
      <Features />
      <Comparison />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </main>
  );
}
