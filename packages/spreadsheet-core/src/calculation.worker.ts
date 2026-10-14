import wasmUrl from "@ironcalc/wasm/wasm_bg.wasm?url";
import { calculateWorkbook, initializeCalculation } from "./calculation";
import type { CalculationRequest, CalculationResponse } from "./worker-client";

self.onmessage = async (event: MessageEvent<CalculationRequest>) => {
  const request = event.data;
  let response: CalculationResponse;
  try {
    await initializeCalculation(wasmUrl);
    response = { id: request.id, type: "result", result: calculateWorkbook(request.workbook) };
  } catch (error) {
    response = {
      id: request.id,
      type: "error",
      error: error instanceof Error ? error.message : "Calculation failed.",
    };
  }
  self.postMessage(response);
};
