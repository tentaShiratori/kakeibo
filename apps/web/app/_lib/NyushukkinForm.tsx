"use client";

import { useForm } from "@tanstack/react-form";
import { useRef, useState } from "react";
import { Button } from "./Button";
import { Field, TextInput } from "./Field";
import { emptyInput, firstSubmitError, valuesFromEditing } from "./formInput";
import {
  kinds,
  nyushukkinInputSchema,
  todayJst,
  type Nyushukkin,
  type NyushukkinInput,
  type NyushukkinResult,
} from "./nyushukkin";

export function NyushukkinForm({
  editing,
  onRecord,
  onCorrect,
  onCancel,
  onSaved,
}: {
  editing: Nyushukkin | null;
  onRecord: (input: NyushukkinInput) => NyushukkinResult<Nyushukkin>;
  onCorrect: (id: string, input: NyushukkinInput) => NyushukkinResult<Nyushukkin>;
  onCancel: () => void;
  onSaved: (item: Nyushukkin) => void;
}) {
  const today = todayJst();
  const amountRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const form = useForm({
    defaultValues: valuesFromEditing(editing, today),
    canSubmitWhenInvalid: true,
    validators: {
      onSubmit: nyushukkinInputSchema(today),
    },
    onSubmitInvalid: ({ formApi }) => {
      setError(firstSubmitError(formApi.state.errorMap.onSubmit));
    },
    onSubmit: ({ value }) => {
      const recorded = editing ? onCorrect(editing.id, value) : onRecord(value);
      if (!recorded.ok) {
        setError(recorded.error);
        return;
      }
      form.reset(emptyInput(today));
      setError("");
      onSaved(recorded.value);
      amountRef.current?.focus();
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setError("");
        void form.handleSubmit();
      }}
    >
      <form.Field name="amount">
        {(field) => (
          <Field label="金額" htmlFor="nyushukkin-amount">
            <TextInput
              ref={amountRef}
              id="nyushukkin-amount"
              inputMode="numeric"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          </Field>
        )}
      </form.Field>
      <form.Field name="date">
        {(field) => (
          <Field label="入出日" htmlFor="nyushukkin-date">
            <TextInput
              id="nyushukkin-date"
              type="date"
              name={field.name}
              max={today}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          </Field>
        )}
      </form.Field>
      <form.Field name="kind">
        {(field) => (
          <fieldset className="flex gap-4">
            <legend className="mb-1 text-sm font-medium">種類</legend>
            {kinds.map((kind) => (
              <label key={kind} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={field.name}
                  value={kind}
                  checked={field.state.value === kind}
                  onBlur={field.handleBlur}
                  onChange={() => field.handleChange(kind)}
                />
                {kind}
              </label>
            ))}
          </fieldset>
        )}
      </form.Field>
      <form.Field name="memo">
        {(field) => (
          <Field label="メモ" htmlFor="nyushukkin-memo">
            <TextInput
              id="nyushukkin-memo"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          </Field>
        )}
      </form.Field>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button type="submit">{editing ? "この入出金を直す" : "記録する"}</Button>
        {editing ? (
          <Button
            variant="ghost"
            onClick={() => {
              onCancel();
              amountRef.current?.focus();
            }}
          >
            やめる
          </Button>
        ) : null}
      </div>
    </form>
  );
}
