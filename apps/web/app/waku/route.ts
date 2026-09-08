import { relayToApi } from "../nyushukkin/_lib/relayToApi";

export function GET(request: Request) {
  return relayToApi(request, "/waku");
}

export function POST(request: Request) {
  return relayToApi(request, "/waku");
}
