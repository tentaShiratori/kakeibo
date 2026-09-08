const defaultApiUrl = "http://127.0.0.1:8080";
const pathPattern = /^\/nyushukkin(?:\/[^/]+)?$/;

type RelayToApiOptions = {
  fetch?: typeof fetch;
  apiUrl?: string;
};

function apiUrl(value: string | undefined): string {
  const raw = (value ?? "").trim();
  const origin = (raw === "" ? defaultApiUrl : raw).replace(/\/+$/, "");
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    throw new Error("api の URL が読めません");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("api の URL が読めません");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("api の URL が読めません");
  }
  return origin;
}

function apiTarget(origin: string, path: string, search = ""): string {
  if (!pathPattern.test(path)) {
    throw new Error("届け先がありません");
  }
  return `${origin}${path}${search}`;
}

export async function relayToApi(
  request: Request,
  path: string,
  options: RelayToApiOptions = {},
): Promise<Response> {
  let origin: string;
  try {
    origin = apiUrl(options.apiUrl ?? process.env.KAKEIBO_API_URL);
  } catch {
    return Response.json({ error: "api の URL が読めません" }, { status: 500 });
  }

  let url: string;
  try {
    url = apiTarget(origin, path, new URL(request.url).search);
  } catch {
    return Response.json({ error: "届け先がありません" }, { status: 404 });
  }

  const headers = new Headers(request.headers);
  headers.delete("host");
  const init: RequestInit = {
    method: request.method,
    headers,
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    Object.assign(init, { duplex: "half" });
  }

  try {
    return await (options.fetch ?? fetch)(url, init);
  } catch {
    return Response.json({ error: "api に届きません" }, { status: 502 });
  }
}
