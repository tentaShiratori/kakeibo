import * as v from "valibot";

export const kinds = ["支出", "収入"] as const;
export type Kind = (typeof kinds)[number];

export type Nyushukkin = {
  id: string;
  kind: Kind;
  amount: number;
  date: string;
  memo: string;
};

export type NyushukkinInput = {
  kind: string;
  amount: string;
  date: string;
  memo: string;
};

export type NyushukkinResult<T> = { ok: true; value: T } | { ok: false; error: string };

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const amountPattern = /^\d+$/;
const kindError = "収入か支出を選んでください";
const amountError = "金額は1円以上の整数円です";
const dateError = "入出日は今日以前の日付です";

const kindSchema = v.picklist(kinds, kindError);
const amountInputSchema = v.pipe(
  v.string(),
  v.trim(),
  v.check((raw) => {
    if (!amountPattern.test(raw)) {
      return false;
    }
    const amount = Number(raw);
    return Number.isSafeInteger(amount) && amount >= 1;
  }, amountError),
);
const memoSchema = v.pipe(v.string(), v.trim());

function dateInputSchema(today: string) {
  return v.pipe(
    v.string(),
    v.trim(),
    v.check((date) => {
      if (!datePattern.test(date) || todayJst(new Date(`${date}T00:00:00+09:00`)) !== date) {
        return false;
      }
      return date <= today;
    }, dateError),
  );
}

export function nyushukkinInputSchema(today: string) {
  return v.object({
    kind: kindSchema,
    amount: amountInputSchema,
    date: dateInputSchema(today),
    memo: memoSchema,
  });
}

function fromSchema<TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
  schema: TSchema,
  input: unknown,
): NyushukkinResult<v.InferOutput<TSchema>> {
  const parsed = v.safeParse(schema, input);
  if (parsed.success) {
    return { ok: true, value: parsed.output };
  }
  return { ok: false, error: parsed.issues[0].message };
}

export function todayJst(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function calendarMonth(date: string): string {
  return date.slice(0, 7);
}

export function shiftCalendarMonth(month: string, delta: number): string {
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1 + delta;
  const shifted = new Date(Date.UTC(year, monthIndex, 1));
  const nextYear = shifted.getUTCFullYear();
  const nextMonth = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonth}`;
}

export function isCurrentOrPastMonth(month: string, today: string): boolean {
  return month <= calendarMonth(today);
}

export function formatCalendarMonth(month: string): string {
  return `${month.slice(0, 4)}年${Number(month.slice(5, 7))}月`;
}

export function nyushukkinInMonth(items: Nyushukkin[], month: string): Nyushukkin[] {
  return items.filter((item) => calendarMonth(item.date) === month);
}

function parseKind(raw: string): NyushukkinResult<Kind> {
  return fromSchema(kindSchema, raw);
}

function parseDate(raw: string, today: string): NyushukkinResult<string> {
  return fromSchema(dateInputSchema(today), raw);
}

export function recordNyushukkin(
  input: NyushukkinInput,
  today: string,
  id: string,
): NyushukkinResult<Nyushukkin> {
  return assemble(id, input, today);
}

export function correctNyushukkin(
  current: Nyushukkin,
  input: NyushukkinInput,
  today: string,
): NyushukkinResult<Nyushukkin> {
  return assemble(current.id, input, today);
}

export function removeNyushukkin(items: Nyushukkin[], id: string): NyushukkinResult<Nyushukkin[]> {
  if (!items.some((item) => item.id === id)) {
    return { ok: false, error: "その入出金はありません" };
  }
  return { ok: true, value: items.filter((item) => item.id !== id) };
}

export function restoreNyushukkin(
  items: Nyushukkin[],
  removed: Nyushukkin,
): NyushukkinResult<Nyushukkin[]> {
  if (items.some((item) => item.id === removed.id)) {
    return { ok: false, error: "その入出金はすでにあります" };
  }
  return { ok: true, value: [...items, removed] };
}

export function replaceNyushukkin(items: Nyushukkin[], next: Nyushukkin): Nyushukkin[] {
  const index = items.findIndex((item) => item.id === next.id);
  if (index === -1) {
    return [...items, next];
  }
  return items.map((item) => (item.id === next.id ? next : item));
}

export function monthTotals(items: Nyushukkin[], month: string) {
  let income = 0;
  let expense = 0;
  for (const item of items) {
    if (calendarMonth(item.date) !== month) {
      continue;
    }
    if (item.kind === "収入") {
      income += item.amount;
    } else {
      expense += item.amount;
    }
  }
  return { income, expense, balance: income - expense };
}

export function sortNyushukkin(items: Nyushukkin[]): Nyushukkin[] {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1;
    }
    return a.id < b.id ? 1 : -1;
  });
}

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

function assemble(id: string, input: NyushukkinInput, today: string): NyushukkinResult<Nyushukkin> {
  const parsed = fromSchema(nyushukkinInputSchema(today), input);
  if (!parsed.ok) {
    return parsed;
  }
  return {
    ok: true,
    value: {
      id,
      kind: parsed.value.kind,
      amount: Number(parsed.value.amount),
      date: parsed.value.date,
      memo: parsed.value.memo,
    },
  };
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
