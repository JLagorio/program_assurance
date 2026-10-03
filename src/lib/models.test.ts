import { describe, expect, it, vi } from "vitest";
import { args, fakeClient, filter, uuid, type FakeCall } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const {
  CHANGED_ELSEWHERE,
  idSet,
  isTenantScoped,
  normalizeFilters,
  readRows,
  selectClause,
  writeRow,
} = await import("./models");

const tenantId = uuid(900);
const context = { tenantId, token: "token" };
const rows = (...ids: number[]) => ids.map((n) => ({ id: uuid(n) }));
const range = (call: FakeCall | undefined) => args(call, "range")[0];

describe("reading rows", () => {
  it("keeps every model inside the workspace and the shared reference rows", async () => {
    const { client, calls } = fakeClient(() => ({ data: rows(1), error: null, count: 1 }));
    await readRows(client, context, "controls", { catalog_revision_id: uuid(3) });
    expect(args(calls[0], "or")).toEqual([[`tenant_id.eq.${tenantId},tenant_id.is.null`]]);
    expect(filter(calls[0], "eq", "catalog_revision_id")).toBe(uuid(3));
    expect(isTenantScoped("tenants")).toBe(false);
    expect(isTenantScoped("selected_controls")).toBe(true);
  });

  it("asks only for the named columns", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readRows(client, context, "controls", {}, { columns: ["id", "code", "title"] });
    expect(args(calls[0], "select")[0]?.[0]).toBe("id,code,title");
  });

  it("reads an empty list as no rows, without a request", async () => {
    const { client, calls } = fakeClient(() => ({ data: rows(1), error: null, count: 1 }));
    await expect(
      readRows(client, context, "selected_controls", { profile_resolution_id: [] }),
    ).resolves.toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("filters empty values with `is` and lists with `in`", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readRows(client, context, "systems", {
      parent_system_id: null,
      id: [uuid(2), uuid(1), uuid(2)],
    });
    expect(filter(calls[0], "is", "parent_system_id")).toBeNull();
    // One spelling: sorted, without repeats.
    expect(filter(calls[0], "in", "id")).toEqual([uuid(1), uuid(2)]);
  });

  it("reads a long list in parts and puts the rows back in one order", async () => {
    const ids = Array.from({ length: 150 }, (_, index) => uuid(index + 1));
    const { client, calls } = fakeClient((call) => {
      const asked = filter(call, "in", "profile_resolution_id") as string[];
      // Each part answers in id order; between them the ids interleave.
      return asked.includes(uuid(1))
        ? { data: rows(5, 9), error: null, count: 2 }
        : { data: rows(1, 7), error: null, count: 2 };
    });
    const found = await readRows(client, context, "selected_controls", {
      profile_resolution_id: ids,
    });
    expect(calls).toHaveLength(2);
    expect(
      calls.map((call) => (filter(call, "in", "profile_resolution_id") as string[]).length),
    ).toEqual([100, 50]);
    expect(found).toEqual(rows(1, 5, 7, 9));
  });

  it("splits every long list, so no request carries more than a hundred ids of one", async () => {
    const systems = Array.from({ length: 120 }, (_, index) => uuid(index + 1));
    const resolutions = Array.from({ length: 130 }, (_, index) => uuid(index + 501));
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readRows(client, context, "system_effective_baselines", {
      system_id: systems,
      profile_resolution_id: resolutions,
    });
    expect(calls).toHaveLength(4);
    for (const call of calls) {
      expect((filter(call, "in", "system_id") as string[]).length).toBeLessThanOrEqual(100);
      expect((filter(call, "in", "profile_resolution_id") as string[]).length).toBeLessThanOrEqual(
        100,
      );
    }
  });

  it("filters through references with an inner join the rows leave out", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readRows(client, context, "requirement_allocations", {
      "requirement_revisions.engineering_requirements.program_id": uuid(7),
    });
    expect(args(calls[0], "select")[0]?.[0]).toBe(
      "*,requirement_revisions!inner(engineering_requirements!inner())",
    );
    expect(
      filter(calls[0], "eq", "requirement_revisions.engineering_requirements.program_id"),
    ).toBe(uuid(7));
  });

  it("pages past a thousand rows, the first page bringing the total", async () => {
    const page = (offset: number, size: number) =>
      Array.from({ length: size }, (_, index) => ({ id: uuid(offset + index) }));
    const { client, calls } = fakeClient((call) => {
      const [from] = range(call) as [number, number];
      return { data: page(from, from < 2000 ? 1000 : 500), error: null, count: 2500 };
    });
    const found = await readRows(client, context, "controls");
    expect(found).toHaveLength(2500);
    expect(calls.map(range)).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
    // Only the first page asks for the count.
    expect(args(calls[0], "select")[0]?.[1]).toEqual({ count: "exact" });
    expect(args(calls[1], "select")[0]?.[1]).toBeUndefined();
  });

  it("orders by the named column, then by id", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readRows(client, context, "controls", {}, { order: { column: "ordinal" } });
    expect(args(calls[0], "order").map(([column]) => column)).toEqual(["ordinal", "id"]);
  });

  it("refuses a collection too large for a screen", async () => {
    const { client } = fakeClient(() => ({
      data: rows(...Array(1000).keys()),
      error: null,
      count: 100_001,
    }));
    await expect(readRows(client, context, "selected_controls")).rejects.toThrow(
      "Narrow its scope",
    );
  });

  it("says what the database refused", async () => {
    const { client } = fakeClient(() => ({ data: null, error: { message: "permission denied" } }));
    await expect(readRows(client, context, "controls")).rejects.toThrow("permission denied");
  });

  it("spells equal filters and ids once", () => {
    expect(normalizeFilters({ id: [uuid(3), uuid(1), uuid(3)], state: "draft" })).toEqual({
      id: [uuid(1), uuid(3)],
      state: "draft",
    });
    expect(idSet([uuid(2), null, undefined, uuid(1), uuid(2)])).toEqual([uuid(1), uuid(2)]);
  });

  it("joins every level of a dotted filter once", () => {
    expect(
      selectClause(["id"], {
        "requirement_revisions.engineering_requirements.program_id": uuid(1),
        "requirement_revisions.state": "draft",
        system_id: uuid(2),
      }),
    ).toBe("id,requirement_revisions!inner(engineering_requirements!inner())");
    expect(selectClause(undefined, {})).toBe("*");
  });
});

