import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const {
  CONTROL_STATUS_ORDER,
  controlStatusFamilies,
  controlStatusShare,
  emptyControlStatusCounts,
  readProgramControlStatus,
} = await import("./control-status");
const { controlStatuses } = await import("./status");
type ControlStanding = import("./control-status").ControlStanding;

type Answer = { data: unknown; error: { message: string } | null };

/** A client whose `rpc` calls are recorded and answer with `answer`. */
function client(answer: Answer) {
  const calls: { name: string; args: Record<string, unknown>; headers: Record<string, string> }[] =
    [];
  return {
    calls,
    client: {
      rpc(name: string, args: Record<string, unknown>) {
        const call = { name, args, headers: {} as Record<string, string> };
        calls.push(call);
        const builder = {
          setHeader(key: string, value: string) {
            call.headers[key] = value;
            return builder;
          },
          abortSignal: () => builder,
          then: (resolve: (value: Answer) => unknown, reject: (reason: unknown) => unknown) =>
            Promise.resolve(answer).then(resolve, reject),
        };
        return builder;
      },
    } as never,
  };
}

const context = { tenantId: "tenant", token: "token" };
const program = "00000000-0000-4000-8000-000000000001";

const DETERMINATIONS = ["other_than_satisfied", "partially_satisfied", "satisfied"];

const line = (
  code: string,
  status: string,
  more: Partial<
    Record<"parent_id" | "family" | "family_title" | "determined_by", string | null> &
      Record<
        "requirements" | "evidenced" | "objectives" | "objectives_mapped" | "objectives_evidenced",
        number
      > & { product_assessments: unknown[] }
  > = {},
) => ({
  id: code.toLowerCase(),
  code,
  title: `${code} title`,
  parent_id: null,
  family: code.slice(0, 2),
  family_title: code.startsWith("AC") ? "Access Control" : "Audit and Accountability",
  status,
  requirements: status === "no_requirement" ? 0 : 1,
  evidenced: status === "no_requirement" || status === "no_evidence" ? 0 : 1,
  objectives: 4,
  objectives_mapped: status === "no_requirement" ? 0 : 4,
  objectives_evidenced: status === "no_requirement" || status === "no_evidence" ? 0 : 4,
  determined_by: DETERMINATIONS.includes(status) ? "program" : null,
  product_assessments: [],
  ...more,
});

const assessment = {
  id: "00000000-0000-4000-8000-000000000070",
  title: "X800 Missile version 1 product assessment",
};

const totals = {
  controls: 5,
  satisfied: 2,
  partially_satisfied: 0,
  other_than_satisfied: 0,
  not_assessed: 1,
  no_evidence: 1,
  no_requirement: 1,
};

describe("the control status vocabulary", () => {
  it("is the ladder, from nothing recorded to satisfied", () => {
    expect(CONTROL_STATUS_ORDER).toEqual([
      "no_requirement",
      "no_evidence",
      "not_assessed",
      "other_than_satisfied",
      "partially_satisfied",
      "satisfied",
    ]);
    expect(controlStatuses.satisfied).toMatchObject({ label: "Satisfied", tone: "success" });
    expect(controlStatuses.other_than_satisfied.tone).toBe("danger");
  });
});

