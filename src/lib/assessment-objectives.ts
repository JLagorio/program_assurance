import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import { normalizeFilters, readRows, type ReadContext, type Row } from "./models";

/*
 * A campaign's objectives as its Objectives collections read them, on the campaign record and on
 * the Assessment campaigns page: `assessment_objective_rows`, each objective with its campaign and
 * program, what it is aimed at and its place in the catalog's reading order. Neither collection
 * pages on the server, so each orders its rows on the client by that place: a control's objectives
 * as the catalog prints them (AC-08a.01 before AC-08a.02, a heading before the objectives under it,
 * the control's statement before its objectives), the controls in code order (AC-2 before AC-10),
 * and an objective aimed at no control part after them, by its title.
 */

type Client = Pick<SupabaseClient, "from">;

/**
 * What the collections read of an objective: every column its form edits, since a preview's Edit
 * starts the form from the row and the form saves a column it was not given as empty, its id and
 * revision, and where it stands (what it is aimed at, its place). The campaign and the program
 * only scope the read.
 */
export const OBJECTIVE_COLUMNS = [
  "id",
  "plan_revision_id",
  "title",
  "description",
  "target_control_part_id",
  "requirement_revision_id",
  "acceptance_criterion",
  "revision",
  "target_kind",
  "target_label",
  "reading_order",
] as const satisfies readonly (keyof Row<"assessment_objective_rows">)[];

/** An objective as the collections read it. */
export type AssessmentObjectiveRow = Pick<
  Row<"assessment_objective_rows">,
  (typeof OBJECTIVE_COLUMNS)[number]
>;

/** What a read is scoped to: one campaign, one program's campaigns, or every campaign. */
export type ObjectiveScope =
  { campaign_id: string } | { program_id: string } | Record<never, never>;

/** The objectives of a campaign, a program or the workspace. */
export async function readAssessmentObjectiveRows(
  client: Client,
  context: ReadContext,
  scope: ObjectiveScope,
  signal?: AbortSignal,
): Promise<AssessmentObjectiveRow[]> {
  return (await readRows(
    client,
    context,
    "assessment_objective_rows",
    scope,
    { columns: OBJECTIVE_COLUMNS },
    signal,
  )) as AssessmentObjectiveRow[];
}

/**
 * The objectives in scope, kept under the objectives' own model: a create, an edit or a removal of
 * an objective, by its form or by a command, reads them again.
 */
export function useAssessmentObjectiveRows(
  scope: ObjectiveScope,
): UseQueryResult<AssessmentObjectiveRow[], Error> {
  const workspace = useWorkspace();
  const filters = normalizeFilters(scope);
  return useQuery<AssessmentObjectiveRow[], Error>({
    queryKey: ["models", workspace.tenantId, "assessment_objectives", "rows", filters],
    retry: false,
    queryFn: async ({ signal }) =>
      readAssessmentObjectiveRows(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        filters as ObjectiveScope,
        signal,
      ),
  });
}

/** Titles as a reader orders them: numbers by their value ("Step 2" before "Step 10"). */
const titles = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/**
 * Two objectives in the catalog's reading order: by the place of what they are aimed at, compared
 * character by character as the server wrote it; an objective aimed at no control part after every
 * one that is, by its title; then by id, so every objective has one place.
 */
export function compareObjectives(
  a: Pick<AssessmentObjectiveRow, "reading_order" | "title" | "id">,
  b: Pick<AssessmentObjectiveRow, "reading_order" | "title" | "id">,
): number {
  if (a.reading_order !== b.reading_order) {
    if (a.reading_order === null) return 1;
    if (b.reading_order === null) return -1;
    return a.reading_order < b.reading_order ? -1 : 1;
  }
  return titles.compare(a.title, b.title) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/** What an objective is aimed at: the record it names and the product's words for it. */
export type ObjectiveTarget = {
  table: "control_parts" | "requirement_revisions";
  id: string;
  label: string;
};

/**
 * What an objective is aimed at, in the product's words: an assessment objective by its label as
 * SP 800-53A prints it (AC-08a.01), the control's statement, or a part of it, as Control statement,
 * and a requirement revision as Requirement revision. None for an objective aimed at nothing.
 */
export function objectiveTarget(
  row: Pick<
    AssessmentObjectiveRow,
    "target_control_part_id" | "target_kind" | "target_label" | "requirement_revision_id"
  >,
): ObjectiveTarget | null {
  if (row.target_control_part_id)
    return {
      table: "control_parts",
      id: row.target_control_part_id,
      label:
        row.target_kind === "assessment-objective"
          ? (row.target_label ?? "Assessment objective")
          : "Control statement",
    };
  if (row.requirement_revision_id)
    return {
      table: "requirement_revisions",
      id: row.requirement_revision_id,
      label: "Requirement revision",
    };
  return null;
}
