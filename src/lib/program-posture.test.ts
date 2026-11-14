import { describe, expect, it } from "vitest";

const {
  familyColumns,
  postureCells,
  postureLeftOut,
  postureRows,
  postureSeverity,
  postureValue,
  readProgramPosture,
  readProgramPostureCell,
  readProgramResiliencyPosture,
  readProgramResiliencyPostureCell,
  severityOfRank,
  techniqueColumns,
} = await import("./program-posture");
type PostureElement = import("./program-posture").PostureElement;
type ProgramPosture = import("./program-posture").ProgramPosture;
type ProgramResiliencyPosture = import("./program-posture").ProgramResiliencyPosture;

type Answer = { data: unknown; error: { message: string } | null };
function client(answer: Answer) {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  return {
    calls,
    client: {
      rpc(name: string, args: Record<string, unknown>) {
        calls.push({ name, args });
        const builder = {
          setHeader: () => builder,
          abortSignal: () => builder,
          then: (resolve: (value: Answer) => unknown, reject: (reason: unknown) => unknown) =>
            Promise.resolve(answer).then(resolve, reject),
        };
        return builder;
      },
    } as never,
  };
}

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const none = {
  requirements: 0,
  evidenced: 0,
  issues: 0,
  issue_severity: null,
  risks: 0,
  risk_severity: null,
};
const element = (
  n: number,
  name: string,
  parent: number | null,
  counted: Partial<typeof none> = {},
): PostureElement => ({
  id: uuid(n),
  code: `SYS-${n}`,
  name,
  type: "subsystem",
  parent_id: parent === null ? null : uuid(parent),
  boundary: parent === null,
  own_requirements: 0,
  ...none,
  ...counted,
});

const elements = [
  element(1, "Mission system", null, { requirements: 9, evidenced: 4 }),
  element(2, "Space segment", 1, { requirements: 5, evidenced: 4 }),
  element(3, "Flight computer", 2),
  element(4, "Ground segment", 1),
  element(5, "Flight computer", 4),
  element(6, "Adrift", 99),
];

describe("postureRows", () => {
  const rows = postureRows(elements);

  it("lists each element under the one that holds it, in the given order", () => {
    expect(rows.map((row) => [row.element.code, row.level])).toEqual([
      ["SYS-1", 0],
      ["SYS-2", 1],
      ["SYS-3", 2],
      ["SYS-4", 1],
      ["SYS-5", 2],
      ["SYS-6", 0],
    ]);
  });

  it("marks an element that holds others as a total", () => {
    expect(rows.filter((row) => row.summary).map((row) => row.element.code)).toEqual([
      "SYS-1",
      "SYS-2",
      "SYS-4",
    ]);
  });

  it("tells two elements of one name apart by their codes", () => {
    expect(rows.map((row) => row.name)).toEqual([
      "Mission system",
      "Space segment",
      "Flight computer (SYS-3)",
      "Ground segment",
      "Flight computer (SYS-5)",
      "Adrift",
    ]);
  });

  it("walks a tree that loops back on itself once", () => {
    const loop = [element(1, "A", 2), element(2, "B", 1)];
    expect(postureRows(loop)).toHaveLength(0);
    expect(postureRows([...loop, element(3, "C", null)])).toHaveLength(1);
  });
});

describe("what a cell reads as", () => {
  const counted = {
    requirements: 9,
    evidenced: 4,
    issues: 3,
    issue_severity: 4,
    risks: 2,
    risk_severity: 2,
  };

  it("counts requirements, the ones with no evidence, open issues and open risks", () => {
    expect(postureValue("requirements", counted)).toBe(9);
    expect(postureValue("gaps", counted)).toBe(5);
    expect(postureValue("issues", counted)).toBe(3);
    expect(postureValue("risks", counted)).toBe(2);
  });

  it("names the worst severity of the issues or the risks, and none for a count of requirements", () => {
    expect(postureSeverity("issues", counted)).toBe("critical");
    expect(postureSeverity("risks", counted)).toBe("moderate");
    expect(postureSeverity("gaps", counted)).toBeNull();
    expect(severityOfRank(null)).toBeNull();
    expect(severityOfRank(1)).toBe("low");
  });
});

