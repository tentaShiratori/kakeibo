import { afterEach, describe, expect, test, vi } from "vitest";
import { DELETE, PUT } from "./route";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const params = Promise.resolve({ id: "id-1" });

describe("PUT /nyushukkin/[id]", () => {
  test("起動設定の api へ直すを届ける", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe("http://api.example/nyushukkin/id-1");
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchImpl);
    vi.stubEnv("KAKEIBO_API_URL", "http://api.example");

    const res = await PUT(new Request("http://web.example/nyushukkin/id-1", { method: "PUT" }), {
      params,
    });

    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});

describe("DELETE /nyushukkin/[id]", () => {
  test("起動設定の api へ消すを届ける", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe("http://api.example/nyushukkin/id-1");
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchImpl);
    vi.stubEnv("KAKEIBO_API_URL", "http://api.example");

    const res = await DELETE(
      new Request("http://web.example/nyushukkin/id-1", { method: "DELETE" }),
      {
        params,
      },
    );

    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
