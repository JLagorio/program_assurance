import { describe, expect, it } from "vitest";
import { args, fakeClient, filter, uuid } from "./testing/fake-client";

const { OBJECTIVE_COLUMNS, compareObjectives, objectiveTarget, readAssessmentObjectiveRows } =
  await import("./assessment-objectives");

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
  it("reads the view in scope, inside the workspace", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readAssessmentObjectiveRows(client, context, { campaign_id: uuid(7) });
    expect(calls[0]?.table).toBe("assessment_objective_rows");
    expect(filter(calls[0], "eq", "campaign_id")).toBe(uuid(7));
    expect(args(calls[0], "or")).toEqual([[`tenant_id.eq.${tenantId},tenant_id.is.null`]]);
    // Every column the objective's form edits, since a preview's Edit starts the form from the row,
    // and where it stands; not the lifecycle stamps nor the campaign and program it is scoped by.
    const asked = String(args(calls[0], "select")[0]?.[0]).split(",");
    expect(asked).toEqual([...OBJECTIVE_COLUMNS]);
    for (const edited of [
      "plan_revision_id",
      "title",
      "description",
      "target_control_part_id",
      "requirement_revision_id",
      "acceptance_criterion",
      "revision",
    ])
      expect(asked).toContain(edited);
    expect(asked).not.toContain("created_at");
    expect(asked).not.toContain("campaign_id");
    await readAssessmentObjectiveRows(client, context, {});
    expect(calls[1]?.steps.filter(([step]) => step === "eq")).toEqual([]);
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
});
