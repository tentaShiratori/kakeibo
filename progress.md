## 現在の状態

- 実装済み: apps/web の入出金記録（金額・入出日・メモ、直す・消す、戻す、暦月の収支と一覧、壊れた保存のひとつ前）、Jotai の atomWithStorage によるブラウザ保存、TanStack Form と Valibot による入力検証、web の簡易デザインシステム（globals.css のトークンと Button / Field）、web のテスト描画は `test/renderApp`、ドメイン（CONTEXT.md / ADR-0001〜0013）、oxlint / oxfmt / vitest、apps/app 初期テンプレ、api Hello World、GitHub の issue / PR テンプレート、Dependabot の週次更新、PR / main の CI、Dependabot の minor / patch は CI 通過後に自動マージ、fallow による不要コード検査
- 作業中: なし
- 未着手: api に入出金を載せる（#22）、枠の名前、入出金の app 側、web から api への接続、端末をまたぐ同じ一冊

## 意思決定ログ

- 2026-09-06: web は Next.js 16 を採用
- 2026-09-06: ネイティブは Tauri を採用
- 2026-09-06: API は Go で開始
- 2026-09-06: 探索ツールは graphify / better-code-review-graph / Serena（使い分けは AGENTS.md）
- 2026-09-06: lint は oxlint、fmt は oxfmt、テストは vitest。ESLint / Prettier は使わない
- 2026-09-06: 家計は一冊。複数人が書いてよい。最初に成立させる仕事は記録（ADR-0001）
- 2026-09-06: 記録は支出のみ。必須は金額と支出日。支払った人は持たない（ADR-0002, ADR-0003）
- 2026-09-06: 記録は収入と支出の両方。口座間の移動はまだ記録ではない（ADR-0004 が ADR-0002 を置き換え）
- 2026-09-06: 一件は直す。返金は収入にしない。金額は1円以上の整数円。収入は家計の外からだけ（ADR-0005, ADR-0006）
- 2026-09-06: 入出金は消せる。入出日は今日以前の暦日。親の名は入出金。家計メンバーは持たない（ADR-0007, ADR-0008）
- 2026-09-06: メモは任意。家計は一つ。金額は円だけ（ADR-0009, ADR-0010）
- 2026-09-06: 分類は任意の枠への後付け。振り返りは暦月の収支（ADR-0011, ADR-0012）
- 2026-09-06: 入出金に付く枠は0または1（ADR-0013）
- 2026-09-06: 入出金の記録はまず apps/web。保存はブラウザ内。枠の名前はまだ開かない
- 2026-09-07: PMはエージェント。次の一手と切るものを決め、PRにする。違うときだけ止める
- 2026-09-07: 最初に書く人は一人。名簿も同期もまだ開かない
- 2026-09-07: 記録の成立は、今週の実費を今の web に残せて、同じブラウザで翌週も見られること
- 2026-09-07: 次の楔は暦月の振り返り。収支と一覧を同じ月にする。枠・api・app はまだ
- 2026-09-07: 消すは残す。誤って消した実費は、同じ画面にいる間だけ戻せる。再読込後は戻さない
- 2026-09-07: 記録の仕事は金額から始める。記録したあとは金額に戻り、続けて書ける
- 2026-09-07: 帳簿が壊れたらひとつ前を出す。空の帳簿は壊れていない
- 2026-09-07: PMは降りる。既存PRを完成させて止める
- 2026-09-07: フォームは TanStack Form、検証は Valibot。入出金のルールは nyushukkin のスキーマに置く。層は増やさない
- 2026-09-07: GitHub の issue は不具合と機能のフォーム、PR は `.github/PULL_REQUEST_TEMPLATE.md` の単一テンプレート。空の issue も残す
- 2026-09-07: 依存の自動更新は Dependabot（Renovate はアプリ追加が要るので見送り）。npm / gomod / cargo / github-actions を週次。lint・test とその他の非メジャーをグループ化。メジャーは別 PR。自動マージはしない
- 2026-09-07: Dependabot の minor / patch は CI 成功後に squash マージする。major は触らない。リポジトリの Allow auto-merge はオフなので、workflow_run で CI 完了を待ってから gh pr merge する
- 2026-09-07: PR と main の push で GitHub Actions を回す。JS は pnpm lint / fmt:check / typecheck / test。Go は gofmt -l と go test。ツールのバージョンは mise.toml。turbo に test を足した。CI ではパッケージのテストを全部回す
- 2026-09-07: web の typecheck は `next typegen` のあと `tsc`。LayoutProps は生成型なので、クリーンな CI では typegen が要る
- 2026-09-07: web の入出金画面は `useNyushukkin` / `NyushukkinForm` / `NyushukkinItem` に分け、`Ledger` は組み立てだけ。ファイルは `app/_lib/` の PascalCase
- 2026-09-07: ブラウザ保存は Jotai の `atomWithStorage`。キーと壊れた保存のひとつ前（`.bak`）は変えない。消した入出金の戻すは画面にいる間だけなので atom に載せない
- 2026-09-07: 金額の数値化は Valibot の `toNumber`。スキーマの出力を使い、パース後の `Number` は置かない
- 2026-09-07: 不要コードは fallow。テスト専用の export は本番に置かない。CI は `fallow dead-code` と `--production` の両方。`skills` は CLI なので ignore。warn 系は advisory のまま
- 2026-09-07: 記録の楔は閉じた。次の楔は api に入出金を載せる（#22）。web と同じ形（収入/支出・金額・入出日・メモ）。プロセスに一冊、ファイル保存、その月の一覧。認証・名簿・公開は持たない
- 2026-09-07: web はブラウザ保存のまま。api への接続、正本の移動、戻す、収支専用の口、DB、枠、app、口座間の移動はまだ開かない
- 2026-09-07: デザインシステムは簡易。トークンは globals.css、部品は Button と Field を app/_lib に置く。packages は新設しない
- 2026-09-07: afterFileEdit フックは stdin の BOM を除いてから JSON を読む。Windows で Cursor が BOM を付けると format.ts が落ちていた
- 2026-09-07: web のテスト描画は `apps/web/test/renderApp`。Provider は `AppProviders` に足す。コンポーネントテストの `render` は `renderApp` に置き換えた。`renderHook` はそのまま
- 2026-09-07: turbo の一括テストは `test:run`。パッケージの `test` は vitest（`pnpm test run {ファイル}` 用）。ルートの `pnpm test` は `turbo run test:run`

## 次のセッションで対応すること

- 枠の名前はまだ開かない
- web から api への接続と、端末をまたぐ同じ一冊はまだ開かない
- 入出金の app 側はまだ開かない
- 名簿はまだ開かない
- api の入出金は #22
