import { createFileRoute } from "@tanstack/react-router";
import { PoamDocument } from "@/components/prototype/assurance-views";
export const Route = createFileRoute("/poam-documents/$documentId")({ component: Page });
function Page() {
  const { documentId } = Route.useParams();
  return <PoamDocument id={documentId} />;
}
