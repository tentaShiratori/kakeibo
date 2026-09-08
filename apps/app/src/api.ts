import type { NyushukkinResult } from "./nyushukkin";

export type RelayOptions = {
  fetch?: typeof fetch;
  signal?: AbortSignal;
  apiUrl?: string;
};

const defaultApiUrl = "http://127.0.0.1:8080";
const unreachable = "api に届きません";
const unreadable = "帳簿が読めません";

function apiOrigin(raw = import.meta.env.KAKEIBO_API_URL): string {
  const origin = (raw ?? "").trim();
  return (origin === "" ? defaultApiUrl : origin).replace(/\/+$/, "");
}

export async function requestJson<T>(
  path: string,
  init: RequestInit,
  parse: (value: unknown) => T | undefined,
  options: RelayOptions = {},
): Promise<NyushukkinResult<T>> {
  const headers = new Headers(init.headers);
  if (init.body != null) {
    headers.set("Content-Type", "application/json");
  }
  let res: Response;
  try {
    res = await (options.fetch ?? fetch)(`${apiOrigin(options.apiUrl)}${path}`, {
      ...init,
      headers,
      signal: options.signal ?? init.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    return { ok: false, error: unreachable };
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    return { ok: false, error: unreadable };
  }

  if (!res.ok) {
    return { ok: false, error: errorMessage(payload) };
  }
  const value = parse(payload);
  if (value === undefined) {
    return { ok: false, error: unreadable };
  }
  return { ok: true, value };
}

function errorMessage(payload: unknown): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return unreadable;
}
