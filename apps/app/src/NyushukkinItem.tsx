import type { ReactNode } from "react";
import type { Nyushukkin } from "./nyushukkin";
import { yen } from "./yen";

export function NyushukkinItem({
  item,
  wakuName,
  children,
}: {
  item: Nyushukkin;
  wakuName?: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="flex flex-col gap-0.5 text-sm">
        <span className={`tabular-nums ${item.kind === "収入" ? "text-income" : "text-expense"}`}>
          {item.date} {item.kind} {yen(item.amount)}
        </span>
        {item.memo ? <span className="text-muted">{item.memo}</span> : null}
        {wakuName ? <span className="text-muted">{wakuName}</span> : null}
      </div>
      <div className="flex gap-3 text-sm">{children}</div>
    </li>
  );
}
