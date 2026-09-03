import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, MoreHorizontal, Paperclip, Pencil } from "lucide-react";

import {
  Badge,
  Box,
  Button,
  DatePicker,
  Dialog,
  Field,
  Grid,
  Id,
  Inline,
  Input,
  Inspector,
  KeyValue,
  NativeSelect,
  Panel,
  Section,
  Shell as DsShell,
  Stack,
  Table,
  Textarea,
  TextLink,
  Timeline,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { riskStatusTone, risks } from "@/lib/grc-data";

export const Route = createFileRoute("/risks/$riskId")({
  loader: ({ params }) => {
    const risk = risks.find((r) => r.id.toLowerCase() === params.riskId.toLowerCase());
    if (!risk) throw notFound();
    return risk;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.id ?? "Risk"} — Equinox GRC` },
      {
        name: "description",
        content:
          loaderData?.summary ??
          "Risk detail with scoring, treatment plan, linked controls, evidence, and full activity history.",
      },
      { property: "og:title", content: `${loaderData?.id ?? "Risk"} — Equinox GRC` },
      {
        property: "og:description",
        content:
          loaderData?.summary ?? "Risk detail, treatment plan, linked controls and evidence.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RiskDetail,
});

const timeline = [
  {
    tone: "danger" as const,
    title: "Escalated to critical",
    time: "Aug 27, 09:41",
    actor: "Linus Aarto",
  },
  {
    tone: "information" as const,
    title: "Evidence attached — scanner output",
    time: "Aug 26, 16:12",
    actor: "Continuous monitor",
  },
  {
    tone: "warning" as const,
    title: "Treatment plan revised",
    time: "Aug 20, 10:02",
    actor: "Sarah Chen",
  },
  {
    tone: "neutral" as const,
    title: "Risk opened from pentest finding",
    time: "Aug 12, 08:30",
    actor: "Whitcombe LLP",
  },
];

const linkedEvidence = [
  { name: "burp_export_idor_v1.json", size: "412 KB", added: "Aug 26" },
  { name: "exports_authz_patch.diff", size: "8 KB", added: "Aug 24" },
  { name: "tenant_scope_test_run.log", size: "1.2 MB", added: "Aug 24" },
];

function RiskDetail() {
  const risk = Route.useLoaderData();
  const [treating, setTreating] = useState(false);

  return (
    <Shell>
      <Stack className="animate-rise" space="space.250">
        <Inline space="space.150" alignBlock="center" spread="space-between" shouldWrap>
          <Inline className="min-w-0" space="space.100" alignBlock="center" shouldWrap>
            <Link to="/risks" className="text-subtle transition-colors hover:text-default">
              <ChevronLeft className="size-icon-medium" />
            </Link>
            <h1 className="truncate font-heading-small font-semibold">{risk.title}</h1>
            <Badge tone={riskStatusTone[risk.status]}>{risk.status}</Badge>
            <Inline
              className="min-w-0 font-body-small text-subtle"
              as="span"
              space="space.100"
              alignBlock="center"
            >
              <Id>{risk.id}</Id>
              <span className="text-subtlest">·</span>
              <span className="truncate">
                {risk.framework} {risk.control}
              </span>
              <span className="text-subtlest">·</span>
              <span className="truncate">Owned by {risk.owner}</span>
            </Inline>
          </Inline>
          <Inline space="space.100" alignBlock="center">
            <Button variant="secondary">Reassign</Button>
            <Button variant="primary" onClick={() => setTreating(true)}>
              Add treatment
            </Button>
            <Button variant="secondary" className="px-0 w-400">
              <MoreHorizontal className="size-icon-medium" />
            </Button>
          </Inline>
        </Inline>

        <Box className="border-t border-default" paddingBlockStart="space.250">
          <Stack space="space.300">
            <Section title="Summary">
              <p className="pt-100 font-body">{risk.summary}</p>
            </Section>

            <Section
              title="Linked evidence"
              action={
                <Button variant="secondary" size="small">
                  <Paperclip className="size-icon-small" /> Attach
                </Button>
              }
            >
              <Table>
                <thead>
                  <tr>
                    <Table.Header>File</Table.Header>
                    <Table.Header className="w-1000">Size</Table.Header>
                    <Table.Header className="text-right w-1000">Added</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {linkedEvidence.map((file) => (
                    <Table.Row key={file.name}>
                      <Table.Id id={file.name} />
                      <Table.Cell className="tabular-nums">{file.size}</Table.Cell>
                      <Table.Cell className="text-right">{file.added}</Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
            </Section>

            <Section title="Activity">
              <Timeline className="pt-150">
                {timeline.map((event) => (
                  <Timeline.Item
                    key={event.title}
                    tone={event.tone}
                    title={event.title}
                    meta={event.actor}
                    time={event.time}
                  />
                ))}
              </Timeline>
            </Section>
          </Stack>
        </Box>
      </Stack>

      <DsShell.Panel label="Details">
        <DsShell.Panel.Splitter label="Resize details" />
        <Panel flush>
          <Inspector.Group
            title="Properties"
            action={
              <button className="text-subtle transition-colors hover:text-default">
                <Pencil className="size-icon-small" />
              </button>
            }
          >
            <KeyValue label="Risk ID">
              <Id>{risk.id}</Id>
            </KeyValue>
            <KeyValue label="Owner">{risk.owner}</KeyValue>
            <KeyValue label="Team">{risk.team}</KeyValue>
            <KeyValue label="Treatment">{risk.treatment}</KeyValue>
            <KeyValue label="Framework">
              {risk.framework} · {risk.control}
            </KeyValue>
          </Inspector.Group>

          <Inspector.Group title="Dates">
            <KeyValue label="Opened">{risk.opened}</KeyValue>
            <KeyValue label="Target date">{risk.due}</KeyValue>
            <KeyValue label="Last updated">{risk.updated}</KeyValue>
          </Inspector.Group>

          <Inspector.Group title="Control coverage">
            <p className="font-body-small text-subtle">
              Maps to one failing control. Closing it requires two consecutive passing runs.
            </p>
            <TextLink size="small" className="pt-075 inline-block">
              <Link to="/controls">View {risk.control}</Link>
            </TextLink>
          </Inspector.Group>
        </Panel>
      </DsShell.Panel>

      <Dialog
        open={treating}
        onClose={() => setTreating(false)}
        title="Add treatment"
        description={`Recorded against ${risk.id}. Reviewers are notified immediately.`}
        footer={
          <>
            <Button variant="subtle" onClick={() => setTreating(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setTreating(false)}>
              Add treatment
            </Button>
          </>
        }
      >
        <Stack space="space.150">
          <Field label="Action">
            <NativeSelect defaultValue="Mitigate">
              {["Mitigate", "Accept", "Transfer", "Avoid"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Plan" hint="Include the control change and how it will be verified.">
            <Textarea placeholder="Enforce tenant scoping in the export resolver and add a regression test." />
          </Field>
          <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
            <Field label="Assignee">
              <NativeSelect defaultValue={risk.owner}>
                {["Sarah Chen", "Linus Aarto", "Marcus Ryde", "Priya Raghavan"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Due date">
              <DatePicker defaultValue="2026-03-31" />
            </Field>
          </Grid>
        </Stack>
      </Dialog>
    </Shell>
  );
}
