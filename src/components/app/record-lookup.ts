import { useQuery } from "@tanstack/react-query";
import { getRecord } from "@/lib/database";
import type { Collection } from "@/lib/records";
import { useWorkspace } from "./workspace";

/** The collection a column's foreign key points at, when it points at a record's id. */
export function relatedCollection(
  collection: Collection,
  column: string,
  collections: Collection[],
) {
  const relation = collection.relations.find(
    (item) =>
      item.target_schema === "public" &&
      item.columns.includes(column) &&
      item.target_columns[item.columns.indexOf(column)] === "id" &&
      column !== "tenant_id",
  );
  return relation ? collections.find((item) => item.name === relation.target_table) : undefined;
}

/** One record, read once per id and shared by every place that names it. */
export function useRecord(collection: Collection | undefined, id: string | null | undefined) {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: ["record", workspace.tenantId, collection?.name, id],
    queryFn: () => getRecord(workspace, collection!, id!),
    enabled: !!collection && !!id,
    retry: false,
  });
}
