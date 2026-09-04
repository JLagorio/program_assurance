import { createFileRoute } from "@tanstack/react-router";
import { Filter, Upload } from "lucide-react";

import evidenceIam from "@/assets/evidence-iam.png";
import evidenceDatacenter from "@/assets/evidence-datacenter.jpg";
import evidenceHeaders from "@/assets/evidence-headers.png";
import {
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Id,
  IndexPage,
  Inline,
  PageHeader,
  Table,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence vault — Equinox GRC" },
      {
        name: "description",
        content:
          "Collected artifacts sampled by auditors: screenshots, configuration exports, logs and attestations with freshness and control mapping.",
      },
      { property: "og:title", content: "Evidence vault — Equinox GRC" },
      {
        property: "og:description",
        content: "Artifacts with freshness, collector, and control mapping for auditor sampling.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Evidence,
});

const captures = [
  {
    src: evidenceIam,
    title: "IAM policy configuration",
    caption: "CC6.1 · captured 12 min ago",
    tone: "success" as const,
    state: "Fresh",
  },
  {
    src: evidenceDatacenter,
    title: "Facility access walkthrough",
    caption: "A.7.2 · captured Aug 18",
    tone: "warning" as const,
    state: "Aging",
  },
  {
    src: evidenceHeaders,
    title: "Security header response set",
    caption: "CC6.6 · captured 12 min ago",
    tone: "success" as const,
    state: "Fresh",
  },
];

const files = [
  {
    name: "iam_policy_export_2026-08-27.json",
    control: "CC6.1",
    collector: "Automated",
    size: "84 KB",
    added: "12 min ago",
    state: "Fresh" as const,
  },
  {
    name: "access_review_q3_signoff.pdf",
    control: "CC6.2",
    collector: "Dana Whitlock",
    size: "1.1 MB",
    added: "Aug 26",
    state: "Fresh" as const,
  },
  {
    name: "pentest_report_whitcombe.pdf",
    control: "CC4.1",
    collector: "Whitcombe LLP",
    size: "3.8 MB",
    added: "Aug 22",
    state: "Fresh" as const,
  },
  {
    name: "facility_badge_logs_useast2.csv",
    control: "A.7.2",
    collector: "Automated",
    size: "620 KB",
    added: "Aug 18",
    state: "Aging" as const,
  },
  {
    name: "training_completion_roster.xlsx",
    control: "A.6.3",
    collector: "Dana Whitlock",
    size: "212 KB",
    added: "Aug 15",
    state: "Aging" as const,
  },
  {
    name: "northwind_soc2_typeii_2025.pdf",
    control: "CC9.2",
    collector: "Vendor portal",
    size: "5.2 MB",
    added: "Jun 30",
    state: "Expired" as const,
  },
];

const stateTone = { Fresh: "success", Aging: "warning", Expired: "danger" } as const;

function Evidence() {
  return (
    <Shell>
      <IndexPage
        header={
          <PageHeader
            title="Evidence vault"
            description="1,402 artifacts mapped to controls. Auditors sample directly from this library — nothing is re-uploaded by hand."
            actions={
              <>
                <Button variant="secondary" iconBefore={<Filter />}>
                  Saved views
                </Button>
                <Button variant="primary" iconBefore={<Upload />}>
                  Upload artifact
                </Button>
              </>
            }
          />
        }
      >
        <Grid
          gap="space.200"
          templateColumns={{ base: "repeat(1, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" }}
        >
          {captures.map((cap) => (
            <Card key={cap.title} className="overflow-hidden">
              <div className="aspect-video overflow-hidden border-b border-default bg-surface-sunken">
                <img
                  src={cap.src}
                  alt={cap.title}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>
              <Inline
                className="px-150 py-100"
                space="space.150"
                alignBlock="start"
                spread="space-between"
              >
                <div className="min-w-0">
                  <div className="truncate font-body font-medium">{cap.title}</div>
                  <Box className="font-body-small text-subtle" paddingBlockStart="space.025">
                    {cap.caption}
                  </Box>
                </div>
                <Badge tone={cap.tone}>{cap.state}</Badge>
              </Inline>
            </Card>
          ))}
        </Grid>

        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Table.Header>Artifact</Table.Header>
                <Table.Header width={96}>Control</Table.Header>
                <Table.Header width={148}>Collected by</Table.Header>
                <Table.Header className="text-right" width={88}>
                  Size
                </Table.Header>
                <Table.Header width={112}>Added</Table.Header>
                <Table.Header className="text-right" width={96}>
                  Freshness
                </Table.Header>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <Table.Row key={file.name}>
                  <Table.Id id={file.name} />
                  <Table.Cell>
                    <Id>{file.control}</Id>
                  </Table.Cell>
                  <Table.Cell>{file.collector}</Table.Cell>
                  <Table.Cell className="tabular-nums text-right">{file.size}</Table.Cell>
                  <Table.Cell>{file.added}</Table.Cell>
                  <Table.Cell className="text-right">
                    <Badge tone={stateTone[file.state]}>{file.state}</Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Card>
      </IndexPage>
    </Shell>
  );
}
