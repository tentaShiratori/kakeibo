import { describe, expect, test } from "vitest";
import { serializeStored, loadStored, parseStored, readStored } from "./stored";

describe("parseStored / loadStored", () => {
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

  test("壊れた帳簿はひとつ前から戻す", () => {
    const items = [{ id: "a", kind: "支出" as const, amount: 1, date: "2026-09-06", memo: "" }];
    expect(loadStored("nope", serializeStored(items))).toEqual(items);
  });

  test("空の帳簿は壊れていない", () => {
    const items = [{ id: "a", kind: "支出" as const, amount: 1, date: "2026-09-06", memo: "" }];
    expect(loadStored("[]", serializeStored(items))).toEqual([]);
  });

  test("帳簿が無ければひとつ前を使う", () => {
    const items = [{ id: "a", kind: "支出" as const, amount: 1, date: "2026-09-06", memo: "" }];
    expect(loadStored(null, serializeStored(items))).toEqual(items);
  });

  test("両方無ければ空", () => {
    expect(loadStored(null, null)).toEqual([]);
  });

  test("配列だけを帳簿として読む", () => {
    expect(readStored(null).ok).toBe(false);
    expect(readStored("nope").ok).toBe(false);
    expect(readStored("[]")).toEqual({ ok: true, value: [] });
  });
});
