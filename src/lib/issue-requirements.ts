import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import {
  idSet,
  invalidateModel,
  useRows,
  type ReadContext,
  type Row,
  type TableName,
} from "./models";
import { labelFor } from "./records";
import { programRequirementScope } from "./requirement-reads";

/*
 * The requirements an operational issue is about. An issue reaches a requirement through the
 * evidence it cites; it also names the requirements it was raised against, one link a requirement
 * of its own program (`issue_requirements`). The link is the issue's: a member who may write makes
 * and removes it at any time, whatever revision the requirement is at. The chain reads
 * (`assurance_trace`, `program_posture` and the posture by technique) walk it beside the evidence,
 * and name its model among theirs, so a link or an unlink marks their answers stale. This module is
 * the issue's requirements as its record lists them, the requirements its Link requirement offers,
 * and the link and unlink commands.
 */

/** The link between an issue and a requirement: the model its writes are announced under. */
const LINK_MODEL = "issue_requirements" satisfies TableName;

/** The most requirements one link takes: a program's whole register. */
export const LINK_REQUIREMENTS_LIMIT = 5000;

const compareCode = new Intl.Collator("en", { numeric: true }).compare;

type Link = Pick<Row<"issue_requirements">, "id" | "program_id" | "engineering_requirement_id">;
type Requirement = Pick<Row<"engineering_requirements">, "id" | "code" | "program_id">;
type Revision = Pick<
  Row<"requirement_revisions">,
  "id" | "engineering_requirement_id" | "version_number" | "title" | "requirement_type" | "state"
> &
  Partial<Pick<Row<"requirement_revisions">, "statement" | "acceptance_criteria">>;

/** Each requirement's latest revision, by the requirement's id. */
function latestRevisions<T extends Revision>(revisions: readonly T[]) {
  const latest = new Map<string, T>();
  for (const revision of revisions) {
    const current = latest.get(revision.engineering_requirement_id);
    if (!current || current.version_number < revision.version_number)
      latest.set(revision.engineering_requirement_id, revision);
  }
  return latest;
}

/** A requirement an issue names, as the issue's record lists it. */
export type IssueRequirement = {
  /** The requirement: the row's identity, and the record its name opens. */
  id: string;
  /** The link's row: what an unlink removes. */
  linkId: string;
  programId: string;
  code: string;
  /** Its latest revision's title; its code while it has no revision. */
  name: string;
  /** Its latest revision's state and type; empty while it has no revision. */
  state: string | null;
  type: string | null;
};

/**
 * The requirements an issue's links name, in code order (REQ-8 before REQ-10), each at its latest
 * revision. A link whose requirement has not been read yet is left out until it is.
 */
export function issueRequirementRows(
  links: readonly Link[],
  requirements: readonly Requirement[],
  revisions: readonly Revision[],
): IssueRequirement[] {
  const byId = new Map(requirements.map((requirement) => [requirement.id, requirement]));
  const latest = latestRevisions(revisions);
  return links
    .flatMap((link) => {
      const requirement = byId.get(link.engineering_requirement_id);
      if (!requirement) return [];
      const revision = latest.get(requirement.id);
      return [
        {
          id: requirement.id,
          linkId: link.id,
          programId: link.program_id,
          code: requirement.code,
          name: revision?.title ?? requirement.code,
          state: revision?.state ?? null,
          type: revision ? labelFor(revision.requirement_type) : null,
        },
      ];
    })
    .sort((a, b) => compareCode(a.code, b.code) || a.id.localeCompare(b.id));
}

/** A requirement Link requirement offers: the program's, at its latest revision. */
export type RequirementChoice = {
  id: string;
  code: string;
  name: string;
  version: number;
  state: string;
  type: string;
  statement: string | null;
  acceptanceCriteria: string | null;
};

/**
 * What Link requirement offers: every requirement of the program at its latest revision that the
 * issue does not name yet, in code order. A requirement with no revision has nothing to read
 * before it is chosen, and is not offered.
 */
export function requirementChoices(
  requirements: readonly Requirement[],
  revisions: readonly Revision[],
  named: ReadonlySet<string>,
): RequirementChoice[] {
  const latest = latestRevisions(revisions);
  return requirements
    .flatMap((requirement) => {
      const revision = latest.get(requirement.id);
      if (!revision || named.has(requirement.id)) return [];
      return [
        {
          id: requirement.id,
          code: requirement.code,
          name: revision.title,
          version: revision.version_number,
          state: revision.state,
          type: labelFor(revision.requirement_type),
          statement: revision.statement ?? null,
          acceptanceCriteria: revision.acceptance_criteria ?? null,
        },
      ];
    })
    .sort((a, b) => compareCode(a.code, b.code) || a.id.localeCompare(b.id));
}