const posture: ProgramPosture = {
  elements,
  families: [{ id: uuid(20), code: "AU", title: "Audit and Accountability", ...none }],
  cells: [{ element_id: uuid(2), family_id: uuid(20), ...none, requirements: 5, evidenced: 4 }],
  totals: {
    requirements: 9,
    allocated: 9,
    allocated_elements: 2,
    evidenced: 4,
    issues: 3,
    issues_severe: 1,
    issues_placed: 2,
    risks: 2,
    risks_severe: 0,
    risks_placed: 2,
  },
};

describe("reads", () => {
  it("reads a program's posture and finds a cell by its element and family", async () => {
    const { client: rpc, calls } = client({ data: posture, error: null });
    const answer = await readProgramPosture(rpc, { tenantId: "t", token: "k" }, uuid(9));
    expect(calls[0]).toMatchObject({
      name: "program_posture",
      args: { p_tenant_id: "t", p_program_id: uuid(9) },
    });
    expect(postureCells(answer).get(`${uuid(2)}:${uuid(20)}`)?.requirements).toBe(5);
    expect(postureCells(answer).get(`${uuid(3)}:${uuid(20)}`)).toBeUndefined();
  });

  it("reads one cell, or a whole line when an end is left out", async () => {
    const detail = {
      requirements: 5,
      evidenced: 4,
      issues: [],
      risks: [],
      unevidenced: [],
      controls: [],
    };
    const { client: rpc, calls } = client({ data: detail, error: null });
    await readProgramPostureCell(
      rpc,
      { tenantId: "t", token: "k" },
      { programId: uuid(9), elementId: uuid(2), familyId: null },
    );
    expect(calls[0]?.args).toEqual({
      p_tenant_id: "t",
      p_program_id: uuid(9),
      p_element_id: uuid(2),
    });
  });

  it("fails on the server's refusal", async () => {
    const { client: rpc } = client({
      data: null,
      error: { message: "Workspace access is required" },
    });
    await expect(readProgramPosture(rpc, { tenantId: "t", token: "k" }, uuid(9))).rejects.toThrow(
      "Workspace access is required",
    );
  });
});

const technique = (slug: string, title: string, counted: Partial<typeof none> = {}) => ({
  code: `technique.${slug}`,
  title,
  ...none,
  ...counted,
});
const resiliency: ProgramResiliencyPosture = {
  elements,
  techniques: [
    technique("adaptive-response", "Adaptive Response", { requirements: 3, evidenced: 1 }),
    technique("deception", "Deception"),
    technique("segmentation", "Segmentation", { requirements: 2, evidenced: 2 }),
  ],
  cells: [
    {
      element_id: uuid(2),
      technique_code: "technique.adaptive-response",
      ...none,
      requirements: 3,
      evidenced: 1,
    },
    {
      element_id: uuid(2),
      technique_code: "technique.segmentation",
      ...none,
      requirements: 2,
      evidenced: 2,
    },
  ],
  totals: { ...posture.totals, placed: 4, issues_placed: 1, risks_placed: 0 },
};

describe("the grid's columns", () => {
  it("heads a family by its code and says it in full", () => {
    expect(
      familyColumns([
        ...posture.families,
        { id: uuid(21), code: "SC", title: null, ...none },
        { id: uuid(22), code: "AU", title: "Audit, another edition", ...none },
      ]),
    ).toEqual([
      { key: uuid(20), name: `AU (${uuid(20)})`, title: "AU Audit and Accountability" },
      { key: uuid(21), name: "SC", title: "SC" },
      { key: uuid(22), name: `AU (${uuid(22)})`, title: "AU Audit, another edition" },
    ]);
  });

  it("lists every technique in the framework's order, by code, headed by its title", () => {
    expect(techniqueColumns(resiliency.techniques)).toEqual([
      { key: "technique.adaptive-response", name: "Adaptive Response", title: "Adaptive Response" },
      { key: "technique.deception", name: "Deception", title: "Deception" },
      { key: "technique.segmentation", name: "Segmentation", title: "Segmentation" },
    ]);
  });

  it("keeps the techniques a program chose, in the framework's order and not the choice's", () => {
    expect(
      techniqueColumns(resiliency.techniques, [
        "technique.segmentation",
        "technique.adaptive-response",
        "technique.not-in-this-revision",
      ]).map((column) => column.key),
    ).toEqual(["technique.adaptive-response", "technique.segmentation"]);
    expect(techniqueColumns(resiliency.techniques, ["technique.not-in-this-revision"])).toEqual([]);
    expect(techniqueColumns(resiliency.techniques, [])).toEqual([]);
  });

  it("tells two techniques of one title apart by their codes", () => {
    expect(
      techniqueColumns([technique("a", "Redundancy"), technique("b", "Redundancy")]).map(
        (column) => column.name,
      ),
    ).toEqual(["Redundancy (technique.a)", "Redundancy (technique.b)"]);
  });

  it("finds a technique's cell by its element and the technique's code", () => {
    const cells = postureCells(resiliency);
    expect(cells.get(`${uuid(2)}:technique.adaptive-response`)?.requirements).toBe(3);
    expect(cells.get(`${uuid(2)}:technique.deception`)).toBeUndefined();
  });
});

