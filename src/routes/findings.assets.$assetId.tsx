import { createFileRoute } from "@tanstack/react-router";
import { AssetRecord } from "@/components/prototype/findings-views";
export const Route = createFileRoute("/findings/assets/$assetId")({
  head: () => ({ meta: [{ title: "Asset — Program Assurance" }] }),
  component: Page,
});
function Page() {
  const { assetId } = Route.useParams();
  return <AssetRecord id={assetId} />;
}
