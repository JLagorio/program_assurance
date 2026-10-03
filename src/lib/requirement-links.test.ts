import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { allocateRequirement, allocateRequirementsToSystem, removeRequirementLink } =
  await import("./requirement-links");

type Result = { data: unknown; error: { code?: string; message: string } | null };
type Call = { table: string; steps: [string, unknown[]][] };

/**
 * A stand-in for the Supabase client: every `from(table)` chain is recorded, and resolves (when
 * awaited, or at `maybeSingle`) to the next queued result.
 */
function fakeClient(results: Result[]) {
  const calls: Call[] = [];
  const queue = [...results];
  const next = () => Promise.resolve(queue.shift() ?? { data: null, error: null });
  const client = {
    from(table: string) {
      const call: Call = { table, steps: [] };
      calls.push(call);
      const builder: Record<string, unknown> = {};
      for (const name of ["select", "delete", "insert", "eq", "in", "setHeader"])
        builder[name] = (...args: unknown[]) => {
          call.steps.push([name, args]);
          return builder;
        };
      builder["maybeSingle"] = () => {
        call.steps.push(["maybeSingle", []]);
        return next();
      };
      builder["then"] = (
        resolve: (value: Result) => unknown,
        reject: (reason: unknown) => unknown,
      ) => next().then(resolve, reject);
      return builder;
    },
  };
  return { client: client as never, calls };
}

const tenantId = "00000000-0000-4000-8000-000000000001";
const context = { tenantId, token: "token" };
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const steps = (call: Call | undefined) => call?.steps.map(([name]) => name);
const filters = (call: Call | undefined) =>
  Object.fromEntries(
    (call?.steps ?? [])
      .filter(([name]) => name === "eq")
      .map(([, args]) => args as [string, unknown]),
  );

