import { afterEach, describe, expect, test, vi } from "vitest";
import { GET, POST } from "./route";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("GET /nyushukkin", () => {
  test("起動設定の api へ一覧を届ける", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toBe("http://api.example/nyushukkin?month=2026-09");
      return new Response("[]", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchImpl);
    vi.stubEnv("KAKEIBO_API_URL", "http://api.example");

    const res = await GET(new Request("http://web.example/nyushukkin?month=2026-09"));

    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});

describe("POST /nyushukkin", () => {
  test("起動設定の api へ記録を届ける", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toBe("http://api.example/nyushukkin");
      return new Response("{}", { status: 201 });
    });
    vi.stubGlobal("fetch", fetchImpl);
    vi.stubEnv("KAKEIBO_API_URL", "http://api.example");

    const res = await POST(
      new Request("http://web.example/nyushukkin", {
        method: "POST",
        body: '{"kind":"支出"}',
      }),
    );

    expect(res.status).toBe(201);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
