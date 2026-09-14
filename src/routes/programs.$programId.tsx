import { createFileRoute } from "@tanstack/react-router";
import {
  ProgramWorkspace,
  programTab,
  type ProgramTab,
} from "@/components/prototype/program-workspace";
import { requirementTab, type RequirementTab } from "@/components/prototype/requirement-record";
export const Route = createFileRoute("/programs/$programId")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    tab?: ProgramTab;
    requirementId?: string | undefined;
    requirementTab?: RequirementTab | undefined;
  } => ({
    tab: programTab(search["tab"]),
    requirementId:
      typeof search["requirementId"] === "string" && search["requirementId"]
        ? search["requirementId"]
        : undefined,
    requirementTab: search["requirementTab"] ? requirementTab(search["requirementTab"]) : undefined,
  }),
  component: ProgramRecord,
});
function ProgramRecord() {
  const { programId } = Route.useParams();
  const { tab, requirementId, requirementTab } = Route.useSearch();
  return (
    <ProgramWorkspace
      programId={programId}
      tab={tab}
      requirementId={requirementId}
      requirementTab={requirementTab}
    />
  );
}
