import { createFileRoute } from "@tanstack/react-router";
import { ProgramComponentRecord } from "@/components/prototype/program-record";
export const Route = createFileRoute("/programs/$programId_/components/$componentId")({
  component: ProgramRecord,
});
function ProgramRecord() {
  const { programId, componentId } = Route.useParams();
  return <ProgramComponentRecord programId={programId} componentId={componentId} />;
}
