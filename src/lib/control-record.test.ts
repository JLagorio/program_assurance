import { describe, expect, it } from "vitest";

const {
  controlSlot,
  controlStrip,
  isControlTab,
  objectiveLines,
  readControlJudgments,
  sequencePlace,
  standingLines,
} = await import("./control-record");
type AssuranceTrace = import("./assurance-trace").AssuranceTrace;
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

const control = "00000000-0000-4000-8000-0000000000c1";
const program = "00000000-0000-4000-8000-0000000000a1";

const trace = (more: Partial<AssuranceTrace> = {}): AssuranceTrace =>
  ({
    focus: { kind: "control", id: control },
    clipped: false,
    controls: [
      { id: control, code: "SI-2", title: "Flaw Remediation", family: "SI", family_title: null },
    ],
    requirements: [],
    evidence: [],
    findings: [],
    issues: [],
    risks: [],
    remediation: [],
    elements: [],
    links: {} as AssuranceTrace["links"],
    ...more,
  }) as AssuranceTrace;

const requirement = (code: string, evidence = 0) => ({
  id: `req-${code}`,
  code,
  title: `${code} title`,
  state: "draft",
  program_id: program,
  evidence_count: evidence,
});

const standing = (more: Partial<ControlStanding> = {}): ControlStanding => ({
  id: control,
  code: "SI-2",
  title: "Flaw Remediation",
  parentId: null,
  family: "SI",
  familyTitle: "System and Information Integrity",
  status: "no_evidence",
  requirements: 1,
  evidenced: 0,
  objectives: 10,
  objectivesMapped: 10,
  objectivesEvidenced: 0,
  objectivesAssessed: 0,
  objectivesInherited: 0,
  determinedBy: null,
  productAssessments: [],
  componentAssessments: [],
  ...more,
});

describe("the record's tabs", () => {
  it("knows its five tabs, Implementation first, and nothing else", () => {
    expect(isControlTab("Assessment")).toBe(true);
    expect(isControlTab("Overview")).toBe(false);
    expect(isControlTab(undefined)).toBe(false);
  });
});

describe("readControlJudgments", () => {
  it("asks for one control of one program and reads each objective's judgment", async () => {
    const { calls, client: rpc } = client({
      data: [
        {
          control_id: control,
          objective_id: "o1",
          determination: "satisfied",
          inherited: true,
          component_assessments: [{ id: "ca1", determination: "satisfied" }],
        },
        {
          control_id: control,
          objective_id: "o2",
          determination: "other_than_satisfied",
          inherited: false,
          component_assessments: null,
        },
        // Another control's line is never this control's.
        {
          control_id: "another",
          objective_id: "o9",
          determination: "satisfied",
          inherited: false,
          component_assessments: null,
        },
      ],
      error: null,
    });
    const judgments = await readControlJudgments(rpc, { token: "token" }, program, control);
    expect(calls[0]).toMatchObject({
      name: "program_control_objective_judgments",
      args: { p_program_id: program, p_control_ids: [control] },
      headers: { Authorization: "Bearer token" },
    });
    expect(judgments).toEqual([
      {
        objectiveId: "o1",
        determination: "satisfied",
        inherited: true,
        componentAssessments: [{ id: "ca1", determination: "satisfied" }],
      },
      {
        objectiveId: "o2",
        determination: "other_than_satisfied",
        inherited: false,
        componentAssessments: [],
      },
    ]);
  });

  it("says a refusal in the server's words", async () => {
    const { client: rpc } = client({
      data: null,
      error: { message: "Program access is required" },
    });
    await expect(readControlJudgments(rpc, { token: "token" }, program, control)).rejects.toThrow(
      "Program access is required",
    );
  });
});

describe("objectiveLines", () => {
  it("keeps the reading order and says whose each determination is", () => {
    const lines = objectiveLines(
      [
        { id: "o1", label: "AU-07a.[01]", prose: "first" },
        { id: "o2", label: "AU-07a.[02]", prose: "second" },
        { id: "o3", label: "AU-07b.[01]", prose: "third" },
      ],
      [
        {
          objectiveId: "o2",
          determination: "satisfied",
          inherited: true,
          componentAssessments: [],
        },
        {
          objectiveId: "o1",
          determination: "partially_satisfied",
          inherited: false,
          componentAssessments: [],
        },
      ],
    );
    expect(lines.map((line) => [line.label, line.determination, line.by])).toEqual([
      ["AU-07a.[01]", "partially_satisfied", "program"],
      ["AU-07a.[02]", "satisfied", "inherited"],
      ["AU-07b.[01]", null, null],
    ]);
  });
});

