import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useWorkspace } from "@/components/app/workspace";
import type { Collection } from "./records";
import { schemaCatalogOptions } from "./schema-catalog";

/**
 * Every collection of the record schema: the schema inspector's list and the generic forms'
 * references. It loads the first time a screen asks and is kept for the session; pass the query
 * to QueryState so the screen waits on it, and never read it as empty while it loads.
 */
export function useSchemaCatalog(): UseQueryResult<Collection[], Error> {
  const workspace = useWorkspace();
  return useQuery(schemaCatalogOptions(workspace));
}

const find = (name: string) => (collections: Collection[]) =>
  collections.find((collection) => collection.name === name) ?? null;

/**
 * One collection's schema: its columns for a generic form or a preview's facts, the relations
 * they name, and the table's grants (`can_insert`, `can_update`, `can_delete`). `data` is
 * undefined while the schema loads and null when the collection is not open to the reader. Call
 * it from the surface that needs it (a form, a preview) as it opens, which waits on it as on any
 * query: its fields load under the operation's primary, not a read-only note. A register, a
 * record page or a tab that only needs to know whether the reader may write asks the workspace
 * role, and row-level security decides each write; the kinds and labels a register's columns
 * show are declared on its columns.
 */
export function useCollection(name: string): UseQueryResult<Collection | null, Error> {
  const workspace = useWorkspace();
  const select = useMemo(() => find(name), [name]);
  return useQuery({ ...schemaCatalogOptions(workspace), select });
}

/**
 * A column's fixed choices as the schema records them (an enum or a check constraint's list): a
 * requirement's type, an artifact's kind. `data` is undefined while the schema loads, so a Select
 * waits instead of offering nothing.
 */
export function useColumnChoices(table: string, column: string): UseQueryResult<string[], Error> {
  const workspace = useWorkspace();
  const select = useMemo(
    () => (collections: Collection[]) =>
      find(table)(collections)?.columns.find((item) => item.name === column)?.choices ?? [],
    [table, column],
  );
  return useQuery({ ...schemaCatalogOptions(workspace), select });
}
