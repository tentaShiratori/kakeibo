import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { renderApp } from "../test/renderApp";
import { Field, TextInput } from "./Field";

afterEach(() => {
  cleanup();
});

test("ラベルと入力が紐づく", () => {
  renderApp(
    <Field label="金額" htmlFor="amount">
      <TextInput id="amount" />
    </Field>,
  );
  expect(screen.getByLabelText("金額")).toBeDefined();
});

test("ラベルが空でも入力は出せる", () => {
  renderApp(
    <Field label="" htmlFor="amount">
      <TextInput id="amount" aria-label="金額" />
    </Field>,
  );
  expect(screen.getByLabelText("金額")).toBeDefined();
});

test("TextInput は値を出せる", () => {
  renderApp(<TextInput aria-label="メモ" value="米" onChange={() => {}} />);
  expect(screen.getByLabelText("メモ").getAttribute("value")).toBe("米");
});

test("TextInput は disabled で無効", () => {
  renderApp(<TextInput aria-label="金額" disabled />);
  expect(screen.getByLabelText("金額").hasAttribute("disabled")).toBe(true);
});
