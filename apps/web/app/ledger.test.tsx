import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { Ledger } from "./ledger";
import { todayJst } from "./nyushukkin";

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

test("金額と入出日で支出を記録できる", () => {
  render(<Ledger />);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect(screen.getByText(`${todayJst()} 支出 5,000円`)).toBeDefined();
  expect(screen.getByText("5,000円", { selector: "dd" })).toBeDefined();
});

test("0円は記録できない", () => {
  render(<Ledger />);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "0" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect(screen.getByRole("alert").textContent).toBe("金額は1円以上の整数円です");
  expect(screen.getByText("まだ入出金がありません")).toBeDefined();
});

test("同じ入出金を直せる", () => {
  render(<Ledger />);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  fireEvent.click(screen.getByRole("button", { name: "直す" }));
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "3000" } });
  fireEvent.click(screen.getByRole("button", { name: "この入出金を直す" }));
  expect(screen.getByText(`${todayJst()} 支出 3,000円`)).toBeDefined();
  expect(screen.queryByText(`${todayJst()} 支出 5,000円`)).toBeNull();
});

test("入出金を消せる", () => {
  render(<Ledger />);
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  fireEvent.click(screen.getByRole("button", { name: "消す" }));
  expect(screen.getByText("まだ入出金がありません")).toBeDefined();
});
