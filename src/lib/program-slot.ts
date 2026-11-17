import { useMemo } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useWorkspace } from "./workspace-context";
import { useProgramUnowned } from "./owner-assign";
import {
  actStanding,
  useProgramRoles,
  useReaderRoles,
  type ProgramRole,
  type ProgramRoleLine,
  type ReaderRole,
  type RoleAct,
  type RoleHolder,
} from "./program-roles";
import { serverRead, useServerResultRows, type ServerRow } from "./server-table";

/*
 * What a program's header holds at its top right, the action slot: the one thing this reader does
 * next on the program, in the operation's words, or who the program waits on and for what (Josef's
 * decisions of 2026-11-17, "Slot · Role-true" and "Signing · Held to roles"). Derived here, beside
 * next-steps, from the reader's roles, what waits on a role and the program's open work, so the
 * header decides nothing of its own.
 *
 * What waits on a role is what the Review queue lists for the program (`review_queue_rows`): a
 * package version submitted with no decision waits on the authorizing official, and draft results
 * that hold findings wait on the lead assessor. Rules, in order:
 *
 * 1. A program that records nobody in any role keeps today's header (`unrecorded`).
 * 2. An act held to a role the reader holds today is theirs: a decision to sign (`sign`, the oldest
 *    submitted version first), else results to publish (`advance`, the oldest first).
 * 3. Else the first of those that waits on somebody else who holds its role today (`waiting`), a
 *    decision before results. An act whose role nobody holds today, or that the program does not
 *    hold to a role, names nobody and is left out: the slot never offers a signature without a
 *    signer, nor waits on nobody.
 * 4. Else, for a reader who may write, the program's most urgent own step: its open risks nobody
 *    owns, else its open operational issues nobody owns (`advance`, Assign owner).
 * 5. Else nothing (`none`).
 *
 * A gate in review waits on its decider in the boards, but the schema records no decider of a gate,
 * so the slot says nothing of gates.
 */

/** A package version submitted to the authorizing official with no decision recorded on it. */
export type DecisionWait = {
  kind: "package";
  /** The package version (`package_revisions.id`), on which the decision is recorded. */
  versionId: string;
  packageId: string;
  packageTitle: string;
  version: number | null;
  /** When it was submitted. */
  since: string;
};

/** Draft assessment results that hold findings, which the lead assessor publishes. */
export type ResultsWait = {
  kind: "assessment_results";
  /** The results revision (`assessment_results_revisions.id`). */
  resultsId: string;
  resultsTitle: string;
  campaignId: string | null;
  campaignTitle: string | null;
  version: number | null;
  /** How many findings they hold. */
  findings: number;
  /** When the first of them was recorded. */
  since: string;
};

export type ProgramWait = DecisionWait | ResultsWait;

/** The act a wait needs, and so the role it waits on. */
export const waitAct = (wait: ProgramWait): RoleAct =>
  wait.kind === "package" ? "authorization_decision" : "publish_assessment_results";

/** The program's own step for a reader who may write: records of one collection nobody owns. */
export type OwnerStep = {
  kind: "assign_owner";
  collection: "risks" | "operational_issues";
  count: number;
};

export type ProgramSlot =
  /** The program records nobody in any role: its header stays as it was, Edit program first. */
  | { form: "unrecorded" }
  /** A decision the reader signs as the program's authorizing official. */
  | { form: "sign"; wait: DecisionWait; role: ProgramRole }
  /** Results the reader publishes as the program's lead assessor. */
  | { form: "advance"; step: { kind: "publish"; wait: ResultsWait } }
  /** The program's own step, which the reader may take. */
  | { form: "advance"; step: OwnerStep }
  /** Something waits on another holder of a role, since when. */
  | { form: "waiting"; wait: ProgramWait; role: ProgramRole; holder: RoleHolder }
  /** Nothing to do here and nothing waiting on anyone named. */
  | { form: "none" };

/** Oldest first, then by id, so the same reads always name the same wait. */
const oldestFirst = (a: ProgramWait, b: ProgramWait) =>
  Date.parse(a.since) - Date.parse(b.since) ||
  (a.kind === "package" ? a.versionId : a.resultsId).localeCompare(
    b.kind === "package" ? b.versionId : b.resultsId,
  );

