import { createFileRoute } from "@tanstack/react-router";
import { IssueRecord } from "@/components/prototype/findings-views";
export const Route = createFileRoute("/issues/$issueId")({ component: Page });
function Page() {
  const { issueId } = Route.useParams();
  return <IssueRecord id={issueId} />;
}
