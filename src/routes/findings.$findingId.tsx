import { createFileRoute } from "@tanstack/react-router";
import { FindingRecord } from "@/components/prototype/findings-views";
export const Route = createFileRoute("/findings/$findingId")({ component: Page });
function Page() {
  const { findingId } = Route.useParams();
  return <FindingRecord id={findingId} />;
}
