import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { RecordDetail } from "@/components/app/record-browser";
import { useRecord } from "@/components/app/record-lookup";
import { useCollection } from "@/lib/collections";
import { recordTitle } from "@/lib/records";
export const Route = createFileRoute("/records/$collection/$recordId")({
  head: () => ({ meta: [{ title: "Schema record — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: Record,
});
function Record() {
  const { collection, recordId } = Route.useParams();
  const { field, value } = Route.useSearch();
  // The record under the name its page gives it; a new record's page keeps the type alone.
  const meta = useCollection(collection).data ?? undefined;
  const record = useRecord(meta, recordId === "new" ? null : recordId);
  useRecordTitle("Schema record", record.data && meta ? recordTitle(record.data, meta) : null);
  return (
    <RecordDetail
      key={`${collection}-${recordId}`}
      name={collection}
      id={recordId}
      initial={field && value ? [field, value] : undefined}
    />
  );
}
