import { describe, expect, it } from "vitest";
import type { AssuranceTrace } from "./assurance-trace";
import {
  controlNextStep,
  isInPlaceStep,
  isReaderFix,
  nextStepLabel,
  traceGapFixes,
} from "./next-steps";
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
  findings: [],
  ...parts,
});

/** An open campaign whose plan holds a control already. */
const fy27 = { id: id(80), title: "Continuous monitoring FY2027" };

describe("controlNextStep", () => {
  it("has a step for every status but satisfied", () => {
    for (const status of Object.keys(controlStatuses) as (keyof typeof controlStatuses)[])
      expect(controlNextStep({ status }) === null, status).toBe(status === "satisfied");
  });

  it("names the first requirement that cites no evidence", () => {
    const step = controlNextStep({ status: "no_evidence" }, [
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
    const step = controlNextStep({ status: "no_evidence" });
    expect(step).toEqual({ kind: "link_evidence", requirement: null });
    expect(nextStepLabel(step!)).toBe("Link evidence");
  });

  it("sends an assessor's verdict to the findings, and evidence waiting on one to a campaign", () => {
    expect(controlNextStep({ status: "not_assessed" })).toEqual({ kind: "assess" });
    expect(controlNextStep({ status: "other_than_satisfied" })).toEqual({
      kind: "review_findings",
    });
    expect(
      controlNextStep({
        status: "partially_satisfied",
        determinedBy: "program",
        productAssessments: [],
      }),
    ).toEqual({ kind: "review_findings" });
    expect(nextStepLabel({ kind: "assess" })).toBe("Add to assessment campaign");
    expect(nextStepLabel({ kind: "review_findings" })).toBe("Open assessment findings");
    expect(nextStepLabel({ kind: "map_requirement" })).toBe("Map a requirement");
  });

  it("puts evidence nobody determined into the assessment that holds it, a draft plan or a new one", () => {
    const step = (plans: { planned: typeof fy27 | null; drafts: number }) =>
      controlNextStep({ status: "not_assessed" }, [requirement(3, 1)], plans);
    // An open campaign's plan holds the control: its assessment is under way there.
    expect(step({ planned: fy27, drafts: 2 })).toEqual({ kind: "open_campaign", campaign: fy27 });
    expect(nextStepLabel(step({ planned: fy27, drafts: 2 })!)).toBe("Open assessment campaign");
    // None holds it: the draft plan of one of them, or a new campaign where none has a draft.
    expect(step({ planned: null, drafts: 1 })).toEqual({ kind: "assess" });
    expect(step({ planned: null, drafts: 0 })).toEqual({ kind: "plan_assessment" });
    expect(nextStepLabel({ kind: "plan_assessment" })).toBe("Plan an assessment");
    // What the campaigns hold decides nothing for any other status.
    expect(controlNextStep({ status: "no_requirement" }, [], { planned: fy27, drafts: 0 })).toEqual(
      { kind: "map_requirement" },
    );
  });

  it("knows which steps are done on the control itself", () => {
    for (const step of [
      { kind: "map_requirement" },
      { kind: "assess" },
      { kind: "plan_assessment" },
    ] as const)
      expect(isInPlaceStep(step), step.kind).toBe(true);
    expect(isInPlaceStep({ kind: "open_campaign", campaign: fy27 })).toBe(false);
    expect(isInPlaceStep({ kind: "review_findings" })).toBe(false);
    expect(isInPlaceStep({ kind: "link_evidence", requirement: null })).toBe(false);
  });

  describe("a status the product determined", () => {
    const x800 = { id: id(70), title: "X800 Missile version 1 product assessment" };
    const r210 = {
      id: id(71),
      title: "R210 Launcher Electronics Unit version 2 product assessment",
    };

    it("has no step once satisfied", () => {
      expect(
        controlNextStep({
          status: "satisfied",
          determinedBy: "product",
          productAssessments: [{ ...x800, determination: "satisfied" }],
        }),
      ).toBeNull();
    });

    it("leads short of satisfied to the product assessment that decided it", () => {
      for (const status of ["other_than_satisfied", "partially_satisfied"] as const) {
        const step = controlNextStep(
          {
            status,
            determinedBy: "product",
            // The one that decided it first: the worst of the variants' determinations.
            productAssessments: [
              { ...r210, determination: status },
              { ...x800, determination: "satisfied" },
            ],
          },
          [requirement(3, 1)],
        );
        expect(step, status).toEqual({ kind: "review_product_assessment", assessment: r210 });
        expect(nextStepLabel(step!)).toBe("Open product assessment");
      }
    });
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

  it("offers nothing more to a control whose requirements cite evidence until its plans are read", () => {
    const evidenced = trace(onControl, {
      controls: [control],
      requirements: [requirement(3, 1)],
      evidence: [evidence],
    });
    expect(traceGapFixes(evidenced, PROGRAM)).toEqual([]);
    expect(traceGapFixes(evidenced, PROGRAM, { status: "not_assessed" })).toEqual([]);
  });

  describe("evidence no assessor has determined", () => {
    const evidenced = (findings: Trace["findings"] = []) =>
      trace(onControl, {
        controls: [control],
        requirements: [requirement(3, 1)],
        evidence: [evidence],
        findings,
      });
    const waiting = { status: "not_assessed" as const };

    it("offers to add the control to a campaign's draft plan, or to plan an assessment", () => {
      const added = traceGapFixes(evidenced(), PROGRAM, waiting, { planned: null, drafts: 2 });
      expect(added).toEqual([{ stage: "finding", kind: "assess" }]);
      expect(nextStepLabel(added[0]!)).toBe("Add to assessment campaign");
      expect(isReaderFix(added[0]!)).toBe(true);
      const planned = traceGapFixes(evidenced(), PROGRAM, waiting, { planned: null, drafts: 0 });
      expect(planned).toEqual([{ stage: "finding", kind: "plan_assessment" }]);
      expect(isReaderFix(planned[0]!)).toBe(true);
    });

    it("names the campaign whose plan holds the control, for every reader", () => {
      const fixes = traceGapFixes(evidenced(), PROGRAM, waiting, { planned: fy27, drafts: 1 });
      expect(fixes).toEqual([{ stage: "finding", kind: "open_campaign", campaign: fy27 }]);
      expect(nextStepLabel(fixes[0]!)).toBe("Open assessment campaign");
      expect(isReaderFix(fixes[0]!)).toBe(false);
    });

    it("offers nothing where a finding stands, or the status says it is not waiting", () => {
      const plans = { planned: null, drafts: 1 };
      const finding = {
        id: id(40),
        title: "AC-2 determined",
        determination: "not_assessed",
        determined_at: null,
        results_state: "published",
        program_id: PROGRAM,
      };
      expect(traceGapFixes(evidenced([finding]), PROGRAM, waiting, plans)).toEqual([]);
      for (const status of ["satisfied", "partially_satisfied", "other_than_satisfied"] as const)
        expect(traceGapFixes(evidenced(), PROGRAM, { status }, plans), status).toEqual([]);
      expect(traceGapFixes(evidenced(), null, waiting, plans)).toEqual([]);
    });
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

  describe("a control the product decided", () => {
    const x800 = { id: id(70), title: "X800 Missile version 1 product assessment" };
    const r210 = {
      id: id(71),
      title: "R210 Launcher Electronics Unit version 2 product assessment",
    };
    const decided = {
      status: "satisfied" as const,
      determinedBy: "product" as const,
      productAssessments: [
        { ...x800, determination: "satisfied" as const },
        { ...r210, determination: "satisfied" as const },
      ],
    };

    it("names the product assessment that decided it, never Map a requirement", () => {
      const fixes = traceGapFixes(trace(onControl, { controls: [control] }), PROGRAM, decided);
      expect(fixes).toEqual([
        { stage: "requirement", kind: "decided_by_product", assessment: x800 },
      ]);
      expect(nextStepLabel(fixes[0]!)).toBe("Decided by X800 Missile version 1 product assessment");
      // Words that say why the stage is empty, not a fix: a viewer reads them too.
      expect(isReaderFix(fixes[0]!)).toBe(false);
    });

    it("names it short of satisfied too, as the one that decided the status", () => {
      const short = {
        status: "other_than_satisfied" as const,
        determinedBy: "product" as const,
        productAssessments: [
          { ...r210, determination: "other_than_satisfied" as const },
          { ...x800, determination: "satisfied" as const },
        ],
      };
      expect(traceGapFixes(trace(onControl, { controls: [control] }), PROGRAM, short)).toEqual([
        { stage: "requirement", kind: "decided_by_product", assessment: r210 },
      ]);
    });

    it("still offers a requirement where the program decided it, or nobody did", () => {
      for (const standing of [
        { status: "no_requirement" as const, determinedBy: null, productAssessments: [] },
        { status: "satisfied" as const, determinedBy: "program" as const, productAssessments: [] },
        // The product determined it, and no assessment can be named: nothing to say instead.
        { status: "satisfied" as const, determinedBy: "product" as const, productAssessments: [] },
        null,
      ])
        expect(
          traceGapFixes(trace(onControl, { controls: [control] }), PROGRAM, standing),
          JSON.stringify(standing),
        ).toEqual([{ stage: "requirement", kind: "map_requirement" }]);
    });

    it("keeps offering evidence for a requirement that maps it and cites none", () => {
      expect(
        traceGapFixes(
          trace(onControl, { controls: [control], requirements: [requirement(3, 0)] }),
          PROGRAM,
          decided,
        ),
      ).toEqual([
        {
          stage: "evidence",
          kind: "link_evidence",
          requirement: { id: id(3), code: "REQ-003", programId: PROGRAM },
        },
      ]);
    });
  });

  it("offers an operational issue a requirement of its own while it names none", () => {
    const onIssue = { kind: "issue", id: id(61) } as const;
    const fixes = traceGapFixes(trace(onIssue, { controls: [control], evidence: [evidence] }));
    expect(fixes).toEqual([
      { stage: "requirement", kind: "link_requirement", issue: { id: id(61) } },
    ]);
    expect(nextStepLabel(fixes[0]!)).toBe("Link requirement");
    expect(isReaderFix(fixes[0]!)).toBe(true);
    // A requirement it names, or one its evidence supports, fills the stage: no gap to close.
    expect(traceGapFixes(trace(onIssue, { requirements: [requirement(3, 1)] }))).toEqual([]);
  });

  it("offers nothing upstream from a record further down the chain", () => {
    for (const kind of ["evidence", "finding", "risk", "remediation"] as const)
      expect(traceGapFixes(trace({ kind, id: id(60) }), PROGRAM), kind).toEqual([]);
  });
});
