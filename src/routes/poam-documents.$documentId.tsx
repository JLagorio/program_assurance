import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { PoamDocument } from "@/components/prototype/assurance-views";
export const Route = createFileRoute("/poam-documents/$documentId")({
  head: () => ({ meta: [{ title: "POA&M plan — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: Page,
});
function Page() {
  const { documentId } = Route.useParams();
  const record = useRow("poam_documents", documentId);
  useRecordTitle("POA&M plan", record.data?.title);
  return <PoamDocument id={documentId} />;
}
