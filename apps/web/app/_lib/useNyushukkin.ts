"use client";

import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { SyncStorage } from "jotai/vanilla/utils/atomWithStorage";
import { useState } from "react";
import {
  correctNyushukkin,
  recordNyushukkin,
  removeNyushukkin,
  replaceNyushukkin,
  restoreNyushukkin,
  todayJst,
  type Nyushukkin,
  type NyushukkinInput,
  type NyushukkinResult,
} from "./nyushukkin";
import { loadStored, readStored, serializeStored } from "./stored";

const storageKey = "kakeibo.nyushukkin";

const nyushukkinStorage: SyncStorage<Nyushukkin[]> = {
  getItem(key, initialValue) {
    if (typeof window === "undefined") {
      return initialValue;
    }
    return loadStored(window.localStorage.getItem(key), window.localStorage.getItem(`${key}.bak`));
  },
  setItem(key, newValue) {
    if (typeof window === "undefined") {
      return;
    }
    const current = window.localStorage.getItem(key);
    const next = serializeStored(newValue);
    if (current !== null && readStored(current).ok) {
      window.localStorage.setItem(`${key}.bak`, current);
    }
    window.localStorage.setItem(key, next);
    if (window.localStorage.getItem(`${key}.bak`) === null) {
      window.localStorage.setItem(`${key}.bak`, next);
    }
  },
  removeItem(key) {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.removeItem(key);
    window.localStorage.removeItem(`${key}.bak`);
  },
  subscribe(key, callback, initialValue) {
    if (typeof window === "undefined") {
      return undefined;
    }
    const onChange = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage && event.key === key) {
        callback(nyushukkinStorage.getItem(key, initialValue));
      }
    };
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  },
};

const nyushukkinItemsAtom = atomWithStorage<Nyushukkin[]>(storageKey, [], nyushukkinStorage);

export function useNyushukkin() {
  const [items, setItems] = useAtom(nyushukkinItemsAtom);
  const [removed, setRemoved] = useState<Nyushukkin | null>(null);

  function onRecord(input: NyushukkinInput): NyushukkinResult<Nyushukkin> {
    const recorded = recordNyushukkin(input, todayJst(), crypto.randomUUID());
    if (!recorded.ok) {
      return recorded;
    }
    setItems((current) => replaceNyushukkin(current, recorded.value));
    return recorded;
  }

  function onCorrect(id: string, input: NyushukkinInput): NyushukkinResult<Nyushukkin> {
    const current = items.find((item) => item.id === id);
    if (!current) {
      return { ok: false, error: "その入出金はありません" };
    }
    const recorded = correctNyushukkin(current, input, todayJst());
    if (!recorded.ok) {
      return recorded;
    }
    setItems((next) => replaceNyushukkin(next, recorded.value));
    return recorded;
  }

  function onRemove(id: string): NyushukkinResult<Nyushukkin> {
    const current = items.find((item) => item.id === id);
    const next = removeNyushukkin(items, id);
    if (!next.ok || !current) {
      return { ok: false, error: next.ok ? "その入出金はありません" : next.error };
    }
    setItems(next.value);
    setRemoved(current);
    return { ok: true, value: current };
  }

  function onRestore(): NyushukkinResult<Nyushukkin> {
    if (!removed) {
      return { ok: false, error: "消した入出金はありません" };
    }
    const next = restoreNyushukkin(items, removed);
    if (!next.ok) {
      return next;
    }
    setItems(next.value);
    const restored = removed;
    setRemoved(null);
    return { ok: true, value: restored };
  }

  return { items, removed, onRecord, onCorrect, onRemove, onRestore };
}
