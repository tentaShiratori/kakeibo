# 家計簿

家計簿アプリです。支出の記録・分類・振り返りを、できるだけ手間なく進められるようにします。

## 技術スタック

- React
- Hono
- Cloudflare
- Terraform

## 開発

ツールチェーンは mise で入れる。プロジェクトのルートで次を実行する

```bash
mise install
```

`mise install` のあと、mise の postinstall hook が lefthook install を実行する。以後、`git commit` で触ったファイルに oxfmt / oxlint（Go なら gofmt）が走る。typecheck とテストは CI。

Cursor はスタートメニューやタスクバーから開かない。Go 拡張は [VS Code プロセスから継承した PATH を使う](https://github.com/golang/vscode-go/issues/1823#issuecomment-933506078) ため、mise が入ったターミナルから起動する

プロジェクトのルートで次を実行する

```bash
cursor .
```

不要コードは fallow で見る。テストでしか使わないコードは `*.test.ts` かリポジトリ直下の `test/` に置く

```bash
pnpm dead-code
```

## コード解析ツール

コードの探索とレビュー用に、次のツールが入っている。ファイルを総当たりで読まず、必要な箇所だけ辿るためのもの。CLI は `mise install` で入る。質問の種類ごとの使い分けは `AGENTS.md` を見る。

### graphify

コード・設計書・画像を横断する知識グラフ。全体構成や、設計とコードの関係など、リポジトリ横断の質問向け。コードは AST からローカルで抽出し、結果は `graphify-out/` に出す（Git 管理しない）。

```bash
graphify update .
graphify query "全体構成は？"
graphify path "A" "B"
graphify explain "概念"
```

### code-review-graph

コードの依存関係をグラフ化する。このリポジトリでは Cursor のフックからレビュー用コンテキストを出す。セッション開始で状態を出し、編集後にグラフを更新し、`git commit` 前に変更差分を添付する。

質問・意味検索・影響範囲・レビュー本文は、同系統の better-code-review-graph を使う。code-review-graph の MCP ツールは質問には使わない。

### Serena

Language Server 経由で、型や定義元をピンポイントで返す。関数名やクラス名が分かっているときの定義元、参照先、リネーム向け。

「〜の処理ある？」のような意味検索には使わない。
