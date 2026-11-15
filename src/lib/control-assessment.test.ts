import { describe, expect, it } from "vitest";
import { args, fakeClient, uuid } from "./testing/fake-client";

const {
  CONTROL_ASSESSMENT_ANSWER_UNREADABLE,
  addControlsToAssessmentPlan,
  assessmentTakes,
  campaignHolds,
  choiceRequests,
  controlAssessment,
  latestPlans,
  planControlAssessment,
  planTakes,
  readPlanControlHoldings,
} = await import("./control-assessment");
const { controlNextStep, judgedInPart, nextStepLabel } = await import("./next-steps");

const context = { tenantId: uuid(1), token: "token" };

/**
 * What the plans hold of a control that counts 26 objectives, none of them judged unless said: by
 * plan, how many, whether whole, whether it holds what the program has not judged yet (the whole
 * control while none is judged) and how many of the objectives nobody has judged it holds (every
 * one it holds while none is judged).
 */
const holdings = (
  plans: [number, number, boolean, boolean?, number?][] = [],
  objectives = 26,
  objectivesAssessed = 0,
) => ({
  objectives,
  objectivesAssessed,
  plans: new Map(
    plans.map(([n, held, holds, holdsUnjudged = holds, unjudgedHeld = held]) => [
      uuid(n),
      { held, holds, holdsUnjudged, unjudgedHeld },
    ]),
  ),
});

const campaign = (n: number, status: string, title: string, startsAt: string | null = null) => ({
  id: uuid(n),
  title,
  status,
  starts_at: startsAt,
  ends_at: null,
});
const plan = (n: number, campaignId: number, version: number, state: "draft" | "published") => ({
  id: uuid(n),
  campaign_id: uuid(campaignId),
  title: `Plan ${n}`,
  version_number: version,
  state,
  revision: version + 1,
  ssp_revision_id: uuid(90),
});

