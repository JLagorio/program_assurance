import { createFileRoute } from "@tanstack/react-router";
import { ProgramSystemRecord } from "@/components/prototype/program-record";
export const Route = createFileRoute("/programs/$programId_/systems/$scopeId")({
  component: ProgramRecord,
});
function ProgramRecord() {
  const { programId, scopeId } = Route.useParams();
  return <ProgramSystemRecord programId={programId} systemId={scopeId} />;
}
