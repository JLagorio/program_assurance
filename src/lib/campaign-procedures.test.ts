import { describe, expect, it } from "vitest";
import { args, fakeClient, filter, uuid } from "./testing/fake-client";

const {
  CAMPAIGN_RUN_COLUMNS,
  PROCEDURE_COLUMNS,
  PROCEDURE_REVISION_COLUMNS,
  campaignRunsTree,
  programOrShared,
  revisionsOutside,
} = await import("./campaign-procedures");
const { readRows } = await import("./models");

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

  it("finds the procedures the runs follow outside the program, through the revision", async () => {
    const runs = [
      { procedure_revision_id: uuid(10) },
      { procedure_revision_id: uuid(12) },
      { procedure_revision_id: uuid(12) },
    ];
    expect(revisionsOutside(runs, [{ id: uuid(10) }, { id: uuid(11) }])).toEqual([uuid(12)]);
    expect(revisionsOutside(runs, [{ id: uuid(10) }, { id: uuid(12) }])).toEqual([]);
    // None is asked while either read is on its way.
    expect(revisionsOutside(undefined, [])).toEqual([]);
    expect(revisionsOutside(runs, undefined)).toEqual([]);
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readRows(
      client,
      context,
      "procedures",
      { "procedure_revisions.id": [uuid(12)] },
      { columns: PROCEDURE_COLUMNS },
    );
    expect(args(calls[0], "select")[0]?.[0]).toBe(
      `${PROCEDURE_COLUMNS.join(",")},procedure_revisions!inner()`,
    );
    expect(filter(calls[0], "in", "procedure_revisions.id")).toEqual([uuid(12)]);
    // Usually there is none, and nothing is asked.
    await readRows(client, context, "procedures", { "procedure_revisions.id": [] });
    expect(calls).toHaveLength(1);
  });
});
