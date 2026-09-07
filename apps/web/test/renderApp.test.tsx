import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { renderApp } from "./renderApp";

afterEach(() => {
  cleanup();
});

test("子を描画する", () => {
  renderApp(<p>家計簿</p>);
  expect(screen.getByText("家計簿")).toBeDefined();
});

test("空の要素も描画できる", () => {
  const view = renderApp(<div />);
  expect(view.container.querySelector("div")).toBeDefined();
});

test("container を渡せる", () => {
  const container = document.createElement("section");
  document.body.append(container);
  renderApp(<p>家計簿</p>, { container });
  expect(container.textContent).toBe("家計簿");
  container.remove();
});
