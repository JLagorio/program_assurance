import { describe, expect, it } from "vitest";
import type { AssuranceTrace } from "./assurance-trace";
import { controlNextStep, nextStepLabel, traceGapFixes } from "./next-steps";
import { controlStatuses } from "./status";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const PROGRAM = id(900);

type Requirement = AssuranceTrace["requirements"][number];
const requirement = (n: number, evidence: number): Requirement => ({
  id: id(n),
  code: `REQ-${String(n).padStart(3, "0")}`,
  title: `Requirement ${n}`,
  state: "published",
  program_id: PROGRAM,
  evidence_count: evidence,
});

const control = {
  id: id(1),
  code: "AC-2",
  title: "Account Management",
  family: "ac",
  family_title: "Access Control",
};
const evidence = {
  id: id(50),
  title: "Account review",
  kind: "report",
  program_id: PROGRAM,
  version_id: null,
  version_number: null,
  collected_at: null,
  review: "accepted",
  expires_at: null,
};

type Trace = Parameters<typeof traceGapFixes>[0];
const trace = (focus: Trace["focus"], parts: Partial<Omit<Trace, "focus">> = {}): Trace => ({
  focus,
  controls: [],
  requirements: [],
  evidence: [],
  ...parts,
});

describe("controlNextStep", () => {
  it("has a step for every status but satisfied", () => {
    for (const status of Object.keys(controlStatuses) as (keyof typeof controlStatuses)[])
      expect(controlNextStep(status) === null, status).toBe(status === "satisfied");
  });

  it("names the first requirement that cites no evidence", () => {
    const step = controlNextStep("no_evidence", [
      requirement(7, 2),
      requirement(8, 0),
      requirement(9, 0),
    ]);
    expect(step).toEqual({
      kind: "link_evidence",
      requirement: { id: id(8), code: "REQ-008", programId: PROGRAM },
    });
    expect(nextStepLabel(step!)).toBe("Link evidence to REQ-008");
  });

  it("says the step before a read names the requirements", () => {
    const step = controlNextStep("no_evidence");
    expect(step).toEqual({ kind: "link_evidence", requirement: null });
    expect(nextStepLabel(step!)).toBe("Link evidence");
  });

  it("sends an assessor's verdict to the findings, and evidence waiting on one to the campaigns", () => {
    expect(controlNextStep("not_assessed")).toEqual({ kind: "assess" });
    expect(controlNextStep("other_than_satisfied")).toEqual({ kind: "review_findings" });
    expect(controlNextStep("partially_satisfied")).toEqual({ kind: "review_findings" });
    expect(nextStepLabel({ kind: "assess" })).toBe("Open assessment campaigns");
    expect(nextStepLabel({ kind: "review_findings" })).toBe("Open assessment findings");
    expect(nextStepLabel({ kind: "map_requirement" })).toBe("Map a requirement");
  });
});

describe("traceGapFixes", () => {
  const onControl = { kind: "control", id: control.id } as const;

  it("offers a requirement to a control none maps, inside a program only", () => {
    expect(traceGapFixes(trace(onControl, { controls: [control] }), PROGRAM)).toEqual([
      { stage: "requirement", kind: "map_requirement" },
    ]);
    expect(traceGapFixes(trace(onControl, { controls: [control] }))).toEqual([]);
  });

  it("offers evidence for a control's first requirement that cites none", () => {
    const fixes = traceGapFixes(
      trace(onControl, {
        controls: [control],
        requirements: [requirement(3, 0), requirement(4, 0)],
      }),
      PROGRAM,
    );
    expect(fixes).toEqual([
      {
        stage: "evidence",
        kind: "link_evidence",
        requirement: { id: id(3), code: "REQ-003", programId: PROGRAM },
      },
    ]);
  });

  it("offers nothing to a control whose requirements cite evidence", () => {
    expect(
      traceGapFixes(
        trace(onControl, {
          controls: [control],
          requirements: [requirement(3, 1)],
          evidence: [evidence],
        }),
        PROGRAM,
      ),
    ).toEqual([]);
  });

  it("offers a requirement its own control and its own evidence", () => {
    const own = requirement(3, 0);
    const fixes = traceGapFixes(
      trace({ kind: "requirement", id: own.id }, { requirements: [own] }),
    );
    const named = { id: own.id, code: "REQ-003", programId: PROGRAM };
    expect(fixes).toEqual([
      { stage: "control", kind: "map_control", requirement: named },
      { stage: "evidence", kind: "link_evidence", requirement: named },
    ]);
    expect(fixes.map(nextStepLabel)).toEqual(["Map control", "Link evidence to REQ-003"]);
  });

  it("offers nothing from a record further down the chain", () => {
    for (const kind of ["evidence", "issue", "risk", "remediation"] as const)
      expect(traceGapFixes(trace({ kind, id: id(60) }), PROGRAM), kind).toEqual([]);
  });
});
