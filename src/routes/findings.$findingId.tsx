import { createFileRoute } from "@tanstack/react-router";
import { FindingRecord } from "@/components/prototype/findings-views";
export const Route = createFileRoute("/findings/$findingId")({
  head: () => ({ meta: [{ title: "Assessment finding — Program Assurance" }] }),
  component: Page,
});
function Page() {
  const { findingId } = Route.useParams();
  return <FindingRecord id={findingId} />;
}
