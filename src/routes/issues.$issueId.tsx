import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { IssueRecord } from "@/components/prototype/findings-views";
export const Route = createFileRoute("/issues/$issueId")({
  head: () => ({ meta: [{ title: "Operational issue — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: Page,
});
function Page() {
  const { issueId } = Route.useParams();
  const record = useRow("operational_issues", issueId);
  useRecordTitle("Operational issue", record.data?.title);
  return <IssueRecord id={issueId} />;
}
