import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow, useRows } from "@/lib/models";
import {
  ProgramRequirementRecord,
  requirementTab,
  type RequirementTab,
} from "@/components/prototype/requirement-record";
export const Route = createFileRoute("/programs/$programId_/requirements/$requirementId")({
  head: () => ({ meta: [{ title: "Program requirement — Program Assurance" }] }),
  pendingComponent: RecordPending,
  validateSearch: (search: Record<string, unknown>): { tab?: RequirementTab | undefined } => ({
    tab: requirementTab(search["tab"]),
  }),
  component: ProgramRecord,
});
function ProgramRecord() {
  const { programId, requirementId } = Route.useParams();
  // The requirement as the page names it: its latest content revision's title, else its code.
  const requirement = useRow("engineering_requirements", requirementId);
  const revisions = useRows("requirement_revisions", {
    engineering_requirement_id: requirementId,
  });
  const latest = revisions.data?.reduce<(typeof revisions.data)[number] | undefined>(
    (best, revision) => (!best || revision.version_number > best.version_number ? revision : best),
    undefined,
  );
  useRecordTitle(
    "Program requirement",
    requirement.data?.program_id === programId && revisions.data
      ? (latest?.title ?? requirement.data.code)
      : null,
  );
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <ProgramRequirementRecord
      programId={programId}
      requirementId={requirementId}
      tab={tab}
      onTabChange={(next) => void navigate({ search: (previous) => ({ ...previous, tab: next }) })}
    />
  );
}
