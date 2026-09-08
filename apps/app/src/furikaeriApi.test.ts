import { afterEach, describe, expect, test, vi } from "vitest";
import { getFurikaeri } from "./furikaeriApi";

afterEach(() => {
  vi.unstubAllGlobals();
});

const furikaeri = {
  month: "2026-09",
  income: 200000,
  expense: 5000,
  balance: 195000,
  waku: [{ id: "w1", name: "食費", income: 0, expense: 3000, balance: -3000 }],
  none: { income: 200000, expense: 2000, balance: 198000 },
};

describe("getFurikaeri", () => {
  test("暦月の振り返りを取る", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toBe("http://api.example/furikaeri?month=2026-09");
      return Response.json(furikaeri);
    });
    await expect(
      getFurikaeri("2026-09", { fetch: fetchImpl, apiUrl: "http://api.example" }),
    ).resolves.toEqual({
      ok: true,
      value: furikaeri,
    });
  });

  test("壊れた形は受け取らない", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json({ month: "2026-09" }));
    await expect(
      getFurikaeri("2026-09", { fetch: fetchImpl, apiUrl: "http://api.example" }),
    ).resolves.toEqual({
      ok: false,
      error: "帳簿が読めません",
    });
  });
});
