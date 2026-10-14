import type { CalculationResult, Workbook } from "./types";
import type { WorkbookImport } from "./xlsx";

export type WorkbookFileRequest =
  | { id: number; type: "import"; bytes: Uint8Array; name: string }
  | { id: number; type: "export"; workbook: Workbook; results?: CalculationResult };
export type WorkbookFileResponse =
  | { id: number; type: "import"; imported: WorkbookImport }
  | { id: number; type: "export"; bytes: Uint8Array }
  | { id: number; type: "error"; error: string };

/** XLSX parsing/writing stays off the interaction thread and can be cancelled. */
export function createWorkbookFileClient(
  makeWorker = () => new Worker(new URL("./xlsx.worker.ts", import.meta.url), { type: "module" }),
  timeoutMs = 45_000,
) {
  let worker: Worker | undefined;
  let disposed = false;
  let sequence = 0;
  let pending:
    | {
        id: number;
        resolve: (result: WorkbookFileResponse) => void;
        reject: (error: Error) => void;
        timer: ReturnType<typeof setTimeout>;
      }
    | undefined;
  function cancel(error = new Error("Workbook file operation cancelled.")) {
    worker?.terminate();
    worker = undefined;
    if (pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
      pending = undefined;
    }
  }
  function run(
    request:
      | Omit<Extract<WorkbookFileRequest, { type: "import" }>, "id">
      | Omit<Extract<WorkbookFileRequest, { type: "export" }>, "id">,
  ): Promise<WorkbookFileResponse> {
    if (disposed) return Promise.reject(new Error("Workbook file client is closed."));
    if (pending)
      return Promise.reject(new Error("Wait for the current import or export to finish."));
    return new Promise((resolve, reject) => {
      try {
        worker ??= makeWorker();
        const id = ++sequence;
        pending = {
          id,
          resolve,
          reject,
          timer: setTimeout(
            () => cancel(new Error("Workbook file operation timed out. Try a smaller workbook.")),
            timeoutMs,
          ),
        };
        worker.onmessage = (event: MessageEvent<WorkbookFileResponse>) => {
          if (!pending || pending.id !== event.data.id) return;
          if (event.data.type === "error") {
            cancel(new Error(event.data.error));
            return;
          }
          const current = pending;
          pending = undefined;
          clearTimeout(current.timer);
          current.resolve(event.data);
        };
        worker.onerror = () => cancel(new Error("The workbook file worker stopped."));
        worker.onmessageerror = () =>
          cancel(new Error("The workbook file result could not be read."));
        worker.postMessage({ ...request, id } satisfies WorkbookFileRequest);
      } catch (error) {
        const cause =
          error instanceof Error ? error : new Error("Unable to start the workbook file worker.");
        cancel(cause);
        reject(cause);
      }
    });
  }
  return {
    async importXlsx(
      bytes: ArrayBuffer | Uint8Array,
      name = "Imported workbook",
    ): Promise<WorkbookImport> {
      const result = await run({
        type: "import",
        bytes: bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes),
        name,
      });
      if (result.type !== "import") throw new Error("Unexpected workbook import response.");
      return result.imported;
    },
    async exportXlsx(workbook: Workbook, results?: CalculationResult): Promise<Uint8Array> {
      const result = await run({ type: "export", workbook, ...(results ? { results } : {}) });
      if (result.type !== "export") throw new Error("Unexpected workbook export response.");
      return result.bytes;
    },
    cancel,
    dispose() {
      disposed = true;
      cancel();
    },
  };
}
