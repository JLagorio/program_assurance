import { createFileRoute } from "@tanstack/react-router";
import { PoamRecord } from "@/components/prototype/assurance-views";
export const Route = createFileRoute("/register/poam/$poamId")({
  head: () => ({ meta: [{ title: "Remediation item — Program Assurance" }] }),
  component: Page,
});
function Page() {
  const { poamId } = Route.useParams();
  return <PoamRecord id={poamId} />;
}
