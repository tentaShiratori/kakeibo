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

export function parseKind(raw: string): NyushukkinResult<Kind> {
  if (raw === "支出" || raw === "収入") {
    return { ok: true, value: raw };
  }
  return { ok: false, error: "収入か支出を選んでください" };
}

export function parseAmount(raw: string): NyushukkinResult<number> {
  const trimmed = raw.trim();
  if (!amountPattern.test(trimmed)) {
    return { ok: false, error: "金額は1円以上の整数円です" };
  }
  const amount = Number(trimmed);
  if (!Number.isSafeInteger(amount) || amount < 1) {
    return { ok: false, error: "金額は1円以上の整数円です" };
  }
  return { ok: true, value: amount };
}

export function parseDate(raw: string, today: string): NyushukkinResult<string> {
  const date = raw.trim();
  if (!datePattern.test(date) || todayJst(new Date(`${date}T00:00:00+09:00`)) !== date) {
    return { ok: false, error: "入出日は今日以前の日付です" };
  }
  if (date > today) {
    return { ok: false, error: "入出日は今日以前の日付です" };
  }
  return { ok: true, value: date };
}

export function parseMemo(raw: string): string {
  return raw.trim();
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

export function parseStored(raw: string | null): Nyushukkin[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const items: Nyushukkin[] = [];
    for (const row of parsed) {
      const item = asNyushukkin(row);
      if (item) {
        items.push(item);
      }
    }
    return items;
  } catch {
    return [];
  }
}

export function serializeStored(items: Nyushukkin[]): string {
  return JSON.stringify(items);
}

function assemble(id: string, input: NyushukkinInput, today: string): NyushukkinResult<Nyushukkin> {
  const kind = parseKind(input.kind);
  if (!kind.ok) {
    return kind;
  }
  const amount = parseAmount(input.amount);
  if (!amount.ok) {
    return amount;
  }
  const date = parseDate(input.date, today);
  if (!date.ok) {
    return date;
  }
  return {
    ok: true,
    value: {
      id,
      kind: kind.value,
      amount: amount.value,
      date: date.value,
      memo: parseMemo(input.memo),
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
