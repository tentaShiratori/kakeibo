import type { ReactNode } from "react";
import type { Nyushukkin } from "./nyushukkin";
import { yen } from "./yen";

export function NyushukkinItem({ item, children }: { item: Nyushukkin; children: ReactNode }) {
  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="flex flex-col gap-0.5 text-sm">
        <span>
          {item.date} {item.kind} {yen(item.amount)}
        </span>
        {item.memo ? <span className="text-zinc-500">{item.memo}</span> : null}
      </div>
      <div className="flex gap-3 text-sm">{children}</div>
    </li>
  );
}
