import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { techniqueParam } from "@/lib/control-resiliency";
import { useRow } from "@/lib/models";
import { ProgramWorkspace } from "@/components/prototype/program-workspace";
export const Route = createFileRoute("/programs/$programId_/control-baseline")({
  // The resiliency technique the baseline is read by lives in the address, by its code after
  // `technique.` (`segmentation`), so a reload, Back and a shared link keep it. None is all
  // controls. The view reads it there (ProgramControlBaseline).
  validateSearch: (search: Record<string, unknown>): { technique?: string | undefined } => ({
    technique: techniqueParam(search["technique"]),
  }),
  head: () => ({ meta: [{ title: "Program — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ProgramView,
});
function ProgramView() {
  const { programId } = Route.useParams();
  const record = useRow("programs", programId);
  useRecordTitle("Program", record.data?.name);
  return <ProgramWorkspace programId={programId} tab="Controls" view="Control baseline" />;
}
