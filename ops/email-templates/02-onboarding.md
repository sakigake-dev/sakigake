# 決済確認 → GitHub invite + onboarding メール

**送信タイミング**: Stripe で決済を確認した直後 + GitHub collaborator 追加完了後

**To**: 顧客のメアド
**Subject**: [Sakigake] GitHub ご招待 + Quick Start ガイド

---

{{名前}} 様

決済を確認いたしました。ありがとうございます。

【GitHub ご招待】

GitHub username({{github_username}})宛に
sakigake-dev/sakigake-customers リポジトリへの
collaborator invitation をお送りしました。

ご承認ください:
https://github.com/notifications

【Quick Start】

1. リポジトリを clone(または fork):
   git clone https://github.com/sakigake-dev/sakigake-customers.git my-saas
   cd my-saas

2. 依存をインストール:
   pnpm install

3. 環境変数の設定:
   cp .env.example .env.local
   # .env.local を編集し、Clerk / Supabase / Stripe / Inngest のキーを設定

4. テンプレートのカスタマイズ:
   - CLAUDE.md.template を CLAUDE.md にコピーし、{{プレースホルダ}} を埋める
   - AGENTS.md.template を AGENTS.md にコピーし、ユビキタス言語を追記

5. 開発開始:
   pnpm dev

詳細は README.md と AGENTS.md を参照ください。

【サポート】

- バグ報告 / 機能要望: このメールに返信、または GitHub Issues
- Discord/Slack コミュニティ(準備中)

--
TKDR / Sakigake
https://sakigake.dev
