import { describe, expect, it, vi } from "vitest";
import { args, fakeClient, filter, uuid, type FakeResult } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { SaveOnceConflict, saveOnce } = await import("./save-once");

const tenantId = uuid(900);
const context = { tenantId, token: "token" };
const id = uuid(1);
const values = { title: "Encrypt data at rest", statement: "The system encrypts." };

/** The lookup's answer, then the write's. */
function client(found: unknown, write: FakeResult = { data: { id }, error: null }) {
  let first = true;
  return fakeClient(() => {
    if (!first) return write;
    first = false;
    return { data: found, error: null };
  });
}

describe("a save that is safe to retry", () => {
  it("creates the record under the id the form chose, with its create-only columns", async () => {
    const { client: db, calls } = client(null);
    const result = await saveOnce(db, context, {
      table: "requirement_revisions",
      id,
      values,
      create: { version_number: 1, state: "draft" },
    });
    expect(result.outcome).toBe("created");
    expect(filter(calls[0], "eq", "tenant_id")).toBe(tenantId);
    expect(filter(calls[0], "eq", "id")).toBe(id);
    expect(args(calls[1], "insert")[0]?.[0]).toEqual({
      version_number: 1,
      state: "draft",
      ...values,
      id,
      tenant_id: tenantId,
    });
  });

  it("writes nothing when a first try already saved the same values", async () => {
    const { client: db, calls } = client({ id, revision: 1, ...values, version_number: 1 });
    const result = await saveOnce(db, context, { table: "requirement_revisions", id, values });
    expect(result.outcome).toBe("unchanged");
    expect(calls).toHaveLength(1);
  });

  it("refuses a create whose id holds other values", async () => {
    const { client: db, calls } = client({ id, revision: 1, ...values, title: "Other" });
    const saving = saveOnce(db, context, { table: "requirement_revisions", id, values });
    await expect(saving).rejects.toBeInstanceOf(SaveOnceConflict);
    await expect(saving).rejects.toMatchObject({ reason: "different" });
    expect(calls).toHaveLength(1);
  });

  it("updates an edit at the revision the reader edited", async () => {
    const { client: db, calls } = client({ id, revision: 3, title: "Before" });
    const result = await saveOnce(db, context, {
      table: "requirement_control_links",
      id,
      values: { rationale: "After" },
      revision: 3,
    });
    expect(result.outcome).toBe("updated");
    expect(args(calls[1], "update")[0]?.[0]).toEqual({ rationale: "After", revision: 4 });
    expect(filter(calls[1], "eq", "revision")).toBe(3);
  });

  it("refuses an edit of a record that changed since the reader opened it", async () => {
    const { client: db } = client({ id, revision: 4, rationale: "Theirs" });
    await expect(
      saveOnce(db, context, {
        table: "requirement_control_links",
        id,
        values: { rationale: "Mine" },
        revision: 3,
      }),
    ).rejects.toMatchObject({ reason: "changed" });
  });

  it("refuses an edit of a record that is gone", async () => {
    const { client: db } = client(null);
    await expect(
      saveOnce(db, context, {
        table: "requirement_control_links",
        id,
        values: { rationale: "Mine" },
        revision: 3,
      }),
    ).rejects.toMatchObject({ reason: "missing" });
  });

  it("says what the lookup's failure was", async () => {
    const { client: db } = fakeClient(() => ({ data: null, error: { message: "timeout" } }));
    await expect(
      saveOnce(db, context, { table: "requirement_revisions", id, values }),
    ).rejects.toThrow("timeout");
  });
});