describe("readProgramControlStatus", () => {
  it("asks for the program as the reader and names each fact as the product does", async () => {
    const server = client({
      data: {
        program_id: program,
        baseline: true,
        totals,
        controls: [
          line("AC-1", "satisfied"),
          line("AC-2", "not_assessed"),
          line("AC-2(1)", "no_evidence", { parent_id: "ac-2" }),
          // A control whose requirements map some of its objectives stands where none maps it.
          line("AU-1", "no_requirement", {
            requirements: 1,
            objectives: 26,
            objectives_mapped: 12,
          }),
          line("AU-2", "satisfied", {
            determined_by: "product",
            requirements: 0,
            evidenced: 0,
            product_assessments: [{ ...assessment, determination: "satisfied" }],
          }),
        ],
      },
      error: null,
    });
    const answer = await readProgramControlStatus(server.client, context, program);
    expect(server.calls).toEqual([
      {
        name: "program_control_status",
        args: { p_program_id: program },
        headers: { Authorization: "Bearer token" },
      },
    ]);
    expect(answer.baseline).toBe(true);
    expect(answer.total).toBe(5);
    expect(answer.counts).toEqual({
      no_requirement: 1,
      no_evidence: 1,
      not_assessed: 1,
      other_than_satisfied: 0,
      partially_satisfied: 0,
      satisfied: 2,
    });
    expect(answer.controls[2]).toEqual({
      id: "ac-2(1)",
      code: "AC-2(1)",
      title: "AC-2(1) title",
      parentId: "ac-2",
      family: "AC",
      familyTitle: "Access Control",
      status: "no_evidence",
      requirements: 1,
      evidenced: 0,
      objectives: 4,
      objectivesMapped: 4,
      objectivesEvidenced: 0,
      determinedBy: null,
      productAssessments: [],
    });
    // How many of its assessment objectives the program's requirements map, as numbers.
    expect(answer.controls[3]).toMatchObject({
      status: "no_requirement",
      requirements: 1,
      objectives: 26,
      objectivesMapped: 12,
      objectivesEvidenced: 0,
    });
    // Whose determination each status is: the program's own assessors', or a product assessment
    // the program's variants inherit the control from, named so a screen can open it.
    expect(answer.controls[0]).toMatchObject({ determinedBy: "program", productAssessments: [] });
    expect(answer.controls[3]).toMatchObject({ determinedBy: null, productAssessments: [] });
    expect(answer.controls[4]).toMatchObject({
      status: "satisfied",
      requirements: 0,
      determinedBy: "product",
      productAssessments: [{ ...assessment, determination: "satisfied" }],
    });
  });

  it("says the server's refusal, and refuses a status or a source it does not know", async () => {
    await expect(
      readProgramControlStatus(
        client({ data: null, error: { message: "Program access is required" } }).client,
        context,
        program,
      ),
    ).rejects.toThrow("Program access is required");
    for (const control of [
      line("AC-1", "passing"),
      line("AC-1", "satisfied", { determined_by: "supplier" }),
      line("AC-1", "satisfied", {
        determined_by: "product",
        product_assessments: [{ ...assessment, determination: "not_assessed" }],
      }),
    ])
      await expect(
        readProgramControlStatus(
          client({
            data: { program_id: program, baseline: true, totals, controls: [control] },
            error: null,
          }).client,
          context,
          program,
        ),
      ).rejects.toThrow();
  });
});

describe("controlStatusFamilies", () => {
  const standing = (
    code: string,
    status: ControlStanding["status"],
    parentId: string | null = null,
    family: string | null = code.slice(0, 2),
  ): ControlStanding => ({
    id: code.toLowerCase(),
    code,
    title: `${code} title`,
    parentId,
    family,
    familyTitle: family === "AC" ? "Access Control" : family ? "Audit and Accountability" : null,
    status,
    requirements: 0,
    evidenced: 0,
    objectives: 0,
    objectivesMapped: 0,
    objectivesEvidenced: 0,
    determinedBy: null,
    productAssessments: [],
  });

  it("groups by family in the order given, an enhancement under its control", () => {
    const families = controlStatusFamilies([
      standing("AC-1", "satisfied"),
      standing("AC-2", "not_assessed"),
      standing("AC-2(1)", "no_evidence", "ac-2"),
      standing("AC-2(2)", "no_evidence", "ac-2"),
      standing("AU-1", "no_requirement"),
    ]);
    expect(families.map((family) => [family.code, family.title, family.total])).toEqual([
      ["AC", "Access Control", 4],
      ["AU", "Audit and Accountability", 1],
    ]);
    const [ac] = families;
    expect(ac!.controls.map((control) => control.code)).toEqual(["AC-1", "AC-2"]);
    expect(ac!.controls[1]!.enhancements.map((control) => control.code)).toEqual([
      "AC-2(1)",
      "AC-2(2)",
    ]);
    // Every control is counted once, enhancements included.
    expect(ac!.counts).toEqual({
      ...emptyControlStatusCounts(),
      satisfied: 1,
      not_assessed: 1,
      no_evidence: 2,
    });
  });

  it("keeps an enhancement whose control the baseline does not select, and a control with no family", () => {
    const families = controlStatusFamilies([
      standing("AC-3(4)", "no_evidence", "ac-3"),
      standing("ZZ-1", "satisfied", null, null),
    ]);
    expect(families.map((family) => family.code)).toEqual(["AC", "Other"]);
    expect(families[0]!.controls.map((control) => control.code)).toEqual(["AC-3(4)"]);
    expect(families[0]!.controls[0]!.enhancements).toEqual([]);
    expect(families[1]!.total).toBe(1);
  });
});

describe("controlStatusShare", () => {
  it("is a whole percent of the baseline, and zero for an empty one", () => {
    const counts = { ...emptyControlStatusCounts(), satisfied: 311, no_evidence: 235 };
    expect(controlStatusShare({ total: 546, counts }, "satisfied")).toBe(57);
    expect(controlStatusShare({ total: 0, counts: emptyControlStatusCounts() }, "satisfied")).toBe(
      0,
    );
  });
});
