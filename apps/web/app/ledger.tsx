"use client";

import { useForm } from "@tanstack/react-form";
import { useRef, useState, useSyncExternalStore } from "react";
import {
  calendarMonth,
  correctNyushukkin,
  formatCalendarMonth,
  isCurrentOrPastMonth,
  kinds,
  loadStored,
  monthTotals,
  nyushukkinInMonth,
  nyushukkinInputSchema,
  recordNyushukkin,
  removeNyushukkin,
  replaceNyushukkin,
  restoreNyushukkin,
  readStored,
  serializeStored,
  shiftCalendarMonth,
  sortNyushukkin,
  todayJst,
  type Nyushukkin,
  type NyushukkinInput,
} from "./nyushukkin";

const storageKey = "kakeibo.nyushukkin";
const backupKey = "kakeibo.nyushukkin.bak";
const listeners = new Set<() => void>();
const fieldOrder = ["kind", "amount", "date", "memo"] as const;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function snapshot() {
  return JSON.stringify([
    window.localStorage.getItem(storageKey),
    window.localStorage.getItem(backupKey),
  ]);
}

function persist(items: Nyushukkin[]) {
  const current = window.localStorage.getItem(storageKey);
  const next = serializeStored(items);
  if (current !== null && readStored(current).ok) {
    window.localStorage.setItem(backupKey, current);
  }
  window.localStorage.setItem(storageKey, next);
  if (window.localStorage.getItem(backupKey) === null) {
    window.localStorage.setItem(backupKey, next);
  }
  for (const listener of listeners) {
    listener();
  }
}

function itemsFromSnapshot(raw: string | null): Nyushukkin[] {
  if (!raw) {
    return [];
  }
  try {
    const pair: unknown = JSON.parse(raw);
    if (!Array.isArray(pair) || pair.length !== 2) {
      return [];
    }
    return loadStored(
      typeof pair[0] === "string" ? pair[0] : null,
      typeof pair[1] === "string" ? pair[1] : null,
    );
  } catch {
    return [];
  }
}

const emptyInput = (today: string): NyushukkinInput => ({
  kind: "支出",
  amount: "",
  date: today,
  memo: "",
});

