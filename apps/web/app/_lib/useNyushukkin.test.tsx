import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { todayJst } from "./nyushukkin";
import { serializeStored } from "./stored";
import { useNyushukkin } from "./useNyushukkin";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  window.localStorage.clear();
});

function renderNyushukkin() {
  const store = createStore();
  return renderHook(() => useNyushukkin(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    ),
  });
}

test("保存が無いときは空の帳簿", () => {
  const { result } = renderNyushukkin();
  expect(result.current.items).toEqual([]);
  expect(result.current.removed).toBeNull();
});

test("壊れた保存はひとつ前の帳簿を出す", async () => {
  const today = todayJst();
  window.localStorage.setItem(
    "kakeibo.nyushukkin.bak",
    serializeStored([{ id: "a", kind: "支出", amount: 5000, date: today, memo: "" }]),
  );
  window.localStorage.setItem("kakeibo.nyushukkin", "nope");
  const { result } = renderNyushukkin();
  await waitFor(() => {
    expect(result.current.items).toEqual([
      { id: "a", kind: "支出", amount: 5000, date: today, memo: "" },
    ]);
  });
});

test("初めての記録が壊れても残る", async () => {
  const { result, rerender } = renderNyushukkin();
  act(() => {
    result.current.onRecord({ kind: "支出", amount: "5000", date: todayJst(), memo: "" });
  });
  rerender();
  expect(result.current.items).toHaveLength(1);
  window.localStorage.setItem("kakeibo.nyushukkin", "nope");
  const { result: reloaded } = renderNyushukkin();
  await waitFor(() => {
    expect(reloaded.current.items[0]?.amount).toBe(5000);
  });
});

test("記録できる", () => {
  const { result, rerender } = renderNyushukkin();
  act(() => {
    const recorded = result.current.onRecord({
      kind: "支出",
      amount: "5000",
      date: todayJst(),
      memo: "米",
    });
    expect(recorded.ok).toBe(true);
  });
  rerender();
  expect(result.current.items).toHaveLength(1);
  expect(result.current.items[0]?.amount).toBe(5000);
});

test("0円は記録できない", () => {
  const { result } = renderNyushukkin();
  act(() => {
    const recorded = result.current.onRecord({
      kind: "支出",
      amount: "0",
      date: todayJst(),
      memo: "",
    });
    expect(recorded).toEqual({ ok: false, error: "金額は1円以上の整数円です" });
  });
  expect(result.current.items).toEqual([]);
});

test("同じ入出金を直せる", () => {
  const { result, rerender } = renderNyushukkin();
  act(() => {
    result.current.onRecord({ kind: "支出", amount: "5000", date: todayJst(), memo: "" });
  });
  rerender();
  const id = result.current.items[0]?.id;
  expect(id).toBeDefined();
  act(() => {
    const recorded = result.current.onCorrect(id ?? "", {
      kind: "支出",
      amount: "3000",
      date: todayJst(),
      memo: "",
    });
    expect(recorded.ok).toBe(true);
  });
  rerender();
  expect(result.current.items[0]?.amount).toBe(3000);
});

test("無い入出金は直せない", () => {
  const { result } = renderNyushukkin();
  act(() => {
    expect(
      result.current.onCorrect("missing", {
        kind: "支出",
        amount: "100",
        date: todayJst(),
        memo: "",
      }),
    ).toEqual({ ok: false, error: "その入出金はありません" });
  });
});

test("入出金を消して戻せる", () => {
  const { result, rerender } = renderNyushukkin();
  act(() => {
    result.current.onRecord({ kind: "支出", amount: "5000", date: todayJst(), memo: "" });
  });
  rerender();
  const id = result.current.items[0]?.id ?? "";
  act(() => {
    expect(result.current.onRemove(id).ok).toBe(true);
  });
  rerender();
  expect(result.current.items).toEqual([]);
  expect(result.current.removed?.id).toBe(id);
  act(() => {
    expect(result.current.onRestore().ok).toBe(true);
  });
  rerender();
  expect(result.current.items[0]?.id).toBe(id);
  expect(result.current.removed).toBeNull();
});

test("無い入出金は消せない", () => {
  const { result } = renderNyushukkin();
  act(() => {
    expect(result.current.onRemove("missing")).toEqual({
      ok: false,
      error: "その入出金はありません",
    });
  });
});

test("消していないときは戻せない", () => {
  const { result } = renderNyushukkin();
  act(() => {
    expect(result.current.onRestore()).toEqual({
      ok: false,
      error: "消した入出金はありません",
    });
  });
});