describe("what the program's campaigns hold of a control", () => {
  const campaigns = [
    campaign(10, "planned", "Annual assessment", "2027-03-01T00:00:00Z"),
    campaign(11, "active", "Continuous monitoring"),
    campaign(12, "completed", "Initial authorization"),
    campaign(13, "planned", "Expanded control set", "2027-01-15T00:00:00Z"),
    campaign(14, "cancelled", "Withdrawn assessment"),
  ];

  it("reads each campaign's latest plan", () => {
    const latest = latestPlans([plan(20, 10, 1, "published"), plan(21, 10, 2, "draft")]);
    expect(latest.get(uuid(10))?.id).toBe(uuid(21));
  });

  it("lists the open campaigns, active first, then the earliest start, and counts their draft plans", () => {
    const answer = controlAssessment(
      campaigns,
      [
        plan(20, 10, 1, "published"),
        plan(21, 10, 2, "draft"),
        plan(22, 11, 1, "published"),
        plan(23, 12, 1, "draft"),
        plan(24, 13, 1, "draft"),
      ],
      holdings(),
    );
    expect(answer.objectives).toBe(26);
    expect(answer.campaigns.map((item) => item.title)).toEqual([
      "Continuous monitoring",
      "Expanded control set",
      "Annual assessment",
    ]);
    expect(answer.campaigns.map((item) => item.plan?.id)).toEqual([uuid(22), uuid(24), uuid(21)]);
    expect(answer.campaigns[2]!.plan).toEqual({
      id: uuid(21),
      title: "Plan 21",
      versionNumber: 2,
      state: "draft",
      revision: 3,
      sspRevisionId: uuid(90),
    });
    // A completed campaign's draft plan takes nothing; the published one is not a draft.
    expect(answer.drafts).toBe(2);
    expect(answer.planned).toBeNull();
  });

  it("names the open campaign whose latest plan holds the control", () => {
    const answer = controlAssessment(
      campaigns,
      [plan(21, 10, 2, "draft"), plan(22, 11, 1, "published"), plan(24, 13, 1, "draft")],
      holdings([[24, 26, true]]),
    );
    expect(answer.planned).toEqual({ id: uuid(13), title: "Expanded control set" });
    expect(answer.campaigns.find((item) => item.id === uuid(13))).toMatchObject({
      holds: true,
      objectivesHeld: 26,
    });
    // The plan that holds it is not one more to add it to.
    expect(answer.drafts).toBe(1);
  });

  it("keeps a draft that holds some of the control's objectives as one to add the rest to", () => {
    const answer = controlAssessment(
      campaigns,
      [plan(21, 10, 2, "draft"), plan(22, 11, 1, "published"), plan(24, 13, 1, "draft")],
      // The expanded set holds 12 of the 26; continuous monitoring's published plan holds 3.
      holdings([
        [24, 12, false],
        [22, 3, false],
      ]),
    );
    expect(answer.planned).toBeNull();
    expect(answer.drafts).toBe(2);
    expect(answer.campaigns.map((item) => [item.title, item.objectivesHeld, item.holds])).toEqual([
      ["Continuous monitoring", 3, false],
      ["Expanded control set", 12, false],
      ["Annual assessment", 0, false],
    ]);
  });

  it("holds a control by its statement, whatever it counts", () => {
    // A plan written before plans took objectives holds the statement: every objective, whole.
    const answer = controlAssessment(
      campaigns,
      [plan(21, 10, 2, "draft")],
      holdings([[21, 26, true]]),
    );
    expect(answer.planned).toEqual({ id: uuid(10), title: "Annual assessment" });
    expect(answer.drafts).toBe(0);
    // A control that counts no objective is held by its statement alone.
    const bare = controlAssessment(
      campaigns,
      [plan(21, 10, 2, "draft")],
      holdings([[21, 0, true]], 0),
    );
    expect(bare).toMatchObject({ objectives: 0, planned: { id: uuid(10) }, drafts: 0 });
  });

  it("says no campaign holds it when only a closed campaign or an earlier plan did", () => {
    const answer = controlAssessment(
      campaigns,
      [plan(20, 10, 1, "published"), plan(21, 10, 2, "draft"), plan(23, 12, 1, "draft")],
      // The annual assessment's first plan, and the completed campaign's, held it whole.
      holdings([
        [20, 26, true],
        [23, 26, true],
      ]),
    );
    expect(answer.planned).toBeNull();
    expect(answer.drafts).toBe(1);
  });

  it("follows a control judged in part to the campaign whose plan holds what is left", () => {
    // Continuous monitoring's published plan holds the 23 objectives nobody has judged, not the 3
    // its first results judged; the expanded set's draft holds 3 of the 26, and none of the rest.
    const answer = controlAssessment(
      campaigns,
      [plan(21, 10, 2, "draft"), plan(22, 11, 1, "published"), plan(24, 13, 1, "draft")],
      holdings(
        [
          [22, 23, false, true, 23],
          [24, 3, false, false, 0],
        ],
        26,
        3,
      ),
    );
    expect(answer.objectivesAssessed).toBe(3);
    expect(answer.planned).toEqual({ id: uuid(11), title: "Continuous monitoring" });
    expect(answer.campaigns.find((item) => item.id === uuid(11))).toMatchObject({
      holds: false,
      holdsUnjudged: true,
      objectivesHeld: 23,
      unjudgedHeld: 23,
    });
    expect(answer.campaigns.find((item) => item.id === uuid(13))).toMatchObject({
      objectivesHeld: 3,
      unjudgedHeld: 0,
    });
    // The two drafts hold none of what is left: either takes the control.
    expect(answer.drafts).toBe(2);
    // Not assessed until all: the control's step opens the campaign where the rest is judged.
    const step = controlNextStep({ status: "not_assessed" }, [], answer);
    expect(step).toEqual({ kind: "open_campaign", campaign: answer.planned });
    expect(nextStepLabel(step!)).toBe("Open assessment campaign");
    // A plan that holds only what was judged leaves the rest to a draft, or to a new plan.
    const drafted = controlAssessment(
      campaigns,
      [plan(22, 11, 1, "published"), plan(24, 13, 1, "draft")],
      holdings(
        [
          [22, 3, false, false, 0],
          [24, 3, false, false, 0],
        ],
        26,
        3,
      ),
    );
    expect(drafted).toMatchObject({ planned: null, drafts: 1 });
    expect(nextStepLabel(controlNextStep({ status: "not_assessed" }, [], drafted)!)).toBe(
      "Add to assessment campaign",
    );
    const judged = controlAssessment(
      campaigns,
      [plan(22, 11, 1, "published")],
      holdings([[22, 3, false, false, 0]], 26, 3),
    );
    expect(judged).toMatchObject({ planned: null, drafts: 0 });
    expect(nextStepLabel(controlNextStep({ status: "not_assessed" }, [], judged)!)).toBe(
      "Plan an assessment",
    );
  });

  it("reads a plan the answer leaves out as holding nothing", () => {
    const answer = controlAssessment(campaigns, [plan(24, 13, 1, "draft")], holdings());
    expect(answer.campaigns.find((item) => item.id === uuid(13))).toMatchObject({
      holds: false,
      holdsUnjudged: false,
      objectivesHeld: 0,
      unjudgedHeld: 0,
    });
    expect(answer.drafts).toBe(1);
  });

  it("counts no draft where no open campaign has a plan", () => {
    const answer = controlAssessment(
      [campaign(10, "planned", "Annual assessment")],
      [],
      holdings([], 26, 3),
    );
    expect(answer).toMatchObject({ planned: null, drafts: 0, objectivesAssessed: 3 });
    expect(answer.campaigns[0]).toMatchObject({
      plan: null,
      holds: false,
      holdsUnjudged: false,
      objectivesHeld: 0,
      unjudgedHeld: 0,
    });
  });
});

