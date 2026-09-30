import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { FindingRecord } from "@/components/prototype/findings-views";
export const Route = createFileRoute("/findings/$findingId")({
  head: () => ({ meta: [{ title: "Assessment finding — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: Page,
});
function Page() {
  const { findingId } = Route.useParams();
  const record = useRow("assessment_findings", findingId);
  useRecordTitle("Assessment finding", record.data?.title);
  return <FindingRecord id={findingId} />;
}
