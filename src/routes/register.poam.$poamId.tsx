import { createFileRoute } from "@tanstack/react-router";
import { PoamRecord } from "@/components/prototype/assurance-views";
export const Route = createFileRoute("/register/poam/$poamId")({ component: Page });
function Page() {
  const { poamId } = Route.useParams();
  return <PoamRecord id={poamId} />;
}
