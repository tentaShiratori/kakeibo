import { describe, expect, test } from "vitest";
import { emptyInput, firstSubmitError, valuesFromEditing } from "./formInput";

describe("emptyInput", () => {
  test("今日の支出で金額もメモも空", () => {
    expect(emptyInput("2026-09-07")).toEqual({
      kind: "支出",
      amount: "",
      date: "2026-09-07",
      memo: "",
    });
  });
});

describe("firstSubmitError", () => {
  test("空なら空文字", () => {
    expect(firstSubmitError(undefined)).toBe("");
    expect(firstSubmitError(null)).toBe("");
  });

  test("文字列をそのまま出す", () => {
    expect(firstSubmitError("金額は1円以上の整数円です")).toBe("金額は1円以上の整数円です");
  });

  test("金額の誤りを先に出す", () => {
    expect(
      firstSubmitError({
        date: "入出日は今日以前の日付です",
        amount: "金額は1円以上の整数円です",
      }),
    ).toBe("金額は1円以上の整数円です");
  });

  test("オブジェクトでなければ空文字", () => {
    expect(firstSubmitError(1)).toBe("");
  });
});

describe("valuesFromEditing", () => {
  test("無いときは空入力", () => {
    expect(valuesFromEditing(null, "2026-09-07").amount).toBe("");
  });

  test("一件があるときはその値", () => {
    expect(
      valuesFromEditing(
        { id: "a", kind: "収入", amount: 200, date: "2026-08-01", memo: "返" },
        "2026-09-07",
      ),
    ).toEqual({
      kind: "収入",
      amount: "200",
      date: "2026-08-01",
      memo: "返",
    });
  });
});
