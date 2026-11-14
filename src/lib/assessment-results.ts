import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import type { Database } from "./database.types";
import { idSet, invalidateModel, useRows, type ReadContext, type Row } from "./models";
import { serverRead, type ServerRow } from "./server-table";
import { determinations } from "./status";

/*
 * Publishing a program's assessment results. An assessor's findings stand in a draft results
 * revision of an assessment campaign, and decide nothing until it is published: only then do the
 * program's control statuses, its traces and its posture read them, and a published revision, with
 * its findings, no longer changes. `publish_assessment_results` publishes one draft at the revision
 * the reader saw and holding the findings the reader was told, in one request answered once: the
 * same request sent again returns its first answer. It also writes one activity event, so the
 * Portfolio's Recent activity and the program's Activity say who published, linked to the
 * campaign. A draft holding findings waits in the Review queue (Assessment results to publish),
 * and its campaign lists its results revisions and publishes from its Actions menu. Either preview
 * of the results lists the findings they hold (`resultsFindingRead`), and while they are a draft
 * their title and description change at the revision the reader opened them at
 * (`editAssessmentResults`).
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

/* ——— The findings the results hold —————————————————————————————————————————————————————————— */

/** What a results preview's list reads of a finding: its name, its determination, its control. */
export const RESULTS_FINDING_COLUMNS = [
  "id",
  "title",
  "determination",
  "control_id",
  "control_code",
] as const;

/** A finding as a results preview lists it. */
export type ResultsFindingRow = ServerRow<
  "assessment_finding_rows",
  (typeof RESULTS_FINDING_COLUMNS)[number],
  "title" | "determination"
>;

/**
 * The findings one results revision holds, a page at a time from the findings register's view: the
 * server pages, sorts, filters, searches and counts them. Unasked, it reads them control by control
 * in the catalog's reading order (AC-2 before AC-10, a statement before the objectives under it),
 * then by title. The search reads a finding's title and its control's code, and finds a
 * determination by the words its badge shows.
 */
export function resultsFindingRead(resultsId: string) {
  return serverRead({
    source: "assessment_finding_rows",
    model: "assessment_findings",
    columns: RESULTS_FINDING_COLUMNS,
    scope: { assessment_results_revision_id: resultsId },
    search: ["title", "control_code"],
    fields: {
      title: { sort: "title_order", filter: false },
      determination: { labels: determinations, sort: "determination_rank" },
      control: { column: "control_code", sort: "reading_order", filter: false },
    },
    order: [{ column: "reading_order" }, { column: "title_order" }],
  });
}

/* ——— Editing draft results ——————————————————————————————————————————————————————————————————— */

export const RESULTS_EDIT_NEEDS_TITLE = "Enter a title for these assessment results.";
export const RESULTS_EDIT_MISSING = "These assessment results are no longer available.";
export const RESULTS_EDIT_PUBLISHED =
  "These assessment results are published, and published results no longer change.";
export const RESULTS_EDIT_CHANGED =
  "These assessment results changed since you opened them: close this dialog and edit them again to start from what is saved.";

/** Draft results' title and description as the reader wrote them, over the revision they opened. */
export type ResultsEdit = {
  /** The results revision. */
  id: string;
  /** The revision the reader opened the form at: results changed since are refused. */
  revision: number;
  title: string;
  description: string | null;
};

/** What an edit did: wrote the results at their next revision, or found them already so. */
export type ResultsEdited = { outcome: "updated" | "unchanged"; revision: number };

const editedSchema = z.object({ revision: z.number().int().positive() });
const currentSchema = z.object({
  state: z.string(),
  revision: z.number().int().positive(),
  title: z.string(),
  description: z.string().nullable(),
});

/**
 * Edit draft assessment results' title and description at the revision the reader opened them at,
 * which the update raises by one. Results that already hold what the reader wrote are left as they
 * are, so a save sent again after an answer that was lost changes nothing; results published,
 * changed since or gone are refused in words the reader acts on, and so is a blank title.
 */
export async function editAssessmentResults(
  client: Pick<SupabaseClient, "from">,
  { tenantId, token }: ReadContext,
  edit: ResultsEdit,
): Promise<ResultsEdited> {
  const title = edit.title.trim();
  const description = edit.description?.trim() || null;
  if (!title) throw new Error(RESULTS_EDIT_NEEDS_TITLE);
  if (!Number.isSafeInteger(edit.revision)) throw new Error(RESULTS_EDIT_CHANGED);
  const read = await client
    .from("assessment_results_revisions")
    .select("state,revision,title,description")
    .eq("tenant_id", tenantId)
    .eq("id", edit.id)
    .setHeader("Authorization", `Bearer ${token}`)
    .maybeSingle();
  if (read.error) throw refusal(read.error);
  if (!read.data) throw new Error(RESULTS_EDIT_MISSING);
  const current = currentSchema.safeParse(read.data);
  if (!current.success) throw new Error(RESULTS_EDIT_CHANGED);
  const saved = current.data;
  if (saved.title === title && saved.description === description)
    return { outcome: "unchanged", revision: saved.revision };
  if (saved.state !== "draft") throw new Error(RESULTS_EDIT_PUBLISHED);
  if (saved.revision !== edit.revision) throw new Error(RESULTS_EDIT_CHANGED);
  const written = await client
    .from("assessment_results_revisions")
    .update({ title, description, revision: edit.revision + 1 })
    .eq("tenant_id", tenantId)
    .eq("id", edit.id)
    .eq("revision", edit.revision)
    .eq("state", "draft")
    .select("revision")
    .setHeader("Authorization", `Bearer ${token}`)
    .maybeSingle();
  if (written.error) {
    // Another session got there between the read and the write: it changed or published them.
    if (written.error.code === "PT409") throw new Error(RESULTS_EDIT_CHANGED);
    if (written.error.code === "23514" && /immutable/i.test(written.error.message))
      throw new Error(RESULTS_EDIT_PUBLISHED);
    throw refusal(written.error);
  }
  // No row at that revision and still a draft: they changed, or were published, in between.
  if (!written.data) throw new Error(RESULTS_EDIT_CHANGED);
  const edited = editedSchema.safeParse(written.data);
  return {
    outcome: "updated",
    revision: edited.success ? edited.data.revision : edit.revision + 1,
  };
}

/**
 * Edit draft assessment results as a mutation. However the request settles, every read of the
 * results revisions reads again (the campaign's results, its preview, the Review queue's pages), so
 * a refusal for results someone else changed or published shows them as they are.
 */
export function useEditAssessmentResults() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<ResultsEdited, Error, ResultsEdit>({
    mutationFn: async (edit) =>
      editAssessmentResults(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        edit,
      ),
    onSettled: () =>
      void invalidateModel(cache, workspace.tenantId, "assessment_results_revisions"),
  });
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
