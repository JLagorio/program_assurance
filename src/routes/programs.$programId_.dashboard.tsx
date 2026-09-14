import { createFileRoute } from "@tanstack/react-router";
import { ProgramWorkspace } from "@/components/prototype/program-workspace";
export const Route = createFileRoute("/programs/$programId_/dashboard")({
  component: ProgramDashboard,
});
function ProgramDashboard() {
  const { programId } = Route.useParams();
  return <ProgramWorkspace programId={programId} />;
}
