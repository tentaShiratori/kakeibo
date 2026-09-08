import { describe, expect, test } from "vitest";
import { emptyFurikaeri } from "./furikaeri";

describe("emptyFurikaeri", () => {
  test("月の数字と枠別と枠なしを0にする", () => {
    expect(emptyFurikaeri("2026-09")).toEqual({
      month: "2026-09",
      income: 0,
      expense: 0,
      balance: 0,
      waku: [],
      none: { income: 0, expense: 0, balance: 0 },
    });
  });

  test("空の月も形は同じ", () => {
    expect(emptyFurikaeri("").month).toBe("");
    expect(emptyFurikaeri("").waku).toEqual([]);
  });
});