describe("writing a row", () => {
  it("creates inside the workspace", async () => {
    const { client, calls } = fakeClient(() => ({ data: { id: uuid(1) }, error: null }));
    await writeRow(client, context, "tasks", { values: { title: "Review" } as never });
    expect(args(calls[0], "insert")[0]?.[0]).toEqual({ title: "Review", tenant_id: tenantId });
  });

  it("updates only at the revision the reader edited", async () => {
    const { client, calls } = fakeClient(() => ({ data: { id: uuid(1) }, error: null }));
    await writeRow(client, context, "tasks", {
      values: { title: "Next" },
      id: uuid(1),
      revision: 4,
    });
    expect(args(calls[0], "update")[0]?.[0]).toEqual({ title: "Next", revision: 5 });
    expect(filter(calls[0], "eq", "id")).toBe(uuid(1));
    expect(filter(calls[0], "eq", "revision")).toBe(4);
  });

  it("says a stale revision changed elsewhere, instead of overwriting it", async () => {
    const { client } = fakeClient(() => ({ data: null, error: { code: "PGRST116", message: "" } }));
    await expect(
      writeRow(client, context, "tasks", { values: { title: "Next" }, id: uuid(1), revision: 4 }),
    ).rejects.toThrow(CHANGED_ELSEWHERE);
  });

  it("asks for a reload when an edit has no revision", async () => {
    const { client, calls } = fakeClient(() => ({ data: null, error: null }));
    await expect(
      writeRow(client, context, "tasks", { values: { title: "Next" }, id: uuid(1) }),
    ).rejects.toThrow("Reload the record");
    expect(calls).toHaveLength(0);
  });
});
