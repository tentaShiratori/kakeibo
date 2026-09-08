import { afterEach, describe, expect, test, vi } from "vitest";
import { GET } from "./route";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("GET /furikaeri", () => {
  test("起動設定の api へ振り返りを届ける", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toBe("http://api.example/furikaeri?month=2026-09");
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchImpl);
    vi.stubEnv("KAKEIBO_API_URL", "http://api.example");

    const res = await GET(new Request("http://web.example/furikaeri?month=2026-09"));

    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
