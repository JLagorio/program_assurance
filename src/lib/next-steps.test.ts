import { describe, expect, it } from "vitest";
import type { AssuranceTrace } from "./assurance-trace";
import {
  controlNextStep,
  isInPlaceStep,
  isReaderFix,
  mappingStep,
  nextStepLabel,
  stepNeedsCoverage,
  traceGapFixes,
  type StepCoverage,
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

/** Two systems that select a control: the program's authorization boundaries. */
const x800 = { id: id(91), code: "X800-A-CUSA", name: "X800 Missile · Customer A" };
const r210 = { id: id(92), code: "R210-STD-CUSA", name: "R210 Launcher · Customer A" };

/** An objective of a control, covered on the systems named of the two that select it. */
const objective = (n: number, on: string[], evidenced = false) => ({
  id: id(600 + n),
  label: `SI-04(13)(${n})`,
  prose: null,
  ancestors: [],
  mapped: on.length === 2,
  evidenced,
  mappedOn: on,
});

/** A system's standing on a control of `of` objectives, as the coverage says it. */
const onSystem = (
  system: typeof x800,
  mapped: number,
  of: number,
  allocated: number,
): StepCoverage["systems"][number] => ({
  ...system,
  mapped: mapped === of,
  evidenced: false,
  objectivesMapped: mapped,
  objectivesEvidenced: 0,
  allocated,
});

const coverage = (parts: Partial<StepCoverage>): StepCoverage => ({
  objectives: [],
  systems: [],
  requirements: [],
  ...parts,
});

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

  it("maps the rest of a control whose requirements map some of its objectives", () => {
    // 12 of AC-2's 26 objectives mapped: the control stands where none maps it, and its step maps
    // the 14 left, which the picker opens on.
    const step = controlNextStep({
      status: "no_requirement",
      objectives: 26,
      objectivesMapped: 12,
    });
    expect(step).toEqual({ kind: "map_requirement", rest: 14 });
    expect(nextStepLabel(step!)).toBe("Map 14 more objectives");
    expect(isInPlaceStep(step!)).toBe(true);
    expect(
      nextStepLabel(
        controlNextStep({ status: "no_requirement", objectives: 26, objectivesMapped: 25 })!,
      ),
    ).toBe("Map 1 more objective");
    // Nothing mapped, or a control with no objectives: the whole control is what is left.
    for (const standing of [
      { status: "no_requirement" as const, objectives: 26, objectivesMapped: 0 },
      { status: "no_requirement" as const, objectives: 0, objectivesMapped: 0 },
      { status: "no_requirement" as const },
    ])
      expect(controlNextStep(standing)).toEqual({ kind: "map_requirement" });
  });

  it("names a requirement whose evidence would cover an objective nothing evidences", () => {
    // REQ-007 covers a.1 and cites none, though REQ-009 evidences a.1 on every system; REQ-008
    // covers b on a system where nothing evidences it: evidence on REQ-008 moves the control, on
    // REQ-007 it would not. The coverage says which owes it.
    const owing = coverage({
      requirements: [
        { id: id(7), code: "REQ-007", evidenced: false, owes: false },
        { id: id(8), code: "REQ-008", evidenced: false, owes: true },
        { id: id(9), code: "REQ-009", evidenced: true, owes: false },
      ],
    });
    const requirements = [requirement(7, 0), requirement(8, 0), requirement(9, 1)];
    expect(controlNextStep({ status: "no_evidence" }, requirements, undefined, owing)).toEqual({
      kind: "link_evidence",
      requirement: { id: id(8), code: "REQ-008", programId: PROGRAM },
    });
    // Without the objectives, the first requirement that cites none.
    expect(controlNextStep({ status: "no_evidence" }, requirements)).toEqual({
      kind: "link_evidence",
      requirement: { id: id(7), code: "REQ-007", programId: PROGRAM },
    });
  });

  describe("every system counts", () => {
    it("maps what no system covers yet, before any system it is short on", () => {
      // Three of six objectives covered on X800 alone: the three left are mapped first.
      const partly = coverage({
        objectives: [1, 2, 3, 4, 5, 6].map((n) => objective(n, n <= 3 ? [x800.id] : [])),
        systems: [onSystem(x800, 3, 6, 2), onSystem(r210, 0, 6, 1)],
      });
      const step = controlNextStep({ status: "no_requirement" }, [], undefined, partly);
      expect(step).toEqual({ kind: "map_requirement", rest: 3 });
      expect(nextStepLabel(step!)).toBe("Map 3 more objectives");
    });

    it("maps on the first system it is short on, where a requirement is allocated there", () => {
      // Every objective covered on X800, none on R210: the control stands at No requirement.
      const short = coverage({
        objectives: [1, 2].map((n) => objective(n, [x800.id])),
        systems: [onSystem(r210, 0, 2, 2), onSystem(x800, 2, 2, 5)],
      });
      const step = mappingStep(short);
      expect(step).toEqual({ kind: "map_requirement", system: r210 });
      expect(nextStepLabel(step)).toBe("Map on R210-STD-CUSA");
      expect(isInPlaceStep(step)).toBe(true);
    });

    it("allocates a requirement to the system first, where none is allocated there", () => {
      const step = mappingStep(
        coverage({
          objectives: [objective(1, [x800.id])],
          systems: [onSystem(x800, 1, 1, 3), onSystem(r210, 0, 1, 0)],
        }),
      );
      expect(step).toEqual({ kind: "allocate_requirement", system: r210 });
      expect(nextStepLabel(step)).toBe("Allocate to R210-STD-CUSA");
      expect(isInPlaceStep(step)).toBe(true);
    });

    it("counts a control with no objective by the control itself on each system", () => {
      const step = mappingStep(
        coverage({
          systems: [
            { ...onSystem(x800, 0, 0, 1), mapped: false },
            { ...onSystem(r210, 0, 0, 1), mapped: true },
          ],
        }),
      );
      expect(step).toEqual({ kind: "map_requirement", system: x800 });
    });

    it("maps the whole control where nothing is covered anywhere", () => {
      for (const nothing of [
        coverage({
          objectives: [objective(1, []), objective(2, [])],
          systems: [onSystem(x800, 0, 2, 1), onSystem(r210, 0, 2, 1)],
        }),
        coverage({ systems: [onSystem(x800, 0, 0, 0)] }),
        coverage({}),
      ])
        expect(mappingStep(nothing)).toEqual({ kind: "map_requirement" });
    });

    it("reads the coverage only where the status cannot say the step", () => {
      const standing = (status: keyof typeof controlStatuses, requirements = 0, evidenced = 0) => ({
        status,
        requirements,
        evidenced,
      });
      // Mapped somewhere and short somewhere: what is left, and on which system.
      expect(stepNeedsCoverage(standing("no_requirement", 1))).toBe(true);
      expect(stepNeedsCoverage(standing("no_requirement", 0))).toBe(false);
      // Several requirements without evidence: which one owes it.
      expect(stepNeedsCoverage(standing("no_evidence", 3, 1))).toBe(true);
      expect(stepNeedsCoverage(standing("no_evidence", 2, 1))).toBe(false);
      for (const status of ["not_assessed", "partially_satisfied", "satisfied"] as const)
        expect(stepNeedsCoverage(standing(status, 4, 4)), status).toBe(false);
    });
  });

  it("knows which steps are done on the control itself", () => {
    for (const step of [
      { kind: "map_requirement" },
      { kind: "map_requirement", rest: 3 },
      { kind: "map_requirement", system: r210 },
      { kind: "allocate_requirement", system: r210 },
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

  it("carries the Details' step in the requirements stage of a control mapped in part", () => {
    const partly = trace(onControl, {
      controls: [control],
      requirements: [requirement(262, 0)],
    });
    const waiting = { status: "no_requirement" as const };
    // What is left, or the system it is short on: the step its Details carry, over the page.
    for (const step of [
      { kind: "map_requirement", rest: 3 },
      { kind: "map_requirement", system: r210 },
      { kind: "allocate_requirement", system: r210 },
    ] as const) {
      const fixes = traceGapFixes(partly, PROGRAM, waiting, undefined, step);
      expect(fixes, step.kind).toEqual([
        { stage: "requirement", ...step },
        // Its requirement cites no evidence: the Evidence stage still offers it, as before.
        {
          stage: "evidence",
          kind: "link_evidence",
          requirement: { id: id(262), code: "REQ-262", programId: PROGRAM },
        },
      ]);
      expect(isReaderFix(fixes[0]!)).toBe(true);
    }
    expect(nextStepLabel({ stage: "requirement", kind: "map_requirement", rest: 3 })).toBe(
      "Map 3 more objectives",
    );
    // A control past No requirement offers nothing in the stage, whatever step it is given.
    expect(
      traceGapFixes(partly, PROGRAM, { status: "no_evidence" }, undefined, {
        kind: "link_evidence",
        requirement: null,
      }).map((fix) => fix.stage),
    ).toEqual(["evidence"]);
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
