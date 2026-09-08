import { relayToApi } from "./_lib/relayToApi";

export function GET(request: Request) {
  return relayToApi(request, "/nyushukkin");
}

export function POST(request: Request) {
  return relayToApi(request, "/nyushukkin");
}
