import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import {
  invalidateModel,
  writeRow,
  type Insert,
  type ReadContext,
  type Row,
  type TableName,
} from "./models";

type Client = Pick<SupabaseClient, "from">;

export type SaveOnce<T extends TableName> = {
  table: T;
  /** The record's id, chosen once when the form opened, so a retried save finds its first try. */
  id: string;
  /** What the reader wrote: a record that already holds exactly these values is this save. */
  values: Partial<Insert<T>>;
  /** Columns a new record takes and an edit leaves alone: `{ version_number: 1, state: "draft" }`. */
  create?: Partial<Insert<T>> | undefined;
  /** The revision the reader edited; absent when the form creates the record. */
  revision?: number | undefined;
};

export type SaveOnceOutcome = "created" | "updated" | "unchanged";

/**
 * Why a retry-safe save stopped without writing:
 * - `different`: a create finds its id already saved with other values.
 * - `changed`: an edit finds the record at another revision than the reader edited.
 * - `missing`: an edit finds the record gone.
 * The reader's draft stays; the form says which, in its own words.
 */
export class SaveOnceConflict extends Error {
  constructor(
    readonly reason: "different" | "changed" | "missing",
    message: string,
  ) {
    super(message);
    this.name = "SaveOnceConflict";
  }
}

const conflicts = {
  different: "This record was already saved with different values. Your draft is kept.",
  changed:
    "This record changed in another session. Your draft is kept; reopen the record to load its current values.",
  missing: "This record is no longer available. Your draft is kept.",
} as const;

/**
 * A save that is safe to retry after an uncertain response: it reads the record by the id the
 * form chose, and creates it only when it is not there, updates it only at the revision the reader
 * edited, and writes nothing when the record already holds the reader's values.
 */
export async function saveOnce<T extends TableName>(
  client: Client,
  context: ReadContext,
  { table, id, values, create, revision }: SaveOnce<T>,
): Promise<{ outcome: SaveOnceOutcome; record: Row<T> }> {
  const { data: existing, error } = await client
    .from(table)
    .select()
    .eq("tenant_id", context.tenantId)
    .eq("id", id)
    .setHeader("Authorization", `Bearer ${context.token}`)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const current = existing as (Row<T> & { revision: number }) | null;
  if (current) {
    const same = Object.entries(values).every(
      ([column, value]) => (current as Record<string, unknown>)[column] === value,
    );
    if (same) return { outcome: "unchanged", record: current };
    if (revision === undefined) throw new SaveOnceConflict("different", conflicts.different);
    if (current.revision !== revision) throw new SaveOnceConflict("changed", conflicts.changed);
    const record = await writeRow(client, context, table, {
      values: values as Insert<T>,
      id,
      revision,
    });
    return { outcome: "updated", record };
  }
  if (revision !== undefined) throw new SaveOnceConflict("missing", conflicts.missing);
  const record = await writeRow(client, context, table, {
    values: { ...create, ...values, id } as Insert<T>,
  });
  return { outcome: "created", record };
}

/**
 * The retry-safe save as a mutation: the add-requirement-details and control-mapping dialogs keep
 * one id for their draft, and a second press after an uncertain failure never makes a duplicate.
 * The table's lists refresh after every save, a found first try included.
 */
export function useSaveOnce<T extends TableName>(table: T) {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<
    { outcome: SaveOnceOutcome; record: Row<T> },
    Error,
    Omit<SaveOnce<T>, "table">
  >({
    mutationFn: async (save) =>
      saveOnce(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        { ...save, table },
      ),
    onSuccess: () => void invalidateModel(cache, workspace.tenantId, table),
  });
}
