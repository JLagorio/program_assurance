import { describe, expect, it } from "vitest";
import {
  StorageUploadError,
  objectAddress,
  uploadObject,
  type UploadTransport,
} from "./storage-upload";

/** A request that records what it was given and answers when the test says. */
function fakeTransport() {
  const sent: { method?: string; url?: string; headers: Record<string, string>; body?: unknown } = {
    headers: {},
  };
  const xhr = {
    status: 0,
    responseText: "",
    timeout: 0,
    upload: { onprogress: null as XMLHttpRequestUpload["onprogress"] },
    onload: null,
    onerror: null,
    ontimeout: null,
    onabort: null,
    open(method: string, url: string) {
      sent.method = method;
      sent.url = url;
    },
    setRequestHeader(name: string, value: string) {
      sent.headers[name] = value;
    },
    send(body: unknown) {
      sent.body = body;
    },
    abort() {
      xhr.onabort?.call(undefined as never, {} as ProgressEvent);
    },
  } as unknown as UploadTransport & { status: number; responseText: string };
  const progress = (loaded: number, total: number) =>
    xhr.upload.onprogress?.call(
      xhr.upload as never,
      {
        loaded,
        total,
        lengthComputable: true,
      } as ProgressEvent,
    );
  const answer = (status: number, body: unknown) => {
    Object.assign(xhr, { status, responseText: JSON.stringify(body) });
    xhr.onload?.call(undefined as never, {} as ProgressEvent);
  };
  return { xhr, sent, progress, answer };
}

const request = {
  url: "http://127.0.0.1:54321/",
  apiKey: "anon",
  token: "session",
  bucket: "evidence",
  path: "tenant/artifact/version/report.pdf",
  file: new Blob(["x".repeat(1000)], { type: "application/pdf" }),
};

describe("an evidence upload that reports its progress", () => {
  it("posts the file as the reader, never overwriting, to the object's address", async () => {
    const { xhr, sent, answer } = fakeTransport();
    const uploading = uploadObject(request, { transport: () => xhr, timeout: 60_000 });
    expect(sent.method).toBe("POST");
    expect(sent.url).toBe(
      "http://127.0.0.1:54321/storage/v1/object/evidence/tenant/artifact/version/report.pdf",
    );
    expect(sent.headers).toEqual({
      Authorization: "Bearer session",
      apikey: "anon",
      "x-upsert": "false",
    });
    expect(xhr.timeout).toBe(60_000);
    const form = sent.body as FormData;
    expect(form.get("cacheControl")).toBe("3600");
    expect((form.get("") as Blob).size).toBe(1000);
    answer(200, { Id: "object-1", Key: "evidence/tenant/artifact/version/report.pdf" });
    await expect(uploading).resolves.toEqual({
      id: "object-1",
      key: "evidence/tenant/artifact/version/report.pdf",
    });
  });

  it("reports the bytes sent, then every byte once Storage confirms", async () => {
    const { xhr, progress, answer } = fakeTransport();
    const seen: number[] = [];
    const uploading = uploadObject(request, {
      transport: () => xhr,
      onProgress: ({ loaded, total }) => seen.push(Math.round((loaded / total) * 100)),
    });
    progress(250, 1000);
    progress(1000, 1000);
    answer(200, { Id: "object-1", Key: "k" });
    await uploading;
    expect(seen).toEqual([25, 100, 100]);
  });

  it("rejects with Storage's own words and status when it refuses", async () => {
    const { xhr, answer } = fakeTransport();
    const uploading = uploadObject(request, { transport: () => xhr });
    answer(409, { statusCode: "409", error: "Duplicate", message: "The resource already exists" });
    await expect(uploading).rejects.toBeInstanceOf(StorageUploadError);
    await expect(uploading).rejects.toMatchObject({
      status: 409,
      message: "The resource already exists",
    });
  });

  it("stops the transfer when the reader cancels", async () => {
    const { xhr } = fakeTransport();
    const controller = new AbortController();
    const uploading = uploadObject(request, { transport: () => xhr, signal: controller.signal });
    controller.abort();
    await expect(uploading).rejects.toMatchObject({ name: "AbortError" });
  });

  it("sends nothing when the reader cancelled first", async () => {
    const { xhr, sent } = fakeTransport();
    const controller = new AbortController();
    controller.abort();
    await expect(
      uploadObject(request, { transport: () => xhr, signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(sent.method).toBeUndefined();
  });

  it("encodes each path segment and keeps the separators", () => {
    expect(objectAddress("https://x.supabase.co", "evidence", "a/b c/d.pdf")).toBe(
      "https://x.supabase.co/storage/v1/object/evidence/a/b%20c/d.pdf",
    );
  });
});
