import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { Ledger } from "./ledger";
import {
  calendarMonth,
  formatCalendarMonth,
  serializeStored,
  shiftCalendarMonth,
  todayJst,
} from "./nyushukkin";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  window.localStorage.clear();
});

test("入出金が無いときは空だと分かる", () => {
  render(<Ledger />);
  expect(screen.getByText("まだ入出金がありません")).toBeDefined();
});

test("壊れた保存はひとつ前の帳簿を出す", () => {
  const today = todayJst();
  window.localStorage.setItem(
    "kakeibo.nyushukkin.bak",
    serializeStored([{ id: "a", kind: "支出", amount: 5000, date: today, memo: "" }]),
  );
  window.localStorage.setItem("kakeibo.nyushukkin", "nope");
  render(<Ledger />);
  expect(screen.getByText(`${today} 支出 5,000円`)).toBeDefined();
});

test("初めての記録が壊れても残る", async () => {
  render(<Ledger />);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  await screen.findByText(`${todayJst()} 支出 5,000円`);
  window.localStorage.setItem("kakeibo.nyushukkin", "nope");
  cleanup();
  render(<Ledger />);
  expect(screen.getByText(`${todayJst()} 支出 5,000円`)).toBeDefined();
});

test("金額と入出日で支出を記録できる", async () => {
  render(<Ledger />);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect(await screen.findByText(`${todayJst()} 支出 5,000円`)).toBeDefined();
  expect(screen.getByText("5,000円", { selector: "dd" })).toBeDefined();
});

test("0円は記録できない", async () => {
  render(<Ledger />);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "0" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect((await screen.findByRole("alert")).textContent).toBe("金額は1円以上の整数円です");
  expect(screen.getByText("まだ入出金がありません")).toBeDefined();
});

test("空の金額は記録できない", async () => {
  render(<Ledger />);
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect((await screen.findByRole("alert")).textContent).toBe("金額は1円以上の整数円です");
  expect(screen.getByText("まだ入出金がありません")).toBeDefined();
});

test("未来の入出日は記録できない", async () => {
  render(<Ledger />);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "100" } });
  fireEvent.change(screen.getByLabelText("入出日"), { target: { value: "2099-01-01" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect((await screen.findByRole("alert")).textContent).toBe("入出日は今日以前の日付です");
  expect(screen.getByText("まだ入出金がありません")).toBeDefined();
});

test("収入を記録できる", async () => {
  render(<Ledger />);
  fireEvent.click(screen.getByLabelText("収入"));
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "200000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect(await screen.findByText(`${todayJst()} 収入 200,000円`)).toBeDefined();
  expect(screen.getByText("収入", { selector: "dt" }).parentElement?.querySelector("dd")?.textContent).toBe(
    "200,000円",
  );
});

test("同じ入出金を直せる", async () => {
  render(<Ledger />);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  fireEvent.click(await screen.findByRole("button", { name: "直す" }));
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "3000" } });
  fireEvent.click(screen.getByRole("button", { name: "この入出金を直す" }));
  expect(await screen.findByText(`${todayJst()} 支出 3,000円`)).toBeDefined();
  expect(screen.queryByText(`${todayJst()} 支出 5,000円`)).toBeNull();
});

test("入出金を消せる", async () => {
  render(<Ledger />);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  fireEvent.click(await screen.findByRole("button", { name: "消す" }));
  expect(screen.getByText("まだ入出金がありません")).toBeDefined();
});

test("消した入出金を戻せる", async () => {
  render(<Ledger />);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  fireEvent.click(await screen.findByRole("button", { name: "消す" }));
  fireEvent.click(screen.getByRole("button", { name: "消した入出金を戻す" }));
  expect(screen.getByText(`${todayJst()} 支出 5,000円`)).toBeDefined();
  expect(screen.queryByRole("button", { name: "消した入出金を戻す" })).toBeNull();
});