/**
 * The requirements an issue names, read by the issue: its links, then the requirements they name
 * and their revisions. The rows the reader has stay while a link's requirement is read.
 */
export function useIssueRequirements(issueId: string) {
  const links = useRows(
    LINK_MODEL,
    { issue_id: issueId },
    { columns: ["id", "program_id", "engineering_requirement_id"] },
  );
  const ids = idSet(links.data?.map((link) => link.engineering_requirement_id));
  const requirements = useRows(
    "engineering_requirements",
    { id: ids },
    { columns: ["id", "code", "program_id"], enabled: links.isSuccess, keepPrevious: true },
  );
  const revisions = useRows(
    "requirement_revisions",
    { engineering_requirement_id: ids },
    {
      columns: [
        "id",
        "engineering_requirement_id",
        "version_number",
        "title",
        "requirement_type",
        "state",
      ],
      enabled: links.isSuccess,
      keepPrevious: true,
    },
  );
  const rows = useMemo(
    () => issueRequirementRows(links.data ?? [], requirements.data ?? [], revisions.data ?? []),
    [links.data, requirements.data, revisions.data],
  );
  const queries = [links, requirements, revisions];
  return {
    rows,
    queries,
    /** Every read has answered: the rows are the issue's whole list. */
    loaded: queries.every((query) => query.data !== undefined),
    failed: queries.some((query) => query.isError),
  };
}

/**
 * Why an operational issue cannot move to another program while it names requirements: the links'
 * keys keep the issue and every requirement it names in one program, so the database refuses the
 * move. The words name the requirements to unlink first, in code order, the first three by code
 * and how many more past them.
 */
export function issueProgramHeldReason(codes: readonly string[]): string {
  const sorted = [...codes].sort(compareCode);
  const shown = sorted.length > 3 ? [...sorted.slice(0, 3), `${sorted.length - 3} more`] : sorted;
  const named = new Intl.ListFormat("en", { type: "conjunction" }).format(shown);
  return `This issue names ${named}. Unlink ${sorted.length === 1 ? "it" : "them"} from the issue's Requirements to move the issue to another program.`;
}

/**
 * The requirements that hold an operational issue in its program, for the issue's edit form: the
 * codes of those it names, in code order, null until both reads have answered (and on a failure,
 * where the save says so instead). It asks what the issue's own Requirements section asks, so the
 * form opened from the issue's page reads nothing new.
 */
export function useIssueProgramHold(issueId: string | null | undefined): {
  codes: string[] | null;
} {
  const links = useRows(
    LINK_MODEL,
    { issue_id: issueId ?? "" },
    { columns: ["id", "program_id", "engineering_requirement_id"], enabled: !!issueId },
  );
  const ids = idSet(links.data?.map((link) => link.engineering_requirement_id));
  const requirements = useRows(
    "engineering_requirements",
    { id: ids },
    { columns: ["id", "code", "program_id"], enabled: links.isSuccess, keepPrevious: true },
  );
  const linked = links.data;
  const named = requirements.data;
  return useMemo(() => {
    if (!issueId || !linked || !named) return { codes: null };
    const held = new Set(linked.map((link) => link.engineering_requirement_id));
    return {
      codes: named
        .filter((requirement) => held.has(requirement.id))
        .map((requirement) => requirement.code)
        .sort(compareCode),
    };
  }, [issueId, linked, named]);
}

/**
 * The requirements Link requirement offers for an issue of a program, read once the browser first
 * opens (`enabled`): the program's requirements and their revisions, scoped on the server, less
 * those the issue names (`named`).
 */
export function useRequirementChoices(
  programId: string,
  named: ReadonlySet<string>,
  { enabled }: { enabled: boolean },
) {
  const requirements = useRows(
    "engineering_requirements",
    programRequirementScope(programId, "engineering_requirements"),
    { columns: ["id", "code", "program_id"], enabled },
  );
  const revisions = useRows(
    "requirement_revisions",
    programRequirementScope(programId, "requirement_revisions"),
    {
      columns: [
        "id",
        "engineering_requirement_id",
        "version_number",
        "title",
        "statement",
        "acceptance_criteria",
        "requirement_type",
        "state",
      ],
      enabled,
    },
  );
  const rows = useMemo(
    () => requirementChoices(requirements.data ?? [], revisions.data ?? [], named),
    [requirements.data, revisions.data, named],
  );
  const total = useMemo(() => latestRevisions(revisions.data ?? []).size, [revisions.data]);
  const queries = [requirements, revisions];
  return {
    rows,
    /** How many of the program's requirements could be named at all, linked or not. */
    total,
    state: queries.some((query) => query.isError)
      ? ("error" as const)
      : queries.some((query) => query.data === undefined)
        ? ("loading" as const)
        : ("ready" as const),
    retry: () => {
      for (const query of queries) if (query.isError) void query.refetch();
    },
  };
}

