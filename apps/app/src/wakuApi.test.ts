import { afterEach, describe, expect, test, vi } from "vitest";
import { getWaku, postWaku, putWaku } from "./wakuApi";

afterEach(() => {
  vi.unstubAllGlobals();
});

const item = { id: "w1", name: "食費" };

describe("getWaku", () => {
  test("一覧を取る", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toBe("http://api.example/waku");
      return Response.json([item]);
    });
    await expect(getWaku({ fetch: fetchImpl, apiUrl: "http://api.example" })).resolves.toEqual({
      ok: true,
      value: [item],
    });
  });

  test("配列以外は受け取らない", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json({}));
    await expect(getWaku({ fetch: fetchImpl, apiUrl: "http://api.example" })).resolves.toEqual({
      ok: false,
      error: "帳簿が読めません",
    });
  });
});

describe("postWaku / putWaku", () => {
  test("足すと改める", async () => {
    const fetchPost = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toBe("http://api.example/waku");
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ name: "食費" }));
      return Response.json(item, { status: 201 });
    });
    const fetchPut = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toBe("http://api.example/waku/w1");
      expect(init?.method).toBe("PUT");
      return Response.json({ id: "w1", name: "日用品" });
    });
    await expect(
      postWaku("食費", { fetch: fetchPost, apiUrl: "http://api.example" }),
    ).resolves.toEqual({
      ok: true,
      value: item,
    });
    await expect(
      putWaku("w1", "日用品", { fetch: fetchPut, apiUrl: "http://api.example" }),
    ).resolves.toEqual({
      ok: true,
      value: { id: "w1", name: "日用品" },
    });
  });
});
