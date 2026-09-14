import { campaignTabs, type CampaignTab } from "@/components/prototype/assessment-tabs";
import { displayDate } from "@/components/prototype/work-format";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Inline,
  PageHeader,
  Stack,
} from "@ledger/design-system";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AssessmentCampaign } from "@/components/prototype/assessment-campaign";
import { EmptyState, QueryState, StatusBadge } from "@/components/prototype/work-common";
import { useRow } from "@/lib/models";

export const Route = createFileRoute("/campaigns/$campaignId")({
  component: CampaignDetail,
  validateSearch: (search: Record<string, unknown>): { tab?: CampaignTab | undefined } => ({
    tab: campaignTabs.find(
      (tab) => tab.toLowerCase() === String(search["tab"] ?? "").toLowerCase(),
    ),
  }),
  head: () => ({ meta: [{ title: "Test campaign — Equinox" }] }),
});
function CampaignDetail() {
  const { campaignId } = Route.useParams();
  const { tab = "Execution" } = Route.useSearch();
  const navigate = useNavigate();
  const query = useRow("assessment_campaigns", campaignId);
  const campaign = query.data;
  const program = useRow("programs", campaign?.program_id);
  return (
    <Stack space="space.200" className="min-w-0">
      {query.isError && campaign && (
        <p role="alert" className="text-danger">
          Campaign refresh failed. The open draft is retained.
        </p>
      )}
      <QueryState queries={campaign ? [] : [query]}>
        {campaign ? (
          <>
            <PageHeader>
              <PageHeader.Lead render={<Breadcrumb />}>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to="/campaigns" />}>
                      Test campaigns
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      render={
                        <Link
                          to="/programs/$programId"
                          params={{ programId: campaign.program_id }}
                        />
                      }
                    >
                      {program.data?.name ?? "Program"}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{campaign.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </PageHeader.Lead>
              <div className="min-w-0">
                <PageHeader.Title>{campaign.title}</PageHeader.Title>
                <Inline space="space.150" alignBlock="center" className="pt-100">
                  <StatusBadge value={campaign.status} />
                  <span className="font-body-small text-subtle">
                    {displayDate(campaign.starts_at)} → {displayDate(campaign.ends_at)}
                  </span>
                </Inline>
              </div>
            </PageHeader>
            <AssessmentCampaign
              key={campaign.id}
              campaign={campaign}
              tab={tab}
              onTab={(next) =>
                void navigate({
                  to: "/campaigns/$campaignId",
                  params: { campaignId },
                  search: { tab: next },
                  replace: true,
                })
              }
            />
          </>
        ) : (
          <EmptyState title="Campaign not found" illustration="search" />
        )}
      </QueryState>
    </Stack>
  );
}
