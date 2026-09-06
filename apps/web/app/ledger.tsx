"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import {
  calendarMonth,
  correctNyushukkin,
  kinds,
  monthTotals,
  parseStored,
  recordNyushukkin,
  removeNyushukkin,
  replaceNyushukkin,
  serializeStored,
  sortNyushukkin,
  todayJst,
  type Nyushukkin,
  type NyushukkinInput,
} from "./nyushukkin";

const storageKey = "kakeibo.nyushukkin";
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function snapshot() {
  return window.localStorage.getItem(storageKey);
}

function persist(items: Nyushukkin[]) {
  window.localStorage.setItem(storageKey, serializeStored(items));
  for (const listener of listeners) {
    listener();
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

export function Ledger() {
  const today = todayJst();
  const month = calendarMonth(today);
  const items = parseStored(useSyncExternalStore(subscribe, snapshot, () => null));
  const [input, setInput] = useState<NyushukkinInput>(emptyInput(today));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const recorded = editingId
      ? (() => {
          const current = items.find((item) => item.id === editingId);
          if (!current) {
            return { ok: false as const, error: "その入出金はありません" };
          }
          return correctNyushukkin(current, input, today);
        })()
      : recordNyushukkin(input, today, crypto.randomUUID());
    if (!recorded.ok) {
      setError(recorded.error);
      return;
    }
    persist(replaceNyushukkin(items, recorded.value));
    setInput(emptyInput(today));
    setEditingId(null);
    setError("");
  }

  function startCorrect(item: Nyushukkin) {
    setEditingId(item.id);
    setInput({
      kind: item.kind,
      amount: String(item.amount),
      date: item.date,
      memo: item.memo,
    });
    setError("");
  }

  function cancelCorrect() {
    setEditingId(null);
    setInput(emptyInput(today));
    setError("");
  }

  function remove(id: string) {
    const next = removeNyushukkin(items, id);
    if (!next.ok) {
      setError(next.error);
      return;
    }
    persist(next.value);
    if (editingId === id) {
      cancelCorrect();
    }
  }

  const totals = monthTotals(items, month);
  const listed = sortNyushukkin(items);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">家計簿</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{month}の収支</p>
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

      <form className="flex flex-col gap-4" onSubmit={submit}>
        <fieldset className="flex gap-4">
          <legend className="mb-1 text-sm font-medium">種類</legend>
          {kinds.map((kind) => (
            <label key={kind} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="kind"
                value={kind}
                checked={input.kind === kind}
                onChange={() => setInput({ ...input, kind })}
              />
              {kind}
            </label>
          ))}
        </fieldset>
        <label className="flex flex-col gap-1 text-sm" htmlFor="nyushukkin-amount">
          金額
          <input
            id="nyushukkin-amount"
            className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            inputMode="numeric"
            name="amount"
            value={input.amount}
            onChange={(event) => setInput({ ...input, amount: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm" htmlFor="nyushukkin-date">
          入出日
          <input
            id="nyushukkin-date"
            className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            type="date"
            name="date"
            max={today}
            value={input.date}
            onChange={(event) => setInput({ ...input, date: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm" htmlFor="nyushukkin-memo">
          メモ
          <input
            id="nyushukkin-memo"
            className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            name="memo"
            value={input.memo}
            onChange={(event) => setInput({ ...input, memo: event.target.value })}
          />
        </label>
        {error ? (
          <p className="text-sm text-red-700 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex gap-3">
          <button
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            type="submit"
          >
            {editingId ? "この入出金を直す" : "記録する"}
          </button>
          {editingId ? (
            <button className="text-sm underline" type="button" onClick={cancelCorrect}>
              やめる
            </button>
          ) : null}
        </div>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">入出金</h2>
        {listed.length === 0 ? (
          <p className="text-sm text-zinc-500">まだ入出金がありません</p>
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
