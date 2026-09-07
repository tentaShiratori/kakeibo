#!/usr/bin/env bash
# Cloud Agent / ローカル共通の冪等な環境セットアップ。
# 何度実行しても壊れないこと（apt もツールチェーンも導入済みならスキップ）を前提にする。
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

# root 以外なら sudo を使う（apt と /usr/local/bin への symlink で使う）。
sudo_cmd=""
if [ "$(id -u)" -ne 0 ]; then sudo_cmd="sudo"; fi

# 1. apps/app（Tauri）の Linux ビルドに要るシステム依存。未導入のときだけ入れる。
if ! pkg-config --exists webkit2gtk-4.1 2>/dev/null; then
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

# 6. 非ログインで起動される MCP サーバ（mcp.json の uvx 起動）やフック（hooks.json の
#    node .cursor/hooks/*.ts）からもピン止めツールを引けるようにする。~/.bashrc の
#    mise 有効化はログインシェルにしか効かないため、mise の shims を /usr/local/bin
#    （どの PATH にも入る）へ張る。shim は mise バイナリへの symlink で単体動作する。
shims_dir="$HOME/.local/share/mise/shims"
mise reshim
if [ -d "$shims_dir" ]; then
  for shim in "$shims_dir"/*; do
    $sudo_cmd ln -sf "$shim" "/usr/local/bin/$(basename "$shim")"
  done
fi

# 7. graphify のナレッジグラフを生成する（AST 抽出のみ・API コスト無し）。エージェントが
#    最初から graphify-out/ を使えるようにする。失敗しても install 全体は止めない。
mise exec -- graphify update . || echo "graphify update をスキップ。後で 'graphify update .' を手動実行してください。"
