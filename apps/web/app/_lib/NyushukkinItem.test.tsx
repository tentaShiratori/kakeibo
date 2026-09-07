import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { NyushukkinItem } from "./NyushukkinItem";

afterEach(() => {
  cleanup();
});

test("日付と種類と金額を出す", () => {
  render(
    <ul>
      <NyushukkinItem item={{ id: "a", kind: "支出", amount: 5000, date: "2026-09-07", memo: "" }}>
        操作
      </NyushukkinItem>
    </ul>,
  );
  expect(screen.getByText("2026-09-07 支出 5,000円")).toBeDefined();
  expect(screen.getByText("操作")).toBeDefined();
});

test("メモがあれば出す", () => {
  render(
    <ul>
      <NyushukkinItem
        item={{ id: "a", kind: "収入", amount: 100, date: "2026-09-01", memo: "給料" }}
      >
        操作
      </NyushukkinItem>
    </ul>,
  );
  expect(screen.getByText("給料")).toBeDefined();
});

test("メモが空なら出さない", () => {
  render(
    <ul>
      <NyushukkinItem item={{ id: "a", kind: "支出", amount: 1, date: "2026-09-07", memo: "" }}>
        操作
      </NyushukkinItem>
    </ul>,
  );
  expect(screen.queryByText("給料")).toBeNull();
  expect(screen.getByText("2026-09-07 支出 1円")).toBeDefined();
});
