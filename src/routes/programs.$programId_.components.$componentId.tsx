import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { ProgramComponentRecord } from "@/components/prototype/program-record";
export const Route = createFileRoute("/programs/$programId_/components/$componentId")({
  head: () => ({ meta: [{ title: "Program component — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ProgramRecord,
});
function ProgramRecord() {
  const { programId, componentId } = Route.useParams();
  // The component the page shows: named once it and its system are known to be this program's.
  const component = useRow("system_components", componentId);
  const system = useRow("systems", component.data?.system_id);
  useRecordTitle(
    "Program component",
    system.data?.program_id === programId ? component.data?.name : null,
  );
  return <ProgramComponentRecord programId={programId} componentId={componentId} />;
}