/* ——— Linking and unlinking ——————————————————————————————————————————————————————————————————— */

const uuid = z.string().uuid();

export const linkIssueRequirementsSchema = z
  .object({
    issueId: uuid,
    /** The issue's program: every requirement an issue names is of its program. */
    programId: uuid,
    requirementIds: z.array(uuid).min(1, "Choose a requirement.").max(LINK_REQUIREMENTS_LIMIT),
  })
  .strict();
export type LinkIssueRequirements = z.infer<typeof linkIssueRequirementsSchema>;

export const unlinkIssueRequirementSchema = z.object({ linkId: uuid }).strict();
export type UnlinkIssueRequirement = z.infer<typeof unlinkIssueRequirementSchema>;

type TableClient = Pick<SupabaseClient, "from">;
type PostgrestFailure = { code?: string | undefined; message: string };

/** A database refusal in the reader's words: what happened and what to do next. */
function failure(error: PostgrestFailure): Error {
  if (error.code === "42501")
    return new Error(
      "Only an editor, admin or owner can change the requirements an operational issue names.",
    );
  // The issue or the requirement is gone, or they are not of one program.
  if (error.code === "23503")
    return new Error(
      "The operational issue or the requirement is no longer available in this program. Reload the issue.",
    );
  // The schema's messages carry no full stop.
  const message = error.message.trim();
  return new Error(/[.!?]$/.test(message) ? message : `${message}.`);
}

/**
 * Name requirements on an issue, in one insert: all of them are linked, or none. An issue names a
 * requirement once, and one it already names is passed over, so a retry after an uncertain
 * response, or a link another session made first, changes nothing and fails nothing.
 */
export async function linkIssueRequirements(
  client: TableClient,
  { tenantId, token }: ReadContext,
  request: LinkIssueRequirements,
): Promise<{ linked: number; alreadyLinked: number }> {
  const values = linkIssueRequirementsSchema.parse(request);
  const requirementIds = [...new Set(values.requirementIds)];
  const { data, error } = await client
    .from(LINK_MODEL)
    .upsert(
      requirementIds.map((requirementId) => ({
        tenant_id: tenantId,
        program_id: values.programId,
        issue_id: values.issueId,
        engineering_requirement_id: requirementId,
      })),
      { onConflict: "tenant_id,issue_id,engineering_requirement_id", ignoreDuplicates: true },
    )
    .select("id")
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw failure(error);
  const linked = Array.isArray(data) ? data.length : 0;
  return { linked, alreadyLinked: requirementIds.length - linked };
}

/**
 * Remove a requirement from an issue. A link that is already gone counts as removed, so a retry
 * after an uncertain response succeeds; one that is still there after the delete could not be
 * removed by this reader.
 */
export async function unlinkIssueRequirement(
  client: TableClient,
  { tenantId, token }: ReadContext,
  request: UnlinkIssueRequirement,
): Promise<{ removed: boolean }> {
  const { linkId } = unlinkIssueRequirementSchema.parse(request);
  const { data, error } = await client
    .from(LINK_MODEL)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", linkId)
    .select("id")
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw failure(error);
  if (Array.isArray(data) && data.length) return { removed: true };
  const current = await client
    .from(LINK_MODEL)
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", linkId)
    .setHeader("Authorization", `Bearer ${token}`)
    .maybeSingle();
  if (current.error) throw failure(current.error);
  if (!current.data) return { removed: false };
  throw new Error(
    "This requirement could not be unlinked. An editor, admin or owner can unlink it.",
  );
}

/** Link requirements to an issue; the issue's list, its trace and the posture read them again. */
export function useLinkIssueRequirements() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (request: LinkIssueRequirements) =>
      linkIssueRequirements(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSuccess: () => void invalidateModel(cache, workspace.tenantId, LINK_MODEL),
  });
}

/** Unlink one requirement from an issue; what reads the link refreshes behind the confirmation. */
export function useUnlinkIssueRequirement() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (request: UnlinkIssueRequirement) =>
      unlinkIssueRequirement(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        request,
      ),
    onSuccess: () => void invalidateModel(cache, workspace.tenantId, LINK_MODEL),
  });
}
