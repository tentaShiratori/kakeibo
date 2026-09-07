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

  test("空の種類は受け取らない", () => {
    expect(
      v.safeParse(nyushukkinInputSchema(today), {
        kind: "",
        amount: "1",
        date: today,
        memo: "",
      }).success,
    ).toBe(false);
  });

  test("前後の空白を除いた金額と昨日の入出日を受け取る", () => {
    const parsed = v.safeParse(nyushukkinInputSchema(today), {
      kind: "支出",
      amount: " 12 ",
      date: "2026-09-05",
      memo: " コンビニ ",
    });
    expect(parsed).toMatchObject({
      success: true,
      output: { amount: 12, date: "2026-09-05", memo: "コンビニ" },
    });
  });

  test("安全な整数の上限は受け取り、それを超えたら受け取らない", () => {
    expect(
      v.safeParse(nyushukkinInputSchema(today), {
        kind: "支出",
        amount: "9007199254740991",
        date: today,
        memo: "",
      }).success,
    ).toBe(true);
    expect(
      v.safeParse(nyushukkinInputSchema(today), {
        kind: "支出",
        amount: "9007199254740993",
        date: today,
        memo: "",
      }).success,
    ).toBe(false);
  });

  test("負と小数と指数表記の金額は受け取らない", () => {
    expect(
      v.safeParse(nyushukkinInputSchema(today), {
        kind: "支出",
        amount: "-1",
        date: today,
        memo: "",
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(nyushukkinInputSchema(today), {
        kind: "支出",
        amount: "1.5",
        date: today,
        memo: "",
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(nyushukkinInputSchema(today), {
        kind: "支出",
        amount: "1e2",
        date: today,
        memo: "",
      }).success,
    ).toBe(false);
  });

  test("存在しない日と形式が違う日と空の入出日は受け取らない", () => {
    expect(
      v.safeParse(nyushukkinInputSchema(today), {
        kind: "支出",
        amount: "1",
        date: "2026-02-31",
        memo: "",
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(nyushukkinInputSchema(today), {
        kind: "支出",
        amount: "1",
        date: "09-06",
        memo: "",
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(nyushukkinInputSchema(today), {
        kind: "支出",
        amount: "1",
        date: "",
        memo: "",
      }).success,
    ).toBe(false);
  });

  test("空白だけのメモは空にする", () => {
    const parsed = v.safeParse(nyushukkinInputSchema(today), {
      kind: "支出",
      amount: "1",
      date: today,
      memo: "   ",
    });
    expect(parsed).toMatchObject({ success: true, output: { memo: "" } });
  });
});
