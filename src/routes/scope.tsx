import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Badge, Table, Id, Item, Tabs } from "@/ds/primitives";
import { PageHeader, Section, IndexPage } from "@/ds/patterns";
import { Shell } from "@/ds/shell";
import {
  decidedRevisions,
  pendingRevisions,
  resolveDraft,
  revisionTone,
  useControlSetVersion,
  type ControlSetRevision,
  type RevisionState,
} from "@/lib/control-set";
import { programs } from "@/lib/grc-data";
import { scopeById } from "@/lib/scopes";

export const Route = createFileRoute("/scope")({
  head: () => ({
    meta: [
      { title: "Control-set approvals — Equinox GRC" },
      {
        name: "description",
        content:
          "The approver's queue: control-set revisions awaiting the program manager, and the ones recently decided, across every program.",
      },
      { property: "og:title", content: "Control-set approvals — Equinox GRC" },
      {
        property: "og:description",
        content:
          "Program managers approve each scope's categorization, overlays and tailoring as a versioned control-set revision.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScopeApprovals,
});

const filters: (RevisionState | "All")[] = [
  "All",
  "Pending approval",
  "Approved",
  "Changes requested",
];

function ScopeApprovals() {
  const version = useControlSetVersion();
  const [tab, setTab] = useState<(typeof filters)[number]>("All");

  const all = useMemo(() => {
    const seen = new Set<string>();
    const out: ControlSetRevision[] = [];
    for (const r of [...pendingRevisions(), ...decidedRevisions()]) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
    return out;
  }, [version]);

  const rows = useMemo(
    () => (tab === "All" ? all : all.filter((r) => r.state === tab)),
    [all, tab],
  );

  return (
    <Shell>
      <IndexPage
        header={
          <PageHeader
            title="Control-set approvals"
            description="Engineers propose a scope's categorization, overlays and tailoring as a revision; the program manager approves it before it takes effect."
          />
        }
      >
        <Tabs
          items={filters.map((f) => ({
            key: f,
            label: f,
            active: tab === f,
            onSelect: () => setTab(f),
            trailing: (
              <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                {f === "All" ? all.length : all.filter((r) => r.state === f).length}
              </span>
            ),
          }))}
        />

        <Section
          title="Revisions"
          description="Nothing below the revision in force moves until the proposal is decided."
        >
          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Header className="w-[104px]">Program</Table.Header>
                <Table.Header className="w-[200px]">Scope</Table.Header>
                <Table.Header className="w-[52px]">Rev</Table.Header>
                <Table.Header className="w-[150px]">State</Table.Header>
                <Table.Header>Reason</Table.Header>
                <Table.Header className="w-[130px]">Author</Table.Header>
                <Table.Header className="w-[112px]">Submitted</Table.Header>
                <Table.Header className="w-[72px] text-right">Ctrls</Table.Header>
                <Table.Header className="w-[168px]">Decision</Table.Header>
                <Table.Header className="w-[76px] text-right">Action</Table.Header>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const program = programs.find((p) => p.id === r.program);
                const scope = scopeById.get(r.scope);
                return (
                  <Table.Row key={r.id}>
                    <Table.Cell className="w-[104px]">
                      <Id>{r.program}</Id>
                    </Table.Cell>
                    <Table.Cell className="w-[200px] truncate">{scope?.name ?? r.scope}</Table.Cell>
                    <Table.Cell className="w-[52px]">
                      <Id>v{r.number}</Id>
                    </Table.Cell>
                    <Table.Cell className="w-[150px]">
                      <Badge tone={revisionTone[r.state]}>{r.state}</Badge>
                    </Table.Cell>
                    <Table.Cell className="truncate" title={r.reason}>
                      {r.reason}
                    </Table.Cell>
                    <Table.Cell className="w-[130px] truncate">{r.author}</Table.Cell>
                    <Table.Cell className="tnum w-[112px]">{r.submitted ?? "—"}</Table.Cell>
                    <Table.Cell className="tnum w-[72px] text-right">
                      {resolveDraft(r).total}
                    </Table.Cell>
                    <Table.Cell className="w-[168px] truncate">
                      {r.decidedBy
                        ? `${r.decidedBy.replace(/\s*\(.*\)$/, "")} · ${r.decided}`
                        : "—"}
                    </Table.Cell>
                    <Table.Cell className="w-[76px] text-right">
                      {program && scope ? (
                        <Link
                          to="/programs/$programId/systems/$scopeId"
                          params={{ programId: r.program, scopeId: r.scope }}
                          search={{ tab: "Revisions" }}
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
          <Item.Group empty="No decision has carried a note yet.">
            {all
              .filter((r) => r.note)
              .map((r) => (
                <Item
                  key={r.id}
                  id={`${r.scope} v${r.number}`}
                  idWidth={120}
                  title={r.note}
                  meta={r.decidedBy ?? undefined}
                  trailing={r.decided ?? undefined}
                />
              ))}
          </Item.Group>
        </Section>
      </IndexPage>
    </Shell>
  );
}
