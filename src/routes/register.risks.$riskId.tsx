import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { RISK_TABS, RiskRecord, type RiskTab } from "@/components/prototype/assurance-views";
export const Route = createFileRoute("/register/risks/$riskId")({
  // The tab a reader chose survives a reload, Back and a shared link.
  validateSearch: (search: Record<string, unknown>): { tab?: RiskTab | undefined } => ({
    tab: RISK_TABS.find((tab) => tab === search["tab"]),
  }),
  head: () => ({ meta: [{ title: "Risk — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: Page,
});
function Page() {
  const { riskId } = Route.useParams();
  const record = useRow("risks", riskId);
  useRecordTitle("Risk", record.data?.title);
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <RiskRecord
      id={riskId}
      tab={tab}
      onTabChange={(next) => void navigate({ search: { tab: next } })}
    />
  );
}