describe("what an assessment takes of a control", () => {
  it("takes every objective of a control nobody has judged, or one judged on every objective", () => {
    expect(assessmentTakes({ objectives: 26, objectivesAssessed: 0 })).toEqual({
      objectives: 26,
      unjudged: false,
    });
    // Judged on every objective: the whole control again, a reassessment its step never offers.
    expect(assessmentTakes({ objectives: 26, objectivesAssessed: 26 })).toEqual({
      objectives: 26,
      unjudged: false,
    });
    // A control a plan takes as its statement counts none.
    expect(assessmentTakes({ objectives: 0, objectivesAssessed: 0 })).toEqual({
      objectives: 0,
      unjudged: false,
    });
  });

  it("takes only the objectives nobody has judged of a control judged in part", () => {
    expect(assessmentTakes({ objectives: 26, objectivesAssessed: 3 })).toEqual({
      objectives: 23,
      unjudged: true,
    });
    expect(assessmentTakes({ objectives: 26, objectivesAssessed: 25 })).toEqual({
      objectives: 1,
      unjudged: true,
    });
    // The same reading as the control's step, which follows it to Add to assessment campaign.
    expect(judgedInPart({ status: "not_assessed", objectives: 26, objectivesAssessed: 3 })).toBe(
      true,
    );
  });

  it("says what Plan an assessment plans, of the objectives the control counts", () => {
    // Judged in part: the 23 of AC-2's 26 nobody has judged.
    expect(planTakes({ objectives: 26, objectivesAssessed: 3 })).toEqual({
      counted: 26,
      objectives: 23,
      unjudged: true,
    });
    // Nobody has judged it, or every objective is judged: all 26.
    expect(planTakes({ objectives: 26, objectivesAssessed: 0 })).toEqual({
      counted: 26,
      objectives: 26,
      unjudged: false,
    });
    expect(planTakes({ objectives: 26, objectivesAssessed: 26 })).toEqual({
      counted: 26,
      objectives: 26,
      unjudged: false,
    });
    // A control that counts none: its statement.
    expect(planTakes({ objectives: 0, objectivesAssessed: 0 })).toEqual({
      counted: 0,
      objectives: 0,
      unjudged: false,
    });
  });

  it("reads what each campaign's plan holds against what the assessment takes", () => {
    // AC-2 with 3 of its 26 objectives judged: the annual plan holds 8 of its objectives, 5 of them
    // nobody has judged; continuous monitoring's holds the 23 nobody has judged, none of the 3.
    const answer = controlAssessment(
      [
        campaign(10, "planned", "Annual assessment"),
        campaign(11, "active", "Continuous monitoring"),
      ],
      [plan(21, 10, 1, "draft"), plan(22, 11, 1, "draft")],
      holdings(
        [
          [21, 8, false, false, 5],
          [22, 23, false, true, 23],
        ],
        26,
        3,
      ),
    );
    const [monitoring, annual] = answer.campaigns;
    const left = assessmentTakes(answer);
    expect(left).toEqual({ objectives: 23, unjudged: true });
    expect(campaignHolds(annual!, left)).toEqual({ held: 5, holds: false });
    expect(campaignHolds(monitoring!, left)).toEqual({ held: 23, holds: true });
    // The plan holding the rest is where its assessment goes on; the other takes what it lacks.
    expect(answer).toMatchObject({
      planned: { id: uuid(11), title: "Continuous monitoring" },
      drafts: 1,
    });
    // Read against the whole control, as for one nobody has judged or judged on every objective.
    const whole = { objectives: 26, unjudged: false };
    expect(campaignHolds(annual!, whole)).toEqual({ held: 8, holds: false });
    expect(campaignHolds(monitoring!, whole)).toEqual({ held: 23, holds: false });
  });
});

