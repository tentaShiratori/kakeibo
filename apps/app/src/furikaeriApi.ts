import { requestJson, type RelayOptions } from "./api";
import type { Furikaeri, Totals, WakuTotals } from "./furikaeri";

export function getFurikaeri(month: string, options: RelayOptions = {}) {
  const url = `/furikaeri?month=${encodeURIComponent(month)}`;
  return requestJson<Furikaeri>(
    url,
    { method: "GET", signal: options.signal },
    parseFurikaeri,
    options,
  );
}

function parseFurikaeri(value: unknown): Furikaeri | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const rec = value as Record<string, unknown>;
  if (typeof rec.month !== "string" || rec.month === "") {
    return undefined;
  }
  const totals = parseTotals(rec);
  if (!totals) {
    return undefined;
  }
  if (!Array.isArray(rec.waku)) {
    return undefined;
  }
  const waku: WakuTotals[] = [];
  for (const row of rec.waku) {
    const item = parseWakuTotals(row);
    if (!item) {
      return undefined;
    }
    waku.push(item);
  }
  const none = parseTotals(rec.none);
  if (!none) {
    return undefined;
  }
  return { month: rec.month, ...totals, waku, none };
}

function parseWakuTotals(value: unknown): WakuTotals | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const rec = value as Record<string, unknown>;
  if (typeof rec.id !== "string" || rec.id === "") {
    return undefined;
  }
  if (typeof rec.name !== "string") {
    return undefined;
  }
  const totals = parseTotals(rec);
  if (!totals) {
    return undefined;
  }
  return { id: rec.id, name: rec.name, ...totals };
}

function parseTotals(value: unknown): Totals | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const rec = value as Record<string, unknown>;
  if (!isAmount(rec.income) || !isAmount(rec.expense) || !isBalance(rec.balance)) {
    return undefined;
  }
  return { income: rec.income, expense: rec.expense, balance: rec.balance };
}

function isAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isBalance(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}
