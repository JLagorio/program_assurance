import { useState } from "react";
import { ProductRecordDialog } from "@/components/prototype/product-record-dialog";
import { MissingRecord, QueryState, RecordActions } from "@/components/prototype/work-common";
import { campaignTabs, type CampaignTab } from "@/components/prototype/assessment-tabs";
import {
  Absent,
  Box,
  DateTime,
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
import { RecordTrail, TrailLink } from "@/components/prototype/record-trail";
import { RelationName } from "@/components/prototype/record-tools";
import { useRecordTitle } from "@/components/app/browser-title";
import { Page, RecordPending } from "@/components/app/shell";
import { StatusBadge } from "@/components/app/status";
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
  return (
    <Page>
      {/* The page is one failure region, and each of its tabs another: an outage reads as one
          alert where it happened, whose Retry reloads every failed read in it. */}
      <QueryState queries={[query]} region>
        {campaign ? (
          <>
            <PageHeader>
              <RecordTrail current={campaign.title}>
                <TrailLink to="/campaigns">Assessment campaigns</TrailLink>
                <TrailLink to="/programs/$programId" params={{ programId: campaign.program_id }}>
                  <RelationName table="programs" id={campaign.program_id} />
                </TrailLink>
              </RecordTrail>
              <PageHeader.Heading>
                <PageHeader.Title>{campaign.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                {/* One Actions menu, as on the other records: the edit, then Inspect record. */}
                <RecordActions
                  table="assessment_campaigns"
                  id={campaign.id}
                  editLabel="Edit assessment campaign"
                  onEdit={() => setEditing(true)}
                />
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
                <Stack space="space.250" className="min-w-0">
                  {/* The Details, first in Overview: the rail beside it, or on a phone a closed
                      disclosure under the tabs whose row says the status. Overview's panel is
                      drawn only while it is chosen, so the rail never stands beside another tab. */}
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
                  <Section title="Description">
                    {campaign.description ? (
                      <Box className="max-w-layout-measure">
                        <Prose>{campaign.description}</Prose>
                      </Box>
                    ) : (
                      <Absent label="No description recorded" />
                    )}
                  </Section>
                </Stack>
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
    </Page>
  );
}
