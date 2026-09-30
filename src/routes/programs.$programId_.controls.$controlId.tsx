import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { ProgramControlRecord } from "@/components/prototype/program-record";
export const Route = createFileRoute("/programs/$programId_/controls/$controlId")({
  head: () => ({ meta: [{ title: "Program control — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ProgramRecord,
});
function ProgramRecord() {
  const { programId, controlId } = Route.useParams();
  // The page names the implementation by its control, once its plan's system is this program's.
  const implementation = useRow("implemented_requirements", controlId);
  const plan = useRow("ssp_revisions", implementation.data?.ssp_revision_id);
  const system = useRow("systems", plan.data?.system_id);
  const selected = useRow("selected_controls", implementation.data?.selected_control_id);
  const control = useRow("controls", selected.data?.control_id);
  useRecordTitle(
    "Program control",
    system.data?.program_id === programId ? control.data?.title : null,
  );
  return <ProgramControlRecord programId={programId} implementationId={controlId} />;
}