describe("removing a requirement link", () => {
  it("deletes the row at the revision the reader saw", async () => {
    const { client, calls } = fakeClient([{ data: [{ id: id(5) }], error: null }]);
    await expect(
      removeRequirementLink(client, context, {
        table: "requirement_evidence",
        id: id(5),
        revision: 3,
      }),
    ).resolves.toEqual({ removed: true, mappingsRemoved: 0 });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("requirement_evidence");
    expect(steps(calls[0])).toContain("delete");
    expect(filters(calls[0])).toEqual({ tenant_id: tenantId, id: id(5), revision: 3 });
  });

  it("counts a row that is already gone as removed, so a retry succeeds", async () => {
    const { client } = fakeClient([
      { data: [], error: null },
      { data: null, error: null },
    ]);
    await expect(
      removeRequirementLink(client, context, {
        table: "requirement_control_links",
        id: id(6),
        revision: 1,
      }),
    ).resolves.toEqual({ removed: false, mappingsRemoved: 0 });
  });

  it("refuses a row that changed since it was read", async () => {
    const { client } = fakeClient([
      { data: [], error: null },
      { data: { id: id(6), revision: 2 }, error: null },
    ]);
    await expect(
      removeRequirementLink(client, context, {
        table: "requirement_control_links",
        id: id(6),
        revision: 1,
      }),
    ).rejects.toThrow("This control mapping changed in another session");
  });

  it("says why a historical revision keeps its links", async () => {
    const { client } = fakeClient([
      {
        data: null,
        error: {
          code: "23514",
          message: "Content of a historical requirement revision cannot change",
        },
      },
    ]);
    await expect(
      removeRequirementLink(client, context, {
        table: "requirement_evidence",
        id: id(7),
        revision: 1,
      }),
    ).rejects.toThrow("no longer the current one");
  });

  it("passes on the schema's own words for any other check", async () => {
    const { client } = fakeClient([
      {
        data: null,
        error: {
          code: "23514",
          message: "The allocated system must belong to the requirement program",
        },
      },
    ]);
    await expect(
      removeRequirementLink(client, context, {
        table: "requirement_evidence",
        id: id(7),
        revision: 1,
      }),
    ).rejects.toThrow("The allocated system must belong to the requirement program");
  });

  it("removes an allocation's control mappings for its system first", async () => {
    const { client, calls } = fakeClient([
      {
        data: { id: id(8), requirement_revision_id: id(20), system_id: id(30) },
        error: null,
      },
      { data: [{ id: id(40) }], error: null },
      { data: [], error: null },
      { data: [{ id: id(8) }], error: null },
    ]);
    await expect(
      removeRequirementLink(client, context, {
        table: "requirement_allocations",
        id: id(8),
        revision: 2,
        mappings: [{ id: id(40), revision: 4 }],
      }),
    ).resolves.toEqual({ removed: true, mappingsRemoved: 1 });
    expect(calls.map((call) => call.table)).toEqual([
      "requirement_allocations",
      "requirement_control_links",
      "requirement_control_links",
      "requirement_allocations",
    ]);
    expect(filters(calls[1])).toEqual({ tenant_id: tenantId, id: id(40), revision: 4 });
    expect(filters(calls[2])).toEqual({
      tenant_id: tenantId,
      requirement_revision_id: id(20),
      system_id: id(30),
    });
    expect(steps(calls[3])).toContain("delete");
  });

  it("keeps an allocation whose system gained a mapping the reader was not shown", async () => {
    const { client, calls } = fakeClient([
      {
        data: { id: id(8), requirement_revision_id: id(20), system_id: id(30) },
        error: null,
      },
      { data: [{ id: id(41) }], error: null },
    ]);
    await expect(
      removeRequirementLink(client, context, {
        table: "requirement_allocations",
        id: id(8),
        revision: 2,
        mappings: [],
      }),
    ).rejects.toThrow("Another control mapping was recorded for this system");
    expect(
      calls.some(
        (call) => call.table === "requirement_allocations" && steps(call)?.includes("delete"),
      ),
    ).toBe(false);
  });

  it("rejects a request that is not a requirement link", async () => {
    const { client, calls } = fakeClient([]);
    await expect(
      removeRequirementLink(client, context, {
        table: "systems" as never,
        id: id(9),
        revision: 1,
      }),
    ).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });
});

describe("allocating a requirement", () => {
  const request = {
    requirementRevisionId: id(20),
    targets: [
      { id: id(1), systemId: id(30) },
      { id: id(2), systemId: id(31) },
    ],
    rationale: "  Owns the boundary  ",
  };

  it("inserts every chosen system in one write with one rationale", async () => {
    const { client, calls } = fakeClient([
      { data: [], error: null },
      { data: null, error: null },
    ]);
    await expect(allocateRequirement(client, context, request)).resolves.toEqual({
      allocationIds: [id(1), id(2)],
      created: 2,
    });
    const insert = calls[1]!.steps.find(([name]) => name === "insert");
    expect(insert?.[1][0]).toEqual([
      {
        id: id(1),
        tenant_id: tenantId,
        requirement_revision_id: id(20),
        system_id: id(30),
        rationale: "Owns the boundary",
      },
      {
        id: id(2),
        tenant_id: tenantId,
        requirement_revision_id: id(20),
        system_id: id(31),
        rationale: "Owns the boundary",
      },
    ]);
  });

  it("inserts only what an earlier attempt did not, on a retry", async () => {
    const { client, calls } = fakeClient([
      {
        data: [
          {
            id: id(1),
            requirement_revision_id: id(20),
            system_id: id(30),
            rationale: "Owns the boundary",
          },
        ],
        error: null,
      },
      { data: null, error: null },
    ]);
    await expect(allocateRequirement(client, context, request)).resolves.toMatchObject({
      created: 1,
    });
    const insert = calls[1]!.steps.find(([name]) => name === "insert");
    expect((insert?.[1][0] as { id: string }[]).map((row) => row.id)).toEqual([id(2)]);
  });

  it("refuses a retry when a row with the same id now says something else", async () => {
    const { client, calls } = fakeClient([
      {
        data: [{ id: id(1), requirement_revision_id: id(20), system_id: id(99), rationale: null }],
        error: null,
      },
    ]);
    await expect(allocateRequirement(client, context, request)).rejects.toThrow(
      "An allocation changed after this attempt",
    );
    expect(calls).toHaveLength(1);
  });

  it("needs at least one system", async () => {
    const { client } = fakeClient([]);
    await expect(allocateRequirement(client, context, { ...request, targets: [] })).rejects.toThrow(
      "Choose a system.",
    );
  });
});

