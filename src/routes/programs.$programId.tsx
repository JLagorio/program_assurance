import { createFileRoute, redirect } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import {
  ProgramWorkspace,
  programTab,
  type ProgramTab,
} from "@/components/prototype/program-workspace";
import { requirementTab, type RequirementTab } from "@/components/prototype/requirement-record";
import { assessmentTab, type AssessmentKind } from "@/components/prototype/assessment-tabs";
export const Route = createFileRoute("/programs/$programId")({
  head: () => ({ meta: [{ title: "Program — Program Assurance" }] }),
  pendingComponent: RecordPending,
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    tab?: ProgramTab;
    requirementId?: string | undefined;
    requirementTab?: RequirementTab | undefined;
    assessmentTab?: AssessmentKind | undefined;
  } => ({
    tab: programTab(search["tab"]),
    requirementId:
      typeof search["requirementId"] === "string" && search["requirementId"]
        ? search["requirementId"]
        : undefined,
    requirementTab: search["requirementTab"] ? requirementTab(search["requirementTab"]) : undefined,
    assessmentTab: assessmentTab(search["assessmentTab"]),
  }),
  // An address that names a retired or aliased tab (?tab=risk, ?tab=POA%26M, ?tab=activity) is
  // replaced by the one that names where its content went, so the address says the tab shown.
  beforeLoad: ({ params, search, location }) => {
    const named = new URLSearchParams(location.searchStr).get("tab");
    if (named !== null && named !== search.tab)
      throw redirect({ to: "/programs/$programId", params, search, replace: true });
  },
  component: ProgramRecord,
});
function ProgramRecord() {
  const { programId } = Route.useParams();
  const record = useRow("programs", programId);
  useRecordTitle("Program", record.data?.name);
  const { tab, requirementId, requirementTab, assessmentTab } = Route.useSearch();
  return (
    <ProgramWorkspace
      programId={programId}
      tab={tab}
      requirementId={requirementId}
      requirementTab={requirementTab}
      assessmentTab={assessmentTab}
    />
  );
}
