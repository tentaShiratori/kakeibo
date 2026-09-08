import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { renderApp } from "../test/renderApp";
import { Field, Select, TextInput } from "./Field";

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

test("Select は選択肢を出せる", () => {
  renderApp(
    <Field label="枠" htmlFor="waku">
      <Select id="waku">
        <option value="">枠なし</option>
        <option value="w1">食費</option>
      </Select>
    </Field>,
  );
  expect(screen.getByLabelText("枠")).toBeDefined();
  expect(screen.getByRole("option", { name: "枠なし" })).toBeDefined();
  expect(screen.getByRole("option", { name: "食費" })).toBeDefined();
});

test("Select は disabled で無効", () => {
  renderApp(
    <Select aria-label="枠" disabled>
      <option value="">枠なし</option>
    </Select>,
  );
  expect(screen.getByLabelText("枠").hasAttribute("disabled")).toBe(true);
});
