import { afterEach, describe, expect, test, vi } from "vitest";
import { deleteNyushukkin, getNyushukkin, postNyushukkin, putNyushukkin } from "./nyushukkinApi";

afterEach(() => {
  vi.unstubAllGlobals();
});

const item = {
  id: "a",
  kind: "支出" as const,
  amount: 5000,
  date: "2026-09-08",
  memo: "米",
  wakuId: "",
};

describe("getNyushukkin", () => {
  test("暦月の一覧を取る", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toBe("/nyushukkin?month=2026-09");
      return Response.json([item]);
    });

    await expect(getNyushukkin("2026-09", { fetch: fetchImpl })).resolves.toEqual({
      ok: true,
      value: [item],
    });
  });

  test("配列以外は受け取らない", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json({}));
    await expect(getNyushukkin("2026-09", { fetch: fetchImpl })).resolves.toEqual({
      ok: false,
      error: "帳簿が読めません",
    });
  });
});

describe("postNyushukkin", () => {
  test("記録を送り、api が付けた id を受け取る", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toBe("/nyushukkin");
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(
        JSON.stringify({
          kind: "支出",
          amount: 5000,
          date: "2026-09-08",
          memo: "米",
          wakuId: "",
        }),
      );
      return Response.json(item, { status: 201 });
    });

    await expect(
      postNyushukkin(
        { kind: "支出", amount: 5000, date: "2026-09-08", memo: "米", wakuId: "" },
        { fetch: fetchImpl },
      ),
    ).resolves.toEqual({ ok: true, value: item });
  });
});

describe("putNyushukkin / deleteNyushukkin", () => {
  test("直すと消すを id つきで送る", async () => {
    const fetchPut = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toBe("/nyushukkin/a");
      expect(init?.method).toBe("PUT");
      return Response.json({ ...item, amount: 3000 });
    });
    const fetchDelete = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toBe("/nyushukkin/a");
      expect(init?.method).toBe("DELETE");
      return Response.json(item);
    });

    await expect(
      putNyushukkin(
        "a",
        { kind: "支出", amount: 3000, date: "2026-09-08", memo: "米", wakuId: "" },
        { fetch: fetchPut },
      ),
    ).resolves.toEqual({ ok: true, value: { ...item, amount: 3000 } });
    await expect(deleteNyushukkin("a", { fetch: fetchDelete })).resolves.toEqual({
      ok: true,
      value: item,
    });
  });
});

describe("失敗", () => {
  test("api の error をそのまま出す", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json({ error: "その入出金はありません" }, { status: 404 }),
    );
    await expect(deleteNyushukkin("missing", { fetch: fetchImpl })).resolves.toEqual({
      ok: false,
      error: "その入出金はありません",
    });
  });

  test("届かなければ失敗にする", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(getNyushukkin("2026-09", { fetch: fetchImpl })).resolves.toEqual({
      ok: false,
      error: "api に届きません",
    });
  });

  test("壊れた JSON は受け取らない", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("nope", { status: 200 }));
    await expect(getNyushukkin("2026-09", { fetch: fetchImpl })).resolves.toEqual({
      ok: false,
      error: "帳簿が読めません",
    });
  });
});