/** The slot's form, from what the program's reads answer. See the rules above. */
export function programSlot({
  roles,
  reader,
  canWrite,
  waits,
  unowned,
}: {
  /** `program_roles`: every role, whether recorded, with today's holders. */
  roles: readonly ProgramRoleLine[];
  /** `program_reader_roles`: the roles the reader holds today. */
  reader: readonly ReaderRole[];
  /** The reader may write in the workspace (every member but a viewer). */
  canWrite: boolean;
  /** What waits on a role on the program. */
  waits: readonly ProgramWait[];
  /** How many open risks and open operational issues nobody owns; undefined where unread. */
  unowned: { risks?: number | undefined; issues?: number | undefined };
}): ProgramSlot {
  if (!roles.some((line) => line.recorded)) return { form: "unrecorded" };
  const decisions = waits.filter((wait): wait is DecisionWait => wait.kind === "package");
  const results = waits.filter((wait): wait is ResultsWait => wait.kind === "assessment_results");
  const ordered = [...[...decisions].sort(oldestFirst), ...[...results].sort(oldestFirst)];
  const holds = (role: ProgramRole) => reader.some((item) => item.role === role);
  // The reader's own: an act held to a role they hold today.
  if (canWrite)
    for (const wait of ordered) {
      const standing = actStanding(roles, reader, waitAct(wait));
      if (!standing.heldToRole || !holds(standing.role)) continue;
      return wait.kind === "package"
        ? { form: "sign", wait, role: standing.role }
        : { form: "advance", step: { kind: "publish", wait } };
    }
  // Who it waits on: the first held to a role somebody else holds today.
  for (const wait of ordered) {
    const standing = actStanding(roles, reader, waitAct(wait));
    const holder = standing.holders[0];
    if (standing.heldToRole && holder && !holds(standing.role))
      return { form: "waiting", wait, role: standing.role, holder };
  }
  if (canWrite) {
    if (unowned.risks)
      return {
        form: "advance",
        step: { kind: "assign_owner", collection: "risks", count: unowned.risks },
      };
    if (unowned.issues)
      return {
        form: "advance",
        step: { kind: "assign_owner", collection: "operational_issues", count: unowned.issues },
      };
  }
  return { form: "none" };
}

/** What waits on a role, from the Review queue's view: the kinds a role holds. */
const waitsRead = (programId: string) =>
  serverRead({
    source: "review_queue_rows",
    // Every table the two kinds derive from, so a decision, a publication or a finding reads again.
    models: [
      "authorization_packages",
      "package_revisions",
      "authorization_decisions",
      "assessment_campaigns",
      "assessment_plan_revisions",
      "assessment_results_revisions",
      "assessment_findings",
    ],
    columns: [
      "id",
      "kind",
      "parent_id",
      "parent_name",
      "name",
      "version_number",
      "waiting_since",
      "determination_count",
    ],
    scope: {
      program_id: programId,
      kind: ["package", "assessment_results"],
    },
    order: [{ column: "waiting_since", ascending: true }],
  });

type WaitRow = ServerRow<
  "review_queue_rows",
  | "id"
  | "kind"
  | "parent_id"
  | "parent_name"
  | "name"
  | "version_number"
  | "waiting_since"
  | "determination_count"
>;

/** A queue row as the wait it is; a row the view gives without a moment is left out. */
export function programWait(row: WaitRow): ProgramWait | null {
  if (!row.waiting_since) return null;
  if (row.kind === "package")
    return row.parent_id
      ? {
          kind: "package",
          versionId: row.id,
          packageId: row.parent_id,
          packageTitle: row.name ?? row.parent_name ?? "",
          version: row.version_number,
          since: row.waiting_since,
        }
      : null;
  if (row.kind === "assessment_results")
    return {
      kind: "assessment_results",
      resultsId: row.id,
      resultsTitle: row.name ?? "",
      campaignId: row.parent_id,
      campaignTitle: row.parent_name,
      version: row.version_number,
      findings: Number(row.determination_count ?? 0),
      since: row.waiting_since,
    };
  return null;
}

/**
 * What waits on a role on a program: its package versions submitted with no decision and its draft
 * results that hold findings, oldest first, one request to the Review queue's view.
 */
export function useProgramWaits(programId: string): {
  query: UseQueryResult<WaitRow[], Error>;
  waits: ProgramWait[] | undefined;
} {
  const read = useMemo(() => waitsRead(programId), [programId]);
  const query = useServerResultRows<WaitRow>(read);
  const waits = useMemo(() => query.data?.flatMap((row) => programWait(row) ?? []), [query.data]);
  return { query, waits };
}

/**
 * The program's slot as its header draws it, from five reads: its roles, the reader's, what waits
 * on a role, and how many open risks and operational issues nobody owns. Undefined while the roles
 * load; once they are read, a read of the rest that failed counts as nothing there, and is said by
 * the page's alert (`queries`). Roles that could not be read keep today's header.
 */
export function useProgramSlot(programId: string) {
  const workspace = useWorkspace();
  const roles = useProgramRoles(programId);
  const reader = useReaderRoles(programId);
  const waits = useProgramWaits(programId);
  const unowned = useProgramUnowned(programId);
  const canWrite = workspace.role !== "viewer";
  const slot = useMemo((): ProgramSlot | undefined => {
    if (roles.isError || reader.isError) return { form: "unrecorded" };
    if (!roles.data || !reader.data) return undefined;
    if (!roles.data.some((line) => line.recorded)) return { form: "unrecorded" };
    // What waits and what is unowned are read before the slot says anything, unless they failed.
    if (waits.query.isPending || unowned.risks.isPending || unowned.issues.isPending)
      return undefined;
    return programSlot({
      roles: roles.data,
      reader: reader.data,
      canWrite,
      waits: waits.waits ?? [],
      unowned: { risks: unowned.risks.data, issues: unowned.issues.data },
    });
  }, [
    roles.isError,
    roles.data,
    reader.isError,
    reader.data,
    waits.query.isPending,
    waits.waits,
    unowned.risks.isPending,
    unowned.risks.data,
    unowned.issues.isPending,
    unowned.issues.data,
    canWrite,
  ]);
  return { slot, queries: [roles, reader, waits.query, unowned.risks, unowned.issues] };
}
