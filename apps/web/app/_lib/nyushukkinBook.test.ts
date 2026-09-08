import { describe, expect, test } from "vitest";
import { removeNyushukkin, replaceNyushukkin, sortNyushukkin } from "./nyushukkin";

describe("removeNyushukkin", () => {
  const items = [
    { id: "a", kind: "支出" as const, amount: 5000, date: "2026-09-06", memo: "", wakuId: "" },
    { id: "b", kind: "支出" as const, amount: 5000, date: "2026-09-06", memo: "", wakuId: "" },
  ];

  test("ある入出金を消せる", () => {
    expect(removeNyushukkin(items, "a")).toEqual({ ok: true, value: [items[1]] });
  });

  test("無い入出金は消せない", () => {
    expect(removeNyushukkin(items, "z").ok).toBe(false);
  });
});

describe("sortNyushukkin / replaceNyushukkin", () => {
  test("入出日の新しい順にする", () => {
    const items = [
      { id: "a", kind: "支出" as const, amount: 1, date: "2026-09-01", memo: "", wakuId: "" },
      { id: "b", kind: "支出" as const, amount: 1, date: "2026-09-06", memo: "", wakuId: "" },
    ];
    expect(sortNyushukkin(items).map((item) => item.id)).toEqual(["b", "a"]);
  });

  test("同じidなら置き換え、無ければ足す", () => {
    const a = {
      id: "a",
      kind: "支出" as const,
      amount: 1,
      date: "2026-09-06",
      memo: "",
      wakuId: "",
    };
    const next = { ...a, amount: 3 };
    expect(replaceNyushukkin([a], next)).toEqual([next]);
    expect(replaceNyushukkin([], a)).toEqual([a]);
  });
});
