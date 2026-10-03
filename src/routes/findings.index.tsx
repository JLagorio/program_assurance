import { createFileRoute } from "@tanstack/react-router";
import { FINDINGS_TABS, Findings, type FindingsTab } from "@/components/prototype/findings-views";
export const Route = createFileRoute("/findings/")({
  // The collection a reader chose survives a reload, Back and a shared link, and a link can open
  // one (the Portfolio's assessment findings tile).
  validateSearch: (search: Record<string, unknown>): { tab?: FindingsTab | undefined } => ({
    tab: FINDINGS_TABS.find((tab) => tab === search["tab"]),
  }),
  head: () => ({ meta: [{ title: "Findings & assets — Program Assurance" }] }),
  component: Page,
});
function Page() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <Findings
      tab={tab ?? "issues"}
      // Over the address's other parameters: each register's question stays in it.
      onTabChange={(next) =>
        void navigate({
          search: (current) => ({ ...current, tab: next === "issues" ? undefined : next }),
        })
      }
    />
  );
}
