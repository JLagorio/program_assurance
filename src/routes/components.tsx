import { createFileRoute } from "@tanstack/react-router";

import {
  Badge,
  Button,
  Card,
  Dot,
  FilterChip,
  Grid,
  IconButton,
  Id,
  IndexPage,
  Inline,
  KeyValue,
  PageHeader,
  Progress,
  Stack,
  Table,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/components")({
  head: () => ({
    meta: [
      { title: "Design system — Equinox GRC" },
      {
        name: "description",
        content:
          "The primitives behind the Equinox interface: buttons, status badges, dense tables, filter chips, meters, and detail key-values.",
      },
      { property: "og:title", content: "Design system — Equinox GRC" },
      {
        property: "og:description",
        content: "Buttons, badges, dense tables, filter chips, meters and key-value rows.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Components,
});

function CardSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <Card.Header title={title} description={description} />
      <Inline className="px-200 py-200" space="space.150" alignBlock="center" shouldWrap>
        {children}
      </Inline>
    </Card>
  );
}

function Components() {
  return (
    <Shell>
      <IndexPage
        header={
          <PageHeader
            eyebrow="System"
            title="Design system"
            description="Every surface in Equinox is built from these primitives. Hairline borders, one accent, tabular numerals."
          />
        }
      >
        <Grid
          gap="space.250"
          templateColumns={{ base: "repeat(1, minmax(0, 1fr))", xl: "repeat(2, minmax(0, 1fr))" }}
        >
          <CardSection
            title="Buttons"
            description="Two weights of emphasis and a text link. Nothing else."
          >
            <Button variant="primary">Request evidence</Button>
            <Button variant="secondary">Export</Button>
            <Button variant="subtle">Cancel</Button>
            <Button variant="danger">Delete</Button>
            <Button variant="link">View report</Button>
            <IconButton label="More">
              <MoreHorizontal className="size-icon-medium" />
            </IconButton>
          </CardSection>

          <CardSection title="Status" description="Tone carries meaning; shape stays constant.">
            <Badge tone="success">Passing</Badge>
            <Badge tone="warning">Needs review</Badge>
            <Badge tone="danger">Failing</Badge>
            <Badge tone="information">Automated</Badge>
            <Badge tone="neutral">Accepted</Badge>
            <Inline
              className="font-body text-subtle"
              as="span"
              display="inline-flex"
              space="space.075"
              alignBlock="center"
            >
              <Dot tone="success" /> Live check
            </Inline>
          </CardSection>

          <CardSection title="Filters" description="Dashed chips until a value is applied.">
            <FilterChip label="Framework" value="SOC 2" isActive />
            <FilterChip label="Owner" />
            <FilterChip label="Updated" />
          </CardSection>

          <CardSection
            title="Meters & numerals"
            description="Tabular figures so columns align on scan."
          >
            <Stack className="w-full" space="space.150">
              {[
                { label: "SOC 2", value: 94, tone: "success" as const },
                { label: "ISO 27001", value: 81, tone: "information" as const },
                { label: "HIPAA", value: 62, tone: "warning" as const },
              ].map((row) => (
                <Inline key={row.label} space="space.150" alignBlock="center">
                  <span className="font-body text-subtle w-1000">{row.label}</span>
                  <Progress value={row.value} tone={row.tone} />
                  <span className="tabular-nums text-right font-body font-medium w-500">
                    {row.value}%
                  </span>
                </Inline>
              ))}
            </Stack>
          </CardSection>
        </Grid>

        <Card>
          <Card.Header
            title="Dense table"
            description="13px rows, 10px vertical rhythm, hairline dividers."
          />
          <Table>
            <thead>
              <tr>
                <Table.Header width={96}>ID</Table.Header>
                <Table.Header>Item</Table.Header>
                <Table.Header width={120}>Owner</Table.Header>
                <Table.Header className="text-right" width={104}>
                  Status
                </Table.Header>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  id: "CTL-118",
                  item: "Encryption in transit enforced",
                  owner: "Marcus Ryde",
                  tone: "success" as const,
                  status: "Passing",
                },
                {
                  id: "CTL-104",
                  item: "Logical access provisioning",
                  owner: "Grace Hoppel",
                  tone: "danger" as const,
                  status: "Failing",
                },
                {
                  id: "CTL-092",
                  item: "Security awareness training",
                  owner: "Dana Whitlock",
                  tone: "warning" as const,
                  status: "Review",
                },
              ].map((row) => (
                <Table.Row key={row.id}>
                  <Table.Cell>
                    <Id>{row.id}</Id>
                  </Table.Cell>
                  <Table.Cell>{row.item}</Table.Cell>
                  <Table.Cell>{row.owner}</Table.Cell>
                  <Table.Cell className="text-right">
                    <Badge tone={row.tone}>{row.status}</Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card className="max-w-layout-measure p-200">
          <div className="font-body font-semibold">Detail rail</div>
          <dl className="pt-100 divide-y">
            <KeyValue label="Risk ID">
              <Id>RSK-2419</Id>
            </KeyValue>
            <KeyValue label="Owner">Linus Aarto</KeyValue>
            <KeyValue label="Treatment">Mitigate</KeyValue>
            <KeyValue label="Target date">Sep 04, 2026</KeyValue>
          </dl>
        </Card>
      </IndexPage>
    </Shell>
  );
}
