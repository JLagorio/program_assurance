import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download } from "lucide-react";

import {
  Badge,
  Box,
  Button,
  Dot,
  Grid,
  Id,
  Inline,
  Item,
  PageHeader,
  Progress,
  Section,
  Stack,
  Table,
  Timeline,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { activity, frameworks, riskStatusTone, risks } from "@/lib/grc-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — Equinox GRC" },
      {
        name: "description",
        content:
          "Program overview for Equinox: audit readiness, open risk posture, control health, and the live assurance stream in one dense workspace.",
      },
      { property: "og:title", content: "Overview — Equinox GRC" },
      {
        property: "og:description",
        content:
          "Audit readiness, open risk posture, control health, and the live assurance stream.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});

const summary = [
  {
    label: "Audit readiness",
    value: "92.4%",
    delta: "+1.8 pts",
    tone: "success" as const,
    note: "SOC 2 Type II",
  },
  { label: "Open risks", value: "24", delta: "+3", tone: "danger" as const, note: "4 critical" },
  {
    label: "Controls failing",
    value: "2",
    delta: "−1",
    tone: "success" as const,
    note: "of 118 monitored",
  },
  {
    label: "Evidence freshness",
    value: "97%",
    delta: "±0",
    tone: "neutral" as const,
    note: "1,402 artifacts",
  },
];

function Overview() {
  return (
    <Shell>
      <Stack className="animate-rise" space="space.300">
        <PageHeader
          eyebrow="Program"
          title="Overview"
          description="Continuous posture across four frameworks. Last full evaluation completed 12 minutes ago."
          actions={
            <>
              <Button variant="secondary">
                <Download className="size-icon-small" /> Export
              </Button>
              <Button variant="primary">Request evidence</Button>
            </>
          }
        />

        {/* Metric row — hairline rules only, no floating cards */}
        <Grid
          className="border-y border-default"
          templateColumns={{ base: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }}
        >
          {summary.map((item) => (
            <Box
              key={item.label}
              className="border-b border-default first:ps-0 md:border-b-0 md:border-r md:last:border-r-0"
              paddingInline="space.200"
              paddingBlock="space.150"
            >
              <div className="font-body-small text-subtle">{item.label}</div>
              <Inline className="pt-025" space="space.100" alignBlock="baseline">
                <span className="tabular-nums font-heading-small font-semibold">{item.value}</span>
                <span
                  className={
                    item.tone === "success"
                      ? "tabular-nums font-body-small font-medium text-success"
                      : item.tone === "danger"
                        ? "tabular-nums font-body-small font-medium text-danger"
                        : "tabular-nums font-body-small font-medium text-subtle"
                  }
                >
                  {item.delta}
                </span>
              </Inline>
              <Box className="font-body-small text-subtle" paddingBlockStart="space.025">
                {item.note}
              </Box>
            </Box>
          ))}
        </Grid>

        <Grid
          gap="space.400"
          templateColumns={{ base: "repeat(1, minmax(0, 1fr))", xl: "minmax(0,1fr) 320px" }}
        >
          <Stack space="space.300">
            <Section
              title="Highest residual risk"
              action={
                <Link to="/risks">
                  <Button variant="link">
                    Risk register <ArrowRight className="size-icon-small" />
                  </Button>
                </Link>
              }
            >
              <Table>
                <thead>
                  <tr>
                    <Table.Header width={88}>ID</Table.Header>
                    <Table.Header>Risk</Table.Header>
                    <Table.Header width={92}>Framework</Table.Header>
                    <Table.Header width={120}>Owner</Table.Header>
                    <Table.Header width={124}>Residual</Table.Header>
                    <Table.Header className="text-right" width={100}>
                      Status
                    </Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {risks.slice(0, 5).map((risk) => (
                    <Table.Row key={risk.id} className="group">
                      <Table.Cell>
                        <Id>{risk.id}</Id>
                      </Table.Cell>
                      <Table.Cell>
                        <Link
                          to="/risks/$riskId"
                          params={{ riskId: risk.id }}
                          className="font-medium text-default underline-offset-2 group-hover:text-brand group-hover:underline"
                        >
                          {risk.title}
                        </Link>
                      </Table.Cell>
                      <Table.Cell>{risk.framework}</Table.Cell>
                      <Table.Cell>{risk.owner}</Table.Cell>
                      <Table.Cell>
                        <Inline space="space.100" alignBlock="center">
                          <Progress
                            value={risk.residual}
                            tone={
                              risk.residual > 60
                                ? "danger"
                                : risk.residual > 30
                                  ? "warning"
                                  : "success"
                            }
                          />
                          <span className="tabular-nums shrink-0 text-right font-body-small text-subtle w-250">
                            {risk.residual}
                          </span>
                        </Inline>
                      </Table.Cell>
                      <Table.Cell className="text-right">
                        <Badge tone={riskStatusTone[risk.status]}>{risk.status}</Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
            </Section>

            <Section title="Framework coverage">
              <Table>
                <thead>
                  <tr>
                    <Table.Header>Framework</Table.Header>
                    <Table.Header width={180}>Coverage</Table.Header>
                    <Table.Header className="text-right" width={92}>
                      Controls
                    </Table.Header>
                    <Table.Header className="text-right" width={176}>
                      Window
                    </Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {frameworks.map((fw) => (
                    <Table.Row key={fw.name}>
                      <Table.Cell>{fw.name}</Table.Cell>
                      <Table.Cell>
                        <Inline space="space.100" alignBlock="center">
                          <Progress value={fw.coverage} tone={fw.tone} />
                          <span className="tabular-nums shrink-0 text-right font-body-small font-medium w-400">
                            {fw.coverage}%
                          </span>
                        </Inline>
                      </Table.Cell>
                      <Table.Cell className="tabular-nums text-right">{fw.controls}</Table.Cell>
                      <Table.Cell className="text-right">{fw.window}</Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
            </Section>
          </Stack>

          <Stack space="space.300">
            <Section title="Assurance stream" action={<Button variant="link">History</Button>}>
              <Timeline className="pt-100">
                {activity.map((item) => (
                  <Timeline.Item
                    key={item.title}
                    tone={item.tone}
                    title={item.title}
                    meta={item.actor}
                    time={item.time}
                  >
                    {item.body}
                  </Timeline.Item>
                ))}
              </Timeline>
            </Section>

            <Section title="Upcoming obligations">
              <Item.Group>
                {[
                  { label: "SOC 2 evidence cutoff", date: "Oct 31", tone: "warning" as const },
                  {
                    label: "ISO 27001 stage 2 audit",
                    date: "Nov 12",
                    tone: "information" as const,
                  },
                  { label: "Quarterly access review", date: "Sep 30", tone: "neutral" as const },
                ].map((row) => (
                  <Item
                    key={row.label}
                    leading={<Dot tone={row.tone} />}
                    title={row.label}
                    trailing={row.date}
                  />
                ))}
              </Item.Group>
            </Section>
          </Stack>
        </Grid>
      </Stack>
    </Shell>
  );
}
