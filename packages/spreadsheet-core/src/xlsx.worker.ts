import type { WorkbookFileRequest, WorkbookFileResponse } from "./file-client";
import { exportXlsx, importXlsx } from "./xlsx";

self.onmessage = async (event: MessageEvent<WorkbookFileRequest>) => {
  const request = event.data;
  let response: WorkbookFileResponse;
  try {
    response =
      request.type === "import"
        ? {
            id: request.id,
            type: "import",
            imported: await importXlsx(request.bytes, request.name),
          }
        : {
            id: request.id,
            type: "export",
            bytes: await exportXlsx(request.workbook, request.results),
          };
  } catch (error) {
    response = {
      id: request.id,
      type: "error",
      error: error instanceof Error ? error.message : "Workbook file operation failed.",
    };
  }
  self.postMessage(response);
};
