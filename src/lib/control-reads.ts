import { useMemo } from "react";
import { keepPreviousData, useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useWorkspace } from "@/components/app/workspace";
import { database, requireIdentity } from "./database";
import { idSet, readRows, useRows, type ReadContext, type Row, type RowsOptions } from "./models";

type Client = Pick<SupabaseClient, "from">;
type Part = Row<"control_parts">;

type Selection = Row<"selected_controls">;

/**
 * The controls a set of resolved profiles selects: only those resolutions' rows, never the whole
 * table (every profile of the tenant and the reference library). `undefined` while the
 * resolutions are still being worked out keeps the read waiting; an empty list reads nothing.
 * Name the `columns` a screen uses when it needs only some (a count needs `profile_resolution_id`
 * and `control_id`).
 */
export function useSelectedControls<K extends keyof Selection & string>(
  resolutionIds: readonly (string | null | undefined)[] | undefined,
  options: Pick<RowsOptions, "enabled"> & { columns: readonly K[] },
): UseQueryResult<Pick<Selection, K>[], Error>;
export function useSelectedControls(
  resolutionIds: readonly (string | null | undefined)[] | undefined,
  options?: Pick<RowsOptions, "enabled">,
): UseQueryResult<Selection[], Error>;
export function useSelectedControls(
  resolutionIds: readonly (string | null | undefined)[] | undefined,
  options: Pick<RowsOptions, "enabled"> & { columns?: readonly (keyof Selection & string)[] } = {},
): UseQueryResult<unknown[], Error> {
  const ids = useMemo(() => (resolutionIds ? idSet(resolutionIds) : undefined), [resolutionIds]);
  return useRows(
    "selected_controls",
    { profile_resolution_id: ids ?? [] },
    {
      enabled: ids !== undefined && (options.enabled ?? true),
      ...(options.columns ? { columns: options.columns } : {}),
    },
  );
}

/**
 * Control statement parts by id, with every part above them, so each can be numbered and checked
 * as a statement ("a.", "a.1."). Reads only the parts asked for and climbs to their parents.
 */
export async function readControlStatements(
  client: Client,
  context: ReadContext,
  ids: readonly string[],
  signal?: AbortSignal | undefined,
): Promise<Part[]> {
  const parts = new Map<string, Part>();
  let wanted = idSet(ids);
  // Eight levels is deeper than any catalog nests its statements; it bounds a broken chain.
  for (let depth = 0; wanted.length && depth < 8; depth++) {
    const rows = (await readRows(
      client,
      context,
      "control_parts",
      { id: wanted },
      {},
      signal,
    )) as Part[];
    rows.forEach((part) => parts.set(part.id, part));
    wanted = idSet(rows.map((part) => part.parent_part_id)).filter((id) => !parts.has(id));
  }
  return [...parts.values()];
}

/**
 * The statements a screen names, with their parents: the Requirements register's statement
 * column and review flag, and the SSP's implementation statements. `keepPrevious` keeps the parts
 * on screen while a changed set loads (a saved statement adds an id).
 */
export function useControlStatements(
  ids: readonly string[],
  options: Pick<RowsOptions, "enabled" | "keepPrevious"> = {},
): UseQueryResult<Part[], Error> {
  const workspace = useWorkspace();
  const wanted = useMemo(() => idSet(ids), [ids]);
  return useQuery({
    queryKey: ["control-statements", workspace.tenantId, wanted],
    enabled: options.enabled ?? true,
    retry: false,
    ...(options.keepPrevious ? { placeholderData: keepPreviousData } : {}),
    queryFn: async ({ signal }) =>
      readControlStatements(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        wanted,
        signal,
      ),
  });
}

/**
 * The parts mapped targets name, and every part of their controls, so a recorded target (a legacy
 * or no longer valid one too) is named and numbered among its siblings.
 */
export async function readMappingParts(
  client: Client,
  context: ReadContext,
  ids: readonly string[],
  signal?: AbortSignal | undefined,
): Promise<Part[]> {
  const wanted = idSet(ids);
  if (!wanted.length) return [];
  const targets = (await readRows(
    client,
    context,
    "control_parts",
    { id: wanted },
    {},
    signal,
  )) as Part[];
  const parts = new Map(targets.map((part) => [part.id, part]));
  const controls = idSet(targets.map((part) => part.control_id));
  const siblings = (await readRows(
    client,
    context,
    "control_parts",
    { control_id: controls },
    {},
    signal,
  )) as Part[];
  siblings.forEach((part) => parts.set(part.id, part));
  return [...parts.values()];
}

/** A requirement's mapped control parts and their controls' other parts (the Control mappings tab). */
export function useMappingParts(ids: readonly string[]): UseQueryResult<Part[], Error> {
  const workspace = useWorkspace();
  const wanted = useMemo(() => idSet(ids), [ids]);
  return useQuery({
    queryKey: ["control-mapping-parts", workspace.tenantId, wanted],
    retry: false,
    queryFn: async ({ signal }) =>
      readMappingParts(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        wanted,
        signal,
      ),
  });
}
