import { requestJson, type RelayOptions } from "./api";
import type { Waku } from "./waku";

export function getWaku(options: RelayOptions = {}) {
  return requestJson<Waku[]>(
    "/waku",
    { method: "GET", signal: options.signal },
    parseList,
    options,
  );
}

export function postWaku(name: string, options: RelayOptions = {}) {
  return requestJson<Waku>(
    "/waku",
    { method: "POST", body: JSON.stringify({ name }) },
    parseItem,
    options,
  );
}

export function putWaku(id: string, name: string, options: RelayOptions = {}) {
  return requestJson<Waku>(
    `/waku/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify({ name }) },
    parseItem,
    options,
  );
}

function parseItem(value: unknown): Waku | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const rec = value as Record<string, unknown>;
  if (typeof rec.id !== "string" || rec.id === "") {
    return undefined;
  }
  if (typeof rec.name !== "string" || rec.name.trim() === "") {
    return undefined;
  }
  return { id: rec.id, name: rec.name };
}

function parseList(value: unknown): Waku[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items: Waku[] = [];
  for (const row of value) {
    const item = parseItem(row);
    if (!item) {
      return undefined;
    }
    items.push(item);
  }
  return items;
}
