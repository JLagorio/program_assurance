import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "@/components/app/workspace";
import type { ControlStatusCounts, ProgramControlStatus } from "./control-status";
import { database, requireIdentity } from "./database";
import type { ReadContext } from "./models";

/*
 * Where a program has stood on its control baseline, day by day. `program_posture_snapshots` keeps
 * one row a program and UTC day: how many controls stood at each control status, as
 * `program_control_status` counts them. The trend starts on the day the first snapshot was taken:
 * nothing is backfilled. A daily job takes every program's at the day's end (23:55 UTC); a trend
 * first asks `ensure_program_posture_snapshots` to take today's of any named program that has none,
 * so a workspace whose job has not run still fills, then reads `program_posture_trend`, several
 * programs in one request. This module reads them and lays a program's days out as points.
 */

const count = z.number().int().nonnegative();
const snapshotSchema = z.object({
  program_id: z.string(),
  taken_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taken_at: z.string(),
  controls: count,
  no_requirement: count,
  no_evidence: count,
  not_assessed: count,
  other_than_satisfied: count,
  partially_satisfied: count,
  satisfied: count,
});

/** A program's control status counts on one day. */
export type PostureSnapshot = {
  programId: string;
  /** The UTC calendar day the counts belong to: "2026-11-13". */
  day: string;
  /** When they were last taken that day. */
  takenAt: string;
  /** How many controls the baseline selected that day. */
  total: number;
  counts: ControlStatusCounts;
};

/** Each named program's snapshots, in date order; a program with none has an empty list. */
export type PostureTrend = ReadonlyMap<string, readonly PostureSnapshot[]>;

/** One day of a program's trend, as a chart draws it. */
export type PosturePoint = {
  /** The UTC calendar day: "2026-11-13". */
  day: string;
  /** The share of the baseline satisfied, from 0 to 1; null for a baseline of no controls. */
  share: number | null;
  satisfied: number;
  total: number;
};

type Client = Pick<SupabaseClient, "rpc">;

/**
 * The named programs' snapshots, from `since` on when it is given. Today's snapshot of a program
 * that has none is taken first, by the command, never by the read; a program the reader cannot
 * read is refused.
 */
export async function readPostureTrend(
  client: Client,
  { token }: Pick<ReadContext, "token">,
  programIds: readonly string[],
  options: { since?: string | undefined; signal?: AbortSignal | undefined } = {},
): Promise<PostureTrend> {
  const ids = [...new Set(programIds)];
  const trend = new Map<string, PostureSnapshot[]>(ids.map((id) => [id, []]));
  if (!ids.length) return trend;
  let ensure = client
    .rpc("ensure_program_posture_snapshots", { p_program_ids: ids })
    .setHeader("Authorization", `Bearer ${token}`);
  if (options.signal) ensure = ensure.abortSignal(options.signal);
  const ensured = await ensure;
  if (ensured.error) throw new Error(ensured.error.message);
  let read = client
    .rpc("program_posture_trend", {
      p_program_ids: ids,
      ...(options.since ? { p_since: options.since } : {}),
    })
    .setHeader("Authorization", `Bearer ${token}`);
  if (options.signal) read = read.abortSignal(options.signal);
  const { data, error } = await read;
  if (error) throw new Error(error.message);
  for (const row of z.array(snapshotSchema).parse(data)) {
    trend.get(row.program_id)?.push({
      programId: row.program_id,
      day: row.taken_on,
      takenAt: row.taken_at,
      total: row.controls,
      counts: {
        no_requirement: row.no_requirement,
        no_evidence: row.no_evidence,
        not_assessed: row.not_assessed,
        other_than_satisfied: row.other_than_satisfied,
        partially_satisfied: row.partially_satisfied,
        satisfied: row.satisfied,
      },
    });
  }
  for (const snapshots of trend.values()) snapshots.sort((a, b) => a.day.localeCompare(b.day));
  return trend;
}

/** The UTC calendar day of a moment, the day a snapshot taken then belongs to: "2026-11-13". */
export function postureDay(at: Date = new Date()): string {
  return at.toISOString().slice(0, 10);
}

/** The UTC calendar day `days` before today's (or `at`'s). */
export function postureDaysBefore(days: number, at: Date = new Date()): string {
  return postureDay(new Date(at.getTime() - days * 86_400_000));
}

/** A calendar day's parts, for a formatter of days: the month counts from 1. */
export function calendarDay(day: string): { year: number; month: number; day: number } {
  const [year = 0, month = 1, date = 1] = day.split("-").map(Number);
  return { year, month, day: date };
}

/**
 * A program's days as points, in date order: the share of its baseline satisfied, with the counts
 * behind it. Today's point is the live standing where one is given, so a line ends at the number
 * the page shows beside it; every earlier day is the snapshot that closed it. A live answer of a
 * program with no baseline changes nothing, and a day with no snapshot is never made up.
 */
export function postureSeries(
  snapshots: readonly PostureSnapshot[],
  live?: Pick<ProgramControlStatus, "baseline" | "total" | "counts"> | undefined,
  today: string = postureDay(),
): PosturePoint[] {
  return [...snapshots]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((snapshot) => {
      const standing = snapshot.day === today && live?.baseline ? live : snapshot;
      return {
        day: snapshot.day,
        share: standing.total > 0 ? standing.counts.satisfied / standing.total : null,
        satisfied: standing.counts.satisfied,
        total: standing.total,
      };
    });
}

/**
 * The named programs' trends, read once for all of them (the Overview names one program, the
 * Portfolio its recently updated rows), from `since` on when it is given. Reading takes today's
 * snapshot of a program that has none, through the command, so the trend fills from the first day
 * it is read. The snapshots change once a day, not with each write, so a write reads nothing again:
 * a chart takes today's point from the live control status beside it (`postureSeries`).
 */
export function usePostureTrend(
  programIds: readonly string[],
  options: { since?: string | undefined } = {},
): UseQueryResult<PostureTrend, Error> {
  const workspace = useWorkspace();
  const ids = [...new Set(programIds)].sort();
  return useQuery<PostureTrend, Error>({
    queryKey: ["models", workspace.tenantId, "program_posture_trend", ids, options.since ?? null],
    enabled: ids.length > 0,
    retry: false,
    queryFn: async ({ signal }) =>
      readPostureTrend(database(), { token: await requireIdentity(workspace) }, ids, {
        since: options.since,
        signal,
      }),
  });
}

/** How many days a row's trend shows, a point each: a sparkline's six to twelve. */
export const RECENT_POSTURE_DAYS = 12;

/**
 * The named programs' last twelve days (today's and the eleven before it), read once for all of
 * them: a widget's rows, each drawing its own as a sparkline.
 */
export function useRecentPostureTrend(
  programIds: readonly string[],
): UseQueryResult<PostureTrend, Error> {
  return usePostureTrend(programIds, { since: postureDaysBefore(RECENT_POSTURE_DAYS - 1) });
}
