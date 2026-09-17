import { createFileRoute } from "@tanstack/react-router";
import { ProgramWorkspace } from "@/components/prototype/program-workspace";
export const Route = createFileRoute("/programs/$programId_/conmon")({
  head: () => ({ meta: [{ title: "Continuous monitoring — Program Assurance" }] }),
  component: ProgramView,
});
function ProgramView() {
  const { programId } = Route.useParams();
  return <ProgramWorkspace programId={programId} tab="Schedule" view="Continuous monitoring" />;
}
