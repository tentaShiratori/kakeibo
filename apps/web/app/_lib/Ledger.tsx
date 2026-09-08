"use client";

import { useState } from "react";
import { Button } from "./Button";
import { NyushukkinForm } from "./NyushukkinForm";
import { NyushukkinItem } from "./NyushukkinItem";
import { WakuList } from "./WakuList";
import {
  calendarMonth,
  formatCalendarMonth,
  isCurrentOrPastMonth,
  nyushukkinInMonth,
  shiftCalendarMonth,
  sortNyushukkin,
  todayJst,
  type Nyushukkin,
} from "./nyushukkin";
import { useFurikaeri } from "./useFurikaeri";
import { useNyushukkin } from "./useNyushukkin";
import { useWaku } from "./useWaku";
import { yen } from "./yen";
import type { Totals } from "./furikaeri";

export function Ledger() {
  const today = todayJst();
  const [month, setMonth] = useState(calendarMonth(today));
  const { items, removed, loadError, hasOtherMonths, onRecord, onCorrect, onRemove, onRestore } =
    useNyushukkin(month);
  const waku = useWaku();
  const revision =
    items.map((item) => `${item.id}:${item.wakuId}:${item.amount}:${item.date}`).join(",") +
    "|" +
    waku.items.map((item) => `${item.id}:${item.name}`).join(",");
  const { furikaeri, loadError: furikaeriError } = useFurikaeri(month, revision);
  const [editing, setEditing] = useState<Nyushukkin | null>(null);
  const [error, setError] = useState("");
  const shownError = error || loadError || waku.loadError || furikaeriError;

  const listed = sortNyushukkin(nyushukkinInMonth(items, month));
  const canShowNextMonth = isCurrentOrPastMonth(shiftCalendarMonth(month, 1), today);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">家計簿</h1>
        <div className="flex items-center gap-3 text-sm text-muted">
          <Button variant="ghost" onClick={() => setMonth(shiftCalendarMonth(month, -1))}>
            前の月
          </Button>
          <p>{formatCalendarMonth(month)}の収支</p>
          <Button
            variant="ghost"
            disabled={!canShowNextMonth}
            onClick={() => setMonth(shiftCalendarMonth(month, 1))}
          >
            次の月
          </Button>
        </div>
        <TotalsRow totals={furikaeri} />
        <ul className="flex flex-col gap-2 text-sm">
          {furikaeri.waku.map((row) => (
            <li key={row.id} className="flex flex-col gap-1">
              <p className="font-medium">{row.name}</p>
              <TotalsRow totals={row} />
            </li>
          ))}
          <li className="flex flex-col gap-1">
            <p className="font-medium">枠なし</p>
            <TotalsRow totals={furikaeri.none} />
          </li>
        </ul>
      </header>

      <NyushukkinForm
        key={editing?.id ?? "new"}
        editing={editing}
        wakus={waku.items}
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
      {shownError ? (
        <p className="text-sm text-danger" role="alert">
          {shownError}
        </p>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">入出金</h2>
        {removed ? (
          <Button
            className="self-start"
            variant="ghost"
            onClick={() => {
              void onRestore().then((restored) => {
                if (!restored.ok) {
                  setError(restored.error);
                  return;
                }
                setMonth(calendarMonth(restored.value.date));
                setError("");
              });
            }}
          >
            消した入出金を戻す
          </Button>
        ) : null}
        {listed.length === 0 ? (
          <p className="text-sm text-muted">
            {items.length === 0 && !hasOtherMonths
              ? "まだ入出金がありません"
              : "この月の入出金はまだありません"}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {listed.map((item) => (
              <NyushukkinItem
                key={item.id}
                item={item}
                wakuName={waku.items.find((row) => row.id === item.wakuId)?.name}
              >
                <Button variant="ghost" onClick={() => setEditing(item)}>
                  直す
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    void onRemove(item.id).then((next) => {
                      if (!next.ok) {
                        setError(next.error);
                        return;
                      }
                      setError("");
                      if (editing?.id === item.id) {
                        setEditing(null);
                      }
                    });
                  }}
                >
                  消す
                </Button>
              </NyushukkinItem>
            ))}
          </ul>
        )}
      </section>

      <WakuList items={waku.items} onCreate={waku.onCreate} onRename={waku.onRename} />
    </div>
  );
}

function TotalsRow({ totals }: { totals: Totals }) {
  return (
    <dl className="grid grid-cols-3 gap-3 text-sm">
      <div>
        <dt className="text-muted">収入</dt>
        <dd className="font-medium tabular-nums text-income">{yen(totals.income)}</dd>
      </div>
      <div>
        <dt className="text-muted">支出</dt>
        <dd className="font-medium tabular-nums text-expense">{yen(totals.expense)}</dd>
      </div>
      <div>
        <dt className="text-muted">収支</dt>
        <dd className="font-medium tabular-nums">{yen(totals.balance)}</dd>
      </div>
    </dl>
  );
}
