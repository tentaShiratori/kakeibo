import { parseDate, parseKind, type Nyushukkin, type NyushukkinResult } from "./nyushukkin";

export function readStored(raw: string | null): NyushukkinResult<Nyushukkin[]> {
  if (raw == null) {
    return { ok: false, error: "帳簿がありません" };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { ok: false, error: "帳簿が壊れています" };
    }
    const items: Nyushukkin[] = [];
    for (const row of parsed) {
      const item = asNyushukkin(row);
      if (item) {
        items.push(item);
      }
    }
    return { ok: true, value: items };
  } catch {
    return { ok: false, error: "帳簿が壊れています" };
  }
}

export function loadStored(primary: string | null, backup: string | null): Nyushukkin[] {
  const main = readStored(primary);
  if (main.ok) {
    return main.value;
  }
  const prev = readStored(backup);
  if (prev.ok) {
    return prev.value;
  }
  return [];
}

export function serializeStored(items: Nyushukkin[]): string {
  return JSON.stringify(items);
}

function asNyushukkin(row: unknown): Nyushukkin | undefined {
  if (!row || typeof row !== "object") {
    return undefined;
  }
  const rec = row as Record<string, unknown>;
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
