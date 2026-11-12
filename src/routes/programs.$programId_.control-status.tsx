import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { ProgramWorkspace } from "@/components/prototype/program-workspace";
export const Route = createFileRoute("/programs/$programId_/control-status")({
  // How the controls are shown lives in the address, so a reload, Back and a shared link keep it:
  // the List, or the families when it names none. The List's own question (its search, sort and
  // filters) rides beside it under the collection's name, which ProductCollection reads.
  validateSearch: (search: Record<string, unknown>): { show?: "list" | undefined } => ({
    show: search["show"] === "list" ? "list" : undefined,
  }),
  head: () => ({ meta: [{ title: "Program — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ProgramView,
});
function ProgramView() {
  const { programId } = Route.useParams();
  const record = useRow("programs", programId);
  useRecordTitle("Program", record.data?.name);
  return <ProgramWorkspace programId={programId} tab="Controls" view="Control status" />;
}
