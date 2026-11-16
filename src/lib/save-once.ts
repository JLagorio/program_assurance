// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// A form whose save must be safe to retry chooses its record id once and saves through
// `useSaveOnce` in save-once: it creates only when the id is absent, edits only at the revision the
// reader saw, writes nothing when the record already holds the values, and says which conflict
// stopped it (another session's change, a record that is gone, different values already saved). The
// generic record form, behind `ProductRecordDialog` and the inspector's create pages, saves by the
// same rule through `saveRecordOnce` in record-save, its id chosen once a draft.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useWorkspace } from "./workspace-context";
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

const conflicts = {
  different: "This record was already saved with different values. Your draft is kept.",
  changed:
    "This record changed in another session. Your draft is kept; reopen the record to load its current values.",
  missing: "This record is no longer available. Your draft is kept.",
} as const;

/**
 * Why a retry-safe save stopped without writing:
 * - `different`: a create finds its id already saved with other values.
 * - `changed`: an edit finds the record at another revision than the reader edited.
 * - `missing`: an edit finds the record gone.
 * The reader's draft stays; the form says which, in its own words (the message here is the
 * fallback).
 */
export class SaveOnceConflict extends Error {
  constructor(
    readonly reason: "different" | "changed" | "missing",
    message: string = conflicts[reason],
  ) {
    super(message);
    this.name = "SaveOnceConflict";
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MOMENT = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

/**
 * Whether a stored value is the one a form sent, as Postgres hands it back: a decimal sent as text
 * comes back a number, a moment in another spelling of the same instant, a uuid in lower case and
 * a JSON document with its keys in another order.
 */
export function sameValue(stored: unknown, sent: unknown): boolean {
  if (stored === sent) return true;
  if (stored === null || stored === undefined || sent === null || sent === undefined)
    return (stored ?? null) === (sent ?? null);
  if (typeof stored === "number" && typeof sent === "string")
    return sent.trim() !== "" && Number(sent) === stored;
  if (typeof stored === "string" && typeof sent === "string") {
    if (UUID.test(stored) && UUID.test(sent)) return stored.toLowerCase() === sent.toLowerCase();
    if (MOMENT.test(stored) && MOMENT.test(sent)) {
      const instant = Date.parse(stored);
      return Number.isFinite(instant) && instant === Date.parse(sent);
    }
    return false;
  }
  if (Array.isArray(stored) || Array.isArray(sent))
    return (
      Array.isArray(stored) &&
      Array.isArray(sent) &&
      stored.length === sent.length &&
      stored.every((value, index) => sameValue(value, sent[index]))
    );
  if (typeof stored === "object" && typeof sent === "object") {
    const a = stored as Record<string, unknown>;
    const b = sent as Record<string, unknown>;
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].every((key) =>
      sameValue(a[key], b[key]),
    );
  }
  return false;
}

/** The record already holds every value the reader wrote. */
export function holds(record: Record<string, unknown>, values: Record<string, unknown>) {
  return Object.entries(values).every(([column, value]) => sameValue(record[column], value));
}

/**
 * What a retry-safe save does with the record its id found: nothing when the record already holds
 * the reader's values; a create when no record is there; an update when the record is at the
 * revision the reader edited. Anything else is a conflict, and nothing is written.
 */
export function onceStep(
  found: Record<string, unknown> | null,
  { values, revision }: { values: Record<string, unknown>; revision?: number | undefined },
): "unchanged" | "create" | "update" {
  if (found) {
    if (holds(found, values)) return "unchanged";
    if (revision === undefined) throw new SaveOnceConflict("different", conflicts.different);
    if (found["revision"] !== revision) throw new SaveOnceConflict("changed", conflicts.changed);
    return "update";
  }
  if (revision !== undefined) throw new SaveOnceConflict("missing", conflicts.missing);
  return "create";
}

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
  const current = existing as Row<T> | null;
  const step = onceStep(current as Record<string, unknown> | null, { values, revision });
  if (step === "unchanged") return { outcome: "unchanged", record: current! };
  if (step === "update") {
    const record = await writeRow(client, context, table, {
      values: values as Insert<T>,
      id,
      revision,
    });
    return { outcome: "updated", record };
  }
  const record = await writeRow(client, context, table, {
    values: { ...create, ...values, id } as Insert<T>,
  });
  return { outcome: "created", record };
}

/**
 * The retry-safe save as a mutation: the add-requirement-details and control-mapping dialogs keep
 * one id for their draft, and a second press after an uncertain failure never makes a duplicate.
 * The generic record form saves by the same rule through `saveRecordOnce` in record-save.ts.
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
