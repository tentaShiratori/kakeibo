import * as v from "valibot";
import type { NyushukkinResult } from "./nyushukkin";

export type Waku = {
  id: string;
  name: string;
};

const nameError = "名前を入れてください";

export function wakuNameSchema() {
  return v.pipe(v.string(), v.trim(), v.minLength(1, nameError));
}

export function parseWakuName(raw: string): NyushukkinResult<string> {
  const parsed = v.safeParse(wakuNameSchema(), raw);
  if (parsed.success) {
    return { ok: true, value: parsed.output };
  }
  return { ok: false, error: parsed.issues[0].message };
}
