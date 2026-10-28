import { describe, expect, it, vi } from "vitest";
import type { CalculationResult } from "./types";
import { applyOperation, createWorkbook } from "./workbook";
import {
  createCalculationClient,
  SupersededCalculationError,
  type CalculationResponse,
  type CalculationWorker,
} from "./worker-client";

function fakeWorker() {
  const worker: CalculationWorker = {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    onmessage: null,
    onerror: null,
    onmessageerror: null,
  };
  return {
    worker,
    send(response: CalculationResponse) {
      worker.onmessage?.call(
        worker as Worker,
        { data: response } as MessageEvent<CalculationResponse>,
      );
    },
  };
}
const result = (revision: number): CalculationResult => ({
  revision,
  sheets: {},
  engine: "ironcalc-0.8.4",
  warnings: [],
});

describe("calculation worker lifecycle", () => {
  it("supersedes old requests and ignores their late results", async () => {
    const workers = [fakeWorker(), fakeWorker()];
    let index = 0;
    const client = createCalculationClient(() => workers[index++]!.worker);
    const workbook = createWorkbook();
    const old = client.calculate(workbook).catch((error: unknown) => error);
    const latest = client.calculate({ ...workbook, revision: 1 });
    expect(await old).toBeInstanceOf(SupersededCalculationError);
    expect(workers[0]!.worker.terminate).toHaveBeenCalledOnce();
    workers[0]!.send({ id: 1, type: "result", result: result(0) });
    workers[1]!.send({ id: 2, type: "result", result: result(1) });
    expect((await latest).revision).toBe(1);
    client.dispose();
  });
  it("rejects inconsistent revisions and allows a fresh worker after engine errors", async () => {
    const workers = [fakeWorker(), fakeWorker(), fakeWorker()];
    let index = 0;
    const client = createCalculationClient(() => workers[index++]!.worker);
    const stale = client.calculate(createWorkbook()).catch((error: unknown) => error);
    workers[0]!.send({ id: 1, type: "result", result: result(99) });
    expect(((await stale) as Error).message).toContain("stale");
    const failed = client.calculate(createWorkbook()).catch((error: unknown) => error);
    workers[1]!.send({ id: 2, type: "error", error: "Engine initialization failed" });
    expect(((await failed) as Error).message).toContain("initialization");
    const retried = client.calculate(createWorkbook());
    workers[2]!.send({ id: 3, type: "result", result: result(0) });
    expect((await retried).revision).toBe(0);
    client.dispose();
  });
  it("terminates hung engines and releases pending promises on disposal", async () => {
    vi.useFakeTimers();
    try {
      const fake = fakeWorker();
      const client = createCalculationClient(() => fake.worker, 20);
      const pending = client.calculate(createWorkbook()).catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(21);
      expect(((await pending) as Error).message).toContain("time limit");
      expect(fake.worker.terminate).toHaveBeenCalledOnce();
      client.dispose();
      await expect(client.calculate(createWorkbook())).rejects.toThrow("closed");
    } finally {
      vi.useRealTimers();
    }
  });
  it("sends sparse updates after acknowledgment and resends a full snapshot on resync", async () => {
    const fake = fakeWorker();
    const client = createCalculationClient(() => fake.worker);
    const workbook = createWorkbook();
    const first = client.calculate(workbook);
    fake.send({ id: 1, type: "result", result: result(0) });
    await first;
    const sheet = workbook.sheets[0]!;
    const next = applyOperation(workbook, {
      type: "edit",
      sheetId: sheet.id,
      edits: [{ rowId: sheet.rows[0]!.id, columnId: sheet.columns[0]!.id, value: "42" }],
    });
    const pending = client.calculate(next);
    expect(fake.worker.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 2,
        delta: expect.objectContaining({ baseRevision: 0, revision: 1 }),
      }),
    );
    fake.send({ id: 2, type: "error", error: "base lost", code: "resync" });
    expect(fake.worker.postMessage).toHaveBeenLastCalledWith({ id: 2, workbook: next });
    fake.send({ id: 2, type: "result", result: result(1) });
    expect((await pending).revision).toBe(1);
    client.dispose();
  });
  it("cancels promptly, restarts with a snapshot, and ignores errors from terminated workers", async () => {
    const workers = [fakeWorker(), fakeWorker()];
    let index = 0;
    const client = createCalculationClient(() => workers[index++]!.worker);
    const workbook = createWorkbook();
    const old = client.calculate(workbook).catch((error: unknown) => error);
    const oldError = workers[0]!.worker.onerror!;
    client.cancel();
    expect(await old).toBeInstanceOf(SupersededCalculationError);
    const next = client.calculate(workbook);
    oldError.call(workers[0]!.worker as Worker, {} as ErrorEvent);
    expect(workers[1]!.worker.terminate).not.toHaveBeenCalled();
    expect(workers[1]!.worker.postMessage).toHaveBeenLastCalledWith({ id: 2, workbook });
    workers[1]!.send({ id: 2, type: "result", result: result(0) });
    await expect(next).resolves.toMatchObject({ revision: 0 });
    client.dispose();
  });
});
