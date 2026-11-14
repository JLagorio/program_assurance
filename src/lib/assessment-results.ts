import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import type { Database } from "./database.types";
import { idSet, invalidateModel, useRows, type ReadContext, type Row } from "./models";

/*
 * Publishing a program's assessment results. An assessor's findings stand in a draft results
 * revision of an assessment campaign, and decide nothing until it is published: only then do the
 * program's control statuses, its traces and its posture read them, and a published revision, with
 * its findings, no longer changes. `publish_assessment_results` publishes one draft at the revision
 * the reader saw and holding the findings the reader was told, in one request answered once: the
 * same request sent again returns its first answer. It also writes one activity event, so the
 * Portfolio's Recent activity and the program's Activity say who published, linked to the
 * campaign. A draft holding findings waits in the Review queue (Assessment results to publish),
 * and its campaign lists its results revisions and publishes from its Actions menu.
 */

type Client = Pick<SupabaseClient, "rpc">;

/** Draft results as the reader saw them, which a publication freezes. */
export type ResultsToPublish = {
  /** The results revision. */
  id: string;
  title: string;
  versionNumber: number;
  /** The revision the reader saw: results changed since are refused. */
  revision: number;
  /** How many findings the reader was told the results hold: another number is refused. */
  findings: number;
};

export type PublishResultsRequest = ResultsToPublish & {
  /** Chosen once for one publication: the same request sent again answers as it first did. */
  requestId: string;
};

const publishedSchema = z.object({
  resultsRevisionId: z.string(),
  campaignId: z.string(),
  programId: z.string(),
  versionNumber: z.number().int(),
  findings: z.number().int().nonnegative(),
  publishedAt: z.string(),
  /** The activity event that records the publication; absent in an answer given before it was. */
  activityEventId: z.string().optional(),
});
/**
 * What a publication did: the results, their campaign and program, how many findings it froze and
 * the activity event that records it.
 */
export type PublishedResults = z.infer<typeof publishedSchema>;

export const RESULTS_NEED_FINDINGS = "Record a finding before publishing these assessment results.";
export const RESULTS_REVISION_MISSING =
  "Reload the assessment results before publishing them; their revision is missing.";
export const RESULTS_ANSWER_UNREADABLE =
  "The assessment results were published, but the answer could not be read. Reload to see them.";

/** A refusal in the reader's words: the command's own, which say what stopped it. */
function refusal(error: { message: string }): Error {
  const message = error.message.trim();
  return new Error(/[.!?]$/.test(message) ? message : `${message}.`);
}

/**
 * Publish draft assessment results in one request, at the revision the reader saw and holding the
 * findings the reader was told. Results already published, changed since, holding no finding or
 * not in the workspace are refused in words the reader acts on. Sent again under the same id, the
 * request answers as it first did.
 */
export async function publishAssessmentResults(
  client: Client,
  { tenantId, token }: ReadContext,
  request: PublishResultsRequest,
): Promise<PublishedResults> {
  if (request.findings < 1) throw new Error(RESULTS_NEED_FINDINGS);
  if (!Number.isSafeInteger(request.revision)) throw new Error(RESULTS_REVISION_MISSING);
  const args: Database["public"]["Functions"]["publish_assessment_results"]["Args"] = {
    p_tenant_id: tenantId,
    p_results_revision_id: request.id,
    p_expected_revision: request.revision,
    p_expected_findings: request.findings,
    p_request_id: request.requestId,
  };
  const { data, error } = await client
    .rpc("publish_assessment_results", args)
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw refusal(error);
  const parsed = publishedSchema.safeParse(data);
  if (!parsed.success) throw new Error(RESULTS_ANSWER_UNREADABLE);
  return parsed.data;
}

/**
 * Publish assessment results as a mutation. However the request settles, every read of the results
 * revisions and of the activity events reads again, and with them each read that names either
 * model: the Review queue's pages, the campaign's results, the program's control statuses, traces
 * and posture, the findings register, the Portfolio's recently updated programs and its Recent
 * activity, and the program's Activity. A refusal for results someone else published, or changed,
 * then shows them as they are.
 */
export function usePublishAssessmentResults() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<PublishedResults, Error, PublishResultsRequest>({
    mutationFn: async (request) =>
      publishAssessmentResults(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSettled: () =>
      void Promise.all(
        (["assessment_results_revisions", "activity_events"] as const).map((model) =>
          invalidateModel(cache, workspace.tenantId, model),
        ),
      ),
  });
}

/* ——— A campaign's results to publish ———————————————————————————————————————————————————————— */

export const CAMPAIGN_RESULTS_READING = "Reading this campaign's assessment results…";
export const CAMPAIGN_RESULTS_UNREADABLE = "This campaign's assessment results could not be read.";
export const CAMPAIGN_HAS_NO_RESULTS = "This campaign has no assessment results to publish.";
export const CAMPAIGN_RESULTS_HOLD_NO_FINDING =
  "This campaign's draft assessment results hold no finding yet.";
export const CAMPAIGN_RESULTS_PUBLISHED = "This campaign's assessment results are all published.";

type ResultsLine = Pick<
  Row<"assessment_results_revisions">,
  "id" | "title" | "version_number" | "state" | "revision" | "created_at"