describe("standingLines", () => {
  const objectives = [
    { id: "a", ancestors: [] },
    { id: "a1", ancestors: ["a"] },
    { id: "a2", ancestors: ["a"] },
    { id: "b", ancestors: [] },
  ];
  it("gives a line a requirement and element, with what its mappings cover there", () => {
    const lines = standingLines({
      requirementIds: ["r1", "r2"],
      mappings: [
        { requirementId: "r1", systemId: "e2", partId: "a1" },
        { requirementId: "r1", systemId: "e1", partId: null },
        { requirementId: "r1", systemId: "e2", partId: "b" },
        { requirementId: "r2", systemId: null, partId: "a" },
      ],
      objectives,
      builtFrom: new Map([["e1", [{ id: "dc", name: "Audit Log Collector", version: 1 }]]]),
      elementOrder: (id) => ({ e1: "CN-2", e2: "CN-10" })[id ?? ""] ?? "",
    });
    expect(
      lines.map((line) => [
        line.requirementId,
        line.systemId,
        `${line.covered} of ${line.objectives}`,
        line.builtFrom.map((component) => component.name),
      ]),
    ).toEqual([
      // CN-2 before CN-10: element codes in their natural order.
      ["r1", "e1", "4 of 4", ["Audit Log Collector"]],
      ["r1", "e2", "2 of 4", []],
      // A heading covers the objectives under it; a mapping on no element counts everywhere.
      ["r2", null, "3 of 4", []],
    ]);
  });

  it("draws nothing for a requirement with no mapping of the control", () => {
    expect(
      standingLines({
        requirementIds: ["r1"],
        mappings: [],
        objectives,
        builtFrom: new Map(),
      }),
    ).toEqual([]);
  });
});

describe("controlStrip", () => {
  const stations = (strip: ReturnType<typeof controlStrip>) =>
    strip.map((station) => [
      station.kind,
      station.state,
      station.count ?? null,
      station.words ?? null,
    ]);

  it("marks the evidence a requirement owes as the gap the next step fills", () => {
    const strip = controlStrip(trace({ requirements: [requirement("REQ-064")] }), standing(), {
      step: {
        kind: "link_evidence",
        requirement: { id: "req", code: "REQ-064", programId: program },
      },
    });
    expect(stations(strip)).toEqual([
      ["control", "held", null, null],
      ["requirement", "held", 1, null],
      ["evidence", "gap", null, null],
      ["finding", "none", null, null],
      ["remediation", "none", null, null],
      ["risk", "none", null, null],
    ]);
    expect(strip.find((station) => station.kind === "evidence")?.step).toBe(true);
  });

  it("counts the assessor's findings and the open issues together, the worst's words", () => {
    const strip = controlStrip(
      trace({
        requirements: [requirement("REQ-1", 1)],
        evidence: [{ id: "e" } as AssuranceTrace["evidence"][number]],
        findings: [
          {
            id: "f",
            title: "f",
            determination: "satisfied",
            determined_at: null,
            results_state: "published",
            program_id: program,
          },
        ],
        issues: [
          {
            id: "i",
            title: "i",
            severity: "high",
            status: "open",
            opened_at: null,
            closed_at: null,
            program_id: program,
          },
          {
            id: "j",
            title: "j",
            severity: "critical",
            status: "closed",
            opened_at: null,
            closed_at: null,
            program_id: program,
          },
        ],
        risks: [
          {
            id: "r",
            title: "r",
            status: "open",
            severity: "moderate",
            likelihood: null,
            impact: null,
            program_id: program,
          },
        ],
      }),
      standing({ status: "satisfied", determinedBy: "program" }),
    );
    const finding = strip.find((station) => station.kind === "finding");
    expect(finding).toMatchObject({ state: "held", count: 2, tone: "danger", words: "High" });
    expect(strip.find((station) => station.kind === "risk")).toMatchObject({
      state: "held",
      count: 1,
      words: "Moderate",
    });
  });

  it("says a control its components decide was judged there, and owes nothing upstream", () => {
    const strip = controlStrip(
      trace({ requirements: [requirement("REQ-353", 1)] }),
      standing({
        status: "satisfied",
        determinedBy: "program",
        objectives: 4,
        objectivesAssessed: 4,
        objectivesInherited: 4,
        componentAssessments: [{ id: "ca", title: "set 1", determination: "satisfied" }],
      }),
      { judgedOn: "Audit Log Collector 1" },
    );
    expect(stations(strip)).toEqual([
      ["control", "held", null, null],
      ["requirement", "held", 1, null],
      ["evidence", "none", null, null],
      ["finding", "held", null, "Audit Log Collector 1"],
      ["remediation", "none", null, null],
      ["risk", "none", null, null],
    ]);
  });

  it("owes a requirement first, and an assessment once evidence waits on one", () => {
    expect(
      controlStrip(trace(), standing({ status: "no_requirement", requirements: 0 }), {
        step: { kind: "map_requirement" },
      }).find((station) => station.kind === "requirement"),
    ).toMatchObject({ state: "gap", step: true });
    expect(
      controlStrip(
        trace({
          requirements: [requirement("REQ-1", 1)],
          evidence: [{ id: "e" } as AssuranceTrace["evidence"][number]],
        }),
        standing({ status: "not_assessed" }),
        { step: { kind: "assess" } },
      ).find((station) => station.kind === "finding"),
    ).toMatchObject({ state: "gap", step: true });
  });
});

