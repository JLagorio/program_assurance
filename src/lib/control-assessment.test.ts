import { describe, expect, it } from "vitest";
import { args, fakeClient, uuid } from "./testing/fake-client";

const {
  CONTROL_ASSESSMENT_ANSWER_UNREADABLE,
  addControlsToAssessmentPlan,
  choiceRequests,
  controlAssessment,
  latestPlans,
  planControlAssessment,
  readPlanControlHoldings,
} = await import("./control-assessment");

const context = { tenantId: uuid(1), token: "token" };

/** What the plans hold of a control that counts 26 objectives: by plan, how many and whether whole. */
const holdings = (plans: [number, number, boolean][] = [], objectives = 26) => ({
  objectives,
  plans: new Map(plans.map(([n, held, holds]) => [uuid(n), { held, holds }])),
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

  it("reads a plan the answer leaves out as holding nothing", () => {
    const answer = controlAssessment(campaigns, [plan(24, 13, 1, "draft")], holdings());
    expect(answer.campaigns.find((item) => item.id === uuid(13))).toMatchObject({
      holds: false,
      objectivesHeld: 0,
    });
    expect(answer.drafts).toBe(1);
  });

  it("counts no draft where no open campaign has a plan", () => {
    const answer = controlAssessment(
      [campaign(10, "planned", "Annual assessment")],
      [],
      holdings(),
    );
    expect(answer).toMatchObject({ planned: null, drafts: 0 });
    expect(answer.campaigns[0]).toMatchObject({ plan: null, holds: false, objectivesHeld: 0 });
  });
});

describe("what the plans hold of a control", () => {
  it("asks for the control and the plans in one request, and reads each plan's holding", async () => {
    const { client, calls } = fakeClient(() => ({
      data: {
        control_id: uuid(40),
        objectives: 26,
        plans: [
          { plan_revision_id: uuid(21), objectives_held: 12, holds: false },
          { plan_revision_id: uuid(24), objectives_held: 26, holds: true },
        ],
      },
      error: null,
    }));
    const answer = await readPlanControlHoldings(client, context, uuid(40), [uuid(21), uuid(24)]);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("rpc:plan_control_holdings");
    expect(args(calls[0], "rpc")[0]).toEqual([
      { p_tenant_id: uuid(1), p_control_id: uuid(40), p_plan_revision_ids: [uuid(21), uuid(24)] },
    ]);
    expect(answer.objectives).toBe(26);
    expect(answer.plans.get(uuid(21))).toEqual({ held: 12, holds: false });
    expect(answer.plans.get(uuid(24))).toEqual({ held: 26, holds: true });
  });

  it("fails rather than read an answer it cannot parse as holding nothing", async () => {
    const { client } = fakeClient(() => ({ data: { objectives: "26" }, error: null }));
    await expect(readPlanControlHoldings(client, context, uuid(40), [])).rejects.toThrow();
    const { client: refused } = fakeClient(() => ({
      data: null,
      error: { code: "42501", message: "Workspace access is required" },
    }));
    await expect(readPlanControlHoldings(refused, context, uuid(40), [])).rejects.toThrow(
      "Workspace access is required",
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

  it("reads an answer first given before plans took objectives as controls written as statements", async () => {
    // A receipt kept from then answers again as it first did, with no count of objectives.
    const { counted: _counted, ...earlier } = {
      ...answered,
      added: 2,
      objectiveIds: [uuid(50), uuid(51)],
    };
    const { client } = fakeClient(() => ({ data: earlier, error: null }));
    await expect(addControlsToAssessmentPlan(client, context, request)).resolves.toEqual({
      ...earlier,
      counted: 0,
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
