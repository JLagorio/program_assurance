import { createCalculationDelta, type CalculationDelta } from "./calculation-update";
import type { CalculationResult, Workbook } from "./types";

export type CalculationRequest =
  { id: number; workbook: Workbook } | { id: number; delta: CalculationDelta };
export type CalculationResponse =
  | { id: number; type: "result"; result: CalculationResult }
  | { id: number; type: "error"; error: string; code?: "resync" };
export type CalculationWorker = Pick<
  Worker,
  "postMessage" | "terminate" | "onmessage" | "onerror" | "onmessageerror"
>;

export class SupersededCalculationError extends Error {
  constructor() {
    super("A newer workbook revision replaced this calculation.");
    this.name = "SupersededCalculationError";
  }
}

/** Latest revision wins. Hung engines are terminated; a later request retries fresh. */
export function createCalculationClient(
  makeWorker: () => CalculationWorker = () =>
    new Worker(new URL("./calculation.worker.ts", import.meta.url), { type: "module" }),
  timeoutMs = 20_000,
) {
  let worker: CalculationWorker | undefined;
  let sequence = 0;
  let disposed = false;
  let acknowledged: Workbook | undefined;
  let pending:
    | {
        id: number;
        revision: number;
        workbook: Workbook;
        resynced: boolean;
        resolve: (result: CalculationResult) => void;
        reject: (error: Error) => void;
        timer: ReturnType<typeof setTimeout>;
      }
    | undefined;
  const stop = (error: Error) => {
    worker?.terminate();
    worker = undefined;
    acknowledged = undefined;
    if (pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
      pending = undefined;
    }
  };
  return {
    calculate(workbook: Workbook): Promise<CalculationResult> {
      if (disposed) return Promise.reject(new Error("Calculation client is closed."));
      if (pending) stop(new SupersededCalculationError());
      return new Promise((resolve, reject) => {
        try {
          worker ??= makeWorker();
          const activeWorker = worker;
          const snapshot = structuredClone(workbook);
          const id = ++sequence;
          pending = {
            id,
            revision: snapshot.revision,
            workbook: snapshot,
            resynced: false,
            resolve,
            reject,
            timer: setTimeout(
              () =>
                stop(
                  new Error("Calculation exceeded its time limit. Simplify the formula and retry."),
                ),
              timeoutMs,
            ),
          };
          worker.onmessage = (event: MessageEvent<CalculationResponse>) => {
            if (worker !== activeWorker || !pending || event.data.id !== pending.id) return;
            if (event.data.type === "error") {
              if (event.data.code === "resync" && !pending.resynced) {
                pending.resynced = true;
                acknowledged = undefined;
                activeWorker.postMessage({
                  id: pending.id,
                  workbook: pending.workbook,
                } satisfies CalculationRequest);
                return;
              }
              stop(new Error(event.data.error));
              return;
            }
            if (event.data.result.revision !== pending.revision) {
              stop(new Error("Calculation returned a stale workbook revision."));
              return;
            }
            const current = pending;
            pending = undefined;
            clearTimeout(current.timer);
            acknowledged = current.workbook;
            current.resolve(event.data.result);
          };
          worker.onerror = () => {
            if (worker === activeWorker)
              stop(new Error("The calculation engine stopped. Retry calculation."));
          };
          worker.onmessageerror = () => {
            if (worker === activeWorker)
              stop(new Error("The calculation result could not be read."));
          };
          const delta = acknowledged && createCalculationDelta(acknowledged, snapshot);
          worker.postMessage(
            delta
              ? ({ id, delta } satisfies CalculationRequest)
              : ({ id, workbook: snapshot } satisfies CalculationRequest),
          );
        } catch (error) {
          const cause =
            error instanceof Error ? error : new Error("Unable to start the calculation worker.");
          stop(cause);
          reject(cause);
        }
      });
    },
    cancel() {
      stop(new SupersededCalculationError());
    },
    dispose() {
      disposed = true;
      stop(new Error("Calculation client is closed."));
    },
  };
}
