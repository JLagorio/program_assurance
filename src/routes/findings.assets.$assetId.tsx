import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { AssetRecord } from "@/components/prototype/findings-views";
export const Route = createFileRoute("/findings/assets/$assetId")({
  head: () => ({ meta: [{ title: "Asset — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: Page,
});
function Page() {
  const { assetId } = Route.useParams();
  const record = useRow("inventory_items", assetId);
  useRecordTitle("Asset", record.data?.name);
  return <AssetRecord id={assetId} />;
}
