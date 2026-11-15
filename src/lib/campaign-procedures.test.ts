import { describe, expect, it } from "vitest";
import { args, fakeClient, filter, uuid } from "./testing/fake-client";

const {
  CAMPAIGN_RUN_COLUMNS,
  PROCEDURE_COLUMNS,
  PROCEDURE_REVISION_COLUMNS,
  RUN_REVISION_COLUMNS,
  campaignProcedureRead,
  campaignProcedureRevisionRead,
  campaignProcedureTree,
  campaignRunsTree,
  programOrShared,
  storedProcedure,
} = await import("./campaign-procedures");
const { readRows } = await import("./models");
const { readServerPage } = await import("./server-table");

const tenantId = uuid(900);
const context = { tenantId, token: "token" };

describe("a campaign's procedures and runs", () => {
  it("reads the program's procedures and those no program owns, in one request", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readRows(
      client,
      context,
      "procedures",
      { or: programOrShared(uuid(5)) },
      { columns: PROCEDURE_COLUMNS },
    );
    expect(calls).toHaveLength(1);
    expect(args(calls[0], "select")[0]?.[0]).toBe(PROCEDURE_COLUMNS.join(","));
    // The workspace's scope and the program's, each its own logic tree, which the rows meet both.
    expect(args(calls[0], "or")).toEqual([
      [`tenant_id.eq.${tenantId},tenant_id.is.null`],
      [`program_id.eq.${uuid(5)},program_id.is.null`],
    ]);
    expect(args(calls[0], "eq")).toEqual([]);
  });

  it("reads those procedures' revisions through the procedure, in one request", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readRows(
      client,
      context,
      "procedure_revisions",
      { "procedures.or": programOrShared(uuid(5)) },
      { columns: PROCEDURE_REVISION_COLUMNS },
    );
    expect(calls).toHaveLength(1);
    // The procedure is joined to filter by, and left out of the rows.
    expect(args(calls[0], "select")[0]?.[0]).toBe(
      `${PROCEDURE_REVISION_COLUMNS.join(",")},procedures!inner()`,
    );
    expect(args(calls[0], "or")).toEqual([
      [`tenant_id.eq.${tenantId},tenant_id.is.null`],
      [`program_id.eq.${uuid(5)},program_id.is.null`, { referencedTable: "procedures" }],
    ]);
  });

  it("names every column a procedure's and a revision's form edits, and not the stamps", () => {
    for (const column of ["title", "description", "owner_party_id", "program_id"])
      expect(PROCEDURE_COLUMNS).toContain(column);
    for (const column of [
      "procedure_id",
      "version_number",
      "title",
      "description",
      "method",
      "preconditions",
      "acceptance_criterion",
      "state",
      "published_by_party_id",
    ])
      expect(PROCEDURE_REVISION_COLUMNS).toContain(column);
    // The form edits only a record of the reader's workspace, at the revision the reader saw.
    for (const columns of [PROCEDURE_COLUMNS, PROCEDURE_REVISION_COLUMNS]) {
      expect(columns).toContain("tenant_id");
      expect(columns).toContain("revision");
      for (const stamp of ["created_at", "updated_at", "created_by", "updated_by"])
        expect(columns).not.toContain(stamp);
    }
  });

  it("reads the runs of the campaign's plans or its events, and none for neither", async () => {
    const tree = campaignRunsTree([uuid(2), uuid(1), uuid(2)], [uuid(3), null]);
    expect(tree).toBe(
      `plan_revision_id.in.(${uuid(1)},${uuid(2)}),assessment_event_id.in.(${uuid(3)})`,
    );
    expect(campaignRunsTree([uuid(1)], [])).toBe(`plan_revision_id.in.(${uuid(1)})`);
    expect(campaignRunsTree([], [uuid(3)])).toBe(`assessment_event_id.in.(${uuid(3)})`);
    expect(campaignRunsTree([], [])).toBeNull();
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readRows(client, context, "test_runs", { or: tree! }, { columns: CAMPAIGN_RUN_COLUMNS });
    expect(args(calls[0], "or")[1]).toEqual([tree]);
    expect(args(calls[0], "select")[0]?.[0]).toBe(CAMPAIGN_RUN_COLUMNS.join(","));
  });

  it("lists the program's procedures, those no program owns and those the runs follow", async () => {
    // A run's revision names its procedure, the program's own or another program's.
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readRows(
      client,
      context,
      "procedure_revisions",
      { id: [uuid(12), uuid(10), uuid(12)] },
      { columns: RUN_REVISION_COLUMNS },
    );
    expect(args(calls[0], "select")[0]?.[0]).toBe("id,procedure_id,title");
    expect(filter(calls[0], "in", "id")).toEqual([uuid(10), uuid(12)]);
    expect(campaignProcedureTree(uuid(5), [uuid(21), null, uuid(20), uuid(21)])).toBe(
      `program_id.eq.${uuid(5)},program_id.is.null,id.in.(${uuid(20)},${uuid(21)})`,
    );
    // With no run, the program's and those of no program.
    expect(campaignProcedureTree(uuid(5), [])).toBe(programOrShared(uuid(5)));
  });

  it("reads a page of the procedures with how many revisions each has, in one request", async () => {
    const tree = campaignProcedureTree(uuid(5), [uuid(20)]);
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 420 }));
    const result = await readServerPage(client, context, campaignProcedureRead(tree), {
      pageIndex: 1,
      pageSize: 25,
      search: "access",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("procedure_rows");
    expect(args(calls[0], "select")[0]).toEqual([
      `${PROCEDURE_COLUMNS.join(",")},versions`,
      { count: "exact", head: false },
    ]);
    // The workspace's scope, the procedures the tree names, then the search.
    expect(args(calls[0], "or")).toEqual([
      [`tenant_id.eq.${tenantId},tenant_id.is.null`],
      [tree],
      ['title.ilike."*access*",description.ilike."*access*"'],
    ]);
    // In id order, as the tab listed them, a page of 25.
    expect(args(calls[0], "order")).toEqual([["id"]]);
    expect(args(calls[0], "range")).toEqual([[25, 49]]);
    expect(result.count).toBe(420);
  });

  it("reads a page of those procedures' revisions through the procedure", async () => {
    const tree = campaignProcedureTree(uuid(5), []);
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 420 }));
    await readServerPage(client, context, campaignProcedureRevisionRead(tree), {
      pageIndex: 0,
      pageSize: 25,
      search: "examine",
      sorting: [{ id: "method", desc: false }],
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("procedure_revisions");
    // The procedure is joined to filter by, and left out of the rows.
    expect(args(calls[0], "select")[0]?.[0]).toBe(
      `${PROCEDURE_REVISION_COLUMNS.join(",")},procedures!inner()`,
    );
    expect(args(calls[0], "or")).toEqual([
      [`tenant_id.eq.${tenantId},tenant_id.is.null`],
      [tree, { referencedTable: "procedures" }],
      // A method is found by its words, as its column shows them.
      ['title.ilike."*examine*",method.in.("examine")'],
    ]);
    expect(args(calls[0], "order")).toEqual([
      ["method", { ascending: true, nullsFirst: false }],
      ["id"],
    ]);
  });

  it("waits for the runs before it reads a page, and asks nothing", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    for (const read of [campaignProcedureRead(undefined), campaignProcedureRevisionRead(undefined)])
      expect(
        await readServerPage(client, context, read, { pageIndex: 0, pageSize: 25 }),
      ).toMatchObject({ rows: [], count: 0 });
    expect(calls).toHaveLength(0);
  });

  it("starts a procedure's preview and form from it as stored", () => {
    const row = {
      id: uuid(1),
      tenant_id: tenantId,
      program_id: uuid(5),
      title: "Account review",
      description: null,
      owner_party_id: null,
      revision: 3,
      versions: 2,
    };
    expect(storedProcedure(row)).toEqual({
      id: uuid(1),
      tenant_id: tenantId,
      program_id: uuid(5),
      title: "Account review",
      description: null,
      owner_party_id: null,
      revision: 3,
    });
  });
});
