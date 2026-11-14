import { useState } from "react";
import { ProductRecordDialog } from "@/components/prototype/product-record-dialog";
import {
  MissingRecord,
  QueryState,
  RecordActions,
  ReportFailures,
} from "@/components/prototype/work-common";
import { campaignTabs, type CampaignTab } from "@/components/prototype/assessment-tabs";
import {
  Absent,
  AsideLayout,
  Box,
  DateTime,
  DropdownMenuItem,
  Inspector,
  Shell,
  KeyValue,
  PageHeader,
  Prose,
  Section,
  Stack,
} from "@ledger/design-system";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AssessmentCampaign } from "@/components/prototype/assessment-campaign";
import { CampaignResults } from "@/components/prototype/campaign-results";
import { usePublishResults } from "@/components/prototype/publish-results";
import { RecordTrail, TrailLink } from "@/components/prototype/record-trail";
import { RelationName } from "@/components/prototype/record-tools";
import { useRecordTitle } from "@/components/app/browser-title";
import { Page, RecordPending } from "@/components/app/shell";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { useCampaignResultsToPublish } from "@/lib/assessment-results";
import { campaignStatuses } from "@/lib/status";
import { useRow } from "@/lib/models";

export const Route = createFileRoute("/campaigns/$campaignId")({
  component: CampaignDetail,
  validateSearch: (search: Record<string, unknown>): { tab?: CampaignTab | undefined } => ({
    tab: campaignTabs.find(
      (tab) => tab.toLowerCase() === String(search["tab"] ?? "").toLowerCase(),
    ),
  }),
  head: () => ({ meta: [{ title: "Assessment campaign — Program Assurance" }] }),
  pendingComponent: RecordPending,
});
function CampaignDetail() {
  const { campaignId } = Route.useParams();
  const [editing, setEditing] = useState(false);
  const { tab = "Overview" } = Route.useSearch();
  const navigate = useNavigate();
  const query = useRow("assessment_campaigns", campaignId);
  const campaign = query.data;
  useRecordTitle("Assessment campaign", campaign?.title);
  const workspace = useWorkspace();
  // The campaign's latest draft results holding a finding, which its Actions menu publishes and
  // the Overview's Assessment results lists among the rest.
  const toPublish = useCampaignResultsToPublish(campaignId);
  const publishResults = usePublishResults();
  return (
    <Page>
      {/* The page is one failure region, and each of its tabs another: an outage reads as one
          alert where it happened, whose Retry reloads every failed read in it. */}
      <QueryState queries={[query]} region>
        {campaign ? (
          <>
            {/* The Actions menu's reads. On the Overview its Assessment results section reads the
                same two requests and says their failure in the tab's alert, so the page says it
                on the other tabs alone: one alert for one outage. */}
            {tab !== "Overview" && <ReportFailures queries={toPublish.queries} />}
            <PageHeader>
              <RecordTrail current={campaign.title}>
                <TrailLink to="/campaigns">Assessment campaigns</TrailLink>
                <TrailLink to="/programs/$programId" params={{ programId: campaign.program_id }}>
                  <RelationName table="programs" id={campaign.program_id} peek={false} />
                </TrailLink>
              </RecordTrail>
              <PageHeader.Heading>
                <PageHeader.Title>{campaign.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                {/* One Actions menu, as on the other records: the edit, Publish assessment results
                    (which stays in place and says why while there is nothing to publish), then
                    Inspect record. */}
                <RecordActions
                  table="assessment_campaigns"
                  id={campaign.id}
                  editLabel="Edit assessment campaign"
                  onEdit={() => setEditing(true)}
                >
                  {workspace.role !== "viewer" && (
                    <DropdownMenuItem
                      onClick={() => {
                        if (toPublish.results) void publishResults.ask(toPublish.results);
                      }}
                      {...(toPublish.waits ? { disabledReason: toPublish.waits } : {})}
                    >
                      Publish assessment results
                    </DropdownMenuItem>
                  )}
                </RecordActions>
              </PageHeader.Actions>
            </PageHeader>
            {editing && (
              <ProductRecordDialog
                table="assessment_campaigns"
                existing={campaign}
                onClose={() => setEditing(false)}
              />
            )}
            <AssessmentCampaign
              key={campaign.id}
              campaign={campaign}
              overview={
                // Overview beside the campaign's Details: the rail at its end where it fits, else
                // a closed disclosure above it whose row says the status. They leave with the tab.
                <AsideLayout
                  aside={
                    <Shell.Aside
                      label="Assessment campaign details"
                      summary={<StatusBadge statuses={campaignStatuses} value={campaign.status} />}
                    >
                      <Inspector.Group title="Details">
                        <KeyValue.Group>
                          <KeyValue label="Status">
                            <StatusBadge statuses={campaignStatuses} value={campaign.status} />
                          </KeyValue>
                          <KeyValue label="Owner">
                            <RelationName table="parties" id={campaign.owner_party_id} />
                          </KeyValue>
                          <KeyValue label="Starts">
                            <DateTime value={campaign.starts_at} format="date" />
                          </KeyValue>
                          <KeyValue label="Ends">
                            <DateTime value={campaign.ends_at} format="date" />
                          </KeyValue>
                        </KeyValue.Group>
                      </Inspector.Group>
                    </Shell.Aside>
                  }
                >
                  {/* What the campaign sets out to do, then what it found: its results revisions,
                      newest first, the draft the Actions menu publishes among them. */}
                  <Stack space="space.300">
                    <Section title="Description">
                      {campaign.description ? (
                        <Box className="max-w-layout-measure">
                          <Prose>{campaign.description}</Prose>
                        </Box>
                      ) : (
                        <Absent label="No description recorded" />
                      )}
                    </Section>
                    <CampaignResults campaignId={campaign.id} />
                  </Stack>
                </AsideLayout>
              }
              tab={tab}
              // The tab joins the address's other parameters, so each collection keeps the
              // question it asks there.
              onTab={(next) =>
                void navigate({
                  to: "/campaigns/$campaignId",
                  params: { campaignId },
                  search: (current) => ({ ...current, tab: next }),
                })
              }
            />
          </>
        ) : (
          <MissingRecord backTo="/campaigns" kind="Assessment campaign" />
        )}
      </QueryState>
      {publishResults.confirmation}
    </Page>
  );
}
