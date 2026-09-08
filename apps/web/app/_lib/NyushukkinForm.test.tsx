import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { renderApp } from "../../test/renderApp";
import { NyushukkinForm } from "./NyushukkinForm";
import {
  todayJst,
  type Nyushukkin,
  type NyushukkinInput,
  type NyushukkinResult,
} from "./nyushukkin";

afterEach(() => {
  cleanup();
});

const saved: Nyushukkin = {
  id: "a",
  kind: "支出",
  amount: 5000,
  date: todayJst(),
  memo: "",
};

type RecordFn = (input: NyushukkinInput) => Promise<NyushukkinResult<Nyushukkin>>;
type CorrectFn = (id: string, input: NyushukkinInput) => Promise<NyushukkinResult<Nyushukkin>>;

function renderForm(
  props: Partial<{
    editing: Nyushukkin | null;
    onRecord: RecordFn;
    onCorrect: CorrectFn;
    onCancel: () => void;
    onSaved: (item: Nyushukkin) => void;
  }> = {},
) {
  const onRecord = vi.fn<RecordFn>(
    props.onRecord ?? (async () => ({ ok: true as const, value: saved })),
  );
  const onCorrect = vi.fn<CorrectFn>(
    props.onCorrect ?? (async () => ({ ok: true as const, value: saved })),
  );
  const onCancel = vi.fn<() => void>(props.onCancel ?? (() => {}));
  const onSaved = vi.fn<(item: Nyushukkin) => void>(props.onSaved ?? (() => {}));
  renderApp(
    <NyushukkinForm
      editing={props.editing ?? null}
      onRecord={onRecord}
      onCorrect={onCorrect}
      onCancel={onCancel}
      onSaved={onSaved}
    />,
  );
  return { onRecord, onCorrect, onCancel, onSaved };
}

test("0円は記録できない", async () => {
  const { onRecord } = renderForm();
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "0" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect((await screen.findByRole("alert")).textContent).toBe("金額は1円以上の整数円です");
  expect(onRecord).not.toHaveBeenCalled();
});

test("空の金額は記録できない", async () => {
  const { onRecord } = renderForm();
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect((await screen.findByRole("alert")).textContent).toBe("金額は1円以上の整数円です");
  expect(onRecord).not.toHaveBeenCalled();
});

test("未来の入出日は記録できない", async () => {
  const { onRecord } = renderForm();
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "100" } });
  fireEvent.change(screen.getByLabelText("入出日"), { target: { value: "2099-01-01" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect((await screen.findByRole("alert")).textContent).toBe("入出日は今日以前の日付です");
  expect(onRecord).not.toHaveBeenCalled();
});

test("記録すると onRecord と onSaved を呼ぶ", async () => {
  const { onRecord, onSaved } = renderForm();
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  await screen.findByRole("button", { name: "記録する" });
  expect(onRecord).toHaveBeenCalled();
  expect(onSaved).toHaveBeenCalledWith(saved);
});

test("直すときは onCorrect を呼ぶ", async () => {
  const { onCorrect, onRecord } = renderForm({ editing: saved });
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "3000" } });
  fireEvent.click(screen.getByRole("button", { name: "この入出金を直す" }));
  await screen.findByRole("button", { name: "この入出金を直す" });
  expect(onCorrect).toHaveBeenCalled();
  expect(onRecord).not.toHaveBeenCalled();
});

test("やめると onCancel を呼ぶ", () => {
  const { onCancel } = renderForm({ editing: saved });
  fireEvent.click(screen.getByRole("button", { name: "やめる" }));
  expect(onCancel).toHaveBeenCalled();
});

test("帳簿の失敗はアラートに出す", async () => {
  renderForm({
    onRecord: async () => ({ ok: false as const, error: "その入出金はありません" }),
  });
  fireEvent.change(screen.getByLabelText("金額"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  expect((await screen.findByRole("alert")).textContent).toBe("その入出金はありません");
});
