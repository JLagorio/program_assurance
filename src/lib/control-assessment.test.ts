import { describe, expect, it, vi } from "vitest";
import { args, fakeClient, uuid } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const {
  CONTROL_ASSESSMENT_ANSWER_UNREADABLE,
  addControlsToAssessmentPlan,
  choiceRequests,
  controlAssessment,
  latestPlans,
  planControlAssessment,
} = await import("./control-assessment");

const context = { tenantId: uuid(1), token: "token" };

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
      [],
    );
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
      [{ plan_revision_id: uuid(24) }],
    );
    expect(answer.planned).toEqual({ id: uuid(13), title: "Expanded control set" });
    expect(answer.campaigns.find((item) => item.id === uuid(13))?.holds).toBe(true);
    // The plan that holds it is not one more to add it to.
    expect(answer.drafts).toBe(1);
  });

  it("says no campaign holds it when only a closed campaign or an earlier plan did", () => {
    const answer = controlAssessment(
      campaigns,
      [plan(20, 10, 1, "published"), plan(21, 10, 2, "draft"), plan(23, 12, 1, "draft")],
      // An objective of the annual assessment's first plan, and of the completed campaign's.
      [{ plan_revision_id: uuid(20) }, { plan_revision_id: uuid(23) }],
    );
    expect(answer.planned).toBeNull();
    expect(answer.drafts).toBe(1);
  });

  it("counts no draft where no open campaign has a plan", () => {
    const answer = controlAssessment([campaign(10, "planned", "Annual assessment")], [], []);
    expect(answer).toMatchObject({ planned: null, drafts: 0 });
    expect(answer.campaigns[0]).toMatchObject({ plan: null, holds: false });
  });
});

describe("adding controls to a campaign's draft plan", () => {
  const request = {
    planRevisionId: uuid(21),
    expectedRevision: 3,
    requestId: uuid(30),
    controlIds: [uuid(40), uuid(41)],
  };
  const answered = {
    campaignId: uuid(10),
    planRevisionId: uuid(21),
    added: 2,
    skipped: 0,
    objectiveIds: [uuid(50), uuid(51)],
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
});

describe("planning an assessment of a control", () => {
  it("sends the program, the SSP, the title and the controls in one request", async () => {
    const answered = {
      campaignId: uuid(15),
      planRevisionId: uuid(25),
      added: 1,
      skipped: 0,
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
