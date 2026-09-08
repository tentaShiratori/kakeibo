import { afterEach, describe, expect, test, vi } from "vitest";
import { GET, POST } from "./route";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("GET /waku", () => {
  test("起動設定の api へ一覧を届ける", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toBe("http://api.example/waku");
      return new Response("[]", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchImpl);
    vi.stubEnv("KAKEIBO_API_URL", "http://api.example");

    const res = await GET(new Request("http://web.example/waku"));

    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});

describe("POST /waku", () => {
  test("起動設定の api へ追加を届ける", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toBe("http://api.example/waku");
      return new Response("{}", { status: 201 });
    });
    vi.stubGlobal("fetch", fetchImpl);
    vi.stubEnv("KAKEIBO_API_URL", "http://api.example");

    const res = await POST(
      new Request("http://web.example/waku", {
        method: "POST",
        body: '{"name":"食費"}',
      }),
    );

    expect(res.status).toBe(201);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
