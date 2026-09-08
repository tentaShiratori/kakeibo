import type { Furikaeri } from "../src/furikaeri";
import type { Nyushukkin } from "../src/nyushukkin";
import type { Waku } from "../src/waku";

export function fakeNyushukkinApi(initial: Nyushukkin[] = [], initialWaku: Waku[] = []) {
  const book = initial.map((item) => ({ ...item, wakuId: item.wakuId ?? "" }));
  const wakus = [...initialWaku];
  let seq = 0;

  const fetchImpl: typeof fetch = async (input, init) => {
    if (init?.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    const url = new URL(String(input), "http://web.test");
    const method = (init?.method ?? "GET").toUpperCase();
    const nyushukkinId = url.pathname.match(/^\/nyushukkin\/([^/]+)$/)?.[1];
    const wakuId = url.pathname.match(/^\/waku\/([^/]+)$/)?.[1];

    if (url.pathname === "/furikaeri" && method === "GET") {
      return Response.json(furikaeri(book, wakus, url.searchParams.get("month") ?? ""));
    }
    if (url.pathname === "/waku" && method === "GET") {
      return Response.json(sortedWaku(wakus));
    }
    if (url.pathname === "/waku" && method === "POST") {
      const body = JSON.parse(String(init?.body ?? "{}")) as { name?: string };
      const name = (body.name ?? "").trim();
      if (name === "") {
        return Response.json({ error: "名前を入れてください" }, { status: 400 });
      }
      if (wakus.some((item) => item.name === name)) {
        return Response.json({ error: "同じ名前の枠があります" }, { status: 400 });
      }
      seq += 1;
      const created: Waku = { id: `waku-${seq}`, name };
      wakus.push(created);
      return Response.json(created, { status: 201 });
    }
    if (wakuId && method === "PUT") {
      const index = wakus.findIndex((item) => item.id === wakuId);
      if (index < 0) {
        return Response.json({ error: "その枠はありません" }, { status: 404 });
      }
      const body = JSON.parse(String(init?.body ?? "{}")) as { name?: string };
      const name = (body.name ?? "").trim();
      if (name === "") {
        return Response.json({ error: "名前を入れてください" }, { status: 400 });
      }
      if (wakus.some((item) => item.id !== wakuId && item.name === name)) {
        return Response.json({ error: "同じ名前の枠があります" }, { status: 400 });
      }
      wakus[index] = { id: wakuId, name };
      return Response.json(wakus[index]);
    }
    if (url.pathname === "/nyushukkin" && method === "GET") {
      const month = url.searchParams.get("month") ?? "";
      return Response.json(book.filter((item) => item.date.startsWith(month)));
    }
    if (url.pathname === "/nyushukkin" && method === "POST") {
      const body = JSON.parse(String(init?.body ?? "{}")) as Omit<Nyushukkin, "id">;
      seq += 1;
      const created: Nyushukkin = { ...body, id: `id-${seq}`, wakuId: body.wakuId ?? "" };
      book.push(created);
      return Response.json(created, { status: 201 });
    }
    if (nyushukkinId && method === "PUT") {
      const index = book.findIndex((item) => item.id === nyushukkinId);
      if (index < 0) {
        return Response.json({ error: "その入出金はありません" }, { status: 404 });
      }
      const body = JSON.parse(String(init?.body ?? "{}")) as Omit<Nyushukkin, "id">;
      const next: Nyushukkin = { ...body, id: nyushukkinId, wakuId: body.wakuId ?? "" };
      book[index] = next;
      return Response.json(next);
    }
    if (nyushukkinId && method === "DELETE") {
      const index = book.findIndex((item) => item.id === nyushukkinId);
      if (index < 0) {
        return Response.json({ error: "その入出金はありません" }, { status: 404 });
      }
      const [removed] = book.splice(index, 1);
      return Response.json(removed);
    }
    return Response.json({ error: "届け先がありません" }, { status: 404 });
  };

  return { fetchImpl, book, wakus };
}

function sortedWaku(items: Waku[]): Waku[] {
  return [...items].sort((a, b) =>
    a.name === b.name ? a.id.localeCompare(b.id) : a.name.localeCompare(b.name, "ja"),
  );
}

function totals(items: Nyushukkin[]) {
  const income = items
    .filter((item) => item.kind === "収入")
    .reduce((sum, item) => sum + item.amount, 0);
  const expense = items
    .filter((item) => item.kind === "支出")
    .reduce((sum, item) => sum + item.amount, 0);
  return { income, expense, balance: income - expense };
}

function furikaeri(book: Nyushukkin[], wakus: Waku[], month: string): Furikaeri {
  const inMonth = book.filter((item) => item.date.startsWith(month));
  const known = new Set(wakus.map((item) => item.id));
  const none = inMonth.filter((item) => !known.has(item.wakuId));
  return {
    month,
    ...totals(inMonth),
    waku: sortedWaku(wakus).map((item) => ({
      id: item.id,
      name: item.name,
      ...totals(inMonth.filter((row) => row.wakuId === item.id)),
    })),
    none: totals(none),
  };
}
