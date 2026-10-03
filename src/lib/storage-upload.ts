/** How far one file's bytes have gone: `loaded` of `total` bytes sent. */
export type UploadProgress = { loaded: number; total: number };

/** The object Storage recorded: its id and its key (`bucket/path`). */
export type StoredObject = { id: string; key: string };

/** Storage refused the upload, with its status (`409` when the path is taken) and its message. */
export class StorageUploadError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "StorageUploadError";
    this.status = status;
  }
}

/** What the upload sends, as the signed-in reader: never a service key. */
export type StorageUploadRequest = {
  /** The project's address, `VITE_SUPABASE_URL`. */
  url: string;
  /** The public anon key, which Storage's gateway asks for beside the session. */
  apiKey: string;
  /** The reader's access token: Storage's row-level security checks the upload as them. */
  token: string;
  bucket: string;
  /** The object's path inside the bucket: `tenant/artifact/version/file.pdf`. */
  path: string;
  file: Blob;
};

/** The request's lifetime and its reports. */
export type StorageUploadOptions = {
  /** Called as the bytes go, and once more with every byte sent. */
  onProgress?: ((progress: UploadProgress) => void) | undefined;
  /** Aborting it stops the transfer; the promise rejects with the signal's reason. */
  signal?: AbortSignal | undefined;
  /** How long the whole transfer may take, in milliseconds. No limit unsaid. */
  timeout?: number | undefined;
  /** The request to send it with: the browser's `XMLHttpRequest` unsaid (a test passes its own). */
  transport?: (() => UploadTransport) | undefined;
};

/** The part of `XMLHttpRequest` the upload uses. */
export type UploadTransport = Pick<
  XMLHttpRequest,
  "open" | "setRequestHeader" | "send" | "abort" | "status" | "responseText" | "timeout"
> & {
  upload: Pick<XMLHttpRequestUpload, "onprogress">;
  onload: ((this: never, event: ProgressEvent) => unknown) | null;
  onerror: ((this: never, event: ProgressEvent) => unknown) | null;
  ontimeout: ((this: never, event: ProgressEvent) => unknown) | null;
  onabort: ((this: never, event: ProgressEvent) => unknown) | null;
};

/** Storage's object address: the bucket, then each segment of the path, encoded. */
export function objectAddress(url: string, bucket: string, path: string) {
  const segments = path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));
  return `${url.replace(/\/+$/, "")}/storage/v1/object/${encodeURIComponent(bucket)}/${segments.join("/")}`;
}

/** Storage's own words for a refusal, else the status. */
function refusal(status: number, body: string) {
  try {
    const parsed = JSON.parse(body) as { message?: unknown; error?: unknown };
    const message =
      typeof parsed.message === "string"
        ? parsed.message
        : typeof parsed.error === "string"
          ? parsed.error
          : null;
    if (message) return new StorageUploadError(status, message);
  } catch {
    // Not JSON: the status says it.
  }
  return new StorageUploadError(status, `Storage refused the upload (${status}).`);
}

/**
 * Sends one file to a private Storage bucket as the signed-in reader, through the same object
 * endpoint and form supabase-js's `upload` uses (never overwriting: `x-upsert: false`), and reports
 * its progress as the bytes go, which a `fetch` cannot. Resolves with the stored object once
 * Storage confirms it; rejects with a `StorageUploadError` when Storage refuses it, and with an
 * Error when the connection fails, times out or is aborted.
 */
export function uploadObject(
  request: StorageUploadRequest,
  { onProgress, signal, timeout, transport }: StorageUploadOptions = {},
): Promise<StoredObject> {
  return new Promise<StoredObject>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("The upload was cancelled.", "AbortError"));
      return;
    }
    const xhr = transport ? transport() : (new XMLHttpRequest() as unknown as UploadTransport);
    const total = request.file.size;
    const stop = () => xhr.abort();
    const settle = () => signal?.removeEventListener("abort", stop);
    xhr.open("POST", objectAddress(request.url, request.bucket, request.path));
    xhr.setRequestHeader("Authorization", `Bearer ${request.token}`);
    xhr.setRequestHeader("apikey", request.apiKey);
    xhr.setRequestHeader("x-upsert", "false");
    if (timeout !== undefined) xhr.timeout = timeout;
    xhr.upload.onprogress = (event: ProgressEvent) =>
      onProgress?.({
        loaded: Math.min(event.loaded, total),
        total: event.lengthComputable ? Math.min(event.total, total) || total : total,
      });
    xhr.onload = () => {
      settle();
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(refusal(xhr.status, xhr.responseText));
        return;
      }
      onProgress?.({ loaded: total, total });
      try {
        const body = JSON.parse(xhr.responseText) as { Id?: unknown; id?: unknown; Key?: unknown };
        const id =
          typeof body.Id === "string" ? body.Id : typeof body.id === "string" ? body.id : "";
        resolve({ id, key: typeof body.Key === "string" ? body.Key : "" });
      } catch {
        reject(new Error("Storage did not say what it stored. Recover the upload to check it."));
      }
    };
    xhr.onerror = () => {
      settle();
      reject(new Error("The connection was lost while the file was uploading."));
    };
    xhr.ontimeout = () => {
      settle();
      reject(new Error("The upload took too long and was stopped."));
    };
    xhr.onabort = () => {
      settle();
      reject(signal?.reason ?? new DOMException("The upload was cancelled.", "AbortError"));
    };
    signal?.addEventListener("abort", stop, { once: true });
    // The form supabase-js sends: the cache lifetime, then the file under an empty name.
    const form = new FormData();
    form.append("cacheControl", "3600");
    form.append("", request.file);
    xhr.send(form);
  });
}
