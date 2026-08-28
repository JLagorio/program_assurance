import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, MoreHorizontal, Paperclip, Pencil } from "lucide-react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  Dot,
  Field,
  Input,
  KeyValue,
  RailGroup,
  Modal,
  Mono,
  Section,
  Select,
  Table,
  Td,
  Textarea,
  Th,
  Tr,
} from "@/components/app/ui";
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
        content: loaderData?.summary ?? "Risk detail, treatment plan, linked controls and evidence.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RiskDetail,
});

const timeline = [
  { tone: "danger" as const, title: "Escalated to critical", time: "Aug 27, 09:41", actor: "Linus Aarto" },
  { tone: "info" as const, title: "Evidence attached — scanner output", time: "Aug 26, 16:12", actor: "Continuous monitor" },
  { tone: "warning" as const, title: "Treatment plan revised", time: "Aug 20, 10:02", actor: "Sarah Chen" },
  { tone: "neutral" as const, title: "Risk opened from pentest finding", time: "Aug 12, 08:30", actor: "Whitcombe LLP" },
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
      <div className="animate-slide-up space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <Link
              to="/risks"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <h1 className="truncate text-[19px] font-semibold tracking-[-0.02em]">{risk.title}</h1>
            <Badge tone={riskStatusTone[risk.status]}>{risk.status}</Badge>
            <span className="flex min-w-0 items-center gap-2 text-[12.5px] text-muted-foreground">
              <Mono>{risk.id}</Mono>
              <span className="text-border">·</span>
              <span className="truncate">
                {risk.framework} {risk.control}
              </span>
              <span className="text-border">·</span>
              <span className="truncate">Owned by {risk.owner}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary">Reassign</Button>
            <Button variant="primary" onClick={() => setTreating(true)}>
              Add treatment
            </Button>
            <Button variant="secondary" className="w-8 px-0">
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 border-t border-border pt-5 xl:grid-cols-[minmax(0,1fr)_272px]">

          <div className="space-y-7">
            <Section title="Summary">
              <p className="pt-2.5 text-[13px] leading-relaxed">{risk.summary}</p>
            </Section>

            <Section
              title="Linked evidence"
              action={
                <Button variant="secondary" size="sm">
                  <Paperclip className="size-3.5" /> Attach
                </Button>
              }
            >
              <Table>
                <thead>
                  <tr>
                    <Th>File</Th>
                    <Th className="w-24">Size</Th>
                    <Th className="w-24 text-right">Added</Th>
                  </tr>
                </thead>
                <tbody>
                  {linkedEvidence.map((file) => (
                    <Tr key={file.name}>
                      <Td>
                        <Mono className="text-primary">{file.name}</Mono>
                      </Td>
                      <Td className="tnum text-muted-foreground">{file.size}</Td>
                      <Td className="text-right text-muted-foreground">{file.added}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Section>

            <Section title="Activity">
              <ol className="relative mt-3 space-y-4 border-l border-border pl-4">
                {timeline.map((event) => (
                  <li key={event.title} className="relative">
                    <span className="absolute -left-[21px] top-[6px] flex size-2.5 items-center justify-center rounded-full bg-card ring-1 ring-border">
                      <Dot tone={event.tone} />
                    </span>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13px] font-medium">{event.title}</span>
                      <span className="shrink-0 text-[12px] text-muted-foreground">{event.time}</span>
                    </div>
                    <div className="text-[12px] text-muted-foreground">{event.actor}</div>
                  </li>
                ))}
              </ol>
            </Section>
          </div>

          <aside className="xl:border-l xl:border-border xl:pl-6">
            <RailGroup
              title="Properties"
              action={
                <button className="text-muted-foreground transition-colors hover:text-foreground">
                  <Pencil className="size-3.5" />
                </button>
              }
            >
              <KeyValue label="Risk ID">
                <Mono>{risk.id}</Mono>
              </KeyValue>
              <KeyValue label="Owner">{risk.owner}</KeyValue>
              <KeyValue label="Team">{risk.team}</KeyValue>
              <KeyValue label="Treatment">{risk.treatment}</KeyValue>
              <KeyValue label="Framework">
                {risk.framework} · {risk.control}
              </KeyValue>
            </RailGroup>

            <RailGroup title="Dates">
              <KeyValue label="Opened">{risk.opened}</KeyValue>
              <KeyValue label="Target date">{risk.due}</KeyValue>
              <KeyValue label="Last updated">{risk.updated}</KeyValue>
            </RailGroup>

            <RailGroup title="Control coverage">
              <p className="text-[12.5px] leading-snug text-muted-foreground">
                Maps to one failing control. Closing it requires two consecutive passing runs.
              </p>
              <Link
                to="/controls"
                className="mt-1.5 inline-block text-[12.5px] text-primary hover:underline"
              >
                View {risk.control}
              </Link>
            </RailGroup>
          </aside>

        </div>
      </div>

      <Modal
        open={treating}
        onClose={() => setTreating(false)}
        title="Add treatment"
        description={`Recorded against ${risk.id}. Reviewers are notified immediately.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTreating(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setTreating(false)}>
              Add treatment
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <Field label="Action">
            <Select defaultValue="Mitigate">
              {["Mitigate", "Accept", "Transfer", "Avoid"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Plan" hint="Include the control change and how it will be verified.">
            <Textarea placeholder="Enforce tenant scoping in the export resolver and add a regression test." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Assignee">
              <Select defaultValue={risk.owner}>
                {["Sarah Chen", "Linus Aarto", "Marcus Ryde", "Priya Raghavan"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="Due date">
              <Input type="date" defaultValue="2026-03-31" />
            </Field>
          </div>
        </div>
      </Modal>
    </Shell>
  );
}
