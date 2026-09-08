import { afterEach, describe, expect, test, vi } from "vitest";
import { PUT } from "./route";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const params = Promise.resolve({ id: "id-1" });

describe("PUT /waku/[id]", () => {
  test("起動設定の api へ改名を届ける", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toBe("http://api.example/waku/id-1");
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchImpl);
    vi.stubEnv("KAKEIBO_API_URL", "http://api.example");

    const res = await PUT(new Request("http://web.example/waku/id-1", { method: "PUT" }), {
      params,
    });

    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
