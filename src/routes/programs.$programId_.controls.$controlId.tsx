import { createFileRoute } from "@tanstack/react-router";
import { ProgramControlRecord } from "@/components/prototype/program-record";
export const Route = createFileRoute("/programs/$programId_/controls/$controlId")({
  component: ProgramRecord,
});
function ProgramRecord() {
  const { programId, controlId } = Route.useParams();
  return <ProgramControlRecord programId={programId} implementationId={controlId} />;
}