describe("what the plans hold of a control", () => {
  it("asks for the program, the control and the plans in one request, and reads each plan's holding", async () => {
    const { client, calls } = fakeClient(() => ({
      data: {
        control_id: uuid(40),
        objectives: 26,
        // The program's assessors have judged 3 of the 26.
        objectives_assessed: 3,
        plans: [
          {
            plan_revision_id: uuid(21),
            objectives_held: 12,
            holds: false,
            holds_unjudged: false,
            unjudged_held: 10,
          },
          {
            plan_revision_id: uuid(24),
            objectives_held: 26,
            holds: true,
            holds_unjudged: true,
            unjudged_held: 23,
          },
          // Holds the objectives its program has not judged, not those it has.
          {
            plan_revision_id: uuid(25),
            objectives_held: 23,
            holds: false,
            holds_unjudged: true,
            unjudged_held: 23,
          },
        ],
      },
      error: null,
    }));
    const answer = await readPlanControlHoldings(client, context, uuid(5), uuid(40), [
      uuid(21),
      uuid(24),
    ]);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("rpc:plan_control_holdings");
    expect(args(calls[0], "rpc")[0]).toEqual([
      {
        p_tenant_id: uuid(1),
        p_program_id: uuid(5),
        p_control_id: uuid(40),
        p_plan_revision_ids: [uuid(21), uuid(24)],
      },
    ]);
    expect(answer).toMatchObject({ objectives: 26, objectivesAssessed: 3 });
    expect(answer.plans.get(uuid(21))).toEqual({
      held: 12,
      holds: false,
      holdsUnjudged: false,
      unjudgedHeld: 10,
    });
    expect(answer.plans.get(uuid(24))).toEqual({
      held: 26,
      holds: true,
      holdsUnjudged: true,
      unjudgedHeld: 23,
    });
    expect(answer.plans.get(uuid(25))).toEqual({
      held: 23,
      holds: false,
      holdsUnjudged: true,
      unjudgedHeld: 23,
    });
  });

  it("asks what an assessment takes of the control naming no plan, as Plan an assessment reads it", async () => {
    const { client, calls } = fakeClient(() => ({
      data: { control_id: uuid(40), objectives: 26, objectives_assessed: 3, plans: [] },
      error: null,
    }));
    const answer = await readPlanControlHoldings(client, context, uuid(5), uuid(40), []);
    expect(args(calls[0], "rpc")[0]).toEqual([
      {
        p_tenant_id: uuid(1),
        p_program_id: uuid(5),
        p_control_id: uuid(40),
        p_plan_revision_ids: [],
      },
    ]);
    expect(answer).toMatchObject({ objectives: 26, objectivesAssessed: 3 });
    expect(answer.plans.size).toBe(0);
    expect(planTakes(answer)).toEqual({ counted: 26, objectives: 23, unjudged: true });
  });

  it("fails rather than read an answer it cannot parse as holding nothing", async () => {
    const { client } = fakeClient(() => ({ data: { objectives: "26" }, error: null }));
    await expect(readPlanControlHoldings(client, context, uuid(5), uuid(40), [])).rejects.toThrow();
    // An answer that does not say what the program has judged, as one naming no program.
    const { client: unscoped } = fakeClient(() => ({
      data: { control_id: uuid(40), objectives: 26, objectives_assessed: null, plans: [] },
      error: null,
    }));
    await expect(
      readPlanControlHoldings(unscoped, context, uuid(5), uuid(40), []),
    ).rejects.toThrow();
    const { client: refused } = fakeClient(() => ({
      data: null,
      error: { code: "42501", message: "Program access is required" },
    }));
    await expect(readPlanControlHoldings(refused, context, uuid(5), uuid(40), [])).rejects.toThrow(
      "Program access is required",
    );
  });
});

