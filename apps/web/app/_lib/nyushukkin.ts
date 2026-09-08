import * as v from "valibot";
import { calendarMonth, todayJst } from "./calendarMonth";

export {
  calendarMonth,
  formatCalendarMonth,
  isCurrentOrPastMonth,
  shiftCalendarMonth,
  todayJst,
} from "./calendarMonth";

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
const kindError = "収入か支出を選んでください";
const amountError = "金額は1円以上の整数円です";
const dateError = "入出日は今日以前の日付です";

const kindSchema = v.picklist(kinds, kindError);
const amountInputSchema = v.pipe(
  v.string(),
  v.trim(),
  v.digits(amountError),
  v.toNumber(amountError),
  v.safeInteger(amountError),
  v.minValue(1, amountError),
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

export function nyushukkinInMonth(items: Nyushukkin[], month: string): Nyushukkin[] {
  return items.filter((item) => calendarMonth(item.date) === month);
}

export function parseKind(raw: string): NyushukkinResult<Kind> {
  return fromSchema(kindSchema, raw);
}

export function parseDate(raw: string, today: string): NyushukkinResult<string> {
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

export function replaceNyushukkin(items: Nyushukkin[], next: Nyushukkin): Nyushukkin[] {
  const index = items.findIndex((item) => item.id === next.id);
  if (index === -1) {
    return [...items, next];
  }
  return items.map((item) => (item.id === next.id ? next : item));
}

export function monthTotals(items: Nyushukkin[], month: string) {
  const inMonth = nyushukkinInMonth(items, month);
  const income = inMonth
    .filter((item) => item.kind === "収入")
    .reduce((sum, item) => sum + item.amount, 0);
  const expense = inMonth
    .filter((item) => item.kind === "支出")
    .reduce((sum, item) => sum + item.amount, 0);
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
      amount: parsed.value.amount,
      date: parsed.value.date,
      memo: parsed.value.memo,
    },
  };
}
