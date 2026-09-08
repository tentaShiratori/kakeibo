import { describe, expect, test } from "vitest";
import { relayToApi } from "./relayToApi";

describe("relayToApi", () => {
  test("一覧の query を api に渡す", async () => {
    const seen: { url: string; method?: string }[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      seen.push({ url: String(input), method: init?.method });
      return new Response("[]", { status: 200 });
    };

    const res = await relayToApi(
      new Request("http://web.example/nyushukkin?month=2026-09"),
      "/nyushukkin",
      { fetch: fetchImpl, apiUrl: "http://api.example" },
    );

    expect(seen[0]?.url).toBe("http://api.example/nyushukkin?month=2026-09");
    expect(seen[0]?.method).toBe("GET");
    expect(res.status).toBe(200);
    await expect(res.text()).resolves.toBe("[]");
  });

  test("記録の本文を api に渡す", async () => {
    const seen: { url?: string; body?: string }[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const body = init?.body;
      seen.push({
        url: String(input),
        body: body instanceof ReadableStream ? await new Response(body).text() : String(body ?? ""),
      });
      return new Response('{"id":"a"}', { status: 201 });
    };

    const res = await relayToApi(
      new Request("http://web.example/nyushukkin", {
        method: "POST",
        body: '{"kind":"支出"}',
      }),
      "/nyushukkin",
      { fetch: fetchImpl, apiUrl: "http://api.example" },
    );

    expect(seen[0]?.url).toBe("http://api.example/nyushukkin");
    expect(seen[0]?.body).toBe('{"kind":"支出"}');
    expect(res.status).toBe(201);
  });

  test("直すと消すの id を api に渡す", async () => {
    const seen: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      seen.push(String(input));
      return new Response("{}", { status: 200 });
    };

    await relayToApi(
      new Request("http://web.example/nyushukkin/id-1", { method: "PUT" }),
      "/nyushukkin/id-1",
      {
        fetch: fetchImpl,
        apiUrl: "http://api.example/",
      },
    );
    await relayToApi(
      new Request("http://web.example/nyushukkin/id-1", { method: "DELETE" }),
      "/nyushukkin/id-1",
      { fetch: fetchImpl, apiUrl: "http://api.example///" },
    );

    expect(seen).toEqual([
      "http://api.example/nyushukkin/id-1",
      "http://api.example/nyushukkin/id-1",
    ]);
  });

  test("空の起動設定は既定の api に届ける", async () => {
    const seen: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      seen.push(String(input));
      return new Response("[]", { status: 200 });
    };

    await relayToApi(new Request("http://web.example/nyushukkin"), "/nyushukkin", {
      fetch: fetchImpl,
      apiUrl: "   ",
    });

    expect(seen[0]).toBe("http://127.0.0.1:8080/nyushukkin");
  });

  test("枠と振り返りも api に届ける", async () => {
    const seen: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      seen.push(String(input));
      return new Response("[]", { status: 200 });
    };

    await relayToApi(new Request("http://web.example/waku"), "/waku", {
      fetch: fetchImpl,
      apiUrl: "http://api.example",
    });
    await relayToApi(new Request("http://web.example/waku/id-1"), "/waku/id-1", {
      fetch: fetchImpl,
      apiUrl: "http://api.example",
    });
    await relayToApi(new Request("http://web.example/furikaeri?month=2026-09"), "/furikaeri", {
      fetch: fetchImpl,
      apiUrl: "http://api.example",
    });

    expect(seen).toEqual([
      "http://api.example/waku",
      "http://api.example/waku/id-1",
      "http://api.example/furikaeri?month=2026-09",
    ]);
  });

  test("api に届かなければ 502 にする", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error("ECONNREFUSED");
    };

    const res = await relayToApi(new Request("http://web.example/nyushukkin"), "/nyushukkin", {
      fetch: fetchImpl,
      apiUrl: "http://api.example",
    });

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: "api に届きません" });
  });

  test("壊れた URL は届けない", async () => {
    let called = false;
    const fetchImpl: typeof fetch = async () => {
      called = true;
      return new Response(null, { status: 200 });
    };

    const bad = [
      "ftp://api.example",
      "not-a-url",
      "http://user:pass@api.example",
      "http://api.example/?x=1",
    ];
    for (const apiUrl of bad) {
      called = false;
      const res = await relayToApi(new Request("http://web.example/nyushukkin"), "/nyushukkin", {
        fetch: fetchImpl,
        apiUrl,
      });
      expect(called).toBe(false);
      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({ error: "api の URL が読めません" });
    }
  });

  test("許可していない口は届けない", async () => {
    let called = false;
    const fetchImpl: typeof fetch = async () => {
      called = true;
      return new Response(null, { status: 200 });
    };

    for (const path of ["/secret", "/nyushukkin/a/b", "/nyushukkin/"]) {
      called = false;
      const res = await relayToApi(new Request("http://web.example/waku"), path, {
        fetch: fetchImpl,
        apiUrl: "http://api.example",
      });
      expect(called).toBe(false);
      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toEqual({ error: "届け先がありません" });
    }
  });
});