describe("adding controls to a campaign's draft plan", () => {
  const request = {
    planRevisionId: uuid(21),
    expectedRevision: 3,
    requestId: uuid(30),
    controlIds: [uuid(40), uuid(41)],
  };
  // The two controls count 26 and 9 objectives; the plan held 12 of the first's, and takes the rest.
  const answered = {
    campaignId: uuid(10),
    planRevisionId: uuid(21),
    added: 23,
    skipped: 0,
    counted: 35,
    judged: 0,
    objectiveIds: Array.from({ length: 23 }, (_, n) => uuid(200 + n)),
  };

  it("sends one request at the plan revision the reader saw, and reads its answer", async () => {
    const { client, calls } = fakeClient(() => ({ data: answered, error: null }));
    await expect(addControlsToAssessmentPlan(client, context, request)).resolves.toEqual(answered);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("rpc:add_controls_to_assessment_plan");
    expect(args(calls[0], "rpc")[0]).toEqual([
      {
        p_tenant_id: uuid(1),
        p_plan_revision_id: uuid(21),
        p_expected_revision: 3,
        p_request_id: uuid(30),
        p_control_ids: [uuid(40), uuid(41)],
      },
    ]);
  });

  it("says the command's refusal in its own words, ending a sentence", async () => {
    const { client } = fakeClient(() => ({
      data: null,
      error: {
        code: "PT409",
        message: "This assessment plan changed. Reload it before adding to it.",
      },
    }));
    await expect(addControlsToAssessmentPlan(client, context, request)).rejects.toThrow(
      "This assessment plan changed. Reload it before adding to it.",
    );
    const { client: refused } = fakeClient(() => ({
      data: null,
      error: {
        code: "23514",
        message: "Add controls the control baseline of the plan's SSP selects",
      },
    }));
    await expect(addControlsToAssessmentPlan(refused, context, request)).rejects.toThrow(
      "Add controls the control baseline of the plan's SSP selects.",
    );
  });

  it("says when the answer cannot be read, since the control may have been added", async () => {
    const { client } = fakeClient(() => ({ data: { added: "two" }, error: null }));
    await expect(addControlsToAssessmentPlan(client, context, request)).rejects.toThrow(
      CONTROL_ASSESSMENT_ANSWER_UNREADABLE,
    );
  });

  it("reads what is left of a control judged in part: the objectives nobody has judged", async () => {
    // AC-2 with 3 of its 26 objectives judged takes the other 23, the 3 left out as judged.
    const left = { ...answered, added: 23, counted: 26, judged: 3 };
    const { client } = fakeClient(() => ({ data: left, error: null }));
    await expect(
      addControlsToAssessmentPlan(client, context, { ...request, controlIds: [uuid(40)] }),
    ).resolves.toEqual(left);
  });

  it("reads an answer first given before plans took objectives as controls written as statements", async () => {
    // A receipt kept from then answers again as it first did, with no count of objectives and
    // none left out as judged.
    const {
      counted: _counted,
      judged: _judged,
      ...earlier
    } = {
      ...answered,
      added: 2,
      objectiveIds: [uuid(50), uuid(51)],
    };
    const { client } = fakeClient(() => ({ data: earlier, error: null }));
    await expect(addControlsToAssessmentPlan(client, context, request)).resolves.toEqual({
      ...earlier,
      counted: 0,
      judged: 0,
    });
  });

  it("reads an answer first given before it took only what is left as leaving nothing out", async () => {
    // A receipt kept from then has its count of objectives and none of what was judged.
    const { judged: _judged, ...earlier } = answered;
    const { client } = fakeClient(() => ({ data: earlier, error: null }));
    await expect(addControlsToAssessmentPlan(client, context, request)).resolves.toEqual({
      ...earlier,
      judged: 0,
    });
  });
});

describe("planning an assessment of a control", () => {
  it("sends the program, the SSP, the title and the controls in one request", async () => {
    // A control that counts no objective plans as its statement: one objective, none counted.
    const answered = {
      campaignId: uuid(15),
      planRevisionId: uuid(25),
      added: 1,
      skipped: 0,
      counted: 0,
      judged: 0,
      objectiveIds: [uuid(52)],
    };
    const { client, calls } = fakeClient(() => ({ data: answered, error: null }));
    await expect(
      planControlAssessment(client, context, {
        programId: uuid(5),
        sspRevisionId: uuid(90),
        title: "AC-2 assessment",
        requestId: uuid(31),
        controlIds: [uuid(40)],
      }),
    ).resolves.toEqual(answered);
    expect(calls[0]!.table).toBe("rpc:plan_control_assessment");
    expect(args(calls[0], "rpc")[0]).toEqual([
      {
        p_tenant_id: uuid(1),
        p_program_id: uuid(5),
        p_ssp_revision_id: uuid(90),
        p_title: "AC-2 assessment",
        p_request_id: uuid(31),
        p_control_ids: [uuid(40)],
      },
    ]);
  });
});

describe("a request id for each choice", () => {
  it("keeps one id for the same choice in any order, and another for a changed one", () => {
    let next = 0;
    const requestFor = choiceRequests(() => uuid(100 + next++));
    expect(requestFor([uuid(21), uuid(40)])).toBe(uuid(100));
    expect(requestFor([uuid(40), uuid(21)])).toBe(uuid(100));
    expect(requestFor([uuid(22), uuid(40)])).toBe(uuid(101));
    expect(requestFor([uuid(21), uuid(40)])).toBe(uuid(100));
  });
});
