import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import type { FakeCall, FakeResult } from "./testing/fake-client";
import { uuid } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { readServerCount, readServerPage, readServerResult, serverQuestion } =
  await import("./server-table");
const {
  determinations,
  evidenceReviewDecisions,
  operationalIssueStatuses,
  riskLevels,
  riskStatuses,
  severityLevels,
  taskPriorities,
  taskStatuses,
} = await import("./status");
type ServerRead = import("./server-table").ServerRead;

/**
 * A stand-in for the Supabase client that records every step of a chain, whatever its name
 * (`ilike`, `overlaps`, `gte` and the rest), and answers when the chain is awaited.
 */
function recordingClient(answer: (call: FakeCall) => FakeResult) {
  const calls: FakeCall[] = [];
  const chain = (call: FakeCall): unknown =>
    new Proxy(
      {},
      {
        get(_target, name) {
          if (name === "then")
            return (resolve: (value: FakeResult) => unknown, reject: (cause: unknown) => unknown) =>
              Promise.resolve()
                .then(() => answer(call))
                .then(resolve, reject);
          return (...args: unknown[]) => {
            call.steps.push([String(name), args]);
            return chain(call);
          };
        },
      },
    );
  const client = {
    from(table: string) {
      const call: FakeCall = { table, steps: [] };
      calls.push(call);
      return chain(call);
    },
  };
  return { client: client as never, calls };
}
const steps = (call: FakeCall | undefined, name: string) =>
  (call?.steps ?? []).filter(([step]) => step === name).map(([, args]) => args);

const tenantId = uuid(900);
const context = { tenantId, token: "token" };
const statuses = {
  draft: { label: "Draft" },
  active: { label: "Active" },
  deprecated: { label: "Deprecated" },
};
const read: ServerRead = {
  source: "cci_item_rows",
  model: "cci_items",
  columns: ["id", "code", "definition", "status", "types", "controls", "published_on"],
  search: ["code", "definition", "controls"],
  fields: {
    types: { filter: "list", emptyLabel: "Not recorded", sort: false },
    status: { labels: statuses },
    published_on: { filter: "range" },
  },
  order: [{ column: "code" }],
};
const page = (pageIndex: number, extra: Partial<Parameters<typeof serverQuestion>[1]> = {}) => ({
  pageIndex,
  pageSize: 25,
  ...extra,
});

