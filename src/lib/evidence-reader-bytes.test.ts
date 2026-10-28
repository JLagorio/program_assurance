import { describe, it, expect } from "vitest";
import { boundedEvidenceResponse } from "./evidence-reader-bytes";
describe("evidence download byte limit", () => {
  it("returns complete bytes within the bound", async () => {
    const result = await boundedEvidenceResponse(new Response(new Uint8Array([1, 2, 3])), 3);
    expect(new Uint8Array(await result.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });
  it("stops an oversized stream even when the size header understates it", async () => {
    let cancelled = false;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(4));
        controller.enqueue(new Uint8Array(4));
      },
      cancel() {
        cancelled = true;
      },
    });
    await expect(
      boundedEvidenceResponse(new Response(stream, { headers: { "content-length": "1" } }), 5),
    ).rejects.toThrow("too large");
    expect(cancelled).toBe(true);
  });
  it("rejects a declared oversized response without reading its body", async () => {
    let cancelled = false;
    const stream = new ReadableStream({
      cancel() {
        cancelled = true;
      },
    });
    await expect(
      boundedEvidenceResponse(new Response(stream, { headers: { "content-length": "20" } }), 5),
    ).rejects.toThrow("too large");
    expect(cancelled).toBe(true);
  });
  it("preserves storage errors for the caller", async () => {
    const response = new Response("Denied", { status: 403 });
    expect(await boundedEvidenceResponse(response, 1)).toBe(response);
  });
});
