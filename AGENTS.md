# AGENTS.md

AI コーディングエージェント (Cursor / Claude Code / Aider / Codex CLI 等) 向けの共通指示書。

## このプロジェクトについて

Sakigake は Next.js × DDD × Claude Code ネイティブ の SaaS Boilerplate です。
詳細は `CLAUDE.md` を参照してください。

## エージェントが守るべき原則

1. **CLAUDE.md を最初に読む**: 全ての方針判断はここに従う
2. **plans/ に未読のプランがあれば優先的に読む**: 進行中の計画から外れる実装はしない
3. **DDD レイヤーを跨ぐ import は禁止**: Domain → Infrastructure の依存方向のみ
4. **Value Object で原始型を包む**: string → TenantId のように
5. **テストは先または同時に書く**: TDD 推奨
6. **ファイル分割の目安**: 300 行を超えそうなら分ける
7. **secret は絶対にコミットしない**: .env.example のみコミット、実体は .env.local

## ツール固有の設定参照

- Claude Code: .claude/agents/ 配下の 4 エージェントを使い分け、/plan /review /ship を活用
- Cursor: .cursorrules (将来追加予定)
- Aider: CONVENTIONS.md (将来追加予定)

## ドメイン用語

bounded context ごとのユビキタス言語は docs/ubiquitous-language/<context>.md を参照してください。
新しいドメイン用語を導入する時は、まずこのファイルを更新してから実装に入ること。
