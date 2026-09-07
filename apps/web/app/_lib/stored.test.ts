import { describe, expect, test } from "vitest";
import { serializeStored, loadStored, readStored } from "./stored";

describe("readStored / loadStored", () => {
  test("空と壊れた値は空の帳簿にする", () => {
    expect(loadStored(null, null)).toEqual([]);
    expect(loadStored("nope", null)).toEqual([]);
    expect(loadStored("{}", null)).toEqual([]);
  });

  test("形が正しい入出金だけ残す", () => {
    const items = [
      { id: "a", kind: "支出", amount: 1, date: "2026-09-06", memo: "" },
      { id: "b", kind: "取引", amount: 1, date: "2026-09-06", memo: "" },
    ];
    expect(readStored(serializeStored(items as never))).toEqual({ ok: true, value: [items[0]] });
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

  test("配列だけを帳簿として読む", () => {
    expect(readStored(null).ok).toBe(false);
    expect(readStored("nope").ok).toBe(false);
    expect(readStored("[]")).toEqual({ ok: true, value: [] });
  });
});