>;
type FindingLine = { assessment_results_revision_id: string };

/**
 * A campaign's results revisions in the order its Assessment results section lists them, newest
 * first: the latest created, then the highest version (a campaign's plans each number their own),
 * then by id, so the order holds. The Actions menu publishes the first draft in it that holds a
 * finding.
 */
export function newestResultsFirst(
  a: Pick<ResultsLine, "id" | "version_number" | "created_at">,
  b: Pick<ResultsLine, "id" | "version_number" | "created_at">,
) {
  return (
    b.created_at.localeCompare(a.created_at) ||
    b.version_number - a.version_number ||
    a.id.localeCompare(b.id)
  );
}

/** How many findings each results revision holds, by its id. */
function findingsHeld(findings: readonly FindingLine[]) {
  const held = new Map<string, number>();
  for (const finding of findings)
    held.set(
      finding.assessment_results_revision_id,
      (held.get(finding.assessment_results_revision_id) ?? 0) + 1,
    );
  return held;
}

/**
 * Which of a campaign's results Publish assessment results publishes: its latest draft that holds a
 * finding, with how many it holds. Where none does, why not, in the words the menu item says: the
 * campaign has no results, its drafts hold no finding, or its results are all published.
 */
export function campaignResultsToPublish(
  revisions: readonly ResultsLine[],
  findings: readonly FindingLine[],
): { results: ResultsToPublish; waits: null } | { results: null; waits: string } {
  const held = findingsHeld(findings);
  const drafts = revisions.filter((revision) => revision.state === "draft");
  const [latest] = drafts
    .filter((revision) => (held.get(revision.id) ?? 0) > 0)
    .sort(newestResultsFirst);
  if (latest)
    return {
      results: {
        id: latest.id,
        title: latest.title,
        versionNumber: latest.version_number,
        revision: latest.revision,
        findings: held.get(latest.id) ?? 0,
      },
      waits: null,
    };
  return {
    results: null,
    waits: !revisions.length
      ? CAMPAIGN_HAS_NO_RESULTS
      : drafts.length
        ? CAMPAIGN_RESULTS_HOLD_NO_FINDING
        : CAMPAIGN_RESULTS_PUBLISHED,
  };
}

/* ——— A campaign's results revisions —————————————————————————————————————————————————————————— */

/** The columns the campaign's Assessment results section, its preview and Actions menu read. */
const CAMPAIGN_RESULTS_COLUMNS = [
  "id",
  "title",
  "description",
  "version_number",
  "state",
  "revision",
  "created_at",
  "published_at",
  "published_by_party_id",
  "assessment_plan_revision_id",
] as const;

/** A results revision of a campaign, with how many findings it holds. */
export type CampaignResults = Pick<
  Row<"assessment_results_revisions">,
  (typeof CAMPAIGN_RESULTS_COLUMNS)[number]
> & { findings: number };

/** Each of a campaign's results revisions with how many findings it holds, newest first. */
export function campaignResults(
  revisions: readonly Omit<CampaignResults, "findings">[],
  findings: readonly FindingLine[],
): CampaignResults[] {
  const held = findingsHeld(findings);
  return revisions
    .map((revision) => ({ ...revision, findings: held.get(revision.id) ?? 0 }))
    .sort(newestResultsFirst);
}

/**
 * A campaign's results revisions, read on the server: the revisions of its plans, then the ids of
 * the findings they hold, counted on the client. `rows` waits for both; `queries` are the reads,
 * for the section's states and the page's alert. The Actions menu reads the same two requests.
 */
export function useCampaignResults(campaignId: string) {
  const revisions = useRows(
    "assessment_results_revisions",
    { "assessment_plan_revisions.campaign_id": campaignId },
    { columns: CAMPAIGN_RESULTS_COLUMNS },
  );
  const ids = useMemo(() => idSet(revisions.data?.map((row) => row.id)), [revisions.data]);
  // A campaign with no results asks the server nothing more.
  const findings = useRows(
    "assessment_findings",
    { assessment_results_revision_id: ids },
    { columns: ["id", "assessment_results_revision_id"], enabled: revisions.isSuccess },
  );
  const rows = useMemo(
    () =>
      revisions.data && findings.data ? campaignResults(revisions.data, findings.data) : undefined,
    [revisions.data, findings.data],
  );
  return { rows, revisions, findings, queries: [revisions, findings] };
}

/**
 * A campaign's results to publish, from the reads its Assessment results section makes: the
 * campaign's results revisions and the findings they hold. `waits` says why there is nothing to
 * publish, while the reads load, when they fail (the page's alert says it too, from `queries`) or
 * once they answer.
 */
export function useCampaignResultsToPublish(campaignId: string) {
  const { revisions, findings, queries } = useCampaignResults(campaignId);
  const answer = useMemo(
    () =>
      revisions.data && findings.data
        ? campaignResultsToPublish(revisions.data, findings.data)
        : null,
    [revisions.data, findings.data],
  );
  const failed = revisions.isError || findings.isError;
  return {
    results: answer?.results ?? null,
    waits:
      answer?.waits ??
      (answer ? undefined : failed ? CAMPAIGN_RESULTS_UNREADABLE : CAMPAIGN_RESULTS_READING),
    queries,
  };
}
