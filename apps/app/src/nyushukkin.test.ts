import { describe, expect, test } from "vitest";
import { correctNyushukkin, parseDate, parseKind, recordNyushukkin } from "./nyushukkin";

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

describe("recordNyushukkin", () => {
  test("金額と入出日があれば支出を残せる", () => {
    expect(
      recordNyushukkin({ kind: "支出", amount: "5000", date: "2026-09-06", memo: "" }, today, "a"),
    ).toEqual({
      ok: true,
      value: { id: "a", kind: "支出", amount: 5000, date: "2026-09-06", memo: "", wakuId: "" },
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
      value: {
        id: "b",
        kind: "収入",
        amount: 200000,
        date: "2026-09-01",
        memo: "給料",
        wakuId: "",
      },
    });
  });

  test("枠を一つ付けられる", () => {
    expect(
      recordNyushukkin(
        { kind: "支出", amount: "5000", date: "2026-09-06", memo: "", wakuId: "w1" },
        today,
        "a",
      ),
    ).toEqual({
      ok: true,
      value: { id: "a", kind: "支出", amount: 5000, date: "2026-09-06", memo: "", wakuId: "w1" },
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
      wakuId: "",
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
