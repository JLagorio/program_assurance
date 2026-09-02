import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Badge, Button, Table, Id, Item } from "@/ds/primitives";
import { PageHeader, Section, IndexPage } from "@/ds/patterns";
import { Shell } from "@/ds/shell";
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
      <IndexPage
        header={
          <PageHeader
            title="Scope approvals"
            description="Systems security engineers submit the tailored baseline and overlays; the program manager approves the compliance scope before engineering commits to it."
          />
        }
      >
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
                <Table.Header className="w-[104px]">Program</Table.Header>
                <Table.Header>System</Table.Header>
                <Table.Header className="w-[164px]">Scope state</Table.Header>
                <Table.Header className="w-[168px]">Submitted by</Table.Header>
                <Table.Header className="w-[112px]">Submitted</Table.Header>
                <Table.Header className="w-[76px] text-right">Ctrls</Table.Header>
                <Table.Header className="w-[76px] text-right">Ovl</Table.Header>
                <Table.Header className="w-[168px]">Decision</Table.Header>
                <Table.Header className="w-[92px] text-right">Action</Table.Header>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const program = programs.find((p) => p.id === a.programId);
                return (
                  <Table.Row key={a.programId}>
                    <Table.Cell className="w-[104px]">
                      <Id>{a.programId}</Id>
                    </Table.Cell>
                    <Table.Cell className="truncate">
                      {program ? (
                        program.name
                      ) : (
                        <span className="font-normal text-muted-foreground">
                          Not in your enclave
                        </span>
                      )}
                    </Table.Cell>
                    <Table.Cell className="w-[164px]">
                      <Badge tone={approvalTone[a.state]}>{a.state}</Badge>
                    </Table.Cell>
                    <Table.Cell className="w-[168px] truncate">{a.submittedBy}</Table.Cell>
                    <Table.Cell className="tnum w-[112px]">{a.submitted}</Table.Cell>
                    <Table.Cell className="tnum w-[76px] text-right">{a.controlCount}</Table.Cell>
                    <Table.Cell className="tnum w-[76px] text-right">{a.overlayCount}</Table.Cell>
                    <Table.Cell className="w-[168px] truncate">
                      {a.decidedBy ? `${a.decidedBy} · ${a.decided}` : "—"}
                    </Table.Cell>
                    <Table.Cell className="w-[92px] text-right">
                      {/* A program the viewer cannot open gets no Review link —
                          the same treatment inheritance and the component
                          library give an id outside the enclave. */}
                      {program ? (
                        <Link
                          to="/programs/$programId"
                          params={{ programId: a.programId }}
                          className="text-[13px] text-primary hover:underline"
                        >
                          Review
                        </Link>
                      ) : (
                        <span className="text-[13px] text-muted-foreground">—</span>
                      )}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </tbody>
          </Table>
        </Section>

        <Section title="Decision notes">
          <Item.Group>
            {scopeApprovals
              .filter((a) => a.note)
              .map((a) => (
                <Item
                  key={a.programId}
                  id={a.programId}
                  idWidth={88}
                  title={a.note}
                  meta={a.decidedBy}
                  trailing={a.decided}
                />
              ))}
          </Item.Group>
        </Section>

        <div className="flex justify-end">
          <Button variant="secondary">Export scope decisions</Button>
        </div>
      </IndexPage>
    </Shell>
  );
}
