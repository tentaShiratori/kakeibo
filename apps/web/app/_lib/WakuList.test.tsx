import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { renderApp } from "../../test/renderApp";
import { WakuList } from "./WakuList";
import type { Waku } from "./waku";
import type { NyushukkinResult } from "./nyushukkin";

afterEach(() => {
  cleanup();
});

test("空のときは枠が無いと分かる", () => {
  renderApp(
    <WakuList
      items={[]}
      onCreate={async () => ({ ok: true, value: { id: "w1", name: "食費" } })}
      onRename={async () => ({ ok: true, value: { id: "w1", name: "食費" } })}
    />,
  );
  expect(screen.getByText("まだ枠がありません")).toBeDefined();
});

test("名前を足せる", async () => {
  const onCreate = vi.fn<(name: string) => Promise<NyushukkinResult<Waku>>>(async (name) => ({
    ok: true,
    value: { id: "w1", name },
  }));
  renderApp(
    <WakuList
      items={[]}
      onCreate={onCreate}
      onRename={async () => ({ ok: true, value: { id: "w1", name: "食費" } })}
    />,
  );
  fireEvent.change(screen.getByLabelText("名前"), { target: { value: "食費" } });
  fireEvent.click(screen.getByRole("button", { name: "枠を足す" }));
  expect(onCreate).toHaveBeenCalledWith("食費");
});

test("空の名前は足せない", async () => {
  const onCreate = vi.fn<(name: string) => Promise<NyushukkinResult<Waku>>>();
  renderApp(
    <WakuList
      items={[]}
      onCreate={onCreate}
      onRename={async () => ({ ok: true, value: { id: "w1", name: "食費" } })}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "枠を足す" }));
  expect((await screen.findByRole("alert")).textContent).toBe("名前を入れてください");
  expect(onCreate).not.toHaveBeenCalled();
});

test("名前を改められる", async () => {
  const onRename = vi.fn<(id: string, name: string) => Promise<NyushukkinResult<Waku>>>(
    async (id, name) => ({ ok: true, value: { id, name } }),
  );
  renderApp(
    <WakuList
      items={[{ id: "w1", name: "食費" }]}
      onCreate={async () => ({ ok: true, value: { id: "w1", name: "食費" } })}
      onRename={onRename}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "改める" }));
  fireEvent.change(screen.getAllByLabelText("名前")[1] as HTMLInputElement, {
    target: { value: "日用品" },
  });
  fireEvent.click(screen.getByRole("button", { name: "この枠を改める" }));
  expect(onRename).toHaveBeenCalledWith("w1", "日用品");
});