describe("reading one page of a register", () => {
  it("asks for one page of the named columns, with the whole result's count", async () => {
    const { client, calls } = recordingClient(() => ({
      data: [{ id: uuid(1) }],
      error: null,
      count: 62,
    }));
    const result = await readServerPage(client, context, read, page(2));
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("cci_item_rows");
    expect(steps(calls[0], "select")[0]).toEqual([
      "id,code,definition,status,types,controls,published_on",
      { count: "exact", head: false },
    ]);
    expect(steps(calls[0], "range")).toEqual([[50, 74]]);
    expect(steps(calls[0], "or")[0]).toEqual([`tenant_id.eq.${tenantId},tenant_id.is.null`]);
    // The read's own order when the reader chose none, then the id that keeps paging stable.
    expect(steps(calls[0], "order")).toEqual([
      ["code", { ascending: true, nullsFirst: false }],
      ["id"],
    ]);
    expect(result).toMatchObject({
      rows: [{ id: uuid(1) }],
      count: 62,
      pageIndex: 2,
      pageSize: 25,
    });
    // Every page of one result names the same result.
    const { client: other } = recordingClient(() => ({ data: [], error: null, count: 62 }));
    expect((await readServerPage(other, context, read, page(0))).result).toBe(result.result);
  });

  it("sorts by the reader's column, through the column a field names", async () => {
    const { client, calls } = recordingClient(() => ({ data: [], error: null, count: 0 }));
    await readServerPage(
      client,
      context,
      { ...read, fields: { ...read.fields, code: { sort: "code_order" } } },
      page(0, { sorting: [{ id: "code", desc: true }] }),
    );
    // Empty values come first descending: the ascending order read backwards, as a table sorts.
    expect(steps(calls[0], "order")).toEqual([
      ["code_order", { ascending: false, nullsFirst: true }],
      ["id"],
    ]);
    const { client: ascending, calls: asked } = recordingClient(() => ({
      data: [],
      error: null,
      count: 0,
    }));
    await readServerPage(
      ascending,
      context,
      read,
      page(0, { sorting: [{ id: "code", desc: false }] }),
    );
    expect(steps(asked[0], "order")[0]).toEqual(["code", { ascending: true, nullsFirst: false }]);
  });

  it("leaves out a sort or a filter on a column the read does not know", async () => {
    const asked = serverQuestion(read, {
      ...page(0),
      search: "  access  ",
      sorting: [
        { id: "unknown", desc: false },
        { id: "types", desc: false },
      ],
      filters: [
        { id: "unknown", value: ["a"] },
        { id: "status", value: [] },
        { id: "status", value: ["active"] },
      ],
    });
    expect(asked.search).toBe("access");
    // Types cannot sort; an empty choice asks nothing.
    expect(asked.sorting).toEqual([]);
    expect(asked.filters).toEqual([{ id: "status", value: ["active"] }]);
  });

  it("searches every text column by substring and a status by its words", async () => {
    const { client, calls } = recordingClient(() => ({ data: [], error: null, count: 0 }));
    await readServerPage(client, context, read, page(0, { search: "act, 5%" }));
    // The search's own commas stay text, and its % and _ match themselves.
    const pattern = '"*act, 5\\\\%*"';
    expect(steps(calls[0], "or")[1]).toEqual([
      `code.ilike.${pattern},definition.ilike.${pattern},controls.ilike.${pattern}`,
    ]);
    const { client: second, calls: secondCalls } = recordingClient(() => ({
      data: [],
      error: null,
      count: 0,
    }));
    await readServerPage(second, context, read, page(0, { search: "ACT" }));
    expect(steps(secondCalls[0], "or")[1]?.[0]).toContain('status.in.("active")');
  });

  it("filters a value, a list, a range and a row with none", async () => {
    const { client, calls } = recordingClient(() => ({ data: [], error: null, count: 0 }));
    await readServerPage(
      client,
      context,
      read,
      page(0, {
        filters: [
          { id: "status", value: ["active", "draft"] },
          { id: "types", value: ["technical"] },
          { id: "published_on", value: ["2020-01-01", undefined] },
          { id: "definition", value: { contains: "audit" } },
        ],
      }),
    );
    expect(steps(calls[0], "in")).toEqual([["status", ["active", "draft"]]]);
    expect(steps(calls[0], "overlaps")).toEqual([["types", ["technical"]]]);
    expect(steps(calls[0], "gte")).toEqual([["published_on", "2020-01-01"]]);
    expect(steps(calls[0], "lte")).toEqual([]);
    expect(steps(calls[0], "ilike")).toEqual([["definition", "%audit%"]]);

    const { client: none, calls: noneCalls } = recordingClient(() => ({
      data: [],
      error: null,
      count: 0,
    }));
    await readServerPage(
      none,
      context,
      read,
      page(0, { filters: [{ id: "types", value: ["Not recorded", "policy"] }] }),
    );
    expect(steps(noneCalls[0], "or")[1]).toEqual(['types.ov.{"policy"},types.eq.{}']);
  });

  it("applies the scope, and reads nothing for an empty list", async () => {
    const { client, calls } = recordingClient(() => ({ data: [], error: null, count: 0 }));
    await readServerPage(
      client,
      context,
      { ...read, scope: { cci_revision_id: uuid(3) } },
      page(0),
    );
    expect(steps(calls[0], "eq")).toEqual([["cci_revision_id", uuid(3)]]);
    const empty = await readServerPage(
      client,
      context,
      { ...read, scope: { cci_revision_id: [] } },
      page(0),
    );
    expect(empty).toMatchObject({ rows: [], count: 0, pageIndex: 0, pageSize: 25 });
    expect(calls).toHaveLength(1);
  });

  it("answers a page past the last row with no rows and the count", async () => {
    const { client } = recordingClient(() => ({
      data: null,
      error: {
        code: "PGRST103",
        message: "Requested range not satisfiable",
        details: "An offset of 1000 was requested, but there are only 62 rows.",
      } as FakeResult["error"],
      count: null,
    }));
    await expect(readServerPage(client, context, read, page(40))).resolves.toMatchObject({
      rows: [],
      count: 62,
      pageIndex: 40,
      pageSize: 25,
    });
  });

  it("says a failed read", async () => {
    const { client } = recordingClient(() => ({
      data: null,
      error: { message: "permission denied for view cci_item_rows" },
      count: null,
    }));
    await expect(readServerPage(client, context, read, page(0))).rejects.toThrow(
      "permission denied for view cci_item_rows",
    );
  });
});

