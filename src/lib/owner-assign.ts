import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import type { Database } from "./database.types";
import { idSet, invalidateModel, type ReadContext } from "./models";

/*
 * One owner for many records. A register's reader chooses rows and assigns them an owner in one
 * request, `assign_record_owner`: every chosen record takes the party or none does. A record that
 * already holds the owner is left as it is, so the request is safe to send again, and one that
 * takes it moves to its next revision.
 */

/** The collections whose registers assign an owner to several records at once. */
export const OWNED_COLLECTIONS = [
  "risks",
  "operational_issues",
  "evidence_artifacts",
  "poam_items",
] as const;
export type OwnedCollection = (typeof OWNED_COLLECTIONS)[number];

/** The filter value, and the saved view, that ask a register for the records nobody owns. */
export const NO_OWNER = "No owner";

/**
 * How a register's read reaches its Owner column: it sorts, filters and is found by the owner's
 * name, which the register's view gives as `owner_name`, and a record nobody owns has none.
 */
export const ownerField = { column: "owner_name", emptyLabel: NO_OWNER } as const;

/** The column filter that lists the records nobody owns, by the Owner column's id. */
export const noOwnerFilter = (column = "owner_party_id") => [{ id: column, value: [NO_OWNER] }];

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
      void invalidateModel(cache, workspace.tenantId, request.collection),
  });
}
