import { parseDate, parseKind, type Nyushukkin, type NyushukkinResult } from "./nyushukkin";

export type NyushukkinBody = {
  kind: Nyushukkin["kind"];
  amount: number;
  date: string;
  memo: string;
};

type RelayOptions = {
  fetch?: typeof fetch;
  signal?: AbortSignal;
};

const unreachable = "api に届きません";
const unreadable = "帳簿が読めません";

export function getNyushukkin(month: string, options: RelayOptions = {}) {
  const url = `/nyushukkin?month=${encodeURIComponent(month)}`;
  return request<Nyushukkin[]>(url, { method: "GET", signal: options.signal }, parseList, options);
}

export function postNyushukkin(body: NyushukkinBody, options: RelayOptions = {}) {
  return request<Nyushukkin>(
    "/nyushukkin",
    { method: "POST", body: JSON.stringify(body) },
    parseItem,
    options,
  );
}

export function putNyushukkin(id: string, body: NyushukkinBody, options: RelayOptions = {}) {
  return request<Nyushukkin>(
    `/nyushukkin/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(body) },
    parseItem,
    options,
  );
}

export function deleteNyushukkin(id: string, options: RelayOptions = {}) {
  return request<Nyushukkin>(
    `/nyushukkin/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    parseItem,
    options,
  );
}

async function request<T>(
  path: string,
  init: RequestInit,
  parse: (value: unknown) => T | undefined,
  options: RelayOptions,
): Promise<NyushukkinResult<T>> {
  const headers = new Headers(init.headers);
  if (init.body != null) {
    headers.set("Content-Type", "application/json");
  }
  let res: Response;
  try {
    res = await (options.fetch ?? fetch)(path, {
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

function parseItem(value: unknown): Nyushukkin | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const rec = value as Record<string, unknown>;
  if (typeof rec.id !== "string" || rec.id === "") {
    return undefined;
  }
  const kind = parseKind(String(rec.kind ?? ""));
  if (!kind.ok) {
    return undefined;
  }
  if (typeof rec.amount !== "number" || !Number.isSafeInteger(rec.amount) || rec.amount < 1) {
    return undefined;
  }
  const date = parseDate(String(rec.date ?? ""), "9999-12-31");
  if (!date.ok) {
    return undefined;
  }
  if (typeof rec.memo !== "string") {
    return undefined;
  }
  return {
    id: rec.id,
    kind: kind.value,
    amount: rec.amount,
    date: date.value,
    memo: rec.memo,
  };
}

function parseList(value: unknown): Nyushukkin[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items: Nyushukkin[] = [];
  for (const row of value) {
    const item = parseItem(row);
    if (!item) {
      return undefined;
    }
    items.push(item);
  }
  return items;
}
