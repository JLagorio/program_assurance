import type { CalculationResult, Workbook } from "./types";

export type CalculationRequest = { id: number; workbook: Workbook };
export type CalculationResponse =
  | { id: number; type: "result"; result: CalculationResult }
  | { id: number; type: "error"; error: string };
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
  let pending:
    | {
        id: number;
        revision: number;
        resolve: (result: CalculationResult) => void;
        reject: (error: Error) => void;
        timer: ReturnType<typeof setTimeout>;
      }
    | undefined;
  const stop = (error: Error) => {
    worker?.terminate();
    worker = undefined;
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
          const id = ++sequence;
          pending = {
            id,
            revision: workbook.revision,
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
            if (!pending || event.data.id !== pending.id) return;
            if (event.data.type === "error") {
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
            current.resolve(event.data.result);
          };
          worker.onerror = () =>
            stop(new Error("The calculation engine stopped. Retry calculation."));
          worker.onmessageerror = () =>
            stop(new Error("The calculation result could not be read."));
          worker.postMessage({ id, workbook } satisfies CalculationRequest);
        } catch (error) {
          const cause =
            error instanceof Error ? error : new Error("Unable to start the calculation worker.");
          stop(cause);
          reject(cause);
        }
      });
    },
    dispose() {
      disposed = true;
      stop(new Error("Calculation client is closed."));
    },
  };
}
