import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import { invalidateModel, writeRow, type ReadContext, type Row, type TableName } from "./models";

type Client = Pick<SupabaseClient, "from">;

/**
 * A calendar day, as Postgres `date` stores it and the kit's DatePicker and Editable.Date report
 * it: "2026-10-14". It names the same day in every zone, so it is never sent as a moment. A day
 * past its month's end ("2026-02-30") is refused.
 */
export const calendarDay = (message: string) => z.string().date(message);

export const INVALID_DUE_DATE = "Enter a valid due date.";
export const INVALID_PLANNED_COMPLETION = "Enter a valid planned completion date.";

/** One day of a record, written at the revision the reader saw. */
export type DayChange = {
  /** The record whose day changes. */
  id: string;
  /** The revision the reader edited: the write applies only while the record is still at it. */
  revision: number;
  /** The ISO day; null, or "" from a cleared field, for none. */
  day: string | null;
};

/** The day to store: the ISO day, or null for none; anything else throws `message`. */
function storedDay({ id, day }: DayChange, message: string): string | null {
  if (!z.string().uuid().safeParse(id).success)
    throw new Error("Reload the record before changing its date.");
  const typed = day?.trim() ?? "";
  if (!typed) return null;
  if (!calendarDay(message).safeParse(typed).success) throw new Error(message);
  return typed;
}

/**
 * Sets the day a task is due, or clears it, as revision + 1 of the revision the reader saw; a
 * task changed elsewhere since refuses the write instead of overwriting it.
 */
export async function setTaskDue(
  client: Client,
  context: ReadContext,
  change: DayChange,
): Promise<Row<"tasks">> {
  const due = storedDay(change, INVALID_DUE_DATE);
  return writeRow(client, context, "tasks", {
    id: change.id,
    revision: change.revision,
    values: { due_on: due },
  });
}

/**
 * Sets the day a remediation commitment plans to be complete, or clears it, as revision + 1 of
 * the revision the reader saw. Only a draft commitment changes: Postgres refuses a published one.
 */
export async function setPlannedCompletion(
  client: Client,
  context: ReadContext,
  change: DayChange,
): Promise<Row<"poam_item_revisions">> {
  const planned = storedDay(change, INVALID_PLANNED_COMPLETION);
  return writeRow(client, context, "poam_item_revisions", {
    id: change.id,
    revision: change.revision,
    values: { planned_completion_date: planned },
  });
}

function useDayCommand<T extends TableName>(
  table: T,
  command: (client: Client, context: ReadContext, change: DayChange) => Promise<Row<T>>,
) {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<Row<T>, Error, DayChange>({
    mutationFn: async (change) =>
      command(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        change,
      ),
    // The write resolves when Postgres confirms it; the lists and the record refresh behind it.
    onSuccess: () => void invalidateModel(cache, workspace.tenantId, table),
  });
}

/** A task's Due, edited in place in its Details. */
export function useSetTaskDue() {
  return useDayCommand("tasks", setTaskDue);
}

/** A remediation commitment's planned completion, edited in place in its item's Details. */
export function useSetPlannedCompletion() {
  return useDayCommand("poam_item_revisions", setPlannedCompletion);
}
