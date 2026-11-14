import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { openIssue, openRisk } from "./assurance-trace";
import { database, requireIdentity } from "./database";
import type { Database } from "./database.types";
import { idSet, invalidateModel, type ReadContext, type TableName } from "./models";
import { serverRead, useServerCountQueries, type ServerResultQuestion } from "./server-table";
import { operationalIssueStatuses, riskStatuses } from "./status";

/*
 * One owner for many records. A register's reader chooses rows and assigns them an owner in one
 * request, `assign_record_owner`: every chosen record takes the party or none does. A record that
 * already holds the owner is left as it is, so the request is safe to send again, and one that
 * takes it moves to its next revision. A requirement's owner is on its current details: they take
 * it at their next revision, and each change is an entry of the requirement's edit history, as an
 * edit of the owner is.
 */

/** The collections whose registers assign an owner to several records at once. */
export const OWNED_COLLECTIONS = [
  "risks",
  "operational_issues",
  "evidence_artifacts",
  "poam_items",
  "engineering_requirements",
] as const;
export type OwnedCollection = (typeof OWNED_COLLECTIONS)[number];

/** Whether a collection's records carry an owner that a register assigns several at a time. */
export const isOwnedCollection = (table: string): table is OwnedCollection =>
  (OWNED_COLLECTIONS as readonly string[]).includes(table);

/**
 * The models an assignment writes, whose reads it marks stale: the collection's own, and for a
 * requirement the details its owner is on and the edit history that records the change.
 */
const writtenModels: Record<OwnedCollection, readonly TableName[]> = {
  risks: ["risks"],
  operational_issues: ["operational_issues"],
  evidence_artifacts: ["evidence_artifacts"],
  poam_items: ["poam_items"],
  engineering_requirements: [
    "engineering_requirements",
    "requirement_revisions",
    "activity_events",
  ],
};

/** The filter value, and the saved view, that ask a register for the records nobody owns. */
export const NO_OWNER = "No owner";

/**
 * How a register's read reaches its Owner column: it sorts, filters and is found by the owner's
 * name, which the register's view gives as `owner_name`, and a record nobody owns has none.
 */
export const ownerField = { column: "owner_name", emptyLabel: NO_OWNER } as const;

/** The column filter that lists the records nobody owns, by the Owner column's id. */
export const noOwnerFilter = (column = "owner_party_id") => [{ id: column, value: [NO_OWNER] }];

/** The statuses of an open operational issue and of an open risk, as the Overview counts them. */
const openIssueStatuses = Object.keys(operationalIssueStatuses).filter(openIssue);
const openRiskStatuses = Object.keys(riskStatuses).filter(openRisk);

/**
 * What a program's Overview asks of each register it counts owners in: the open records nobody
 * owns, by the register's status and Owner columns. The same question counts them on the server
 * and, through `questionSearch`, opens the program tab's register on exactly those records.
 */
export const unownedQuestions = {
  operational_issues: {
    filters: [{ id: "status", value: openIssueStatuses }, ...noOwnerFilter()],
  },
  risks: { filters: [{ id: "status", value: openRiskStatuses }, ...noOwnerFilter()] },
} satisfies Record<string, ServerResultQuestion>;

/** A program's open records of one collection, as its register's view gives them. */
const programOwnerRead = (source: "operational_issue_rows" | "risk_rows", programId: string) =>
  serverRead({
    source,
    model: source === "risk_rows" ? "risks" : "operational_issues",
    columns: ["id", "status"],
    scope: { program_id: programId },
    fields: { owner_party_id: ownerField },
  });

/**
 * How many of a program's open operational issues and open risks nobody owns: one HEAD request
 * each, with the exact count and no rows, asked of the register's view. Each is a query, so a tray
 * says its count is loading or could not be read rather than a zero; an assignment counts again.
 */
export function useProgramUnowned(programId: string) {
  const reads = useMemo(
    () => ({
      issues: programOwnerRead("operational_issue_rows", programId),
      risks: programOwnerRead("risk_rows", programId),
    }),
    [programId],
  );
  const [issues] = useServerCountQueries(reads.issues, [unownedQuestions.operational_issues]);
  const [risks] = useServerCountQueries(reads.risks, [unownedQuestions.risks]);
  return { issues: issues!, risks: risks! };
}

export type AssignOwner = {
  collection: OwnedCollection;
  /** The chosen records, by id: the ones on other pages of the register too. */
  recordIds: readonly string[];
  /** The person or organization that owns them from now on. */
  ownerPartyId: string;
};

const answerSchema = z.object({
  assigned: z.number().int().nonnegative(),
  unchanged: z.number().int().nonnegative(),
});
/** What the command did: how many records took the owner, and how many already held it. */
export type AssignedOwner = z.infer<typeof answerSchema>;

export const OWNER_NOTHING_CHOSEN = "Choose at least one record.";
export const OWNER_ANSWER_UNREADABLE =
  "The owner was assigned, but the answer could not be read. Reload to see the records.";

type CommandArgs = Database["public"]["Functions"]["assign_record_owner"]["Args"];

/**
 * Assign one owner to the chosen records of one collection, in one request: all of them take the
 * owner or none does. The command says its refusals in the product's words (a record that is
 * gone, a reader who may not edit), and they are passed on as they are.
 */
export async function assignOwner(
  client: Pick<SupabaseClient, "rpc">,
  { token }: Pick<ReadContext, "token">,
  request: AssignOwner,
): Promise<AssignedOwner> {
  const recordIds = idSet(request.recordIds);
  if (!recordIds.length) throw new Error(OWNER_NOTHING_CHOSEN);
  const args: CommandArgs = {
    p_collection: request.collection,
    p_record_ids: recordIds,
    p_owner_party_id: request.ownerPartyId,
  };
  const { data, error } = await client
    .rpc("assign_record_owner", args)
    .setHeader("Authorization", `Bearer ${token}`);
  if (error) throw new Error(error.message);
  const answer = answerSchema.safeParse(data);
  if (!answer.success) throw new Error(OWNER_ANSWER_UNREADABLE);
  return answer.data;
}

/**
 * What a finished assignment says: how many records took the owner and, when some already held
 * it, how many. `noun` is the collection's ("risk", "risks").
 */
export function ownerAssignedText(
  { assigned, unchanged }: AssignedOwner,
  noun: { one: string; other: string },
  formatNumber: (value: number) => string = String,
): string {
  const count = (value: number) => `${formatNumber(value)} ${value === 1 ? noun.one : noun.other}`;
  if (assigned === 0)
    return unchanged === 1
      ? `The ${noun.one} already has this owner.`
      : `All ${count(unchanged)} already have this owner.`;
  const took = `${count(assigned)} now ${assigned === 1 ? "has" : "have"} this owner.`;
  return unchanged > 0 ? `${took} ${formatNumber(unchanged)} already had it.` : took;
}

/**
 * Assign an owner as a mutation. The collection's reads are marked stale once the request settles,
 * whichever way: a request whose answer was lost may still have assigned the owner.
 */
export function useAssignOwner() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<AssignedOwner, Error, AssignOwner>({
    mutationFn: async (request) =>
      assignOwner(database(), { token: await requireIdentity(workspace) }, request),
    onSettled: (_answer, _error, request) =>
      void Promise.all(
        writtenModels[request.collection].map((model) =>
          invalidateModel(cache, workspace.tenantId, model),
        ),
      ),
  });
}
