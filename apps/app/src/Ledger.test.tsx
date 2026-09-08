import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { fakeNyushukkinApi } from "../test/fakeNyushukkinApi";
import { renderApp } from "../test/renderApp";
import { Ledger } from "./Ledger";
import { calendarMonth, formatCalendarMonth, shiftCalendarMonth, todayJst } from "./nyushukkin";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  const { fetchImpl } = fakeNyushukkinApi();
  vi.stubGlobal("fetch", fetchImpl);
});

function renderLedger() {
  return renderApp(<Ledger />);
}

test("入出金が無いときは空だと分かる", async () => {
  renderLedger();
  expect(await screen.findByText("まだ入出金がありません")).toBeDefined();
});

test("金額と入出日で支出を記録できる", async () => {
  renderLedger();
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect(await screen.findByText(`${todayJst()} 支出 5,000円`)).toBeDefined();
  expect(screen.getAllByText("5,000円", { selector: "dd" }).length).toBeGreaterThan(0);
});

test("収入を記録できる", async () => {
  renderLedger();
  fireEvent.click(screen.getByLabelText("収入"));
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "200000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect(await screen.findByText(`${todayJst()} 収入 200,000円`)).toBeDefined();
  expect(
    screen.getAllByText("収入", { selector: "dt" })[0]?.parentElement?.querySelector("dd")
      ?.textContent,
  ).toBe("200,000円");
});

test("同じ入出金を直せる", async () => {
  renderLedger();
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  fireEvent.click(await screen.findByRole("button", { name: "直す" }));
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "3000" } });
  fireEvent.click(screen.getByRole("button", { name: "この入出金を直す" }));
  expect(await screen.findByText(`${todayJst()} 支出 3,000円`)).toBeDefined();
  expect(screen.queryByText(`${todayJst()} 支出 5,000円`)).toBeNull();
});

test("入出金を消せる", async () => {
  renderLedger();
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  fireEvent.click(await screen.findByRole("button", { name: "消す" }));
  expect(await screen.findByText("まだ入出金がありません")).toBeDefined();
});

test("消した入出金を戻せる", async () => {
  renderLedger();
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  fireEvent.click(await screen.findByRole("button", { name: "消す" }));
  fireEvent.click(await screen.findByRole("button", { name: "消した入出金を戻す" }));
  expect(await screen.findByText(`${todayJst()} 支出 5,000円`)).toBeDefined();
  expect(screen.queryByRole("button", { name: "消した入出金を戻す" })).toBeNull();
});

test("戻すと入出日の月へ移る", async () => {
  const lastMonth = shiftCalendarMonth(calendarMonth(todayJst()), -1);
  const pastDate = `${lastMonth}-15`;
  renderLedger();
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "1200" } });
  fireEvent.change(screen.getByLabelText("入出日"), { target: { value: pastDate } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  fireEvent.click(await screen.findByRole("button", { name: "消す" }));
  fireEvent.click(await screen.findByRole("button", { name: "次の月" }));
  fireEvent.click(await screen.findByRole("button", { name: "消した入出金を戻す" }));
  expect(await screen.findByText(`${pastDate} 支出 1,200円`)).toBeDefined();
  expect(screen.getByText(`${formatCalendarMonth(lastMonth)}の収支`)).toBeDefined();
});

