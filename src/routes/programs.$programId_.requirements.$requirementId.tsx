import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ProgramRequirementRecord,
  requirementTab,
  type RequirementTab,
} from "@/components/prototype/requirement-record";
export const Route = createFileRoute("/programs/$programId_/requirements/$requirementId")({
  validateSearch: (search: Record<string, unknown>): { tab?: RequirementTab | undefined } => ({
    tab: requirementTab(search["tab"]),
  }),
  component: ProgramRecord,
});
function ProgramRecord() {
  const { programId, requirementId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <ProgramRequirementRecord
      programId={programId}
      requirementId={requirementId}
      tab={tab}
      onTabChange={(next) =>
        void navigate({ search: (previous) => ({ ...previous, tab: next }), replace: true })
      }
    />
  );
}
