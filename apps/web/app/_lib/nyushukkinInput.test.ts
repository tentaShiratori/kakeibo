import { describe, expect, test } from "vitest";
import * as v from "valibot";
import { nyushukkinInputSchema } from "./nyushukkin";

const today = "2026-09-06";

describe("nyushukkinInputSchema", () => {
  test("正しい入力を受け取る", () => {
    const parsed = v.safeParse(nyushukkinInputSchema(today), {
      kind: "収入",
      amount: " 1 ",
      date: today,
      memo: " 給料 ",
    });
    expect(parsed).toMatchObject({
      success: true,
      output: {
        kind: "収入",
        amount: 1,
        date: today,
        memo: "給料",
      },
    });
  });

  test("種類と金額と入出日が欠けたら受け取らない", () => {
    expect(
      v.safeParse(nyushukkinInputSchema(today), {
        kind: "取引",
        amount: "5000",
        date: today,
        memo: "",
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(nyushukkinInputSchema(today), {
        kind: "支出",
        amount: "",
        date: today,
        memo: "",
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(nyushukkinInputSchema(today), {
        kind: "支出",
        amount: "5000",
        date: "2026-09-07",
        memo: "",
      }).success,
    ).toBe(false);
  });

  test("1円と今日は受け取り、0円と明日は受け取らない", () => {
    expect(
      v.safeParse(nyushukkinInputSchema(today), {
        kind: "支出",
        amount: "1",
        date: today,
        memo: "",
      }).success,
    ).toBe(true);
    expect(
      v.safeParse(nyushukkinInputSchema(today), {
        kind: "支出",
        amount: "0",
        date: today,
        memo: "",
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(nyushukkinInputSchema("2026-09-07"), {
        kind: "支出",
        amount: "1",
        date: "2026-09-07",
        memo: "",
      }).success,
    ).toBe(true);
  });
});
