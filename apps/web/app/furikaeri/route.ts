import { relayToApi } from "../nyushukkin/_lib/relayToApi";

export function GET(request: Request) {
  return relayToApi(request, "/furikaeri");
}
