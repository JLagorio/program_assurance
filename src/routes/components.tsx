import { createFileRoute } from "@tanstack/react-router";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Dot,
  FilterChip,
  IconButton,
  KeyValue,
  Meter,
  Mono,
  PageHeader,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
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

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <div className="flex flex-wrap items-center gap-3 px-4 py-4">{children}</div>
    </Card>
  );
}

function Components() {
  return (
    <Shell>
      <div className="space-y-5 animate-slide-up">
        <PageHeader
          eyebrow="System"
          title="Design system"
          description="Every surface in Equinox is built from these primitives. Hairline borders, one accent, tabular numerals."
        />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Section title="Buttons" description="Two weights of emphasis and a text link. Nothing else.">
            <Button variant="primary">Request evidence</Button>
            <Button variant="secondary">Export</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="danger">Delete</Button>
            <Button variant="link">View report</Button>
            <IconButton aria-label="More">
              <MoreHorizontal className="size-4" />
            </IconButton>
          </Section>

          <Section title="Status" description="Tone carries meaning; shape stays constant.">
            <Badge tone="success">Passing</Badge>
            <Badge tone="warning">Needs review</Badge>
            <Badge tone="danger">Failing</Badge>
            <Badge tone="info">Automated</Badge>
            <Badge tone="neutral">Accepted</Badge>
            <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Dot tone="success" /> Live check
            </span>
          </Section>

          <Section title="Filters" description="Dashed chips until a value is applied.">
            <FilterChip label="Framework" value="SOC 2" active />
            <FilterChip label="Owner" />
            <FilterChip label="Updated" />
          </Section>

          <Section title="Meters & numerals" description="Tabular figures so columns align on scan.">
            <div className="w-full space-y-3">
              {[
                { label: "SOC 2", value: 94, tone: "success" as const },
                { label: "ISO 27001", value: 81, tone: "info" as const },
                { label: "HIPAA", value: 62, tone: "warning" as const },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="w-24 text-[13px] text-muted-foreground">{row.label}</span>
                  <Meter value={row.value} tone={row.tone} />
                  <span className="tnum w-10 text-right text-[13px] font-medium">{row.value}%</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Card>
          <CardHeader title="Dense table" description="13px rows, 10px vertical rhythm, hairline dividers." />
          <Table>
            <thead>
              <tr>
                <Th className="w-[96px]">ID</Th>
                <Th>Item</Th>
                <Th className="w-[120px]">Owner</Th>
                <Th className="w-[104px] text-right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: "CTL-118", item: "Encryption in transit enforced", owner: "Marcus Ryde", tone: "success" as const, status: "Passing" },
                { id: "CTL-104", item: "Logical access provisioning", owner: "Grace Hoppel", tone: "danger" as const, status: "Failing" },
                { id: "CTL-092", item: "Security awareness training", owner: "Dana Whitlock", tone: "warning" as const, status: "Review" },
              ].map((row) => (
                <Tr key={row.id}>
                  <Td>
                    <Mono className="text-muted-foreground">{row.id}</Mono>
                  </Td>
                  <Td className="font-medium">{row.item}</Td>
                  <Td className="text-muted-foreground">{row.owner}</Td>
                  <Td className="text-right">
                    <Badge tone={row.tone}>{row.status}</Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card className="max-w-md p-4">
          <div className="text-[13px] font-semibold">Detail rail</div>
          <dl className="mt-2 divide-y divide-border/70">
            <KeyValue label="Risk ID">
              <Mono>RSK-2419</Mono>
            </KeyValue>
            <KeyValue label="Owner">Linus Aarto</KeyValue>
            <KeyValue label="Treatment">Mitigate</KeyValue>
            <KeyValue label="Target date">Sep 04, 2026</KeyValue>
          </dl>
        </Card>
      </div>
    </Shell>
  );
}
