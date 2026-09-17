import { createFileRoute } from "@tanstack/react-router";
import { RecordDetail } from "@/components/app/record-browser";
export const Route = createFileRoute("/records/$collection/$recordId")({
  head: () => ({ meta: [{ title: "Schema record — Program Assurance" }] }),
  component: Record,
});
function Record() {
  const { collection, recordId } = Route.useParams();
  const { field, value } = Route.useSearch();
  return (
    <RecordDetail
      key={`${collection}-${recordId}`}
      name={collection}
      id={recordId}
      initial={field && value ? [field, value] : undefined}
    />
  );
}
