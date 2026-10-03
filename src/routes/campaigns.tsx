import { PageHeader } from "@ledger/design-system";
import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Page } from "@/components/app/shell";
import { AssessmentBrowser } from "@/components/prototype/assessment-browser";
import { assessmentTab, type AssessmentKind } from "@/components/prototype/assessment-tabs";

export const Route = createFileRoute("/campaigns")({
  // The register's tab is in the address under its own key, since a campaign's page keeps `tab`.
  validateSearch: (
    search: Record<string, unknown>,
  ): { assessmentTab?: AssessmentKind | undefined } => ({
    assessmentTab: assessmentTab(search["assessmentTab"]),
  }),
  component: CampaignsLayout,
  head: () => ({ meta: [{ title: "Assessment campaigns — Program Assurance" }] }),
});
function CampaignsLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { assessmentTab: tab } = Route.useSearch();
  const navigate = useNavigate();
  if (pathname !== "/campaigns" && pathname !== "/campaigns/") return <Outlet />;
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Assessment campaigns</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <AssessmentBrowser
        tab={tab}
        // Each choice is a step in the history, so Back returns to the tab before; the
        // registers' questions stay in the address beside it.
        onTabChange={(next) =>
          void navigate({
            to: "/campaigns",
            search: (current) => ({ ...current, assessmentTab: next }),
            resetScroll: false,
          })
        }
      />
    </Page>
  );
}
