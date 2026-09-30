import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import {
  ProgramSystemRecord,
  systemTab,
  type SystemTab,
} from "@/components/prototype/program-record";
export const Route = createFileRoute("/programs/$programId_/systems/$scopeId")({
  head: () => ({ meta: [{ title: "System — Program Assurance" }] }),
  pendingComponent: RecordPending,
  validateSearch: (search: Record<string, unknown>): { tab?: SystemTab | undefined } => ({
    tab: systemTab(search["tab"]),
  }),
  component: ProgramRecord,
});
function ProgramRecord() {
  const { programId, scopeId } = Route.useParams();
  const system = useRow("systems", scopeId);
  useRecordTitle("System", system.data?.program_id === programId ? system.data.name : null);
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <ProgramSystemRecord
      programId={programId}
      systemId={scopeId}
      tab={tab}
      onTabChange={(next) => void navigate({ search: (previous) => ({ ...previous, tab: next }) })}
    />
  );
}