test("戻すと入出日の月へ移る", async () => {
  const lastMonth = shiftCalendarMonth(calendarMonth(todayJst()), -1);
  const pastDate = `${lastMonth}-15`;
  render(<Ledger />);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "1200" } });
  fireEvent.change(screen.getByLabelText("入出日"), { target: { value: pastDate } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  fireEvent.click(await screen.findByRole("button", { name: "消す" }));
  fireEvent.click(screen.getByRole("button", { name: "次の月" }));
  fireEvent.click(screen.getByRole("button", { name: "消した入出金を戻す" }));
  expect(screen.getByText(`${formatCalendarMonth(lastMonth)}の収支`)).toBeDefined();
  expect(screen.getByText(`${pastDate} 支出 1,200円`)).toBeDefined();
});

test("記録したあと金額に戻り続けて書ける", async () => {
  render(<Ledger />);
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

test("一覧と収支は見ている暦月だけにする", () => {
  const today = todayJst();
  const thisMonth = calendarMonth(today);
  const lastMonth = shiftCalendarMonth(thisMonth, -1);
  window.localStorage.setItem(
    "kakeibo.nyushukkin",
    serializeStored([
      { id: "now", kind: "支出", amount: 5000, date: today, memo: "" },
      { id: "past", kind: "支出", amount: 1200, date: `${lastMonth}-15`, memo: "" },
    ]),
  );
  render(<Ledger />);
  expect(screen.getByText(`${formatCalendarMonth(thisMonth)}の収支`)).toBeDefined();
  expect(screen.getByText(`${today} 支出 5,000円`)).toBeDefined();
  expect(screen.queryByText(`${lastMonth}-15 支出 1,200円`)).toBeNull();
  expect(screen.getByText("5,000円", { selector: "dd" })).toBeDefined();
});

test("前の月の入出金と収支を見られる", () => {
  const today = todayJst();
  const thisMonth = calendarMonth(today);
  const lastMonth = shiftCalendarMonth(thisMonth, -1);
  window.localStorage.setItem(
    "kakeibo.nyushukkin",
    serializeStored([
      { id: "now", kind: "支出", amount: 5000, date: today, memo: "" },
      { id: "past", kind: "支出", amount: 1200, date: `${lastMonth}-15`, memo: "" },
    ]),
  );
  render(<Ledger />);
  fireEvent.click(screen.getByRole("button", { name: "前の月" }));
  expect(screen.getByText(`${formatCalendarMonth(lastMonth)}の収支`)).toBeDefined();
  expect(screen.getByText(`${lastMonth}-15 支出 1,200円`)).toBeDefined();
  expect(screen.queryByText(`${today} 支出 5,000円`)).toBeNull();
  expect(screen.getByText("1,200円", { selector: "dd" })).toBeDefined();
});

test("今の月より先には行けない", () => {
  render(<Ledger />);
  expect((screen.getByRole("button", { name: "次の月" }) as HTMLButtonElement).disabled).toBe(true);
});

test("記録した入出日の月へ移る", async () => {
  const lastMonth = shiftCalendarMonth(calendarMonth(todayJst()), -1);
  const pastDate = `${lastMonth}-15`;
  render(<Ledger />);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "1200" } });
  fireEvent.change(screen.getByLabelText("入出日"), { target: { value: pastDate } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect(await screen.findByText(`${formatCalendarMonth(lastMonth)}の収支`)).toBeDefined();
  expect(screen.getByText(`${pastDate} 支出 1,200円`)).toBeDefined();
});

test("他の月にだけ入出金があるときはこの月が空だと分かる", () => {
  const lastMonth = shiftCalendarMonth(calendarMonth(todayJst()), -1);
  window.localStorage.setItem(
    "kakeibo.nyushukkin",
    serializeStored([{ id: "past", kind: "支出", amount: 1200, date: `${lastMonth}-15`, memo: "" }]),
  );
  render(<Ledger />);
  expect(screen.getByText("この月の入出金はまだありません")).toBeDefined();
  expect(screen.queryByText("まだ入出金がありません")).toBeNull();
});
