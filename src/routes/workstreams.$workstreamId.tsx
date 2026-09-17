import { MissingRecord } from "@/components/prototype/work-common";
import { Box } from "@ledger/design-system";
import { displayDate } from "@/components/prototype/work-format";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Absent,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Inspector,
  PageHeader,
  Section,
  Shell,
  Stack,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia,
  EmptyIllustration,
} from "@ledger/design-system";
import { useRow } from "@/lib/models";
import type { DataRecord } from "@/lib/records";
import { useWorkspace } from "@/components/app/workspace";
import { WorkTable } from "@/components/prototype/work-table";
import {
  DetailFacts,
  ModelForm,
  QueryState,
  SchemaLink,
  StatusBadge,
} from "@/components/prototype/work-common";

export const Route = createFileRoute("/workstreams/$workstreamId")({
  component: WorkstreamRoute,
  head: () => ({ meta: [{ title: "Workstream — Program Assurance" }] }),
});
function WorkstreamRoute() {
  const { workstreamId } = Route.useParams();
  return <WorkstreamDetail key={workstreamId} workstreamId={workstreamId} />;
}
function WorkstreamDetail({ workstreamId }: { workstreamId: string }) {
  const workspace = useWorkspace();
  const query = useRow("workstreams", workstreamId);
  const row = query.data;
  const program = useRow("programs", row?.program_id);
  const owner = useRow("parties", row?.owner_party_id);
  const [editing, setEditing] = useState<DataRecord | null>(null);
  return (
    <Stack space="space.200" className="min-w-0">
      {editing && (
        <ModelForm
          target={{ table: "workstreams", existing: editing }}
          onClose={() => setEditing(null)}
        />
      )}
      <QueryState queries={[query]}>
        {row ? (
          <>
            <PageHeader>
              <PageHeader.Lead render={<Breadcrumb />}>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to="/programs" />}>Programs</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      render={
                        <Link to="/programs/$programId" params={{ programId: row.program_id }} />
                      }
                    >
                      {program.data?.name ?? "Program"}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{row.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </PageHeader.Lead>
              <PageHeader.Heading>
                <PageHeader.Title>{row.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                {workspace.role !== "viewer" && (
                  <Button
                    variant="primary"
                    disabled={!!editing}
                    onClick={() => setEditing(row as DataRecord)}
                  >
                    Edit workstream
                  </Button>
                )}
              </PageHeader.Actions>
            </PageHeader>
            <Box className="border-b border-default" />
            <Stack space="space.300" className="min-w-0 pt-200">
              <Section title="Objective">
                <p className="max-w-layout-measure whitespace-pre-wrap pt-150 text-subtle">
                  {row.description || <Absent />}
                </p>
              </Section>
              <Section title="Tasks">
                <WorkTable programId={row.program_id} workstreamId={row.id} fill />
              </Section>
            </Stack>
            <Shell.Aside label="Workstream properties">
              <Inspector.Group title="Details">
                <DetailFacts
                  facts={[
                    [
                      "Lead",
                      row.owner_party_id
                        ? owner.isError
                          ? "Unavailable person"
                          : (owner.data?.name ?? "Loading…")
                        : null,
                    ],
                    ["Status", <StatusBadge value={row.status} />],
                    ["Starts", row.starts_on ? displayDate(row.starts_on) : null],
                    ["Ends", row.ends_on ? displayDate(row.ends_on) : null],
                  ]}
                />
                <Box className="pt-200">
                  <SchemaLink table="workstreams" id={row.id} />
                </Box>
              </Inspector.Group>
            </Shell.Aside>
          </>
        ) : (
          <MissingRecord backTo="/programs" kind="Workstream" />
        )}
      </QueryState>
    </Stack>
  );
}
