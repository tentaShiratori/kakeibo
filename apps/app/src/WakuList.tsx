import { useState } from "react";
import { Button } from "./Button";
import { Field, TextInput } from "./Field";
import { parseWakuName, type Waku } from "./waku";
import type { NyushukkinResult } from "./nyushukkin";

export function WakuList({
  items,
  onCreate,
  onRename,
}: {
  items: Waku[];
  onCreate: (name: string) => Promise<NyushukkinResult<Waku>>;
  onRename: (id: string, name: string) => Promise<NyushukkinResult<Waku>>;
}) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Waku | null>(null);
  const [error, setError] = useState("");

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">枠</h2>
      <form
        className="flex flex-col gap-3"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const parsed = parseWakuName(name);
          if (!parsed.ok) {
            setError(parsed.error);
            return;
          }
          void onCreate(parsed.value).then((saved) => {
            if (!saved.ok) {
              setError(saved.error);
              return;
            }
            setName("");
            setError("");
          });
        }}
      >
        <Field label="名前" htmlFor="waku-name">
          <TextInput
            id="waku-name"
            name="waku-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Button type="submit" className="self-start">
          枠を足す
        </Button>
      </form>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {items.length === 0 ? (
        <p className="text-sm text-muted">まだ枠がありません</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              {editing?.id === item.id ? (
                <form
                  className="flex flex-1 flex-col gap-3"
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const parsed = parseWakuName(editing.name);
                    if (!parsed.ok) {
                      setError(parsed.error);
                      return;
                    }
                    void onRename(item.id, parsed.value).then((saved) => {
                      if (!saved.ok) {
                        setError(saved.error);
                        return;
                      }
                      setEditing(null);
                      setError("");
                    });
                  }}
                >
                  <Field label="名前" htmlFor={`waku-rename-${item.id}`}>
                    <TextInput
                      id={`waku-rename-${item.id}`}
                      value={editing.name}
                      onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                    />
                  </Field>
                  <div className="flex gap-3">
                    <Button type="submit">この枠を改める</Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditing(null);
                        setError("");
                      }}
                    >
                      やめる
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <span>{item.name}</span>
                  <Button variant="ghost" onClick={() => setEditing(item)}>
                    改める
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