describe("reading a whole result or its count", () => {
  it("says whether the reader chose the page's order", async () => {
    const { client } = recordingClient(() => ({ data: [], error: null, count: 0 }));
    expect((await readServerPage(client, context, read, page(0))).sorted).toBe(false);
    const sorted = await readServerPage(
      client,
      context,
      read,
      page(0, { sorting: [{ id: "code", desc: false }] }),
    );
    expect(sorted.sorted).toBe(true);
  });

  it("counts a question without reading its rows", async () => {
    const { client, calls } = recordingClient(() => ({ data: null, error: null, count: 17 }));
    await expect(
      readServerCount(client, context, read, { filters: [{ id: "status", value: ["active"] }] }),
    ).resolves.toBe(17);
    expect(steps(calls[0], "select")[0]).toEqual(["id", { count: "exact", head: true }]);
    expect(steps(calls[0], "in")).toEqual([["status", ["active"]]]);
    expect(steps(calls[0], "range")).toEqual([]);
    expect(steps(calls[0], "order")).toEqual([]);
  });

  it("reads every page of a result, in its order, for an export", async () => {
    const rows = Array.from({ length: 620 }, (_, index) => ({ id: uuid(index + 1) }));
    const { client, calls } = recordingClient((call) => {
      const [[from, to]] = steps(call, "range") as [[number, number]];
      return { data: rows.slice(from, to + 1), error: null, count: rows.length };
    });
    const result = await readServerResult(client, context, read, {
      sorting: [{ id: "code", desc: true }],
    });
    expect(result).toEqual(rows);
    expect(calls.map((call) => steps(call, "range")[0])).toEqual([
      [0, 499],
      [500, 999],
    ]);
    expect(steps(calls[0], "order")[0]).toEqual(["code", { ascending: false, nullsFirst: true }]);
  });

  it("refuses a result past what an export takes, rather than cutting it short", async () => {
    const { client } = recordingClient(() => ({ data: [], error: null, count: 20_000 }));
    await expect(readServerResult(client, context, read, {}, { limit: 10_000 })).rejects.toThrow(
      "more than an export takes",
    );
  });
});

describe("the registers' views", () => {
  const migrations = fileURLToPath(new URL("../../supabase/migrations", import.meta.url));
  const sql = readdirSync(migrations)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => readFileSync(`${migrations}/${name}`, "utf8"))
    .join("\n");
  /** The values a view's rank column lists, in the order it ranks them. */
  function ranks(view: string, column: string) {
    const body = sql.slice(sql.lastIndexOf(`create view public.${view} `));
    const end = body.indexOf(";\n");
    for (const match of body
      .slice(0, end)
      .matchAll(/array_position\(\s*'\{([^}]*)\}'::text\[\][\s\S]*?\)\s+as\s+(\w+_rank)\b/g))
      if (match[2] === column) return match[1]!.split(",");
    return undefined;
  }

  it("rank each status as the product's vocabulary orders it", () => {
    const expected: [string, string, readonly string[]][] = [
      ["risk_rows", "status_rank", Object.keys(riskStatuses)],
      ["risk_rows", "severity_rank", Object.keys(severityLevels)],
      ["risk_rows", "likelihood_rank", Object.keys(riskLevels)],
      ["risk_rows", "impact_rank", Object.keys(riskLevels)],
      ["operational_issue_rows", "status_rank", Object.keys(operationalIssueStatuses)],
      ["operational_issue_rows", "severity_rank", Object.keys(severityLevels)],
      ["assessment_finding_rows", "determination_rank", Object.keys(determinations)],
      [
        "evidence_artifact_rows",
        "review_rank",
        ["not_reviewed", ...Object.keys(evidenceReviewDecisions)],
      ],
      ["task_rows", "status_rank", Object.keys(taskStatuses)],
      ["task_rows", "priority_rank", Object.keys(taskPriorities)],
    ];
    for (const [view, column, values] of expected)
      expect(ranks(view, column), `${view}.${column}`).toEqual(values);
  });
});
