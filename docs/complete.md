# 完成

完成は、web・api・`apps/app` が同じ一冊を扱い、複数人が書いてよい状態である。日常の証明は、作者が毎週の実費を残し、月末に枠つきで収支を見ること。別端末と別人は後半の段の証明。

切替より前のブラウザの実費は完成の対象外。api は空の家計簿から始める。完成の証明は、正本が api になってからの記録で行う。

用語は `CONTEXT.md`。決定の理由は ADR。段の中身は次の設計。作業単位は GitHub issue。

## 段

1. [正本を api にする](./seihon.md) — #25, #26
2. [枠](./waku.md) — #27, #28, #29, #30
3. [app](./app.md) — #31, #32
4. [複数人](./fukusuu.md) — 実装しない。issue は作らない

## issue

正本

- https://github.com/tentaShiratori/kakeibo/issues/25
- https://github.com/tentaShiratori/kakeibo/issues/26

枠

- https://github.com/tentaShiratori/kakeibo/issues/27
- https://github.com/tentaShiratori/kakeibo/issues/28
- https://github.com/tentaShiratori/kakeibo/issues/29
- https://github.com/tentaShiratori/kakeibo/issues/30

app

- https://github.com/tentaShiratori/kakeibo/issues/31
- https://github.com/tentaShiratori/kakeibo/issues/32

## やらないこと

口座間の移動、税、円以外、家計を並べる、支払った人、入出金への人、枠の階層、オフラインの帳簿、公開ホスト、ブラウザ一冊の移行、名簿、合言葉、接続先を入れる画面。
