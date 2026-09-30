import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { PoamRecord } from "@/components/prototype/assurance-views";
export const Route = createFileRoute("/register/poam/$poamId")({
  head: () => ({ meta: [{ title: "Remediation item — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: Page,
});
function Page() {
  const { poamId } = Route.useParams();
  const record = useRow("poam_items", poamId);
  useRecordTitle("Remediation item", record.data?.title);
  return <PoamRecord id={poamId} />;
}