describe("allocating many requirements to one system", () => {
  const targets = Array.from({ length: 538 }, (_, index) => ({
    id: id(1000 + index),
    requirementRevisionId: id(5000 + index),
  }));
  const request = { systemId: id(30), targets, rationale: "  Owns the boundary  " };

  it("writes every chosen requirement in one insert on a first attempt", async () => {
    const { client, calls } = fakeClient([{ data: null, error: null }]);
    await expect(allocateRequirementsToSystem(client, context, request)).resolves.toMatchObject({
      created: 538,
    });
    expect(calls).toHaveLength(1);
    const rows = calls[0]!.steps.find(([name]) => name === "insert")?.[1][0] as {
      id: string;
      requirement_revision_id: string;
      system_id: string;
      rationale: string;
    }[];
    expect(rows).toHaveLength(538);
    expect(rows[0]).toEqual({
      id: id(1000),
      tenant_id: tenantId,
      requirement_revision_id: id(5000),
      system_id: id(30),
      rationale: "Owns the boundary",
    });
  });

  it("on a retry, looks up its ids a hundred at a time and inserts only the rest", async () => {
    const landed = targets.slice(0, 120).map((target) => ({
      id: target.id,
      requirement_revision_id: target.requirementRevisionId,
      system_id: id(30),
      rationale: "Owns the boundary",
    }));
    const { client, calls } = fakeClient([
      { data: landed.slice(0, 100), error: null },
      { data: landed.slice(100), error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: null, error: null },
    ]);
    await expect(
      allocateRequirementsToSystem(client, context, { ...request, retry: true }),
    ).resolves.toMatchObject({ created: 418 });
    const lookups = calls.filter((call) => steps(call)?.includes("in"));
    expect(lookups).toHaveLength(6);
    expect(
      lookups.every(
        (call) => (call.steps.find(([name]) => name === "in")?.[1][1] as string[]).length <= 100,
      ),
    ).toBe(true);
    const rows = calls.at(-1)!.steps.find(([name]) => name === "insert")?.[1][0] as unknown[];
    expect(rows).toHaveLength(418);
  });

  it("refuses a retry when one of its rows now says something else", async () => {
    const { client } = fakeClient([
      {
        data: [
          {
            id: id(1000),
            requirement_revision_id: id(5000),
            system_id: id(99),
            rationale: "Owns the boundary",
          },
        ],
        error: null,
      },
    ]);
    await expect(
      allocateRequirementsToSystem(client, context, {
        ...request,
        targets: targets.slice(0, 1),
        retry: true,
      }),
    ).rejects.toThrow("An allocation changed after this attempt");
  });

  it("says another session allocated one of them when the insert meets a duplicate", async () => {
    const { client } = fakeClient([
      { data: null, error: { code: "23505", message: "duplicate key value" } },
    ]);
    await expect(allocateRequirementsToSystem(client, context, request)).rejects.toThrow(
      "allocated to this system in another session",
    );
  });

  it("needs at least one requirement", async () => {
    const { client } = fakeClient([]);
    await expect(
      allocateRequirementsToSystem(client, context, { ...request, targets: [] }),
    ).rejects.toThrow("Choose a requirement.");
  });
});
