import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  Mono,
  PageHeader,
  Section,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
import { programs } from "@/lib/grc-data";
import { approvalTone, scopeApprovals, type ApprovalState } from "@/lib/tailoring";

export const Route = createFileRoute("/scope")({
  head: () => ({
    meta: [
      { title: "Scope approvals — Equinox GRC" },
      {
        name: "description",
        content:
          "Shared dashboard where program managers approve the tailored NIST SP 800-53 control scope and DoD overlays before engineering begins.",
      },
      { property: "og:title", content: "Scope approvals — Equinox GRC" },
      {
        property: "og:description",
        content:
          "Program managers review and approve tailored control baselines and CNSSI 1253 overlays per program.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScopeApprovals,
});

const filters: (ApprovalState | "All")[] = [
  "All",
  "Pending PM approval",
  "Approved",
  "Changes requested",
];

function ScopeApprovals() {
  const [tab, setTab] = useState<(typeof filters)[number]>("All");

  const rows = useMemo(
    () => (tab === "All" ? scopeApprovals : scopeApprovals.filter((a) => a.state === tab)),
    [tab],
  );

  return (
    <Shell>
      <div className="animate-slide-up space-y-4">
        <PageHeader
          title="Scope approvals"
          description="Systems security engineers submit the tailored baseline and overlays; the program manager approves the compliance scope before engineering commits to it."
        />

        <div className="flex items-center gap-4 border-b border-border">
          {filters.map((f) => {
            const count =
              f === "All"
                ? scopeApprovals.length
                : scopeApprovals.filter((a) => a.state === f).length;
            return (
              <button key={f} onClick={() => setTab(f)}>
                <span
                  className={
                    f === tab
                      ? "-mb-px inline-flex items-center gap-1.5 border-b-2 border-primary px-0.5 pb-2.5 pt-1 text-[13px] font-semibold text-primary"
                      : "-mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-0.5 pb-2.5 pt-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  {f}
                  <span className="tnum text-[12px] text-muted-foreground">{count}</span>
                </span>
              </button>
            );
          })}
        </div>

        <Section
          title="Awaiting decision"
          description="Engineering should not baseline controls until the scope is approved."
        >
          <Table className="table-fixed">
            <thead>
              <tr>
                <Th className="w-[104px]">Program</Th>
                <Th>System</Th>
                <Th className="w-[164px]">Scope state</Th>
                <Th className="w-[168px]">Submitted by</Th>
                <Th className="w-[112px]">Submitted</Th>
                <Th className="w-[76px] text-right">Ctrls</Th>
                <Th className="w-[76px] text-right">Ovl</Th>
                <Th className="w-[168px]">Decision</Th>
                <Th className="w-[92px] text-right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const program = programs.find((p) => p.id === a.programId);
                return (
                  <Tr key={a.programId}>
                    <Td className="w-[104px]">
                      <Mono>{a.programId}</Mono>
                    </Td>
                    <Td className="truncate font-medium">{program?.name ?? a.programId}</Td>
                    <Td className="w-[164px]">
                      <Badge tone={approvalTone[a.state]}>{a.state}</Badge>
                    </Td>
                    <Td className="w-[168px] truncate text-muted-foreground">{a.submittedBy}</Td>
                    <Td className="tnum w-[112px] text-muted-foreground">{a.submitted}</Td>
                    <Td className="tnum w-[76px] text-right text-muted-foreground">
                      {a.controlCount}
                    </Td>
                    <Td className="tnum w-[76px] text-right text-muted-foreground">
                      {a.overlayCount}
                    </Td>
                    <Td className="w-[168px] truncate text-muted-foreground">
                      {a.decidedBy ? `${a.decidedBy} · ${a.decided}` : "—"}
                    </Td>
                    <Td className="w-[92px] text-right">
                      <Link
                        to="/programs/$programId"
                        params={{ programId: a.programId }}
                        className="text-[13px] text-primary hover:underline"
                      >
                        Review
                      </Link>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </Section>

        <Section title="Decision notes">
          <ol className="pt-1">
            {scopeApprovals
              .filter((a) => a.note)
              .map((a) => (
                <li
                  key={a.programId}
                  className="flex gap-3 border-b border-border/70 py-2.5 last:border-0"
                >
                  <Mono className="w-[88px] shrink-0">{a.programId}</Mono>
                  <span className="min-w-0 flex-1 truncate text-[13px]">{a.note}</span>
                  <span className="shrink-0 text-[12px] text-muted-foreground">{a.decidedBy}</span>
                  <span className="tnum w-[104px] shrink-0 text-right text-[12px] text-muted-foreground">
                    {a.decided}
                  </span>
                </li>
              ))}
          </ol>
        </Section>

        <div className="flex justify-end">
          <Button variant="secondary">Export scope decisions</Button>
        </div>
      </div>
    </Shell>
  );
}
