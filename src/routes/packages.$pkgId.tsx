import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { PackageRecord } from "@/components/prototype/package-views";
export const Route = createFileRoute("/packages/$pkgId")({
  head: () => ({ meta: [{ title: "Authorization package — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: Page,
});
function Page() {
  const { pkgId } = Route.useParams();
  const record = useRow("authorization_packages", pkgId);
  useRecordTitle("Authorization package", record.data?.title);
  return <PackageRecord id={pkgId} />;
}
