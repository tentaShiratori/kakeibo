import { describe, expect, test } from "vitest";
import {
  monthTotals,
  removeNyushukkin,
  replaceNyushukkin,
  restoreNyushukkin,
  sortNyushukkin,
} from "./nyushukkin";

describe("removeNyushukkin / restoreNyushukkin", () => {
  const items = [
    { id: "a", kind: "支出" as const, amount: 5000, date: "2026-09-06", memo: "" },
    { id: "b", kind: "支出" as const, amount: 5000, date: "2026-09-06", memo: "" },
  ];

  test("ある入出金を消せる", () => {
    expect(removeNyushukkin(items, "a")).toEqual({ ok: true, value: [items[1]] });
  });

  test("無い入出金は消せない", () => {
    expect(removeNyushukkin(items, "z").ok).toBe(false);
  });

  test("消した入出金を戻せる", () => {
    expect(restoreNyushukkin([items[1]], items[0])).toEqual({
      ok: true,
      value: [items[1], items[0]],
    });
  });

  test("空の帳簿にも戻せる", () => {
    expect(restoreNyushukkin([], items[0])).toEqual({ ok: true, value: [items[0]] });
  });

  test("すでに残っている入出金は戻せない", () => {
    expect(restoreNyushukkin(items, items[0]).ok).toBe(false);
  });
});

describe("monthTotals", () => {
  const items = [
    { id: "a", kind: "収入" as const, amount: 200000, date: "2026-09-01", memo: "" },
    { id: "b", kind: "支出" as const, amount: 5000, date: "2026-09-06", memo: "" },
    { id: "c", kind: "支出" as const, amount: 1200, date: "2026-08-31", memo: "" },
  ];

  test("指定した暦月の収入・支出・収支だけを足す", () => {
    expect(monthTotals(items, "2026-09")).toEqual({
      income: 200000,
      expense: 5000,
      balance: 195000,
    });
  });

  test("入出金が無い月は0", () => {
    expect(monthTotals(items, "2026-07")).toEqual({ income: 0, expense: 0, balance: 0 });
  });
});

describe("sortNyushukkin / replaceNyushukkin", () => {
  test("入出日の新しい順にする", () => {
    const items = [
      { id: "a", kind: "支出" as const, amount: 1, date: "2026-09-01", memo: "" },
      { id: "b", kind: "支出" as const, amount: 1, date: "2026-09-06", memo: "" },
    ];
    expect(sortNyushukkin(items).map((item) => item.id)).toEqual(["b", "a"]);
  });

  test("同じidなら置き換え、無ければ足す", () => {
    const a = { id: "a", kind: "支出" as const, amount: 1, date: "2026-09-06", memo: "" };
    const next = { ...a, amount: 3 };
    expect(replaceNyushukkin([a], next)).toEqual([next]);
    expect(replaceNyushukkin([], a)).toEqual([a]);
  });
});
