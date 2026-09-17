import { MissingRecord } from "@/components/prototype/work-common";
import { campaignTabs, type CampaignTab } from "@/components/prototype/assessment-tabs";
import { displayDate } from "@/components/prototype/work-format";
import {
  Absent,
  Inspector,
  Shell,
  KeyValue,
  Section,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Inline,
  PageHeader,
  Stack,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia,
  EmptyIllustration,
} from "@ledger/design-system";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AssessmentCampaign } from "@/components/prototype/assessment-campaign";
import { QueryState, StatusBadge } from "@/components/prototype/work-common";
import { useRow } from "@/lib/models";

export const Route = createFileRoute("/campaigns/$campaignId")({
  component: CampaignDetail,
  validateSearch: (search: Record<string, unknown>): { tab?: CampaignTab | undefined } => ({
    tab: campaignTabs.find(
      (tab) => tab.toLowerCase() === String(search["tab"] ?? "").toLowerCase(),
    ),
  }),
  head: () => ({ meta: [{ title: "Test campaign — Program Assurance" }] }),
});
function CampaignDetail() {
  const { campaignId } = Route.useParams();
  const { tab = "Overview" } = Route.useSearch();
  const navigate = useNavigate();
  const query = useRow("assessment_campaigns", campaignId);
  const campaign = query.data;
  const program = useRow("programs", campaign?.program_id);
  return (
    <Stack space="space.200" className="min-w-0">
      <QueryState queries={[query]}>
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
              <PageHeader.Heading>
                <PageHeader.Title>{campaign.title}</PageHeader.Title>
              </PageHeader.Heading>
            </PageHeader>
            {tab === "Overview" && (
              <Shell.Aside label="Campaign details">
                <Inspector.Group title="Details">
                  <KeyValue label="Status">
                    <StatusBadge value={campaign.status} />
                  </KeyValue>
                  <KeyValue label="Starts">
                    {campaign.starts_at ? displayDate(campaign.starts_at) : <Absent />}
                  </KeyValue>
                  <KeyValue label="Ends">
                    {campaign.ends_at ? displayDate(campaign.ends_at) : <Absent />}
                  </KeyValue>
                </Inspector.Group>
              </Shell.Aside>
            )}
            <AssessmentCampaign
              key={campaign.id}
              campaign={campaign}
              overview={
                <Section title="Description">
                  <p>{campaign.description || <Absent />}</p>
                </Section>
              }
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
          <MissingRecord backTo="/campaigns" kind="Test campaign" />
        )}
      </QueryState>
    </Stack>
  );
}
