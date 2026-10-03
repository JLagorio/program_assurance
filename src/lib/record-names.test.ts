import { describe, expect, it, vi } from "vitest";
import { args, fakeClient, filter, uuid } from "./testing/fake-client";
import type { Collection, Column } from "./records";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { MISSING_RECORD, createNameBatcher, nameColumns, readRecordNames } =
  await import("./record-names");

const column = (name: string): Column => ({
  name,
  type: "text",
  required: false,
  default: null,
  description: null,
  choices: [],
});
const collection = (name: string, columns: string[]): Collection => ({
  name,
  description: null,
  columns: columns.map(column),
  relations: [],
  can_insert: true,
  can_update: true,
  can_delete: true,
});
const controls = collection("controls", ["id", "code", "title", "props", "catalog_revision_id"]);
const revisions = collection("ssp_revisions", ["id", "version_number", "system_id", "body"]);

describe("the columns a name is read from", () => {
  it("reads the name candidates and what names a record without one, never the rest", () => {
    expect(nameColumns(controls)).toEqual(["id", "code", "title"]);
    expect(nameColumns(revisions)).toEqual(["id", "version_number"]);
    const notes = collection("notes", ["id", "description", "body"]);
    // A record named by its description reads it; a record with a name does not.
    expect(nameColumns(notes)).toEqual(["id", "description"]);
  });
});

describe("reading names", () => {
  it("reads a hundred ids a request, only the name columns, and skips what is not an id", async () => {
    const ids = [...Array.from({ length: 150 }, (_, index) => uuid(index + 1)), "not-an-id"];
    const { client, calls } = fakeClient((call) => ({
      data: (filter(call, "in", "id") as string[]).map((id) => ({ id, code: "AC-1" })),
      error: null,
    }));
    const found = await readRecordNames(client, "token", controls, ids);
    expect(calls).toHaveLength(2);
    expect(args(calls[0], "select")[0]).toEqual(["id,code,title"]);
    expect((filter(calls[0], "in", "id") as string[]).length).toBe(100);
    expect((filter(calls[1], "in", "id") as string[]).length).toBe(50);
    expect(found.size).toBe(150);
    expect(found.has("not-an-id")).toBe(false);
  });
});

describe("gathering the names a page asks for", () => {
  function manual() {
    const flushes: (() => void)[] = [];
    const batcher = createNameBatcher((flush) => void flushes.push(flush));
    return { batcher, flush: () => flushes.splice(0).forEach((flush) => flush()) };
  }

  it("reads each collection's names once for every cell that asked in the same task", async () => {
    const { batcher, flush } = manual();
    const read = vi.fn(async (ids: string[]) => new Map(ids.map((id) => [id, { id }])));
    const asks = [uuid(1), uuid(2), uuid(1), uuid(3)].map((id) =>
      batcher.load("tenant:controls", id, read),
    );
    const other = batcher.load("tenant:systems", uuid(9), read);
    flush();
    await expect(Promise.all(asks)).resolves.toEqual([
      { id: uuid(1) },
      { id: uuid(2) },
      { id: uuid(1) },
      { id: uuid(3) },
    ]);
    await expect(other).resolves.toEqual({ id: uuid(9) });
    expect(read).toHaveBeenCalledTimes(2);
    expect(read.mock.calls[0]?.[0]).toEqual([uuid(1), uuid(2), uuid(3)]);
  });

  it("says a record the reader cannot see does not exist, and keeps the others", async () => {
    const { batcher, flush } = manual();
    const read = async () => new Map([[uuid(1), { id: uuid(1) }]]);
    const found = batcher.load("tenant:controls", uuid(1), read);
    const missing = batcher.load("tenant:controls", uuid(2), read);
    flush();
    await expect(found).resolves.toEqual({ id: uuid(1) });
    await expect(missing).rejects.toThrow(MISSING_RECORD);
  });

  it("fails every cell of a read that failed, and never sends a malformed id", async () => {
    const { batcher, flush } = manual();
    const read = vi.fn(async () => {
      throw new Error("offline");
    });
    const asks = [uuid(1), uuid(2)].map((id) => batcher.load("tenant:controls", id, read));
    await expect(batcher.load("tenant:controls", "draft", read)).rejects.toThrow(MISSING_RECORD);
    flush();
    for (const ask of asks) await expect(ask).rejects.toThrow("offline");
    expect(read.mock.calls[0]).toEqual([[uuid(1), uuid(2)]]);
  });

  it("starts a new read for asks after the last one was sent", async () => {
    const { batcher, flush } = manual();
    const read = vi.fn(async (ids: string[]) => new Map(ids.map((id) => [id, { id }])));
    const first = batcher.load("tenant:controls", uuid(1), read);
    flush();
    await first;
    const second = batcher.load("tenant:controls", uuid(2), read);
    flush();
    await second;
    expect(read).toHaveBeenCalledTimes(2);
  });
});
