import { describe, expect, it } from "vitest";
import { args, fakeClient, filter, uuid } from "./testing/fake-client";

const {
  CAMPAIGN_OBJECTIVE_COLUMNS,
  OBJECTIVE_COLUMNS,
  OBJECTIVE_REGISTER_COLUMNS,
  assessmentObjectiveRead,
  campaignObjectiveRead,
  compareObjectives,
  objectiveTarget,
  storedObjective,
} = await import("./assessment-objectives");
const { readServerPage } = await import("./server-table");

const tenantId = uuid(900);
const context = { tenantId, token: "token" };

/** An objective as the view answers it, aimed at a part whose place the server wrote. */
const objective = (
  id: number,
  title: string,
  readingOrder: string | null,
  target: { kind?: string; label?: string; requirement?: boolean } = {},
) => ({
  id: uuid(id),
  title,
  reading_order: readingOrder,
  target_control_part_id: target.kind ? uuid(id + 100) : null,
  target_kind: target.kind ?? null,
  target_label: target.label ?? null,
  requirement_revision_id: target.requirement ? uuid(id + 200) : null,
});

describe("a campaign's objectives", () => {
  it("pages a campaign record's objectives on the server, in the order the record gave them", async () => {
    const read = campaignObjectiveRead(uuid(7));
    expect(read).toMatchObject({
      source: "assessment_objective_rows",
      model: "assessment_objectives",
      // A plan's title is in the rows: a write to a plan reads the pages again.
      models: ["assessment_plan_revisions"],
      scope: { campaign_id: uuid(7) },
      // What a row shows: the objective's title, its acceptance criterion and its plan's title.
      search: ["title", "acceptance_criterion", "plan_title"],
    });
    // Every column the objective's form edits, since a preview's Edit starts the form from the row,
    // its workspace, which the form needs to edit it, and where it stands; its plan by name, and not
    // the campaign it is scoped by nor the lifecycle stamps.
    expect(read.columns).toEqual([...CAMPAIGN_OBJECTIVE_COLUMNS]);
    for (const column of [
      "tenant_id",
      "plan_revision_id",
      "title",
      "description",
      "target_control_part_id",
      "requirement_revision_id",
      "acceptance_criterion",
      "revision",
      "plan_title",
    ])
      expect(read.columns).toContain(column);
    for (const column of ["created_at", "campaign_id", "campaign_title"])
      expect(read.columns).not.toContain(column);
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 1791 }));
    const page = await readServerPage(client, context, read, { pageIndex: 2, pageSize: 25 });
    expect(page.count).toBe(1791);
    expect(calls[0]?.table).toBe("assessment_objective_rows");
    expect(String(args(calls[0], "select")[0]?.[0]).split(",")).toEqual([
      ...CAMPAIGN_OBJECTIVE_COLUMNS,
    ]);
    expect(args(calls[0], "select")[0]?.[1]).toEqual({ count: "exact", head: false });
    expect(args(calls[0], "or")[0]).toEqual([`tenant_id.eq.${tenantId},tenant_id.is.null`]);
    expect(filter(calls[0], "eq", "campaign_id")).toBe(uuid(7));
    // The newest plan first, each plan's in the catalog's reading order, then by title and by id.
    expect(args(calls[0], "order")).toEqual([
      ["plan_version", { ascending: false, nullsFirst: false }],
      ["plan_revision_id", { ascending: true, nullsFirst: false }],
      ["reading_order", { ascending: true, nullsFirst: false }],
      ["title_order", { ascending: true, nullsFirst: false }],
      ["id"],
    ]);
    expect(args(calls[0], "range")).toEqual([[50, 74]]);
    // The reader's sort on Plan reads the plan title's sort key; a search reads what a row shows.
    await readServerPage(client, context, read, {
      pageIndex: 0,
      pageSize: 25,
      search: "AC-08a",
      sorting: [{ id: "plan", desc: false }],
    });
    expect(args(calls[1], "order")[0]).toEqual([
      "plan_order",
      { ascending: true, nullsFirst: false },
    ]);
    expect(args(calls[1], "or")[1]).toEqual([
      'title.ilike."*AC-08a*",acceptance_criterion.ilike."*AC-08a*",plan_title.ilike."*AC-08a*"',
    ]);
  });

  it("orders them as the catalog reads: controls in code order, a heading before its objectives", () => {
    // The places as the view writes them: the control's code in natural order, then the part's
    // ordinal under each part above it (AC-8's statement is its first part, its objectives its
    // third).
    const rows = [
      objective(1, "Unplanned check", null),
      objective(2, "AC-10 Concurrent Session Control", "ac-000000000010 000000", {
        kind: "statement",
      }),
      objective(
        3,
        "AC-08a.02 the system use notification states that",
        "ac-000000000008 000002.000000.000001",
        {
          kind: "assessment-objective",
          label: "AC-08a.02",
        },
      ),
      objective(
        4,
        "AC-08a.01 the system use notification states that",
        "ac-000000000008 000002.000000.000000",
        {
          kind: "assessment-objective",
          label: "AC-08a.01",
        },
      ),
      objective(
        5,
        "AC-08a. [Assignment: system use notification] is displayed",
        "ac-000000000008 000002.000000",
        {
          kind: "assessment-objective",
          label: "AC-08a.",
        },
      ),
      objective(6, "AC-8 System Use Notification", "ac-000000000008 000000", { kind: "statement" }),
      objective(
        7,
        "AC-02(01)[01] automated mechanisms are",
        "ac-000000000002(000000000001) 000002.000000",
        {
          kind: "assessment-objective",
          label: "AC-02(01)[01]",
        },
      ),
      objective(
        8,
        "AC-02a.[01] account types are defined",
        "ac-000000000002 000002.000000.000000",
        {
          kind: "assessment-objective",
          label: "AC-02a.[01]",
        },
      ),
      objective(9, "Step 10 witness the test", null, { requirement: true }),
      objective(10, "Step 2 witness the test", null, { requirement: true }),
    ];
    expect([...rows].sort(compareObjectives).map((row) => row.target_label ?? row.title)).toEqual([
      "AC-02a.[01]",
      "AC-02(01)[01]",
      "AC-8 System Use Notification",
      "AC-08a.",
      "AC-08a.01",
      "AC-08a.02",
      "AC-10 Concurrent Session Control",
      // Aimed at no control part: last, by title, its numbers by their value.
      "Step 2 witness the test",
      "Step 10 witness the test",
      "Unplanned check",
    ]);
  });

  it("gives two objectives on one part an order by title, then by id", () => {
    const place = "ac-000000000002 000002.000000.000000";
    const first = objective(1, "Retest AC-02a.[01]", place, { kind: "assessment-objective" });
    const second = objective(2, "AC-02a.[01] account types", place, {
      kind: "assessment-objective",
    });
    const twin = objective(3, "AC-02a.[01] account types", place, { kind: "assessment-objective" });
    expect([first, twin, second].sort(compareObjectives)).toEqual([second, twin, first]);
  });

  it("names what an objective is aimed at in the product's words", () => {
    expect(
      objectiveTarget(objective(1, "", "x", { kind: "assessment-objective", label: "AC-08a.01" })),
    ).toEqual({ table: "control_parts", id: uuid(101), label: "AC-08a.01" });
    expect(objectiveTarget(objective(2, "", "x", { kind: "statement" }))?.label).toBe(
      "Control statement",
    );
    // A part of the statement points into the control's text, as the statement does.
    expect(objectiveTarget(objective(3, "", "x", { kind: "item" }))?.label).toBe(
      "Control statement",
    );
    expect(objectiveTarget(objective(4, "", "x", { kind: "assessment-objective" }))?.label).toBe(
      "Assessment objective",
    );
    expect(objectiveTarget(objective(5, "", null, { requirement: true }))).toEqual({
      table: "requirement_revisions",
      id: uuid(205),
      label: "Requirement revision",
    });
    expect(objectiveTarget(objective(6, "", null))).toBeNull();
  });

  it("pages the register on the server in the order the screen always gave it", async () => {
    const read = assessmentObjectiveRead({ program_id: uuid(5) });
    expect(read).toMatchObject({
      source: "assessment_objective_rows",
      model: "assessment_objectives",
      // A campaign's and a plan's titles are in the rows: a write to either reads the pages again.
      models: ["assessment_campaigns", "assessment_plan_revisions"],
      scope: { program_id: uuid(5) },
      search: ["title", "description", "campaign_title", "plan_title"],
    });
    // Every column the objective's form edits, since a preview's Edit starts the form from the row,
    // and its campaign and plan by name.
    expect(read.columns).toEqual([...OBJECTIVE_REGISTER_COLUMNS]);
    for (const column of OBJECTIVE_COLUMNS) expect(read.columns).toContain(column);
    // The workspace's register is scoped by nothing but the workspace.
    expect(assessmentObjectiveRead({}).scope).toBeUndefined();
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 1232 }));
    const page = await readServerPage(client, context, read, { pageIndex: 1, pageSize: 25 });
    expect(page.count).toBe(1232);
    expect(calls[0]?.table).toBe("assessment_objective_rows");
    expect(String(args(calls[0], "select")[0]?.[0]).split(",")).toEqual([
      ...OBJECTIVE_REGISTER_COLUMNS,
    ]);
    expect(args(calls[0], "select")[0]?.[1]).toEqual({ count: "exact", head: false });
    expect(filter(calls[0], "eq", "program_id")).toBe(uuid(5));
    // Each campaign's objectives together by its title, the newest plan first, each plan's in the
    // catalog's reading order, then by title and by id: one place for every objective.
    expect(args(calls[0], "order")).toEqual([
      ["campaign_order", { ascending: true, nullsFirst: false }],
      ["plan_version", { ascending: false, nullsFirst: false }],
      ["plan_revision_id", { ascending: true, nullsFirst: false }],
      ["reading_order", { ascending: true, nullsFirst: false }],
      ["title_order", { ascending: true, nullsFirst: false }],
      ["id"],
    ]);
    expect(args(calls[0], "range")).toEqual([[25, 49]]);
    // The reader's sort on Campaign reads the title's sort key, and the Campaign filter the title.
    await readServerPage(client, context, read, {
      pageIndex: 0,
      pageSize: 25,
      sorting: [{ id: "campaign", desc: true }],
      filters: [{ id: "campaign", value: ["Customer A delta assessment"] }],
    });
    expect(args(calls[1], "order")[0]).toEqual([
      "campaign_order",
      { ascending: false, nullsFirst: true },
    ]);
    expect(args(calls[1], "in")).toEqual([["campaign_title", ["Customer A delta assessment"]]]);
  });

  it("gives the edit form the objective as stored, without the names a register derives", () => {
    const stored = storedObjective({
      id: uuid(1),
      tenant_id: tenantId,
      plan_revision_id: uuid(2),
      title: "AC-02a.[01] account types are defined",
      description: null,
      target_control_part_id: uuid(3),
      requirement_revision_id: null,
      acceptance_criterion: "Shown",
      revision: 4,
      target_kind: "assessment-objective",
      target_label: "AC-02a.[01]",
      reading_order: "ac-000000000002 000002.000000.000000",
    });
    expect(Object.keys(stored)).toEqual([...OBJECTIVE_COLUMNS]);
    // Its workspace too: the form edits only a record of the reader's workspace.
    expect(stored).toMatchObject({
      id: uuid(1),
      tenant_id: tenantId,
      revision: 4,
      description: null,
    });
  });
});
