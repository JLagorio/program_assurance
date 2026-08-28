import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download } from "lucide-react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  Dot,
  Meter,
  Mono,
  PageHeader,
  Section,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
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
  { label: "Audit readiness", value: "92.4%", delta: "+1.8 pts", tone: "success" as const, note: "SOC 2 Type II" },
  { label: "Open risks", value: "24", delta: "+3", tone: "danger" as const, note: "4 critical" },
  { label: "Controls failing", value: "2", delta: "−1", tone: "success" as const, note: "of 118 monitored" },
  { label: "Evidence freshness", value: "97%", delta: "±0", tone: "neutral" as const, note: "1,402 artifacts" },
];

function Overview() {
  return (
    <Shell>
      <div className="animate-slide-up space-y-7">
        <PageHeader
          eyebrow="Program"
          title="Overview"
          description="Continuous posture across four frameworks. Last full evaluation completed 12 minutes ago."
          actions={
            <>
              <Button variant="secondary">
                <Download className="size-3.5" /> Export
              </Button>
              <Button variant="primary">Request evidence</Button>
            </>
          }
        />

        {/* Metric row — hairline rules only, no floating cards */}
        <div className="grid grid-cols-2 border-y border-border md:grid-cols-4">
          {summary.map((item) => (
            <div
              key={item.label}
              className="border-b border-border px-4 py-3 first:pl-0 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <div className="text-[12px] text-muted-foreground">{item.label}</div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="tnum text-[20px] font-semibold tracking-[-0.02em]">
                  {item.value}
                </span>
                <span
                  className={
                    item.tone === "success"
                      ? "tnum text-[12px] font-medium text-success"
                      : item.tone === "danger"
                        ? "tnum text-[12px] font-medium text-danger"
                        : "tnum text-[12px] font-medium text-muted-foreground"
                  }
                >
                  {item.delta}
                </span>
              </div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">{item.note}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-7">
            <Section
              title="Highest residual risk"
              action={
                <Link to="/risks">
                  <Button variant="link">
                    Risk register <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              }
            >
              <Table>
                <thead>
                  <tr>
                    <Th className="w-[88px]">ID</Th>
                    <Th>Risk</Th>
                    <Th className="w-[92px]">Framework</Th>
                    <Th className="w-[120px]">Owner</Th>
                    <Th className="w-[124px]">Residual</Th>
                    <Th className="w-[100px] text-right">Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {risks.slice(0, 5).map((risk) => (
                    <Tr key={risk.id} className="group">
                      <Td>
                        <Mono className="text-muted-foreground">{risk.id}</Mono>
                      </Td>
                      <Td>
                        <Link
                          to="/risks/$riskId"
                          params={{ riskId: risk.id }}
                          className="font-medium text-foreground underline-offset-2 group-hover:text-primary group-hover:underline"
                        >
                          {risk.title}
                        </Link>
                      </Td>
                      <Td className="text-muted-foreground">{risk.framework}</Td>
                      <Td className="text-muted-foreground">{risk.owner}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Meter
                            value={risk.residual}
                            tone={risk.residual > 60 ? "danger" : risk.residual > 30 ? "warning" : "success"}
                          />
                          <span className="tnum w-5 shrink-0 text-right text-[12px] text-muted-foreground">
                            {risk.residual}
                          </span>
                        </div>
                      </Td>
                      <Td className="text-right">
                        <Badge tone={riskStatusTone[risk.status]}>{risk.status}</Badge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Section>

            <Section title="Framework coverage">
              <Table>
                <thead>
                  <tr>
                    <Th>Framework</Th>
                    <Th className="w-[180px]">Coverage</Th>
                    <Th className="w-[92px] text-right">Controls</Th>
                    <Th className="w-[176px] text-right">Window</Th>
                  </tr>
                </thead>
                <tbody>
                  {frameworks.map((fw) => (
                    <Tr key={fw.name}>
                      <Td className="font-medium">{fw.name}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Meter value={fw.coverage} tone={fw.tone} />
                          <span className="tnum w-8 shrink-0 text-right text-[12px] font-medium">
                            {fw.coverage}%
                          </span>
                        </div>
                      </Td>
                      <Td className="tnum text-right text-muted-foreground">{fw.controls}</Td>
                      <Td className="text-right text-[12px] text-muted-foreground">{fw.window}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Section>
          </div>

          <div className="space-y-7">
            <Section title="Assurance stream" action={<Button variant="link">History</Button>}>
              <ol className="divide-y divide-border">
                {activity.map((item) => (
                  <li key={item.title} className="flex gap-2.5 py-2.5">
                    <span className="mt-[7px]">
                      <Dot tone={item.tone} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[13px] font-medium">{item.title}</span>
                        <Mono className="shrink-0 text-muted-foreground">{item.time}</Mono>
                      </div>
                      <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                        {item.body}
                      </p>
                      <div className="mt-0.5 text-[12px] text-muted-foreground/80">{item.actor}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>

            <Section title="Upcoming obligations">
              <ul className="divide-y divide-border">
                {[
                  { label: "SOC 2 evidence cutoff", date: "Oct 31", tone: "warning" as const },
                  { label: "ISO 27001 stage 2 audit", date: "Nov 12", tone: "info" as const },
                  { label: "Quarterly access review", date: "Sep 30", tone: "neutral" as const },
                ].map((row) => (
                  <li key={row.label} className="flex h-9 items-center gap-2 text-[13px]">
                    <Dot tone={row.tone} />
                    <span className="truncate">{row.label}</span>
                    <span className="tnum ml-auto shrink-0 text-[12px] text-muted-foreground">
                      {row.date}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>
      </div>
    </Shell>
  );
}
