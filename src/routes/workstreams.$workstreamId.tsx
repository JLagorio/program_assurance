import { useRecordTitle } from "@/components/app/browser-title";
import { Page, RecordPending } from "@/components/app/shell";
import { StatusBadge } from "@/components/app/status";
import { RelationName } from "@/components/prototype/record-tools";
import { RecordTrail, TrailLink } from "@/components/prototype/record-trail";
import { WorkTable } from "@/components/prototype/work-table";
import {
  DetailFacts,
  MissingRecord,
  ModelForm,
  QueryState,
  RecordActions,
} from "@/components/prototype/work-common";
import { useRow } from "@/lib/models";
import type { DataRecord } from "@/lib/records";
import { workstreamStatuses } from "@/lib/status";
import {
  Absent,
  AsideLayout,
  Box,
  DateTime,
  Inspector,
  PageHeader,
  Prose,
  Section,
  Shell,
  Stack,
} from "@ledger/design-system";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/workstreams/$workstreamId")({
  component: WorkstreamRoute,
  head: () => ({ meta: [{ title: "Workstream — Program Assurance" }] }),
  pendingComponent: RecordPending,
});
function WorkstreamRoute() {
  const { workstreamId } = Route.useParams();
  return <WorkstreamDetail key={workstreamId} workstreamId={workstreamId} />;
}
function WorkstreamDetail({ workstreamId }: { workstreamId: string }) {
  const query = useRow("workstreams", workstreamId);
  const row = query.data;
  useRecordTitle("Workstream", row?.title);
  const program = useRow("programs", row?.program_id);
  const [editing, setEditing] = useState<DataRecord | null>(null);
  return (
    <Page>
      {editing && (
        <ModelForm
          target={{ table: "workstreams", existing: editing }}
          onClose={() => setEditing(null)}
        />
      )}
      <QueryState queries={[query]} region>
        {row ? (
          <>
            <PageHeader>
              <RecordTrail current={row.title}>
                <TrailLink to="/programs">Programs</TrailLink>
                <TrailLink to="/programs/$programId" params={{ programId: row.program_id }}>
                  {/* The program as every program page names it; loading and failure as RelationName says them. */}
                  {program.data ? (
                    `${program.data.code} · ${program.data.name}`
                  ) : (
                    <RelationName table="programs" id={row.program_id} peek={false} />
                  )}
                </TrailLink>
              </RecordTrail>
              <PageHeader.Heading>
                <PageHeader.Title>{row.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <RecordActions
                  table="workstreams"
                  id={row.id}
                  onEdit={() => setEditing(row as DataRecord)}
                />
              </PageHeader.Actions>
            </PageHeader>
            {/* The body beside the workstream's Details: the rail at its end where it fits, else
                a closed disclosure above it whose row says the status. */}
            <AsideLayout
              aside={
                <Shell.Aside
                  label="Workstream details"
                  summary={<StatusBadge statuses={workstreamStatuses} value={row.status} />}
                >
                  <Inspector.Group title="Details">
                    <DetailFacts
                      facts={[
                        [
                          "Status",
                          <StatusBadge statuses={workstreamStatuses} value={row.status} />,
                        ],
                        [
                          "Owner",
                          row.owner_party_id ? (
                            <RelationName table="parties" id={row.owner_party_id} />
                          ) : null,
                        ],
                        ["Starts", row.starts_on ? <DateTime value={row.starts_on} /> : null],
                        ["Ends", row.ends_on ? <DateTime value={row.ends_on} /> : null],
                      ]}
                    />
                  </Inspector.Group>
                </Shell.Aside>
              }
            >
              <Stack space="space.300" className="min-w-0">
                <Section title="Objective">
                  {row.description ? (
                    <Box className="max-w-layout-measure">
                      <Prose>{row.description}</Prose>
                    </Box>
                  ) : (
                    <Absent label="No objective recorded" />
                  )}
                </Section>
                <Section title="Tasks">
                  <WorkTable programId={row.program_id} workstreamId={row.id} />
                </Section>
              </Stack>
            </AsideLayout>
          </>
        ) : (
          <MissingRecord backTo="/programs" kind="Workstream" />
        )}
      </QueryState>
    </Page>
  );
}