describe("controlSlot", () => {
  it("adds evidence on the control, saying which requirement owes it and how much is evidenced", () => {
    expect(
      controlSlot({
        step: {
          kind: "link_evidence",
          requirement: { id: "r", code: "REQ-064", programId: program },
        },
        standing: standing(),
        canWrite: true,
      }),
    ).toEqual({
      form: "advance",
      kind: "add_evidence",
      label: "Add evidence",
      reason: "REQ-064 cites none",
      detail: "0 of 10 objectives",
    });
  });

  it("keeps the next step's own words for a step done on the control", () => {
    expect(
      controlSlot({
        step: { kind: "assess" },
        standing: standing({ status: "not_assessed", objectivesEvidenced: 10 }),
        canWrite: true,
      }),
    ).toMatchObject({
      label: "Add to assessment campaign",
      reason: "Evidence on 10 of 10",
      detail: "no determination yet",
    });
    expect(
      controlSlot({
        step: { kind: "map_requirement", rest: 3 },
        standing: standing({ status: "no_requirement", objectivesMapped: 7 }),
        canWrite: true,
      }),
    ).toMatchObject({ label: "Map 3 more objectives", reason: "7 of 10 objectives mapped" });
  });

  it("leads a control its components decide to the component's assessment", () => {
    expect(
      controlSlot({
        step: null,
        standing: standing({
          status: "satisfied",
          objectives: 4,
          objectivesAssessed: 4,
          objectivesInherited: 4,
        }),
        canWrite: false,
        builtFrom: "Audit Log Collector 1",
      }),
    ).toEqual({
      form: "advance",
      kind: "open_component_assessment",
      label: "Open component assessment",
      reason: "Judged once",
      detail: "on Audit Log Collector 1",
    });
  });

  it("holds nothing for a satisfied control, or a step a viewer may not take", () => {
    expect(
      controlSlot({ step: null, standing: standing({ status: "satisfied" }), canWrite: true }),
    ).toEqual({ form: "none" });
    expect(
      controlSlot({
        step: { kind: "map_requirement" },
        standing: standing({ status: "no_requirement" }),
        canWrite: false,
      }),
    ).toEqual({ form: "none" });
    // A step done elsewhere is a link, which a viewer follows too.
    expect(
      controlSlot({
        step: { kind: "open_campaign", campaign: { id: "c", title: "FY2027" } },
        standing: standing({ status: "not_assessed" }),
        canWrite: false,
      }),
    ).toMatchObject({ form: "advance", label: "Open assessment campaign", detail: "FY2027" });
  });
});

describe("sequencePlace", () => {
  it("says where a control stands in the register's result and its neighbours", () => {
    expect(sequencePlace(["a", "b", "c"], "b")).toEqual({
      position: 2,
      total: 3,
      previous: "a",
      next: "c",
    });
    expect(sequencePlace(["a", "b"], "a")).toMatchObject({ previous: null, next: "b" });
    expect(sequencePlace(["a"], "z")).toBeNull();
  });
});
