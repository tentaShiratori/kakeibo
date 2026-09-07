"use client";

import { useState } from "react";
import { NyushukkinForm } from "./NyushukkinForm";
import { NyushukkinItem } from "./NyushukkinItem";
import {
  calendarMonth,
  formatCalendarMonth,
  isCurrentOrPastMonth,
  monthTotals,
  nyushukkinInMonth,
  shiftCalendarMonth,
  sortNyushukkin,
  todayJst,
  type Nyushukkin,
} from "./nyushukkin";
import { useNyushukkin } from "./useNyushukkin";
import { yen } from "./yen";

export function Ledger() {
  const today = todayJst();
  const { items, removed, onRecord, onCorrect, onRemove, onRestore } = useNyushukkin();
  const [month, setMonth] = useState(calendarMonth(today));
  const [editing, setEditing] = useState<Nyushukkin | null>(null);
  const [error, setError] = useState("");

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

      <NyushukkinForm
        key={editing?.id ?? "new"}
        editing={editing}
        onRecord={onRecord}
        onCorrect={onCorrect}
        onCancel={() => {
          setEditing(null);
          setError("");
        }}
        onSaved={(item) => {
          setMonth(calendarMonth(item.date));
          setEditing(null);
          setError("");
        }}
      />
      {error ? (
        <p className="text-sm text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">入出金</h2>
        {removed ? (
          <button
            className="self-start text-sm underline"
            type="button"
            onClick={() => {
              const restored = onRestore();
              if (!restored.ok) {
                setError(restored.error);
                return;
              }
              setMonth(calendarMonth(restored.value.date));
              setError("");
            }}
          >
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
              <NyushukkinItem key={item.id} item={item}>
                <button className="underline" type="button" onClick={() => setEditing(item)}>
                  直す
                </button>
                <button
                  className="underline"
                  type="button"
                  onClick={() => {
                    const next = onRemove(item.id);
                    if (!next.ok) {
                      setError(next.error);
                      return;
                    }
                    setError("");
                    if (editing?.id === item.id) {
                      setEditing(null);
                    }
                  }}
                >
                  消す
                </button>
              </NyushukkinItem>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
