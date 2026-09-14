import { PageHeader, Stack } from "@ledger/design-system";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AssessmentBrowser } from "@/components/prototype/assessment-browser";

export const Route = createFileRoute("/campaigns")({
  component: CampaignsLayout,
  head: () => ({ meta: [{ title: "Test campaigns — Equinox" }] }),
});
function CampaignsLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname !== "/campaigns" && pathname !== "/campaigns/") return <Outlet />;
  return (
    <Stack space="space.200" className="min-w-0">
      <PageHeader>
        <div className="min-w-0">
          <PageHeader.Title>Test campaigns</PageHeader.Title>
        </div>
      </PageHeader>
      <AssessmentBrowser />
    </Stack>
  );
}
