import { requestJson, type RelayOptions } from "./api";
import { parseDate, parseKind, type Nyushukkin } from "./nyushukkin";

export type NyushukkinBody = {
  kind: Nyushukkin["kind"];
  amount: number;
  date: string;
  memo: string;
  wakuId: string;
};

export function getNyushukkin(month: string, options: RelayOptions = {}) {
  const url = `/nyushukkin?month=${encodeURIComponent(month)}`;
  return requestJson<Nyushukkin[]>(
    url,
    { method: "GET", signal: options.signal },
    parseList,
    options,
  );
}

export function postNyushukkin(body: NyushukkinBody, options: RelayOptions = {}) {
  return requestJson<Nyushukkin>(
    "/nyushukkin",
    { method: "POST", body: JSON.stringify(body) },
    parseItem,
    options,
  );
}

export function putNyushukkin(id: string, body: NyushukkinBody, options: RelayOptions = {}) {
  return requestJson<Nyushukkin>(
    `/nyushukkin/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(body) },
    parseItem,
    options,
  );
}

export function deleteNyushukkin(id: string, options: RelayOptions = {}) {
  return requestJson<Nyushukkin>(
    `/nyushukkin/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    parseItem,
    options,
  );
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
  const wakuId = parseWakuId(rec.wakuId);
  if (wakuId === undefined) {
    return undefined;
  }
  return {
    id: rec.id,
    kind: kind.value,
    amount: rec.amount,
    date: date.value,
    memo: rec.memo,
    wakuId,
  };
}

function parseWakuId(value: unknown): string | undefined {
  if (value == null) {
    return "";
  }
  if (typeof value !== "string") {
    return undefined;
  }
  return value.trim();
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
