import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ProgramSystemRecord,
  systemTab,
  type SystemTab,
} from "@/components/prototype/program-record";
export const Route = createFileRoute("/programs/$programId_/systems/$scopeId")({
  validateSearch: (search: Record<string, unknown>): { tab?: SystemTab | undefined } => ({
    tab: systemTab(search["tab"]),
  }),
  component: ProgramRecord,
});
function ProgramRecord() {
  const { programId, scopeId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <ProgramSystemRecord
      programId={programId}
      systemId={scopeId}
      tab={tab}
      onTabChange={(next) =>
        void navigate({ search: (previous) => ({ ...previous, tab: next }), replace: true })
      }
    />
  );
}
