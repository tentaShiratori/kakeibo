"use client";

import { useEffect, useState } from "react";
import { calendarMonth } from "./calendarMonth";
import {
  correctNyushukkin,
  recordNyushukkin,
  removeNyushukkin,
  replaceNyushukkin,
  todayJst,
  type Nyushukkin,
  type NyushukkinInput,
  type NyushukkinResult,
} from "./nyushukkin";
import { deleteNyushukkin, getNyushukkin, postNyushukkin, putNyushukkin } from "./nyushukkinApi";

export function useNyushukkin(month: string) {
  const [items, setItems] = useState<Nyushukkin[]>([]);
  const [removed, setRemoved] = useState<Nyushukkin | null>(null);
  const [loadError, setLoadError] = useState("");
  const [monthsWithItems, setMonthsWithItems] = useState<string[]>([]);

  function noteMonth(key: string) {
    setMonthsWithItems((current) => (current.includes(key) ? current : [...current, key]));
  }

  useEffect(() => {
    const ac = new AbortController();
    setLoadError("");
    void (async () => {
      try {
        const listed = await getNyushukkin(month, { signal: ac.signal });
        if (ac.signal.aborted) {
          return;
        }
        if (!listed.ok) {
          setLoadError(listed.error);
          setItems([]);
          return;
        }
        setItems(listed.value);
        if (listed.value.length > 0) {
          noteMonth(month);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        throw error;
      }
    })();
    return () => ac.abort();
  }, [month]);

  const hasOtherMonths = monthsWithItems.some((key) => key !== month);

  async function onRecord(input: NyushukkinInput): Promise<NyushukkinResult<Nyushukkin>> {
    const recorded = recordNyushukkin(input, todayJst(), "pending");
    if (!recorded.ok) {
      return recorded;
    }
    const saved = await postNyushukkin({
      kind: recorded.value.kind,
      amount: recorded.value.amount,
      date: recorded.value.date,
      memo: recorded.value.memo,
      wakuId: recorded.value.wakuId,
    });
    if (!saved.ok) {
      return saved;
    }
    const savedMonth = calendarMonth(saved.value.date);
    noteMonth(savedMonth);
    if (savedMonth === month) {
      setItems((current) => replaceNyushukkin(current, saved.value));
    }
    return saved;
  }

  async function onCorrect(
    id: string,
    input: NyushukkinInput,
  ): Promise<NyushukkinResult<Nyushukkin>> {
    const current = items.find((item) => item.id === id);
    if (!current) {
      return { ok: false, error: "その入出金はありません" };
    }
    const recorded = correctNyushukkin(current, input, todayJst());
    if (!recorded.ok) {
      return recorded;
    }
    const saved = await putNyushukkin(id, {
      kind: recorded.value.kind,
      amount: recorded.value.amount,
      date: recorded.value.date,
      memo: recorded.value.memo,
      wakuId: recorded.value.wakuId,
    });
    if (!saved.ok) {
      return saved;
    }
    const savedMonth = calendarMonth(saved.value.date);
    noteMonth(savedMonth);
    if (savedMonth === month) {
      setItems((currentItems) => replaceNyushukkin(currentItems, saved.value));
    } else {
      setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    }
    return saved;
  }

  async function onRemove(id: string): Promise<NyushukkinResult<Nyushukkin>> {
    const current = items.find((item) => item.id === id);
    const next = removeNyushukkin(items, id);
    if (!next.ok || !current) {
      return { ok: false, error: next.ok ? "その入出金はありません" : next.error };
    }
    const saved = await deleteNyushukkin(id);
    if (!saved.ok) {
      return saved;
    }
    setItems(next.value);
    setRemoved(current);
    return { ok: true, value: current };
  }

  async function onRestore(): Promise<NyushukkinResult<Nyushukkin>> {
    if (!removed) {
      return { ok: false, error: "消した入出金はありません" };
    }
    const saved = await postNyushukkin({
      kind: removed.kind,
      amount: removed.amount,
      date: removed.date,
      memo: removed.memo,
      wakuId: removed.wakuId,
    });
    if (!saved.ok) {
      return saved;
    }
    const savedMonth = calendarMonth(saved.value.date);
    noteMonth(savedMonth);
    if (savedMonth === month) {
      setItems((current) => replaceNyushukkin(current, saved.value));
    }
    setRemoved(null);
    return saved;
  }

  return { items, removed, loadError, hasOtherMonths, onRecord, onCorrect, onRemove, onRestore };
}
