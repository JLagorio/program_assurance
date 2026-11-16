import { describe, expect, it } from "vitest";
import { args, fakeClient, filter, uuid, type FakeResult } from "./testing/fake-client";
import type { Collection, DataRecord } from "./records";

const { saveRecordOnce } = await import("./record-save");
const { SaveOnceConflict } = await import("./save-once");

const tenantId = uuid(900);
const context = { tenantId, token: "token" };
const id = uuid(1);

const column = (name: string, type = "text") => ({
  name,
  type,
  required: false,
  default: null,
  description: null,
  choices: [],
});
const parties: Collection = {
  name: "parties",
  description: null,
  can_insert: true,
  can_update: true,
  can_delete: true,
  columns: ["id", "tenant_id", "revision", "party_type", "name", "email"].map((name) =>
    column(name),
  ),
  relations: [],
};
const payload = { party_type: "organization", name: "Northwind Systems", email: null };

/** The lookup's answer, then the write's. */
function client(found: unknown, write: FakeResult = { data: { id }, error: null }) {
  let first = true;
  return fakeClient(() => {
    if (!first) return write;
    first = false;
    return { data: found, error: null };
  });
}

describe("the generic record form's save, safe to retry", () => {
  it("creates the record under the id the draft chose, in the workspace", async () => {
    const { client: db, calls } = client(null);
    const sent = new Set<string>();
    const result = await saveRecordOnce(db, context, parties, { id, payload, sent });
    expect(result.outcome).toBe("created");
    expect(calls.map((call) => call.table)).toEqual(["parties", "parties"]);
    expect(filter(calls[0], "eq", "id")).toBe(id);
    expect(filter(calls[0], "eq", "tenant_id")).toBe(tenantId);
    expect(args(calls[1], "insert")[0]?.[0]).toEqual({ ...payload, id, tenant_id: tenantId });
    expect(args(calls[1], "setHeader")[0]).toEqual(["Authorization", "Bearer token"]);
    // What this insert sent a value for, so a later try holds the record to it.
    expect([...sent]).toEqual(["party_type", "name"]);
  });

  it("writes nothing when a first try already created it, though its answer was lost", async () => {
    // The server filled the column the reader left empty, and spelled the rest its own way.
    const { client: db, calls } = client({
      id,
      tenant_id: tenantId,
      revision: 1,
      ...payload,
      email: "filled@example.test",
    });
    const result = await saveRecordOnce(db, context, parties, {
      id,
      payload,
      sent: new Set(["party_type", "name"]),
    });
    expect(result.outcome).toBe("unchanged");
    expect(result.record.id).toBe(id);
    expect(calls).toHaveLength(1);
  });

  it("refuses a create whose first try saved other details", async () => {
    const { client: db, calls } = client({ id, revision: 1, ...payload, name: "Northwind" });
    const saving = saveRecordOnce(db, context, parties, { id, payload, sent: new Set() });
    await expect(saving).rejects.toBeInstanceOf(SaveOnceConflict);
    await expect(saving).rejects.toMatchObject({ reason: "different" });
    expect(calls).toHaveLength(1);
  });

  it("holds the record to a value an earlier insert sent and the reader has since cleared", async () => {
    const { client: db } = client({ id, revision: 1, ...payload, email: "first@example.test" });
    await expect(
      saveRecordOnce(db, context, parties, {
        id,
        payload,
        sent: new Set(["party_type", "name", "email"]),
      }),
    ).rejects.toMatchObject({ reason: "different" });
  });

  it("edits at the revision the reader opened, looking the record up by its id", async () => {
    const existing: DataRecord = { id, tenant_id: tenantId, revision: 3, ...payload };
    const { client: db, calls } = client({ ...existing });
    const edited = { ...payload, name: "Northwind Defense" };
    const result = await saveRecordOnce(db, context, parties, { id, payload: edited, existing });
    expect(result.outcome).toBe("updated");
    expect(filter(calls[0], "eq", "tenant_id")).toBeUndefined();
    expect(args(calls[1], "update")[0]?.[0]).toEqual({ ...edited, revision: 4 });
    expect(filter(calls[1], "eq", "id")).toBe(id);
    expect(filter(calls[1], "eq", "revision")).toBe(3);
  });

  it("writes nothing when an edit is retried after its write landed", async () => {
    const existing: DataRecord = { id, tenant_id: tenantId, revision: 3, ...payload };
    const edited = { ...payload, name: "Northwind Defense" };
    const { client: db, calls } = client({ ...existing, ...edited, revision: 4 });
    const result = await saveRecordOnce(db, context, parties, { id, payload: edited, existing });
    expect(result.outcome).toBe("unchanged");
    expect(calls).toHaveLength(1);
  });

  it("refuses an edit of a record another session changed, or that is gone", async () => {
    const existing: DataRecord = { id, tenant_id: tenantId, revision: 3, ...payload };
    const edited = { ...payload, name: "Northwind Defense" };
    const changed = client({ ...existing, name: "Theirs", revision: 4 });
    await expect(
      saveRecordOnce(changed.client, context, parties, { id, payload: edited, existing }),
    ).rejects.toMatchObject({ reason: "changed" });
    expect(changed.calls).toHaveLength(1);
    const gone = client(null);
    await expect(
      saveRecordOnce(gone.client, context, parties, { id, payload: edited, existing }),
    ).rejects.toMatchObject({ reason: "missing" });
    // A record that moves on between the lookup and the update is the same conflict.
    const raced = client({ ...existing }, { data: null, error: { code: "PGRST116", message: "" } });
    await expect(
      saveRecordOnce(raced.client, context, parties, { id, payload: edited, existing }),
    ).rejects.toMatchObject({ reason: "changed" });
  });

  it("refuses an edit of a record its revision workflow manages, before it reads", async () => {
    const { client: db, calls } = client(null);
    await expect(
      saveRecordOnce(db, context, parties, { id, payload, existing: { id, ...payload } }),
    ).rejects.toThrow("This record is managed through its published revision workflow.");
    expect(calls).toHaveLength(0);
  });

  it("keeps saveRecord's words for a refused write", async () => {
    const refused = (code: string, message = "") =>
      client(null, { data: null, error: { code, message } }).client;
    await expect(
      saveRecordOnce(refused("23505"), context, parties, { id, payload }),
    ).rejects.toThrow("A record with this identifier or relationship already exists.");
    await expect(
      saveRecordOnce(refused("23503"), context, parties, { id, payload }),
    ).rejects.toThrow("Choose existing related records from the same workspace.");
    await expect(
      saveRecordOnce(refused("P0001", "A nested system needs a parent"), context, parties, {
        id,
        payload,
      }),
    ).rejects.toThrow("A nested system needs a parent");
    const issues = { ...parties, name: "operational_issues" };
    const existing: DataRecord = { id, revision: 2, program_id: uuid(5) };
    const moved = client(
      { ...existing },
      { data: null, error: { code: "23503", message: 'violates "issue_requirements"' } },
    );
    await expect(
      saveRecordOnce(moved.client, context, issues, {
        id,
        payload: { program_id: uuid(6) },
        existing,
      }),
    ).rejects.toThrow("This issue names requirements of its program.");
  });

  it("says what the lookup's failure was, and writes nothing", async () => {
    const { client: db, calls } = fakeClient(() => ({
      data: null,
      error: { message: "TypeError: Failed to fetch" },
    }));
    await expect(saveRecordOnce(db, context, parties, { id, payload })).rejects.toThrow(
      "Failed to fetch",
    );
    expect(calls).toHaveLength(1);
  });

  it("leaves the workspace out of a collection that keeps none", async () => {
    const shared = { ...parties, columns: parties.columns.filter((c) => c.name !== "tenant_id") };
    const { client: db, calls } = client(null);
    await saveRecordOnce(db, context, shared, { id, payload });
    expect(filter(calls[0], "eq", "tenant_id")).toBeUndefined();
    expect(args(calls[1], "insert")[0]?.[0]).toEqual({ ...payload, id });
  });
});
