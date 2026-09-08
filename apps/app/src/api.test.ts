import { describe, expect, test, vi } from "vitest";
import { requestJson } from "./api";

function parseList(value: unknown) {
  return Array.isArray(value) ? value : undefined;
}

describe("requestJson", () => {
  test("空の起動設定は既定の api に届く", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toBe("http://127.0.0.1:8080/nyushukkin");
      return Response.json([]);
    });
    await expect(
      requestJson("/nyushukkin", { method: "GET" }, parseList, { fetch: fetchImpl, apiUrl: "" }),
    ).resolves.toEqual({ ok: true, value: [] });
  });

  test("末尾スラッシュを除いて付ける", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toBe("http://api.example/nyushukkin");
      return Response.json([]);
    });
    await expect(
      requestJson("/nyushukkin", { method: "GET" }, parseList, {
        fetch: fetchImpl,
        apiUrl: "http://api.example/",
      }),
    ).resolves.toEqual({ ok: true, value: [] });
  });
});
