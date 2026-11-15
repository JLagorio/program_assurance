import { idSet, useRows, type Row } from "./models";
import { labelFor } from "./records";
import { serverRead } from "./server-table";
import { revisionStates } from "./status";

/*
 * What a campaign record reads of its procedures and its test runs: only what it shows. Its
 * Procedures tab lists the program's procedures, the ones no program owns and the ones the
 * campaign's runs follow, and their revisions, each a page at a time on the server, since a
 * program can hold hundreds; its Runs and Regression tabs list the campaign's runs
 * (those of its plans and of its events), each named by its procedure revision. It once read every
 * procedure, revision and run of the workspace, and then every procedure of the program and every
 * revision of them, and kept those on the client.
 *
 * Two requests before the tab reads a page: the runs, and the revisions they follow, which name
 * each run's procedure revision and whose procedures the tab lists beside the program's. A
 * campaign with no run asks the second of nothing.
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
 * The procedures a campaign record lists, as one logic tree: the program's, those no program owns,
 * and those its runs follow (`followed`, by the procedure's id), another program's among them.
 */
export function campaignProcedureTree(
  programId: string,
  followed: readonly (string | null | undefined)[],
): string {
  const ids = idSet(followed);
  return [programOrShared(programId), ...(ids.length ? [`id.in.(${ids.join(",")})`] : [])].join(
    ",",
  );
}

/** A procedure as the Procedures section lists it: every column its form edits, and how many revisions it has. */
export type CampaignProcedureRow = CampaignProcedure & { versions: number | null };

/** The procedure as stored, without the count the register derives: what its preview and form start from. */
export const storedProcedure = ({ versions: _versions, ...procedure }: CampaignProcedureRow) =>
  procedure;

/** The six methods a procedure revision tests by, in the words its column shows. */
const PROCEDURE_METHODS = [
  "analysis",
  "demonstration",
  "examine",
  "inspection",
  "interview",
  "test",
];
const methodLabels = Object.fromEntries(
  PROCEDURE_METHODS.map((method) => [method, { label: labelFor(method) }]),
);

/** Read nothing until the tree is known: a scope with an empty list waits. */
const waiting = { id: [] };

/**
 * The Procedures section's read, a page at a time from `procedure_rows`: each procedure the tree
 * names with how many revisions it has, in id order as the tab listed them, searched by its title
 * and description. `undefined` waits for the runs, whose procedures the tree names.
 */
export function campaignProcedureRead(tree: string | undefined) {
  return serverRead({
    source: "procedure_rows",
    model: "procedures",
    models: ["procedure_revisions"],
    columns: [...PROCEDURE_COLUMNS, "versions"],
    scope: tree ? { or: tree } : waiting,
    search: ["title", "description"],
  });
}

/**
 * The Procedure revisions section's read, a page at a time: the revisions of the procedures the
 * tree names, through the procedure, every column a revision's form edits. The search finds a
 * revision by its title, its method's words and its state's.
 */
export function campaignProcedureRevisionRead(tree: string | undefined) {
  return serverRead({
    source: "procedure_revisions",
    models: ["procedures"],
    columns: PROCEDURE_REVISION_COLUMNS,
    scope: tree ? { "procedures.or": tree } : waiting,
    search: ["title"],
    fields: { method: { labels: methodLabels }, state: { labels: revisionStates } },
  });
}

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

/** What the Runs tab reads of a procedure revision a run follows: its procedure and its title. */
export const RUN_REVISION_COLUMNS = [
  "id",
  "procedure_id",
  "title",
] as const satisfies readonly (keyof Row<"procedure_revisions">)[];

/**
 * A campaign's runs and the procedure revisions they follow, read on the server, and the tree of
 * the procedures its Procedures tab lists a page at a time. The runs wait for the campaign's plans
 * and events (`planIds`, `eventIds`, `ready` once both have loaded), and the tree for the runs:
 * `undefined` until the revisions they follow are read. A write to a procedure, a revision or a
 * run reads them again, as any read of the model does.
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
  // The revisions the runs follow, which name each run's procedure revision; their procedures,
  // another program's among them, are listed with the program's.
  const runRevisions = useRows(
    "procedure_revisions",
    { id: idSet(runs.data?.map((run) => run.procedure_revision_id)) },
    { columns: RUN_REVISION_COLUMNS, enabled: !!runs.data },
  );
  const procedureTree = runRevisions.data
    ? campaignProcedureTree(
        programId,
        runRevisions.data.map((revision) => revision.procedure_id),
      )
    : undefined;
  return {
    runs,
    runRevisions,
    procedureTree,
    /** The reads the Procedures tab waits on before it reads a page. */
    procedureQueries: [runs, runRevisions],
  };
}