test("記録したあと金額に戻り続けて書ける", async () => {
  renderLedger();
  const amount = screen.getByLabelText("金額");
  fireEvent.change(amount, { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  await waitFor(() => {
    expect(amount).toBe(document.activeElement);
    expect((amount as HTMLInputElement).value).toBe("");
  });
  fireEvent.change(amount, { target: { value: "800" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect(await screen.findByText(`${todayJst()} 支出 5,000円`)).toBeDefined();
  expect(await screen.findByText(`${todayJst()} 支出 800円`)).toBeDefined();
});

test("一覧と収支は見ている暦月だけにする", async () => {
  const today = todayJst();
  const thisMonth = calendarMonth(today);
  const lastMonth = shiftCalendarMonth(thisMonth, -1);
  renderLedger();
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  await screen.findByText(`${today} 支出 5,000円`);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "1200" } });
  fireEvent.change(screen.getByLabelText("入出日"), { target: { value: `${lastMonth}-15` } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect(await screen.findByText(`${formatCalendarMonth(lastMonth)}の収支`)).toBeDefined();
  expect(screen.getByText(`${lastMonth}-15 支出 1,200円`)).toBeDefined();
  expect(screen.queryByText(`${today} 支出 5,000円`)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "次の月" }));
  expect(await screen.findByText(`${today} 支出 5,000円`)).toBeDefined();
  expect(screen.queryByText(`${lastMonth}-15 支出 1,200円`)).toBeNull();
  expect(screen.getAllByText("5,000円", { selector: "dd" }).length).toBeGreaterThan(0);
});

test("前の月の入出金と収支を見られる", async () => {
  const today = todayJst();
  const thisMonth = calendarMonth(today);
  const lastMonth = shiftCalendarMonth(thisMonth, -1);
  renderLedger();
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  await screen.findByText(`${today} 支出 5,000円`);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "1200" } });
  fireEvent.change(screen.getByLabelText("入出日"), { target: { value: `${lastMonth}-15` } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect(await screen.findByText(`${formatCalendarMonth(lastMonth)}の収支`)).toBeDefined();
  expect(screen.getByText(`${lastMonth}-15 支出 1,200円`)).toBeDefined();
  expect(screen.queryByText(`${today} 支出 5,000円`)).toBeNull();
  expect(screen.getAllByText("1,200円", { selector: "dd" }).length).toBeGreaterThan(0);
});

test("今の月より先には行けない", () => {
  renderLedger();
  expect((screen.getByRole("button", { name: "次の月" }) as HTMLButtonElement).disabled).toBe(true);
});

test("記録した入出日の月へ移る", async () => {
  const lastMonth = shiftCalendarMonth(calendarMonth(todayJst()), -1);
  const pastDate = `${lastMonth}-15`;
  renderLedger();
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "1200" } });
  fireEvent.change(screen.getByLabelText("入出日"), { target: { value: pastDate } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect(await screen.findByText(`${formatCalendarMonth(lastMonth)}の収支`)).toBeDefined();
  expect(screen.getByText(`${pastDate} 支出 1,200円`)).toBeDefined();
});

test("他の月にだけ入出金があるときはこの月が空だと分かる", async () => {
  const lastMonth = shiftCalendarMonth(calendarMonth(todayJst()), -1);
  renderLedger();
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "1200" } });
  fireEvent.change(screen.getByLabelText("入出日"), { target: { value: `${lastMonth}-15` } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  await screen.findByText(`${lastMonth}-15 支出 1,200円`);
  fireEvent.click(screen.getByRole("button", { name: "次の月" }));
  expect(await screen.findByText("この月の入出金はまだありません")).toBeDefined();
  expect(screen.queryByText("まだ入出金がありません")).toBeNull();
});

test("枠の名前を足して一件に付けられる", async () => {
  renderLedger();
  fireEvent.change(screen.getByLabelText("名前"), { target: { value: "食費" } });
  fireEvent.click(screen.getByRole("button", { name: "枠を足す" }));
  expect((await screen.findAllByText("食費")).length).toBeGreaterThan(0);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.change(screen.getByLabelText("枠"), { target: { value: "waku-1" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect(await screen.findByText(`${todayJst()} 支出 5,000円`)).toBeDefined();
  expect(screen.getByText(`${todayJst()} 支出 5,000円`).closest("li")?.textContent).toContain(
    "食費",
  );
  expect(screen.getAllByText("枠なし").length).toBeGreaterThan(0);
});
