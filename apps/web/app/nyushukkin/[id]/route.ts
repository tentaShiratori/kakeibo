import { relayToApi } from "../_lib/relayToApi";

type IdParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: IdParams) {
  const { id } = await params;
  return relayToApi(request, `/nyushukkin/${id}`);
}

export async function DELETE(request: Request, { params }: IdParams) {
  const { id } = await params;
  return relayToApi(request, `/nyushukkin/${id}`);
}
