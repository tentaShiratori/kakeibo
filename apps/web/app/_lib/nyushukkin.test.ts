import { describe, expect, test } from "vitest";
import {
  correctNyushukkin,
  parseAmount,
  parseDate,
  parseKind,
  parseMemo,
  recordNyushukkin,
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
    expect(parseAmount("9007199254740991")).toEqual({ ok: true, value: 9007199254740991 });
  });

  test("0円と負と小数は受け取らない", () => {
    expect(parseAmount("0").ok).toBe(false);
    expect(parseAmount("-1").ok).toBe(false);
    expect(parseAmount("1.5").ok).toBe(false);
    expect(parseAmount("").ok).toBe(false);
    expect(parseAmount("1e2").ok).toBe(false);
    expect(parseAmount("9007199254740993").ok).toBe(false);
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
