import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { renderApp } from "../../test/renderApp";
import { Button } from "./Button";

afterEach(() => {
  cleanup();
});

test("子をボタンとして出す", () => {
  renderApp(<Button>記録する</Button>);
  expect(screen.getByRole("button", { name: "記録する" })).toBeDefined();
});

test("既定の type は button", () => {
  renderApp(<Button>やめる</Button>);
  expect(screen.getByRole("button", { name: "やめる" }).getAttribute("type")).toBe("button");
});

test("submit を渡せる", () => {
  renderApp(<Button type="submit">記録する</Button>);
  expect(screen.getByRole("button", { name: "記録する" }).getAttribute("type")).toBe("submit");
});

test("ghost でもボタンとして出せる", () => {
  renderApp(<Button variant="ghost">直す</Button>);
  expect(screen.getByRole("button", { name: "直す" })).toBeDefined();
});

test("押すと onClick を呼ぶ", () => {
  const onClick = vi.fn<() => void>();
  renderApp(<Button onClick={onClick}>前の月</Button>);
  fireEvent.click(screen.getByRole("button", { name: "前の月" }));
  expect(onClick).toHaveBeenCalled();
});

test("disabled のときは無効", () => {
  renderApp(<Button disabled>次の月</Button>);
  expect(screen.getByRole("button", { name: "次の月" }).hasAttribute("disabled")).toBe(true);
});
