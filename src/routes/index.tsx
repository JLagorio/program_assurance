import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Badge,
  Box,
  Button,
  Grid,
  Inline,
  PageHeader,
  Section,
  Stack,
  Table,
  TextLink,
} from "@ledger/design-system";
import { Download, Plus } from "lucide-react";
import { useRows } from "@/lib/models";
import { useWorkspace } from "@/components/app/workspace";
import { labelFor } from "@/lib/records";
import {
  downloadJson,
  QueryState,
  RelationName,
  StateBadge,
} from "@/components/prototype/record-tools";
import { EmptyState } from "@/components/prototype/work-common";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Portfolio — Equinox" }] }),
  component: Portfolio,
});
function Portfolio() {
  const workspace = useWorkspace();
  const programs = useRows("programs"),
    risks = useRows("risks"),
    riskVersions = useRows("risk_revisions"),
    findings = useRows("assessment_findings"),
    evidence = useRows("evidence_artifacts"),
    activity = useRows("activity_events"),
    baselines = useRows("scope_baselines");
  const metrics = [
    { label: "Programs", query: programs, value: programs.data?.length, note: "Recorded programs" },
    {
      label: "Open risks",
      query: risks,
      value: risks.data?.filter((row) => row.status !== "closed").length,
      note: "Includes accepted risks",
    },
    {
      label: "Unsatisfied findings",
      query: findings,
      value: findings.data?.filter((row) =>
        ["partially_satisfied", "other_than_satisfied"].includes(row.determination),
      ).length,
      note: "Recorded assessment determinations",
    },
    {
      label: "Evidence artifacts",
      query: evidence,
      value: evidence.data?.length,
      note: "Registered evidence identities",
    },
  ];
  const recentRisks = risks.data
    ?.slice()
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);
  const latest = (id: string) =>
    riskVersions.data
      ?.filter((row) => row.risk_id === id)
      .sort((a, b) => b.version_number - a.version_number)[0];
  return (
    <Stack className="animate-rise" space="space.300">
      <PageHeader>
        <PageHeader.Lead className="font-body text-subtle">Portfolio</PageHeader.Lead>
        <div className="min-w-0">
          <PageHeader.Title>Overview</PageHeader.Title>
        </div>
        <PageHeader.Actions>
          <Button
            variant="secondary"
            iconBefore={<Download />}
            disabled={!programs.data || !risks.data || !findings.data}
            onClick={() =>
              downloadJson("portfolio.json", {
                programs: programs.data,
                risks: risks.data,
                findings: findings.data,
              })
            }
          >
            Export recorded data
          </Button>
          {workspace.role !== "viewer" && (
            <Button variant="primary" iconBefore={<Plus />} render={<Link to="/programs/new" />}>
              Create program
            </Button>
          )}
        </PageHeader.Actions>
      </PageHeader>
      <Grid
        className="border-y border-default"
        templateColumns={{ base: "repeat(2,minmax(0,1fr))", md: "repeat(4,minmax(0,1fr))" }}
      >
        {metrics.map((metric) => (
          <Box
            key={metric.label}
            className="border-b border-default first:ps-0 md:border-b-0 md:border-r md:last:border-r-0"
            paddingInline="space.200"
            paddingBlock="space.150"
          >
            <p className="font-body-small text-subtle">{metric.label}</p>
            <p className="tabular-nums font-heading-small font-semibold pt-025">
              {metric.query.isError
                ? "Unavailable"
                : metric.value === undefined
                  ? "Loading…"
                  : metric.value.toLocaleString()}
            </p>
            <p className="font-body-small text-subtle pt-025">{metric.note}</p>
          </Box>
        ))}
      </Grid>
      <Grid gap="space.400" templateColumns={{ base: "minmax(0,1fr)", xl: "minmax(0,1fr) 320px" }}>
        <Stack space="space.300">
          <Section
            title="Risk posture"
            action={<TextLink render={<Link to="/risks" />}>Risk register</TextLink>}
          >
            <QueryState query={risks}>
              <QueryState query={riskVersions}>
                {recentRisks?.length ? (
                  <Table>
                    <thead>
                      <Table.Row>
                        <Table.Header>Risk</Table.Header>
                        <Table.Header>Program</Table.Header>
                        <Table.Header>Owner</Table.Header>
                        <Table.Header>Latest severity</Table.Header>
                        <Table.Header>Status</Table.Header>
                      </Table.Row>
                    </thead>
                    <tbody>
                      {recentRisks.map((row) => (
                        <Table.Row key={row.id}>
                          <Table.Cell>
                            <TextLink
                              render={<Link to="/risks/$riskId" params={{ riskId: row.id }} />}
                            >
                              {row.title}
                            </TextLink>
                          </Table.Cell>
                          <Table.Cell>
                            <RelationName table="programs" id={row.program_id} />
                          </Table.Cell>
                          <Table.Cell>
                            <RelationName table="parties" id={row.owner_party_id} />
                          </Table.Cell>
                          <Table.Cell>
                            <StateBadge value={latest(row.id)?.severity} />
                          </Table.Cell>
                          <Table.Cell>
                            <StateBadge value={row.status} />
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <EmptyState
                    illustration="records"
                    title="No risks recorded"
                    description="Risk assessments appear here when they are saved."
                  />
                )}
              </QueryState>
            </QueryState>
          </Section>
          <Section
            title="Programs"
            action={<TextLink render={<Link to="/programs" />}>All programs</TextLink>}
          >
            <QueryState query={programs}>
              {programs.data?.length ? (
                <Table>
                  <thead>
                    <Table.Row>
                      <Table.Header>Program</Table.Header>
                      <Table.Header>Name</Table.Header>
                      <Table.Header>Status</Table.Header>
                    </Table.Row>
                  </thead>
                  <tbody>
                    {programs.data.map((row) => (
                      <Table.Row key={row.id}>
                        <Table.Cell>{row.code}</Table.Cell>
                        <Table.Cell>
                          <TextLink
                            render={
                              <Link to="/programs/$programId" params={{ programId: row.id }} />
                            }
                          >
                            {row.name}
                          </TextLink>
                        </Table.Cell>
                        <Table.Cell>
                          <StateBadge value={row.status} />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-subtle py-200">
                  Create your first program to start building its assurance record.
                </p>
              )}
            </QueryState>
          </Section>
        </Stack>
        <Stack space="space.300">
          <Section title="Assurance activity">
            <QueryState query={activity}>
              {activity.data?.length ? (
                <Stack space="space.200">
                  {activity.data
                    .slice()
                    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
                    .slice(0, 10)
                    .map((row) => (
                      <Box key={row.id} className="border-b border-default pb-150">
                        <p className="font-medium">{labelFor(row.event_type)}</p>
                        {row.description && <p>{row.description}</p>}
                        <p className="font-body-small text-subtle">
                          {new Date(row.occurred_at).toLocaleString()}
                        </p>
                      </Box>
                    ))}
                </Stack>
              ) : (
                <p className="text-subtle">No activity events have been recorded.</p>
              )}
            </QueryState>
          </Section>
          <Section title="Reference and baseline coverage">
            <QueryState query={baselines}>
              <p>{baselines.data?.length} adopted scope baselines</p>
            </QueryState>
            <p className="text-subtle pt-100">
              Reference controls are available in the catalog. Assessment outcomes remain unrecorded
              until your work produces them.
            </p>
            <Inline space="space.150" className="pt-150" shouldWrap>
              <TextLink render={<Link to="/catalog" />}>Browse catalog</TextLink>
              <TextLink render={<Link to="/schema" />}>Inspect backend data</TextLink>
            </Inline>
          </Section>
        </Stack>
      </Grid>
    </Stack>
  );
}
