import wasmUrl from "@ironcalc/wasm/wasm_bg.wasm?url";
import { createCalculationSession, initializeCalculation } from "./calculation";
import { applyCalculationDelta, CalculationResyncError } from "./calculation-update";
import type { Workbook } from "./types";
import type { CalculationRequest, CalculationResponse } from "./worker-client";

const session = createCalculationSession();
let workbook: Workbook | undefined;
let queue = Promise.resolve();
self.onmessage = (event: MessageEvent<CalculationRequest>) => {
  const request = event.data;
  queue = queue.then(async () => {
    let response: CalculationResponse;
    try {
      await initializeCalculation(wasmUrl);
      const next =
        "workbook" in request ? request.workbook : applyCalculationDelta(workbook, request.delta);
      const result = session.calculate(next);
      workbook = next;
      response = { id: request.id, type: "result", result };
    } catch (error) {
      workbook = undefined;
      response = {
        id: request.id,
        type: "error",
        error: error instanceof Error ? error.message : "Calculation failed.",
        ...(error instanceof CalculationResyncError ? { code: "resync" as const } : {}),
      };
    }
    self.postMessage(response);
  });
};
