import type { Nyushukkin } from "../app/_lib/nyushukkin";

export function fakeNyushukkinApi(initial: Nyushukkin[] = []) {
  const book = [...initial];
  let seq = 0;

  const fetchImpl: typeof fetch = async (input, init) => {
    if (init?.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    const url = new URL(String(input), "http://web.test");
    const method = (init?.method ?? "GET").toUpperCase();
    const id = url.pathname.match(/^\/nyushukkin\/([^/]+)$/)?.[1];

    if (url.pathname === "/nyushukkin" && method === "GET") {
      const month = url.searchParams.get("month") ?? "";
      return Response.json(book.filter((item) => item.date.startsWith(month)));
    }
    if (url.pathname === "/nyushukkin" && method === "POST") {
      const body = JSON.parse(String(init?.body ?? "{}")) as Omit<Nyushukkin, "id">;
      seq += 1;
      const created: Nyushukkin = { ...body, id: `id-${seq}` };
      book.push(created);
      return Response.json(created, { status: 201 });
    }
    if (id && method === "PUT") {
      const index = book.findIndex((item) => item.id === id);
      if (index < 0) {
        return Response.json({ error: "その入出金はありません" }, { status: 404 });
      }
      const body = JSON.parse(String(init?.body ?? "{}")) as Omit<Nyushukkin, "id">;
      const next: Nyushukkin = { ...body, id };
      book[index] = next;
      return Response.json(next);
    }
    if (id && method === "DELETE") {
      const index = book.findIndex((item) => item.id === id);
      if (index < 0) {
        return Response.json({ error: "その入出金はありません" }, { status: 404 });
      }
      const [removed] = book.splice(index, 1);
      return Response.json(removed);
    }
    return Response.json({ error: "届け先がありません" }, { status: 404 });
  };

  return { fetchImpl, book };
}
