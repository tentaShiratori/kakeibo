import { describe, expect, test } from "vitest";
import {
  calendarMonth,
  correctNyushukkin,
  monthTotals,
  parseAmount,
  parseDate,
  parseKind,
  parseMemo,
  parseStored,
  recordNyushukkin,
  removeNyushukkin,
  replaceNyushukkin,
  serializeStored,
  sortNyushukkin,
  todayJst,
} from "./nyushukkin";

const today = "2026-09-06";

describe("parseKind", () => {
  test("収入と支出を受け取る", () => {
    expect(parseKind("支出")).toEqual({ ok: true, value: "支出" });
    expect(parseKind("収入")).toEqual({ ok: true, value: "収入" });
  });

  test("それ以外は受け取らない", () => {
    expect(parseKind("取引").ok).toBe(false);
    expect(parseKind("").ok).toBe(false);
  });
});

describe("parseAmount", () => {
  test("1円以上の整数円を受け取る", () => {
    expect(parseAmount("1")).toEqual({ ok: true, value: 1 });
    expect(parseAmount("5400")).toEqual({ ok: true, value: 5400 });
    expect(parseAmount(" 12 ")).toEqual({ ok: true, value: 12 });
  });

  test("0円と負と小数は受け取らない", () => {
    expect(parseAmount("0").ok).toBe(false);
    expect(parseAmount("-1").ok).toBe(false);
    expect(parseAmount("1.5").ok).toBe(false);
    expect(parseAmount("").ok).toBe(false);
    expect(parseAmount("1e2").ok).toBe(false);
  });
});

describe("parseDate", () => {
  test("今日以前の暦日を受け取る", () => {
    expect(parseDate("2026-09-06", today)).toEqual({ ok: true, value: "2026-09-06" });
    expect(parseDate("2026-09-05", today)).toEqual({ ok: true, value: "2026-09-05" });
  });

  test("未来と存在しない日は受け取らない", () => {
    expect(parseDate("2026-09-07", today).ok).toBe(false);
    expect(parseDate("2026-02-31", today).ok).toBe(false);
    expect(parseDate("09-06", today).ok).toBe(false);
    expect(parseDate("", today).ok).toBe(false);
  });
});

describe("parseMemo", () => {
  test("前後の空白を除き、空でもよい", () => {
    expect(parseMemo(" コンビニ ")).toBe("コンビニ");
    expect(parseMemo("   ")).toBe("");
  });
});

describe("recordNyushukkin", () => {
  test("金額と入出日があれば支出を残せる", () => {
    expect(
      recordNyushukkin({ kind: "支出", amount: "5000", date: "2026-09-06", memo: "" }, today, "a"),
    ).toEqual({
      ok: true,
      value: { id: "a", kind: "支出", amount: 5000, date: "2026-09-06", memo: "" },
    });
  });

  test("収入も残せる", () => {
    expect(
      recordNyushukkin(
        { kind: "収入", amount: "200000", date: "2026-09-01", memo: "給料" },
        today,
        "b",
      ),
    ).toEqual({
      ok: true,
      value: { id: "b", kind: "収入", amount: 200000, date: "2026-09-01", memo: "給料" },
    });
  });

  test("必須が欠けたら残せない", () => {
    expect(
      recordNyushukkin({ kind: "支出", amount: "", date: today, memo: "" }, today, "c").ok,
    ).toBe(false);
  });
});

describe("correctNyushukkin", () => {
  test("同じ入出金の金額を正味に直す", () => {
    const current = {
      id: "a",
      kind: "支出" as const,
      amount: 5000,
      date: "2026-09-06",
      memo: "",
    };
    expect(
      correctNyushukkin(
        current,
        { kind: "支出", amount: "3000", date: "2026-09-06", memo: "" },
        today,
      ),
    ).toEqual({
      ok: true,
      value: { ...current, amount: 3000 },
    });
  });
});

describe("removeNyushukkin", () => {
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

describe("parseStored", () => {
  test("空と壊れた値は空の帳簿にする", () => {
    expect(parseStored(null)).toEqual([]);
    expect(parseStored("nope")).toEqual([]);
    expect(parseStored("{}")).toEqual([]);
  });

  test("形が正しい入出金だけ残す", () => {
    const items = [
      { id: "a", kind: "支出", amount: 1, date: "2026-09-06", memo: "" },
      { id: "b", kind: "取引", amount: 1, date: "2026-09-06", memo: "" },
    ];
    expect(parseStored(serializeStored(items as never))).toEqual([items[0]]);
  });
});

describe("sortNyushukkin", () => {
  test("入出日の新しい順にする", () => {
    const items = [
      { id: "a", kind: "支出" as const, amount: 1, date: "2026-09-01", memo: "" },
      { id: "b", kind: "支出" as const, amount: 1, date: "2026-09-06", memo: "" },
    ];
    expect(sortNyushukkin(items).map((item) => item.id)).toEqual(["b", "a"]);
  });
});

describe("todayJst / calendarMonth / replaceNyushukkin", () => {
  test("日本の暦日と月を切る", () => {
    expect(todayJst(new Date("2026-09-06T15:00:00+09:00"))).toBe("2026-09-06");
    expect(calendarMonth("2026-09-06")).toBe("2026-09");
  });

  test("同じidなら置き換え、無ければ足す", () => {
    const a = { id: "a", kind: "支出" as const, amount: 1, date: "2026-09-06", memo: "" };
    const next = { ...a, amount: 3 };
    expect(replaceNyushukkin([a], next)).toEqual([next]);
    expect(replaceNyushukkin([], a)).toEqual([a]);
  });
});
