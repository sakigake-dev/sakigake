#!/bin/bash
# Sakigake 本 repo の main を customers (private distribution) にも push する。
# 顧客に新機能を配布する際に実行する。

set -e
cd "$(dirname "$0")/../.."

# 念のため main にいるか確認
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
  echo "❌ main ブランチで実行してください(現在: $current_branch)"
  exit 1
fi

# customers remote の存在確認
if ! git remote | grep -q "^customers$"; then
  echo "❌ customers remote が未設定です:"
  echo "  git remote add customers https://github.com/sakigake-dev/sakigake-customers.git"
  exit 1
fi

# 本家を最新化
git pull origin main

# customers に push
echo "→ customers (private) に push..."
git push customers main

echo "✅ sync 完了"