function yen(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円`;
}

function issueMessage(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (!Array.isArray(value) || value.length === 0) {
    return "";
  }
  const first = value[0];
  if (typeof first === "string") {
    return first;
  }
  if (first && typeof first === "object" && "message" in first && typeof first.message === "string") {
    return first.message;
  }
  return "";
}

function firstSubmitError(onSubmit: unknown): string {
  if (!onSubmit) {
    return "";
  }
  if (typeof onSubmit === "string") {
    return onSubmit;
  }
  if (typeof onSubmit !== "object") {
    return "";
  }
  const grouped = onSubmit as Record<string, unknown>;
  for (const key of fieldOrder) {
    const message = issueMessage(grouped[key]);
    if (message) {
      return message;
    }
  }
  for (const value of Object.values(grouped)) {
    const message = issueMessage(value);
    if (message) {
      return message;
    }
  }
  return "";
}

const inputClass = "rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950";

export function Ledger() {
  const today = todayJst();
  const items = itemsFromSnapshot(useSyncExternalStore(subscribe, snapshot, () => null));
  const amountRef = useRef<HTMLInputElement>(null);
  const [month, setMonth] = useState(calendarMonth(today));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Nyushukkin | null>(null);
  const [error, setError] = useState("");
  const form = useForm({
    defaultValues: emptyInput(today),
    validators: {
      onSubmit: nyushukkinInputSchema(today),
    },
    onSubmit: ({ value }) => {
      const recorded = editingId
        ? (() => {
            const current = items.find((item) => item.id === editingId);
            if (!current) {
              return { ok: false as const, error: "その入出金はありません" };
            }
            return correctNyushukkin(current, value, today);
          })()
        : recordNyushukkin(value, today, crypto.randomUUID());
      if (!recorded.ok) {
        setError(recorded.error);
        return;
      }
      persist(replaceNyushukkin(items, recorded.value));
      setMonth(calendarMonth(recorded.value.date));
      resetForm();
    },
  });

  function resetForm() {
    form.reset(emptyInput(today));
    setEditingId(null);
    setError("");
    amountRef.current?.focus();
  }

  function startCorrect(item: Nyushukkin) {
    setEditingId(item.id);
    form.reset({
      kind: item.kind,
      amount: String(item.amount),
      date: item.date,
      memo: item.memo,
    });
    setError("");
  }

  function remove(id: string) {
    const current = items.find((item) => item.id === id);
    const next = removeNyushukkin(items, id);
    if (!next.ok || !current) {
      setError(next.ok ? "その入出金はありません" : next.error);
      return;
    }
    persist(next.value);
    setRemoved(current);
    setError("");
    if (editingId === id) {
      resetForm();
    }
  }

  function restore() {
    if (!removed) {
      return;
    }
    const next = restoreNyushukkin(items, removed);
    if (!next.ok) {
      setError(next.error);
      return;
    }
    persist(next.value);
    setMonth(calendarMonth(removed.date));
    setRemoved(null);
    setError("");
  }

  const totals = monthTotals(items, month);
  const listed = sortNyushukkin(nyushukkinInMonth(items, month));
  const canShowNextMonth = isCurrentOrPastMonth(shiftCalendarMonth(month, 1), today);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">家計簿</h1>
        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <button
            className="underline"
            type="button"
            onClick={() => setMonth(shiftCalendarMonth(month, -1))}
          >
            前の月
          </button>
          <p>{formatCalendarMonth(month)}の収支</p>
          <button
            className="underline disabled:text-zinc-400 disabled:no-underline dark:disabled:text-zinc-600"
            type="button"
            disabled={!canShowNextMonth}
            onClick={() => setMonth(shiftCalendarMonth(month, 1))}
          >
            次の月
          </button>
        </div>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-zinc-500">収入</dt>
            <dd className="font-medium">{yen(totals.income)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">支出</dt>
            <dd className="font-medium">{yen(totals.expense)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">収支</dt>
            <dd className="font-medium">{yen(totals.balance)}</dd>
          </div>
        </dl>
      </header>

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setError("");
          void form.handleSubmit();
        }}
      >
        <form.Field name="amount">
          {(field) => (
            <label className="flex flex-col gap-1 text-sm" htmlFor="nyushukkin-amount">
              金額
              <input
                ref={amountRef}
                id="nyushukkin-amount"
                className={inputClass}
                inputMode="numeric"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </label>
          )}
        </form.Field>
        <form.Field name="date">
          {(field) => (
            <label className="flex flex-col gap-1 text-sm" htmlFor="nyushukkin-date">
              入出日
              <input
                id="nyushukkin-date"
                className={inputClass}
                type="date"
                name={field.name}
                max={today}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </label>
          )}
        </form.Field>
        <form.Field name="kind">
          {(field) => (
            <fieldset className="flex gap-4">
              <legend className="mb-1 text-sm font-medium">種類</legend>
              {kinds.map((kind) => (
                <label key={kind} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={field.name}
                    value={kind}
                    checked={field.state.value === kind}
                    onBlur={field.handleBlur}
                    onChange={() => field.handleChange(kind)}
                  />
                  {kind}
                </label>
              ))}
            </fieldset>
          )}
        </form.Field>
        <form.Field name="memo">
          {(field) => (
            <label className="flex flex-col gap-1 text-sm" htmlFor="nyushukkin-memo">
              メモ
              <input
                id="nyushukkin-memo"
                className={inputClass}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </label>
          )}
        </form.Field>
        {error ? (
          <p className="text-sm text-red-700 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : (
          <form.Subscribe selector={(state) => firstSubmitError(state.errorMap.onSubmit)}>
            {(message) =>
              message ? (
                <p className="text-sm text-red-700 dark:text-red-400" role="alert">
                  {message}
                </p>
              ) : null
            }
          </form.Subscribe>
        )}
        <div className="flex gap-3">
          <button
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            type="submit"
          >
            {editingId ? "この入出金を直す" : "記録する"}
          </button>
          {editingId ? (
            <button className="text-sm underline" type="button" onClick={resetForm}>
              やめる
            </button>
          ) : null}
        </div>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">入出金</h2>
        {removed ? (
          <button className="self-start text-sm underline" type="button" onClick={restore}>
            消した入出金を戻す
          </button>
        ) : null}
        {listed.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {items.length === 0 ? "まだ入出金がありません" : "この月の入出金はまだありません"}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {listed.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 py-3">
                <div className="flex flex-col gap-0.5 text-sm">
                  <span>
                    {item.date} {item.kind} {yen(item.amount)}
                  </span>
                  {item.memo ? <span className="text-zinc-500">{item.memo}</span> : null}
                </div>
                <div className="flex gap-3 text-sm">
                  <button className="underline" type="button" onClick={() => startCorrect(item)}>
                    直す
                  </button>
                  <button className="underline" type="button" onClick={() => remove(item.id)}>
                    消す
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
