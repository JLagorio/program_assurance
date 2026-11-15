import { useMemo } from "react";
import { idSet, useRows, type Row } from "./models";

/*
 * What a campaign record reads of its procedures and its test runs: only what it shows. Its
 * Procedures tab lists the program's procedures, the ones no program owns and the ones the
 * campaign's runs follow, each with its revisions; its Runs and Regression tabs list the campaign's
 * runs (those of its plans and of its events), each named by its procedure revision. It once read
 * every procedure, revision and run of the workspace and kept those on the client.
 *
 * Three requests in the usual case: the runs, the procedures and their revisions. A run that
 * follows a procedure of another program adds two more, that procedure and its revisions; a
 * campaign whose runs follow none adds nothing.
 */

/**
 * What the Procedures tab and a procedure's preview read of a procedure: every column its form
 * edits, since the preview's Edit starts the form from the row and the form saves a column it was
 * not given as empty, with its id, its workspace and its revision; not the lifecycle stamps.
 */
export const PROCEDURE_COLUMNS = [
  "id",
  "tenant_id",
  "program_id",
  "title",
  "description",
  "owner_party_id",
  "revision",
] as const satisfies readonly (keyof Row<"procedures">)[];

/**
 * What the tab and a revision's preview read of a procedure revision: every column its form edits
 * (its procedure, version, title, description, method, preconditions, acceptance criterion, state
 * and who published it), with its id, its workspace and its revision.
 */
export const PROCEDURE_REVISION_COLUMNS = [
  "id",
  "tenant_id",
  "procedure_id",
  "version_number",
  "title",
  "description",
  "method",
  "preconditions",
  "acceptance_criterion",
  "state",
  "published_by_party_id",
  "revision",
] as const satisfies readonly (keyof Row<"procedure_revisions">)[];

/**
 * What the Runs and Regression tabs read of a run: its title, status, procedure revision,
 * configuration baseline, plan, event, assessor and the day it completed. A run's preview reads the
 * run whole, and its Edit starts from that read.
 */
export const CAMPAIGN_RUN_COLUMNS = [
  "id",
  "title",
  "status",
  "procedure_revision_id",
  "configuration_baseline_id",
  "plan_revision_id",
  "assessment_event_id",
  "assessor_party_id",
  "completed_at",
  "revision",
] as const satisfies readonly (keyof Row<"test_runs">)[];

export type CampaignProcedure = Pick<Row<"procedures">, (typeof PROCEDURE_COLUMNS)[number]>;
export type CampaignProcedureRevision = Pick<
  Row<"procedure_revisions">,
  (typeof PROCEDURE_REVISION_COLUMNS)[number]
>;
export type CampaignRun = Pick<Row<"test_runs">, (typeof CAMPAIGN_RUN_COLUMNS)[number]>;

/** A program's procedures and those no program owns, as one logic tree (`or=(…)`). */
export const programOrShared = (programId: string) =>
  `program_id.eq.${programId},program_id.is.null`;

/**
 * The runs of a campaign's plans or of its events, as one logic tree; none for a campaign with
 * neither, which has no run to read.
 */
export function campaignRunsTree(
  planIds: readonly (string | null | undefined)[],
  eventIds: readonly (string | null | undefined)[],
): string | null {
  const plans = idSet(planIds);
  const events = idSet(eventIds);
  const branches = [
    ...(plans.length ? [`plan_revision_id.in.(${plans.join(",")})`] : []),
    ...(events.length ? [`assessment_event_id.in.(${events.join(",")})`] : []),
  ];
  return branches.length ? branches.join(",") : null;
}

/**
 * The procedures that the runs follow and the reads do not hold yet: their revisions' ids, read
 * through those revisions. None while either read is on its way.
 */
export function revisionsOutside(
  runs: readonly Pick<CampaignRun, "procedure_revision_id">[] | undefined,
  revisions: readonly Pick<CampaignProcedureRevision, "id">[] | undefined,
): string[] {
  if (!runs || !revisions) return [];
  const known = new Set(revisions.map((revision) => revision.id));
  return idSet(runs.map((run) => run.procedure_revision_id).filter((id) => !known.has(id)));
}

/** Rows by id, the first of each kept, in the order they came. */
function once<T extends { id: string }>(...lists: (readonly T[] | undefined)[]): T[] {
  const seen = new Set<string>();
  const rows: T[] = [];
  for (const list of lists)
    for (const row of list ?? []) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      rows.push(row);
    }
  return rows;
}

/**
 * A campaign's runs, procedures and procedure revisions, read on the server. The runs wait for the
 * campaign's plans and events (`planIds`, `eventIds`, `ready` once both have loaded). `data` is
 * undefined while its own reads load; `queries` are the reads each tab waits on, for its states and
 * the page's alert. A write to a procedure, a revision or a run reads them again, as any read of the
 * model does.
 */
export function useCampaignProcedures({
  programId,
  planIds,
  eventIds,
  ready,
}: {
  programId: string;
  planIds: readonly string[];
  eventIds: readonly string[];
  ready: boolean;
}) {
  const tree = campaignRunsTree(planIds, eventIds);
  // A campaign with no plan and no event has no run: an empty list reads nothing.
  const runs = useRows("test_runs", tree ? { or: tree } : { id: [] }, {
    columns: CAMPAIGN_RUN_COLUMNS,
    enabled: ready,
  });
  const scope = programOrShared(programId);
  const procedures = useRows("procedures", { or: scope }, { columns: PROCEDURE_COLUMNS });
  const revisions = useRows(
    "procedure_revisions",
    { "procedures.or": scope },
    { columns: PROCEDURE_REVISION_COLUMNS },
  );
  // A run may follow a procedure of another program: that procedure, read through the revision
  // the run follows, and its revisions. Usually there is none, and nothing more is asked.
  const outside = revisionsOutside(runs.data, revisions.data);
  const followed = useRows(
    "procedures",
    { "procedure_revisions.id": outside },
    { columns: PROCEDURE_COLUMNS, enabled: !!runs.data && !!revisions.data },
  );
  const followedRevisions = useRows(
    "procedure_revisions",
    { procedure_id: idSet(followed.data?.map((procedure) => procedure.id)) },
    { columns: PROCEDURE_REVISION_COLUMNS, enabled: !!followed.data },
  );
  const procedureData = useMemo(
    () => (procedures.data ? once(procedures.data, followed.data) : undefined),
    [procedures.data, followed.data],
  );
  const revisionData = useMemo(
    () => (revisions.data ? once(revisions.data, followedRevisions.data) : undefined),
    [revisions.data, followedRevisions.data],
  );
  return {
    runs,
    procedures: procedureData,
    revisions: revisionData,
    /** The reads the Procedures tab waits on. */
    procedureQueries: [procedures, revisions, runs, followed, followedRevisions],
    /** The reads that name a run's procedure revision. */
    revisionQueries: [revisions, followedRevisions],
  };
}
