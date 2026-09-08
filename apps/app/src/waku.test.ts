import { describe, expect, test } from "vitest";
import { parseWakuName } from "./waku";

describe("parseWakuName", () => {
  test("名前を受け取る", () => {
    expect(parseWakuName("食費")).toEqual({ ok: true, value: "食費" });
    expect(parseWakuName(" 家賃 ")).toEqual({ ok: true, value: "家賃" });
  });

  test("空と空白だけは受け取らない", () => {
    expect(parseWakuName("")).toEqual({ ok: false, error: "名前を入れてください" });
    expect(parseWakuName("   ")).toEqual({ ok: false, error: "名前を入れてください" });
  });
});
