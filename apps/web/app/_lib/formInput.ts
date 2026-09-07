import type { Nyushukkin, NyushukkinInput } from "./nyushukkin";

const fieldOrder = ["kind", "amount", "date", "memo"] as const;

export function emptyInput(today: string): NyushukkinInput {
  return {
    kind: "支出",
    amount: "",
    date: today,
    memo: "",
  };
}

function issueMessage(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (!Array.isArray(value) || value.length === 0) {
    return "";
  }
  const first = value[0];
  if (typeof first === "string") {
    return first;
  }
  if (
    first &&
    typeof first === "object" &&
    "message" in first &&
    typeof first.message === "string"
  ) {
    return first.message;
  }
  return "";
}

export function firstSubmitError(onSubmit: unknown): string {
  if (!onSubmit) {
    return "";
  }
  if (typeof onSubmit === "string") {
    return onSubmit;
  }
  if (typeof onSubmit !== "object") {
    return "";
  }
  const grouped = onSubmit as Record<string, unknown>;
  for (const key of fieldOrder) {
    const message = issueMessage(grouped[key]);
    if (message) {
      return message;
    }
  }
  for (const value of Object.values(grouped)) {
    const message = issueMessage(value);
    if (message) {
      return message;
    }
  }
  return "";
}

export function valuesFromEditing(editing: Nyushukkin | null, today: string): NyushukkinInput {
  if (!editing) {
    return emptyInput(today);
  }
  return {
    kind: editing.kind,
    amount: String(editing.amount),
    date: editing.date,
    memo: editing.memo,
  };
}
