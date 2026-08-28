import { createFileRoute } from "@tanstack/react-router";
import { Filter, Upload } from "lucide-react";

import evidenceIam from "@/assets/evidence-iam.png";
import evidenceDatacenter from "@/assets/evidence-datacenter.jpg";
import evidenceHeaders from "@/assets/evidence-headers.png";
import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  Card,
  Mono,
  PageHeader,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";

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
  { name: "iam_policy_export_2026-08-27.json", control: "CC6.1", collector: "Automated", size: "84 KB", added: "12 min ago", state: "Fresh" as const },
  { name: "access_review_q3_signoff.pdf", control: "CC6.2", collector: "Dana Whitlock", size: "1.1 MB", added: "Aug 26", state: "Fresh" as const },
  { name: "pentest_report_whitcombe.pdf", control: "CC4.1", collector: "Whitcombe LLP", size: "3.8 MB", added: "Aug 22", state: "Fresh" as const },
  { name: "facility_badge_logs_useast2.csv", control: "A.7.2", collector: "Automated", size: "620 KB", added: "Aug 18", state: "Aging" as const },
  { name: "training_completion_roster.xlsx", control: "A.6.3", collector: "Dana Whitlock", size: "212 KB", added: "Aug 15", state: "Aging" as const },
  { name: "northwind_soc2_typeii_2025.pdf", control: "CC9.2", collector: "Vendor portal", size: "5.2 MB", added: "Jun 30", state: "Expired" as const },
];

const stateTone = { Fresh: "success", Aging: "warning", Expired: "danger" } as const;

function Evidence() {
  return (
    <Shell>
      <div className="space-y-5 animate-slide-up">
        <PageHeader
          title="Evidence vault"
          description="1,402 artifacts mapped to controls. Auditors sample directly from this library — nothing is re-uploaded by hand."
          actions={
            <>
              <Button variant="secondary">
                <Filter className="size-3.5" /> Saved views
              </Button>
              <Button variant="primary">
                <Upload className="size-3.5" /> Upload artifact
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {captures.map((cap) => (
            <Card key={cap.title} className="overflow-hidden">
              <div className="aspect-[16/10] overflow-hidden border-b border-border bg-subtle">
                <img
                  src={cap.src}
                  alt={cap.title}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>
              <div className="flex items-start justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium">{cap.title}</div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground">{cap.caption}</div>
                </div>
                <Badge tone={cap.tone}>{cap.state}</Badge>
              </div>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th>Artifact</Th>
                <Th className="w-[96px]">Control</Th>
                <Th className="w-[148px]">Collected by</Th>
                <Th className="w-[88px] text-right">Size</Th>
                <Th className="w-[112px]">Added</Th>
                <Th className="w-[96px] text-right">Freshness</Th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <Tr key={file.name}>
                  <Td>
                    <Mono className="text-primary">{file.name}</Mono>
                  </Td>
                  <Td>
                    <Mono className="text-muted-foreground">{file.control}</Mono>
                  </Td>
                  <Td className="text-muted-foreground">{file.collector}</Td>
                  <Td className="tnum text-right text-muted-foreground">{file.size}</Td>
                  <Td className="text-[12px] text-muted-foreground">{file.added}</Td>
                  <Td className="text-right">
                    <Badge tone={stateTone[file.state]}>{file.state}</Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </Shell>
  );
}
