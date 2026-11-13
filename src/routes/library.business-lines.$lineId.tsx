import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { BusinessLineRecord } from "@/components/prototype/business-lines";
export const Route = createFileRoute("/library/business-lines/$lineId")({
  head: () => ({ meta: [{ title: "Business line — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: BusinessLinePage,
});
function BusinessLinePage() {
  const { lineId } = Route.useParams();
  return <BusinessLineRecord key={lineId} lineId={lineId} />;
}