describe("what a grid does not place", () => {
  it("says the issues and the risks that reach no requirement in a cell", () => {
    expect(postureLeftOut("issues", posture.totals)).toEqual({ records: "issues", unplaced: 1 });
    expect(postureLeftOut("risks", posture.totals)).toEqual({ records: "risks", unplaced: 0 });
    expect(postureLeftOut("issues", resiliency.totals)).toEqual({ records: "issues", unplaced: 2 });
  });

  it("says the requirements allocated to no element, by family", () => {
    const counted = { ...posture.totals, requirements: 12, allocated: 9 };
    expect(postureLeftOut("requirements", counted)).toEqual({
      records: "requirements",
      unallocated: 3,
      unsupported: 0,
    });
    expect(postureLeftOut("gaps", counted)).toEqual(postureLeftOut("requirements", counted));
  });

  it("says the allocated requirements whose controls support no technique, by technique", () => {
    expect(
      postureLeftOut("requirements", { ...resiliency.totals, requirements: 12, allocated: 9 }),
    ).toEqual({ records: "requirements", unallocated: 3, unsupported: 5 });
  });
});

describe("reads by technique", () => {
  it("reads a program's posture by technique, naming the program alone", async () => {
    const { client: rpc, calls } = client({ data: resiliency, error: null });
    const answer = await readProgramResiliencyPosture(rpc, { tenantId: "t", token: "k" }, uuid(9));
    expect(calls[0]).toEqual({
      name: "program_resiliency_posture",
      args: { p_program_id: uuid(9) },
    });
    expect(answer.techniques.map((item) => item.code)).toEqual([
      "technique.adaptive-response",
      "technique.deception",
      "technique.segmentation",
    ]);
    expect(answer.totals.placed).toBe(4);
  });

  it("refuses an answer that does not say how many requirements are placed", async () => {
    const { client: rpc } = client({
      data: { ...resiliency, totals: posture.totals },
      error: null,
    });
    await expect(
      readProgramResiliencyPosture(rpc, { tenantId: "t", token: "k" }, uuid(9)),
    ).rejects.toThrow();
  });

  it("reads one cell by its technique's code, or a whole line when an end is left out", async () => {
    const detail = {
      requirements: 3,
      evidenced: 1,
      issues: [],
      risks: [],
      unevidenced: [],
      controls: [],
    };
    const { client: rpc, calls } = client({ data: detail, error: null });
    await readProgramResiliencyPostureCell(
      rpc,
      { tenantId: "t", token: "k" },
      { programId: uuid(9), elementId: uuid(2), techniqueCode: "technique.segmentation" },
    );
    await readProgramResiliencyPostureCell(
      rpc,
      { tenantId: "t", token: "k" },
      { programId: uuid(9), elementId: null, techniqueCode: "technique.segmentation" },
    );
    expect(calls.map((call) => call.args)).toEqual([
      {
        p_program_id: uuid(9),
        p_element_id: uuid(2),
        p_technique_code: "technique.segmentation",
      },
      { p_program_id: uuid(9), p_technique_code: "technique.segmentation" },
    ]);
    expect(calls.every((call) => call.name === "program_resiliency_posture_cell")).toBe(true);
  });

  it("fails on the server's refusal", async () => {
    const { client: rpc } = client({
      data: null,
      error: { message: "Program access is required" },
    });
    await expect(
      readProgramResiliencyPosture(rpc, { tenantId: "t", token: "k" }, uuid(9)),
    ).rejects.toThrow("Program access is required");
  });
});
