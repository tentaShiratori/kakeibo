#!/usr/bin/env bash
# Cloud Agent / ローカル共通の冪等な環境セットアップ。
# 何度実行しても壊れないこと（apt もツールチェーンも導入済みならスキップ）を前提にする。
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

# 1. apps/app（Tauri）の Linux ビルドに要るシステム依存。未導入のときだけ入れる。
if ! pkg-config --exists webkit2gtk-4.1 2>/dev/null; then
  sudo_cmd=""
  if [ "$(id -u)" -ne 0 ]; then sudo_cmd="sudo"; fi
  export DEBIAN_FRONTEND=noninteractive
  $sudo_cmd apt-get update -qq
  $sudo_cmd apt-get install -y --no-install-recommends \
    libwebkit2gtk-4.1-dev build-essential curl wget file \
    libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
fi

# 2. mise（mise.toml でピン止めした go / node / rust / pnpm / uv / turbo などを入れる）。
export PATH="$HOME/.local/bin:$PATH"
if ! command -v mise >/dev/null 2>&1; then
  curl -fsSL https://mise.run | sh
fi
mise trust --yes "$repo_root"
mise install

# 3. 新しいシェルで mise を自動有効化する（冪等）。~/.profile が ~/.bashrc を読むので
#    ログインシェル（tmux）でもツールチェーンが PATH に載る。
if ! grep -q "mise activate bash" "$HOME/.bashrc" 2>/dev/null; then
  echo "eval \"\$($HOME/.local/bin/mise activate bash)\"" >> "$HOME/.bashrc"
fi

# 4. ワークスペースの依存を導入する。
mise exec -- pnpm install --frozen-lockfile

# 5. Next.js 16 のルート型を生成する（未生成だと apps/web の typecheck が LayoutProps で落ちる）。
( cd apps/web && mise exec -- pnpm exec next typegen )
