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
});
function CampaignDetail() {
  const { campaignId } = Route.useParams();
  const [editing, setEditing] = useState(false);
  const { tab = "Overview" } = Route.useSearch();
  const navigate = useNavigate();
  const query = useRow("assessment_campaigns", campaignId);
  const campaign = query.data;
  return (
    <Stack space="space.200" className="min-w-0">
      <QueryState queries={[query]}>
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
            {tab === "Overview" && (
              <Shell.Aside label="Assessment campaign details">
                <Inspector.Group title="Details">
                  <KeyValue.Group>
                    <KeyValue label="Status">
                      <StatusBadge statuses={campaignStatuses} value={campaign.status} />
                    </KeyValue>
                    <KeyValue label="Owner">
                      <RelationName table="parties" id={campaign.owner_party_id} />
                    </KeyValue>
                    <KeyValue label="Starts">
                      <DateTime
                        value={campaign.starts_at}
                        format="date"
                        absentLabel="Not recorded"
                      />
                    </KeyValue>
                    <KeyValue label="Ends">
                      <DateTime value={campaign.ends_at} format="date" absentLabel="Not recorded" />
                    </KeyValue>
                  </KeyValue.Group>
                </Inspector.Group>
              </Shell.Aside>
            )}
            <AssessmentCampaign
              key={campaign.id}
              campaign={campaign}
              overview={
                <Section title="Description">
                  {campaign.description ? (
                    <Box className="max-w-layout-measure">
                      <Prose>{campaign.description}</Prose>
                    </Box>
                  ) : (
                    <Absent label="No description recorded" />
                  )}
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
          <MissingRecord backTo="/campaigns" kind="Assessment campaign" />
        )}
      </QueryState>
    </Stack>
  );
}
