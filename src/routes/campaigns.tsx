import { PageHeader } from "@ledger/design-system";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Page } from "@/components/app/shell";
import { AssessmentBrowser } from "@/components/prototype/assessment-browser";

export const Route = createFileRoute("/campaigns")({
  component: CampaignsLayout,
  head: () => ({ meta: [{ title: "Assessment campaigns — Program Assurance" }] }),
});
function CampaignsLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname !== "/campaigns" && pathname !== "/campaigns/") return <Outlet />;
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Assessment campaigns</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <AssessmentBrowser />
    </Page>
  );
}
