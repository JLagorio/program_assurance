import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { CatalogControlRecord } from "@/components/prototype/control-record";

export const Route = createFileRoute("/catalog_/controls/$controlId")({
  head: () => ({ meta: [{ title: "Control — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: Page,
});
function Page() {
  const { controlId } = Route.useParams();
  const record = useRow("controls", controlId);
  useRecordTitle("Control", record.data?.title);
  return <CatalogControlRecord id={controlId} />;
}
