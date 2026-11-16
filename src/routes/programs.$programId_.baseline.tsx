import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useViewTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { ProgramWorkspace } from "@/components/prototype/program-workspace";
export const Route = createFileRoute("/programs/$programId_/baseline")({
  head: () => ({ meta: [{ title: "Configuration baseline — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ProgramView,
});
function ProgramView() {
  const { programId } = Route.useParams();
  const record = useRow("programs", programId);
  useViewTitle("Configuration baseline", record.data?.name);
  return <ProgramWorkspace programId={programId} view="Configuration baseline" />;
}
