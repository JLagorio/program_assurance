import { createFileRoute } from "@tanstack/react-router";
import { ProgramWorkspace } from "@/components/prototype/program-workspace";
export const Route = createFileRoute("/programs/$programId_/risk")({ component: ProgramView });
function ProgramView() {
  const { programId } = Route.useParams();
  return <ProgramWorkspace programId={programId} tab="Risk" view="Residual risk" />;
}
