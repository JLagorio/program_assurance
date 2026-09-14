/**
 * Synchronous domain stores stage their JSON values here. In database mode a
 * complete snapshot is saved in one revision, keeping related store writes in
 * the same turn together. Browser demo storage remains a separate opt-in mode.
 */
export interface WorkspaceRepository {
  load(): Promise<{ revision: number; values: Record<string, string> }>;
  save(expectedRevision: number, values: Record<string, string>): Promise<number>;
}

export class WorkspaceConflictError extends Error {
  readonly code = "WORKSPACE_CONFLICT";

  constructor(
    message = "This workspace changed in another session. Reload to read its latest changes.",
  ) {
    super(message);
    this.name = "WorkspaceConflictError";
  }
}

export type WorkspacePersistenceStatus = Readonly<{
  state: "demo" | "loading" | "saved" | "saving" | "error" | "conflict";
  error?: string;
}>;

const listeners = new Set<() => void>();
const debounceMs = 150;
// Fail closed even before the gate's effect runs, including when Vite evaluates
// a fresh copy of this module during an update of the running local app.
let configured = import.meta.env["VITE_DATA_BACKEND"] === "supabase";
let status: WorkspacePersistenceStatus = { state: configured ? "loading" : "demo" };
let repository: WorkspaceRepository | undefined;
let loaded = false;
let revision = 0;
let values: Record<string, string> = {};
let acknowledged: Record<string, string> = {};
let failure: Error | undefined;
let loading: Promise<void> | undefined;
let saving: Promise<void> | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;

function publish(next: WorkspacePersistenceStatus) {
  if (status.state === next.state && status.error === next.error) return;
  status = next;
  for (const listener of listeners) listener();
}

/** Stable snapshots suitable for React's useSyncExternalStore. */
export function getWorkspacePersistenceStatus(): WorkspacePersistenceStatus {
  return status;
}

export function subscribeWorkspacePersistence(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Call before rendering/restoring any domain stores in database mode. */
export function setWorkspaceStoragePending(): void {
  if (configured) return;
  configured = true;
  publish({ state: "loading" });
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error("Workspace persistence failed.");
}

function failed(error: unknown) {
  failure = asError(error);
  publish({
    state: failure instanceof WorkspaceConflictError ? "conflict" : "error",
    error: failure.message,
  });
}

/**
 * Load before restoreWorkspaceRecords. Never copy pre-existing browser records
 * into a database workspace. Switching workspace/account requires a page reload
 * because the existing domain stores also keep module-scoped restored state.
 */
export function initializeWorkspaceStorage(next: WorkspaceRepository): Promise<void> {
  setWorkspaceStoragePending();
  if (repository && repository !== next) {
    return Promise.reject(new Error("Reload before switching workspace or account."));
  }
  repository = next;
  if (loading) return loading;
  if (loaded) return Promise.resolve();
  failure = undefined;
  publish({ state: "loading" });
  loading = (async () => {
    try {
      const snapshot = await next.load();
      if (
        !Number.isSafeInteger(snapshot.revision) ||
        snapshot.revision < 0 ||
        !snapshot.values ||
        typeof snapshot.values !== "object" ||
        Array.isArray(snapshot.values) ||
        Object.values(snapshot.values).some((value) => typeof value !== "string")
      ) {
        throw new Error("The saved workspace snapshot is invalid.");
      }
      revision = snapshot.revision;
      values = { ...snapshot.values };
      acknowledged = { ...snapshot.values };
      loaded = true;
      publish({ state: "saved" });
    } catch (error) {
      failed(error);
      throw failure;
    }
  })().finally(() => {
    loading = undefined;
  });
  return loading;
}

function assertReady() {
  if (!loaded) throw failure ?? new Error("Wait for the workspace to finish loading.");
}

function changed(): boolean {
  return (
    Object.keys(values).length !== Object.keys(acknowledged).length ||
    Object.entries(values).some(([key, value]) => acknowledged[key] !== value)
  );
}

function cancelTimer() {
  if (timer !== undefined) clearTimeout(timer);
  timer = undefined;
}

function schedule() {
  cancelTimer();
  // Always defer to let synchronous multi-store commands and their rollbacks
  // finish before capturing the snapshot sent to the database.
  timer = setTimeout(() => {
    timer = undefined;
    void flushWorkspacePersistence().catch(() => {
      // Failure is retained and published; retries are explicit.
    });
  }, debounceMs);
}

export const workspaceStorage = {
  getItem(key: string): string | null {
    if (!configured) return typeof window === "undefined" ? null : window.localStorage.getItem(key);
    assertReady();
    return Object.hasOwn(values, key) ? values[key]! : null;
  },

  setItem(key: string, value: string): void {
    if (!configured) {
      if (typeof window !== "undefined") window.localStorage.setItem(key, value);
      return;
    }
    assertReady();
    // Keep the rejected snapshot intact until it is retried or the page reloads.
    // Domain command rollback paths receive a synchronous error for later edits.
    if (failure) throw failure;
    if (Object.hasOwn(values, key) && values[key] === value) return;
    values = { ...values, [key]: value };
    publish({ state: "saving" });
    schedule();
  },
};

/** Flush staged writes in order; at most one repository save is in flight. */
export function flushWorkspacePersistence(): Promise<void> {
  if (!configured) return Promise.resolve();
  if (saving) return saving;
  cancelTimer();
  if (!loaded || !repository) {
    return Promise.reject(failure ?? new Error("Wait for the workspace to finish loading."));
  }
  if (failure) return Promise.reject(failure);
  const destination = repository;
  saving = (async () => {
    try {
      while (changed()) {
        publish({ state: "saving" });
        const snapshot = { ...values };
        const nextRevision = await destination.save(revision, snapshot);
        if (!Number.isSafeInteger(nextRevision) || nextRevision <= revision) {
          throw new Error("The server returned an invalid workspace revision.");
        }
        revision = nextRevision;
        acknowledged = snapshot;
      }
      publish({ state: "saved" });
    } catch (error) {
      cancelTimer();
      failed(error);
      throw failure;
    }
  })().finally(() => {
    saving = undefined;
  });
  return saving;
}

/** Retry the retained snapshot with the original revision; never force a save. */
export function retryWorkspacePersistence(): Promise<void> {
  if (!configured) return Promise.resolve();
  if (saving) return saving;
  if (!repository) return Promise.reject(new Error("Sign in before loading the workspace."));
  if (!loaded) return initializeWorkspaceStorage(repository);
  if (failure instanceof WorkspaceConflictError) return Promise.reject(failure);
  failure = undefined;
  return flushWorkspacePersistence();
}

if (import.meta.hot && typeof window !== "undefined") {
  // Self-accept so importers keep using the live store while it finishes saving.
  // Retain that first instance's flush across consecutive rejected updates: a
  // newly evaluated module has no copy of the unsaved state in the open page.
  const flushBeforeReload =
    (import.meta.hot.data["flushWorkspacePersistence"] as (() => Promise<void>) | undefined) ??
    flushWorkspacePersistence;
  import.meta.hot.data["flushWorkspacePersistence"] = flushBeforeReload;
  import.meta.hot.accept(() => {
    void flushBeforeReload()
      .then(() => window.location.reload())
      .catch(() => {
        // The live adapter retains and publishes its failure. Keep that page
        // open so the user can recover or retry without discarding edits.
      });
  });
}
