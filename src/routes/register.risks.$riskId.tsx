import { createFileRoute } from "@tanstack/react-router";
import { RiskRecord } from "@/components/prototype/assurance-views";
export const Route = createFileRoute("/register/risks/$riskId")({ component: Page });
function Page() {
  const { riskId } = Route.useParams();
  return <RiskRecord id={riskId} />;
}
