"use client";

import { useEffect, useState } from "react";
import { getWaku, postWaku, putWaku } from "./wakuApi";
import { parseWakuName, type Waku } from "./waku";
import type { NyushukkinResult } from "./nyushukkin";

export function useWaku() {
  const [items, setItems] = useState<Waku[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    setLoadError("");
    void (async () => {
      try {
        const listed = await getWaku({ signal: ac.signal });
        if (ac.signal.aborted) {
          return;
        }
        if (!listed.ok) {
          setLoadError(listed.error);
          setItems([]);
          return;
        }
        setItems(listed.value);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        throw error;
      }
    })();
    return () => ac.abort();
  }, []);

  async function onCreate(name: string): Promise<NyushukkinResult<Waku>> {
    const parsed = parseWakuName(name);
    if (!parsed.ok) {
      return parsed;
    }
    const saved = await postWaku(parsed.value);
    if (!saved.ok) {
      return saved;
    }
    setItems((current) =>
      [...current, saved.value].sort((a, b) =>
        a.name === b.name ? a.id.localeCompare(b.id) : a.name.localeCompare(b.name, "ja"),
      ),
    );
    return saved;
  }

  async function onRename(id: string, name: string): Promise<NyushukkinResult<Waku>> {
    const parsed = parseWakuName(name);
    if (!parsed.ok) {
      return parsed;
    }
    const saved = await putWaku(id, parsed.value);
    if (!saved.ok) {
      return saved;
    }
    setItems((current) =>
      current
        .map((item) => (item.id === id ? saved.value : item))
        .sort((a, b) =>
          a.name === b.name ? a.id.localeCompare(b.id) : a.name.localeCompare(b.name, "ja"),
        ),
    );
    return saved;
  }

  return { items, loadError, onCreate, onRename };
}
