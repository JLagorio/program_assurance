import { describe, expect, it, vi } from "vitest";
import { args, fakeClient, uuid } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const {
  CAMPAIGN_HAS_NO_RESULTS,
  CAMPAIGN_RESULTS_HOLD_NO_FINDING,
  CAMPAIGN_RESULTS_PUBLISHED,
  RESULTS_ANSWER_UNREADABLE,
  RESULTS_NEED_FINDINGS,
  RESULTS_REVISION_MISSING,
  campaignResultsToPublish,
  publishAssessmentResults,
} = await import("./assessment-results");

const context = { tenantId: uuid(1), token: "token" };

describe("publishing assessment results", () => {
  const request = {
    id: uuid(20),
    title: "Interim results — expanded control set, increment 2",
    versionNumber: 2,
    revision: 1,
    findings: 20,
    requestId: uuid(30),
  };
  const answered = {
    resultsRevisionId: uuid(20),
    campaignId: uuid(10),
    programId: uuid(5),
    versionNumber: 2,
    findings: 20,
    publishedAt: "2026-11-13T23:10:00+00:00",
  };

  it("sends one request at the revision and with the findings the reader saw, and reads its answer", async () => {
    const { client, calls } = fakeClient(() => ({ data: answered, error: null }));
    await expect(publishAssessmentResults(client, context, request)).resolves.toEqual(answered);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("rpc:publish_assessment_results");
    expect(args(calls[0], "rpc")[0]).toEqual([
      {
        p_tenant_id: uuid(1),
        p_results_revision_id: uuid(20),
        p_expected_revision: 1,
        p_expected_findings: 20,
        p_request_id: uuid(30),
      },
    ]);
    expect(args(calls[0], "setHeader")).toEqual([["Authorization", "Bearer token"]]);
  });

  it("sends the same request again as it is, so the command answers it as it first did", async () => {
    const { client, calls } = fakeClient(() => ({ data: answered, error: null }));
    await publishAssessmentResults(client, context, request);
    await publishAssessmentResults(client, context, request);
    expect(args(calls[0], "rpc")).toEqual(args(calls[1], "rpc"));
  });

  it("says each refusal in the command's own words, ending a sentence", async () => {
    for (const [code, message, said] of [
      [
        "23514",
        "These assessment results were already published. Reload to see them.",
        "These assessment results were already published. Reload to see them.",
      ],
      [
        "PT409",
        "These assessment results now hold 21 findings. Reload them before publishing.",
        "These assessment results now hold 21 findings. Reload them before publishing.",
      ],
      [
        "42501",
        "An editor, admin, or owner can publish assessment results",
        "An editor, admin, or owner can publish assessment results.",
      ],
    ] as const) {
      const { client } = fakeClient(() => ({ data: null, error: { code, message } }));
      await expect(publishAssessmentResults(client, context, request)).rejects.toThrow(said);
    }
  });

  it("sends nothing for results with no finding, or without the revision the reader saw", async () => {
    const { client, calls } = fakeClient(() => ({ data: answered, error: null }));
    await expect(
      publishAssessmentResults(client, context, { ...request, findings: 0 }),
    ).rejects.toThrow(RESULTS_NEED_FINDINGS);
    await expect(
      publishAssessmentResults(client, context, { ...request, revision: Number.NaN }),
    ).rejects.toThrow(RESULTS_REVISION_MISSING);
    expect(calls).toHaveLength(0);
  });

  it("says when the answer cannot be read, since the results may have been published", async () => {
    const { client } = fakeClient(() => ({ data: { findings: "twenty" }, error: null }));
    await expect(publishAssessmentResults(client, context, request)).rejects.toThrow(
      RESULTS_ANSWER_UNREADABLE,
    );
  });
});

describe("a campaign's results to publish", () => {
  const results = (
    n: number,
    state: "draft" | "published",
    version: number,
    createdAt: string,
    title = `Results ${n}`,
  ) => ({
    id: uuid(n),
    title,
    version_number: version,
    state,
    revision: version + 1,
    created_at: createdAt,
  });
  const finding = (resultsId: number) => ({ assessment_results_revision_id: uuid(resultsId) });

  it("publishes the latest draft that holds a finding, with how many it holds", () => {
    const answer = campaignResultsToPublish(
      [
        results(20, "published", 1, "2026-11-01T00:00:00Z"),
        results(21, "draft", 2, "2026-11-10T00:00:00Z"),
        results(22, "draft", 3, "2026-11-12T00:00:00Z"),
        // The newest draft holds nothing yet, so it is not the one.
        results(23, "draft", 4, "2026-11-13T00:00:00Z"),
      ],
      // The published results' findings count for nothing here.
      [finding(20), finding(21), finding(22), finding(22), finding(22)],
    );
    expect(answer).toEqual({
      results: { id: uuid(22), title: "Results 22", versionNumber: 3, revision: 4, findings: 3 },
      waits: null,
    });
  });

  it("says why there is nothing to publish", () => {
    expect(campaignResultsToPublish([], [])).toEqual({
      results: null,
      waits: CAMPAIGN_HAS_NO_RESULTS,
    });
    expect(campaignResultsToPublish([results(21, "draft", 1, "2026-11-10T00:00:00Z")], [])).toEqual(
      { results: null, waits: CAMPAIGN_RESULTS_HOLD_NO_FINDING },
    );
    expect(
      campaignResultsToPublish(
        [results(20, "published", 1, "2026-11-01T00:00:00Z")],
        [finding(20)],
      ),
    ).toEqual({ results: null, waits: CAMPAIGN_RESULTS_PUBLISHED });
  });
});
