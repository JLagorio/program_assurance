import { describe, expect, it } from "vitest";
import { args, fakeClient, filter, uuid, type FakeResult } from "./testing/fake-client";

const { SaveOnceConflict, onceStep, sameValue, saveOnce } = await import("./save-once");

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

  it("finds a first try that Postgres hands back in its own spelling", async () => {
    const sent = {
      title: "Encrypt data at rest",
      score: "7.50",
      due_at: new Date("2026-11-15T10:00:00Z").toISOString(),
      owner_party_id: uuid(7).toUpperCase(),
      payload: { b: [1, { c: true }], a: null },
      tags: ["one", "two"],
    };
    const { client: db, calls } = client({
      id,
      revision: 1,
      title: "Encrypt data at rest",
      score: 7.5,
      due_at: "2026-11-15T10:00:00+00:00",
      owner_party_id: uuid(7),
      payload: { a: null, b: [1, { c: true }] },
      tags: ["one", "two"],
    });
    const result = await saveOnce(db, context, {
      table: "requirement_revisions",
      id,
      values: sent as never,
    });
    expect(result.outcome).toBe("unchanged");
    expect(calls).toHaveLength(1);
  });

  it("says what the lookup's failure was", async () => {
    const { client: db } = fakeClient(() => ({ data: null, error: { message: "timeout" } }));
    await expect(
      saveOnce(db, context, { table: "requirement_revisions", id, values }),
    ).rejects.toThrow("timeout");
  });
});

describe("a stored value is the one a form sent", () => {
  it("in Postgres's own spelling", () => {
    expect(sameValue(7.5, "7.50")).toBe(true);
    expect(sameValue("2026-11-15T10:00:00+00:00", "2026-11-15T10:00:00.000Z")).toBe(true);
    expect(sameValue(uuid(3), uuid(3).toUpperCase())).toBe(true);
    expect(sameValue({ a: 1, b: [2] }, { b: [2], a: 1 })).toBe(true);
    expect(sameValue(null, undefined)).toBe(true);
  });

  it("and not another value", () => {
    expect(sameValue(7.5, "7.6")).toBe(false);
    expect(sameValue(0, "")).toBe(false);
    expect(sameValue("2026-11-15T10:00:00+00:00", "2026-11-15T10:01:00.000Z")).toBe(false);
    expect(sameValue("Name", "name")).toBe(false);
    expect(sameValue(["one"], ["one", "two"])).toBe(false);
    expect(sameValue({ a: 1 }, { a: 2 })).toBe(false);
    expect(sameValue("value", null)).toBe(false);
    expect(sameValue(false, null)).toBe(false);
  });
});

describe("what a retry-safe save does with what its id found", () => {
  const values = { title: "After" };
  it("creates where nothing is found, and refuses an edit of a record that is gone", () => {
    expect(onceStep(null, { values })).toBe("create");
    expect(() => onceStep(null, { values, revision: 2 })).toThrow(SaveOnceConflict);
  });

  it("writes nothing where the record holds the values, at any revision", () => {
    expect(onceStep({ id, revision: 5, title: "After" }, { values, revision: 2 })).toBe(
      "unchanged",
    );
    expect(onceStep({ id, revision: 1, title: "After" }, { values })).toBe("unchanged");
  });

  it("edits only at the revision the reader opened", () => {
    expect(onceStep({ id, revision: 2, title: "Before" }, { values, revision: 2 })).toBe("update");
    expect(() => onceStep({ id, revision: 3, title: "Before" }, { values, revision: 2 })).toThrow(
      expect.objectContaining({ reason: "changed" }),
    );
    expect(() => onceStep({ id, revision: 1, title: "Before" }, { values })).toThrow(
      expect.objectContaining({ reason: "different" }),
    );
  });
});
