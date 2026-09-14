import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceRepository } from "./workspace-storage";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function repository(values: Record<string, string> = {}, revision = 0) {
  return {
    load: vi.fn(async () => ({ values, revision })),
    save: vi.fn(async (expected: number, _values: Record<string, string>) => expected + 1),
  } satisfies WorkspaceRepository;
}

let browserValues: Map<string, string>;
let browserWrite: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubEnv("VITE_DATA_BACKEND", undefined);
  browserValues = new Map();
  browserWrite = vi.fn((key: string, value: string) => browserValues.set(key, value));
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => browserValues.get(key) ?? null,
      setItem: browserWrite,
    },
  });
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("workspace persistence", () => {
  it("keeps demo storage synchronous, including quota failures", async () => {
    const store = await import("./workspace-storage");
    expect(store.getWorkspacePersistenceStatus()).toEqual({ state: "demo" });
    expect(store.workspaceStorage.getItem("missing")).toBeNull();
    store.workspaceStorage.setItem("programs", "demo programs");
    expect(store.workspaceStorage.getItem("programs")).toBe("demo programs");
    browserWrite.mockImplementationOnce(() => {
      throw new Error("Quota exceeded");
    });
    expect(() => store.workspaceStorage.setItem("programs", "changed")).toThrow("Quota exceeded");
    expect(store.workspaceStorage.getItem("programs")).toBe("demo programs");
    await expect(store.flushWorkspacePersistence()).resolves.toBeUndefined();
  });

  it("starts closed in Supabase mode before any gate or initialization effect", async () => {
    vi.stubEnv("VITE_DATA_BACKEND", "supabase");
    browserValues.set("programs", "browser demo");
    const store = await import("./workspace-storage");
    expect(store.getWorkspacePersistenceStatus()).toEqual({ state: "loading" });
    expect(() => store.workspaceStorage.getItem("programs")).toThrow("loading");
    expect(() => store.workspaceStorage.setItem("programs", "premature edit")).toThrow("loading");
    expect(browserWrite).not.toHaveBeenCalled();
    await store.initializeWorkspaceStorage(repository({ programs: "database workspace" }, 1));
    expect(store.workspaceStorage.getItem("programs")).toBe("database workspace");
    expect(browserValues.get("programs")).toBe("browser demo");
  });

  it("blocks early domain access and loads database values without importing browser data", async () => {
    const store = await import("./workspace-storage");
    browserValues.set("old-browser-record", "private demo value");
    const snapshot = deferred<{ revision: number; values: Record<string, string> }>();
    const remote = repository();
    remote.load.mockReturnValueOnce(snapshot.promise);
    store.setWorkspaceStoragePending();
    expect(() => store.workspaceStorage.getItem("old-browser-record")).toThrow("loading");
    expect(() => store.workspaceStorage.setItem("programs", "early write")).toThrow("loading");
    const loading = store.initializeWorkspaceStorage(remote);
    expect(store.initializeWorkspaceStorage(remote)).toBe(loading);
    snapshot.resolve({ revision: 4, values: { programs: "database programs" } });
    await loading;
    expect(store.workspaceStorage.getItem("programs")).toBe("database programs");
    expect(store.workspaceStorage.getItem("old-browser-record")).toBeNull();
    store.workspaceStorage.setItem("requirements", "database requirements");
    await store.flushWorkspacePersistence();
    expect(remote.save).toHaveBeenCalledExactlyOnceWith(4, {
      programs: "database programs",
      requirements: "database requirements",
    });
    expect(browserWrite).not.toHaveBeenCalled();
    expect(browserValues.get("old-browser-record")).toBe("private demo value");
  });

  it("coalesces related writes and rollback before sending an atomic snapshot", async () => {
    const store = await import("./workspace-storage");
    const remote = repository({ evidence: "previous evidence", programs: "programs" }, 7);
    await store.initializeWorkspaceStorage(remote);
    store.workspaceStorage.setItem("evidence", "rejected link");
    store.workspaceStorage.setItem("evidence", "previous evidence");
    await vi.runAllTimersAsync();
    expect(remote.save).not.toHaveBeenCalled();
    expect(store.getWorkspacePersistenceStatus().state).toBe("saved");

    store.workspaceStorage.setItem("evidence", "accepted link");
    store.workspaceStorage.setItem("requirements", "related requirement");
    expect(remote.save).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    expect(remote.save).toHaveBeenCalledExactlyOnceWith(7, {
      evidence: "accepted link",
      requirements: "related requirement",
      programs: "programs",
    });
  });

  it("serializes saves and coalesces edits made while a request is in flight", async () => {
    const store = await import("./workspace-storage");
    const first = deferred<number>();
    const second = deferred<number>();
    const remote = repository({ programs: "original" }, 10);
    remote.save.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    await store.initializeWorkspaceStorage(remote);
    store.workspaceStorage.setItem("programs", "first");
    const saving = store.flushWorkspacePersistence();
    expect(remote.save).toHaveBeenCalledExactlyOnceWith(10, { programs: "first" });

    store.workspaceStorage.setItem("programs", "second");
    store.workspaceStorage.setItem("programs", "latest");
    store.workspaceStorage.setItem("requirements", "related");
    await vi.advanceTimersByTimeAsync(500);
    expect(remote.save).toHaveBeenCalledTimes(1);
    expect(store.flushWorkspacePersistence()).toBe(saving);
    first.resolve(11);
    await Promise.resolve();
    expect(remote.save).toHaveBeenNthCalledWith(2, 11, {
      programs: "latest",
      requirements: "related",
    });
    expect(store.getWorkspacePersistenceStatus().state).toBe("saving");
    second.resolve(12);
    await saving;
    expect(store.getWorkspacePersistenceStatus()).toEqual({ state: "saved" });
  });

  it("retains network failures, blocks later edits, and retries without changing the expected revision", async () => {
    const store = await import("./workspace-storage");
    const remote = repository({ programs: "original" }, 3);
    remote.save.mockRejectedValueOnce(new Error("Network unavailable"));
    await store.initializeWorkspaceStorage(remote);
    store.workspaceStorage.setItem("programs", "pending");
    await expect(store.flushWorkspacePersistence()).rejects.toThrow("Network unavailable");
    expect(store.getWorkspacePersistenceStatus()).toEqual({
      state: "error",
      error: "Network unavailable",
    });
    expect(store.workspaceStorage.getItem("programs")).toBe("pending");
    expect(() => store.workspaceStorage.setItem("programs", "later edit")).toThrow(
      "Network unavailable",
    );
    await vi.runAllTimersAsync();
    expect(remote.save).toHaveBeenCalledTimes(1);
    await store.retryWorkspacePersistence();
    expect(remote.save).toHaveBeenNthCalledWith(2, 3, { programs: "pending" });
    expect(store.getWorkspacePersistenceStatus()).toEqual({ state: "saved" });
  });

  it("never overwrites a stale revision, including after an uncertain network result", async () => {
    const store = await import("./workspace-storage");
    let persisted = { programs: "original" };
    let serverRevision = 2;
    const remote = repository(persisted, serverRevision);
    remote.save.mockImplementation(async (expected, snapshot) => {
      if (expected !== serverRevision) throw new store.WorkspaceConflictError();
      persisted = { programs: snapshot["programs"]! };
      serverRevision += 1;
      // The write committed, but the response did not reach the browser.
      throw new Error("Connection lost");
    });
    await store.initializeWorkspaceStorage(remote);
    store.workspaceStorage.setItem("programs", "first session");
    await expect(store.flushWorkspacePersistence()).rejects.toThrow("Connection lost");
    persisted = { programs: "other session" };
    serverRevision += 1;
    await expect(store.retryWorkspacePersistence()).rejects.toBeInstanceOf(
      store.WorkspaceConflictError,
    );
    expect(store.getWorkspacePersistenceStatus().state).toBe("conflict");
    expect(() => store.workspaceStorage.setItem("programs", "overwrite")).toThrow(
      store.WorkspaceConflictError,
    );
    await expect(store.retryWorkspacePersistence()).rejects.toBeInstanceOf(
      store.WorkspaceConflictError,
    );
    expect(remote.save).toHaveBeenCalledTimes(2);
    expect(persisted).toEqual({ programs: "other session" });
    expect(store.workspaceStorage.getItem("programs")).toBe("first session");
  });

  it("retries failed loads without falling back to browser records", async () => {
    const store = await import("./workspace-storage");
    const remote = repository({ tasks: "remote tasks" }, 1);
    remote.load.mockRejectedValueOnce(new Error("Database unavailable"));
    browserValues.set("tasks", "demo tasks");
    await expect(store.initializeWorkspaceStorage(remote)).rejects.toThrow("Database unavailable");
    expect(() => store.workspaceStorage.getItem("tasks")).toThrow("Database unavailable");
    await store.retryWorkspacePersistence();
    expect(store.workspaceStorage.getItem("tasks")).toBe("remote tasks");
    expect(remote.load).toHaveBeenCalledTimes(2);
    expect(remote.save).not.toHaveBeenCalled();
  });

  it("publishes stable snapshots and requires a reload before switching repositories", async () => {
    const store = await import("./workspace-storage");
    const listener = vi.fn();
    const unsubscribe = store.subscribeWorkspacePersistence(listener);
    store.setWorkspaceStoragePending();
    const pending = store.getWorkspacePersistenceStatus();
    store.setWorkspaceStoragePending();
    expect(store.getWorkspacePersistenceStatus()).toBe(pending);
    expect(listener).toHaveBeenCalledTimes(1);
    const remote = repository({ programs: "first account" });
    await store.initializeWorkspaceStorage(remote);
    const saved = store.getWorkspacePersistenceStatus();
    await store.initializeWorkspaceStorage(remote);
    expect(store.getWorkspacePersistenceStatus()).toBe(saved);
    expect(remote.load).toHaveBeenCalledTimes(1);
    await expect(store.initializeWorkspaceStorage(repository())).rejects.toThrow("Reload");
    expect(store.workspaceStorage.getItem("programs")).toBe("first account");
    unsubscribe();
    const count = listener.mock.calls.length;
    store.workspaceStorage.setItem("programs", "edit");
    await store.flushWorkspacePersistence();
    expect(listener).toHaveBeenCalledTimes(count);
  });
});
