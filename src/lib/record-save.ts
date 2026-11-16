import type { SupabaseClient } from "@supabase/supabase-js";
import { saveRefusal } from "./database";
import type { ReadContext } from "./models";
import type { Collection, DataRecord } from "./records";
import { onceStep, SaveOnceConflict, type SaveOnceOutcome } from "./save-once";

type Client = Pick<SupabaseClient, "from">;

export type RecordDraft = {
  /** The record's id: chosen once when a create's form opened, or the record an edit changes. */
  id: string;
  /** What the form writes, from `recordPayload`. */
  payload: Record<string, unknown>;
  /** The record as the reader opened it; absent when the form creates one. */
  existing?: DataRecord | undefined;
  /**
   * The columns an earlier try of this draft inserted a value for; each insert adds its own. On a
   * create, a column the reader leaves empty is the server's to fill (a trigger derives a mapping's
   * control or a system's lifecycle status), so the record a retry finds is held to it only where
   * an earlier insert sent a value the reader has since cleared.
   */
  sent?: Set<string> | undefined;
};

/**
 * The generic record form's save, safe to retry after an uncertain answer, by `saveOnce`'s rule
 * over a schema collection: it reads the record by the id the draft chose, writes nothing when the
 * record already holds the reader's values, creates it only when it is not there and edits it only
 * at the revision the reader opened. A conflict is a `SaveOnceConflict`; any other refusal keeps
 * the words `saveRecord` gives it, and an insert carries the workspace's `tenant_id` where the
 * collection has one.
 */
export async function saveRecordOnce(
  client: Client,
  context: ReadContext,
  collection: Pick<Collection, "name" | "columns">,
  { id, payload, existing, sent }: RecordDraft,
): Promise<{ outcome: SaveOnceOutcome; record: DataRecord }> {
  const revision = existing?.revision;
  if (existing && !Number.isSafeInteger(revision))
    throw new Error("This record is managed through its published revision workflow.");
  const tenantScoped = collection.columns.some((column) => column.name === "tenant_id");
  const authorization = `Bearer ${context.token}`;
  // A create looks for its id in the workspace; an edit for the record the reader opened.
  let lookup = client.from(collection.name).select().eq("id", id);
  if (tenantScoped && !existing) lookup = lookup.eq("tenant_id", context.tenantId);
  const { data: found, error } = await lookup
    .setHeader("Authorization", authorization)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const values = existing
    ? payload
    : Object.fromEntries(
        Object.entries(payload).filter(([column, value]) => value !== null || sent?.has(column)),
      );
  const step = onceStep(found as Record<string, unknown> | null, { values, revision });
  if (step === "unchanged") return { outcome: "unchanged", record: found as DataRecord };
  if (step === "create")
    for (const [column, value] of Object.entries(payload)) if (value !== null) sent?.add(column);
  const request =
    step === "update"
      ? client
          .from(collection.name)
          .update({ ...payload, revision: revision! + 1 })
          .eq("id", id)
          .eq("revision", revision!)
      : client.from(collection.name).insert({
          ...payload,
          id,
          ...(tenantScoped ? { tenant_id: context.tenantId } : {}),
        });
  const { data, error: refused } = await request
    .select()
    .setHeader("Authorization", authorization)
    .single();
  if (refused) {
    // The record moved on between the lookup and the update: the conflict the lookup would name.
    if (step === "update" && (refused.code === "PT409" || refused.code === "PGRST116"))
      throw new SaveOnceConflict("changed");
    throw saveRefusal(refused, collection, existing);
  }
  return { outcome: step === "update" ? "updated" : "created", record: data as DataRecord };
}
