/** Bound actual streamed bytes, including a response with an absent or incorrect size header. */
export const MAX_READER_BYTES = 50 * 1024 * 1024;
export async function boundedEvidenceResponse(response: Response, limit = MAX_READER_BYTES) {
  if (!response.ok || !response.body) return response;
  const failure = () => new Error("This file is too large for the reader (50 MiB maximum).");
  if (Number(response.headers.get("content-length")) > limit) {
    await response.body.cancel();
    throw failure();
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let length = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw failure();
      }
      chunks.push(new Uint8Array(next.value));
    }
  } finally {
    reader.releaseLock();
  }
  return new Response(new Blob(chunks), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
