import { createFileRoute } from "@tanstack/react-router";
import { PoamDocument } from "@/components/prototype/assurance-views";
export const Route = createFileRoute("/poam-documents/$documentId")({
  head: () => ({ meta: [{ title: "POA&M document — Program Assurance" }] }),
  component: Page,
});
function Page() {
  const { documentId } = Route.useParams();
  return <PoamDocument id={documentId} />;
}
