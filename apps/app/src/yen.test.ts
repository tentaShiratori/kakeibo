import { describe, expect, test } from "vitest";
import { yen } from "./yen";

describe("yen", () => {
  test("3桁ごとにカンマを付けて円を付ける", () => {
    expect(yen(5000)).toBe("5,000円");
  });

  test("1円はカンマ無し", () => {
    expect(yen(1)).toBe("1円");
  });

  test("0円も表示できる", () => {
    expect(yen(0)).toBe("0円");
  });
});
