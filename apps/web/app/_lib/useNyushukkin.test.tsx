import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { fakeNyushukkinApi } from "../../test/fakeNyushukkinApi";
import { calendarMonth, todayJst } from "./nyushukkin";
import { useNyushukkin } from "./useNyushukkin";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  const { fetchImpl } = fakeNyushukkinApi();
  vi.stubGlobal("fetch", fetchImpl);
});

function renderNyushukkin(month = calendarMonth(todayJst())) {
  return renderHook((props: { month: string }) => useNyushukkin(props.month), {
    initialProps: { month },
  });
}

test("保存が無いときは空の帳簿", async () => {
  const { result } = renderNyushukkin();
  await waitFor(() => {
    expect(result.current.items).toEqual([]);
  });
  expect(result.current.removed).toBeNull();
});

test("記録できる", async () => {
  const { result } = renderNyushukkin();
  await waitFor(() => {
    expect(result.current.items).toEqual([]);
  });
  await act(async () => {
    const recorded = await result.current.onRecord({
      kind: "支出",
      amount: "5000",
      date: todayJst(),
      memo: "米",
    });
    expect(recorded.ok).toBe(true);
  });
  expect(result.current.items).toHaveLength(1);
  expect(result.current.items[0]?.amount).toBe(5000);
});

test("0円は記録できない", async () => {
  const { result } = renderNyushukkin();
  await waitFor(() => {
    expect(result.current.items).toEqual([]);
  });
  await act(async () => {
    const recorded = await result.current.onRecord({
      kind: "支出",
      amount: "0",
      date: todayJst(),
      memo: "",
    });
    expect(recorded).toEqual({ ok: false, error: "金額は1円以上の整数円です" });
  });
  expect(result.current.items).toEqual([]);
});

test("同じ入出金を直せる", async () => {
  const { result } = renderNyushukkin();
  await waitFor(() => {
    expect(result.current.items).toEqual([]);
  });
  await act(async () => {
    await result.current.onRecord({ kind: "支出", amount: "5000", date: todayJst(), memo: "" });
  });
  const id = result.current.items[0]?.id;
  expect(id).toBeDefined();
  await act(async () => {
    const recorded = await result.current.onCorrect(id ?? "", {
      kind: "支出",
      amount: "3000",
      date: todayJst(),
      memo: "",
    });
    expect(recorded.ok).toBe(true);
  });
  expect(result.current.items[0]?.amount).toBe(3000);
});

test("無い入出金は直せない", async () => {
  const { result } = renderNyushukkin();
  await waitFor(() => {
    expect(result.current.items).toEqual([]);
  });
  await act(async () => {
    expect(
      await result.current.onCorrect("missing", {
        kind: "支出",
        amount: "100",
        date: todayJst(),
        memo: "",
      }),
    ).toEqual({ ok: false, error: "その入出金はありません" });
  });
});

test("入出金を消して戻せる", async () => {
  const { result } = renderNyushukkin();
  await waitFor(() => {
    expect(result.current.items).toEqual([]);
  });
  await act(async () => {
    await result.current.onRecord({ kind: "支出", amount: "5000", date: todayJst(), memo: "" });
  });
  await act(async () => {
    expect((await result.current.onRemove(result.current.items[0]?.id ?? "")).ok).toBe(true);
  });
  expect(result.current.items).toEqual([]);
  expect(result.current.removed?.amount).toBe(5000);
  await act(async () => {
    expect((await result.current.onRestore()).ok).toBe(true);
  });
  expect(result.current.items[0]?.amount).toBe(5000);
  expect(result.current.removed).toBeNull();
});

test("無い入出金は消せない", async () => {
  const { result } = renderNyushukkin();
  await waitFor(() => {
    expect(result.current.items).toEqual([]);
  });
  await act(async () => {
    expect(await result.current.onRemove("missing")).toEqual({
      ok: false,
      error: "その入出金はありません",
    });
  });
});

test("消していないときは戻せない", async () => {
  const { result } = renderNyushukkin();
  await waitFor(() => {
    expect(result.current.items).toEqual([]);
  });
  await act(async () => {
    expect(await result.current.onRestore()).toEqual({
      ok: false,
      error: "消した入出金はありません",
    });
  });
});

test("api に届かなければ一覧を空にする", async () => {
  vi.stubGlobal("fetch", async () => {
    throw new TypeError("Failed to fetch");
  });
  const { result } = renderNyushukkin();
  await waitFor(() => {
    expect(result.current.loadError).toBe("api に届きません");
  });
  expect(result.current.items).toEqual([]);
});
