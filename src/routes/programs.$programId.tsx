import { createFileRoute, redirect, useLocation } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useBrowserTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { ProgramWorkspace } from "@/components/prototype/program-workspace";
import {
  isRiskTab,
  programPart,
  programTab,
  programTabHash,
  type ProgramTab,
  type RiskTab,
} from "@/lib/program-parts";
import { requirementTab, type RequirementTab } from "@/components/prototype/requirement-record";
export const Route = createFileRoute("/programs/$programId")({
  head: () => ({ meta: [{ title: "Program — Program Assurance" }] }),
  pendingComponent: RecordPending,
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    tab?: ProgramTab | RiskTab;
    requirementId?: string | undefined;
    requirementTab?: RequirementTab | undefined;
  } => ({
    // A word for the Risks part stays as it was typed until beforeLoad replaces it: the server
    // replaces an address whose search reads otherwise before beforeLoad runs, and drops its hash.
    tab: isRiskTab(search["tab"]) ? search["tab"] : programTab(search["tab"]),
    requirementId:
      typeof search["requirementId"] === "string" && search["requirementId"]
        ? search["requirementId"]
        : undefined,
    requirementTab: search["requirementTab"] ? requirementTab(search["requirementTab"]) : undefined,
  }),
  // An address that names a retired or aliased tab (?tab=risk, ?tab=POA%26M, ?tab=activity) is
  // replaced by the one that names where its content went, so the address says the part shown:
  // ?tab=risk keeps the risks' Section in its hash, which is the Risks part.
  beforeLoad: ({ params, search, location }) => {
    const named = new URLSearchParams(location.searchStr).get("tab");
    const risks = programTabHash(named);
    if (named !== null && (named !== search.tab || risks)) {
      const hash = risks ?? location.hash;
      throw redirect({
        to: "/programs/$programId",
        params,
        search: { ...search, tab: programTab(named) },
        ...(hash ? { hash } : {}),
        replace: true,
      });
    }
  },
  component: ProgramRecord,
});
function ProgramRecord() {
  const { programId } = Route.useParams();
  const record = useRow("programs", programId);
  const { tab, requirementId, requirementTab } = Route.useSearch();
  const hash = useLocation({ select: (location) => location.hash });
  const part = programPart(programTab(tab), hash);
  // The Overview names the program, "<program> — Program — …"; a part names itself first, as its
  // h1 does: "Requirements — <program> — …".
  const name = record.data?.name?.trim();
  useBrowserTitle(name ? (part === "Overview" ? [name, "Program"] : [part, name]) : null);
  return (
    <ProgramWorkspace
      programId={programId}
      part={part}
      requirementId={requirementId}
      requirementTab={requirementTab}
    />
  );
}
