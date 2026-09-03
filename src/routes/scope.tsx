import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { RevisionActions, RevisionReview } from "@/components/app/control-set-revisions";
import {
  Badge,
  Button,
  Id,
  IndexPage,
  Inline,
  Item,
  PageHeader,
  Section,
  Sheet,
  Stack,
  Table,
  Tabs,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import {
  decidedRevisions,
  openStates,
  pendingRevisions,
  resolveDraft,
  revisionById,
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
  const [reviewing, setReviewing] = useState<string | null>(null);

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

  // Re-read on every store change so the sheet shows the state an action just produced.
  const reviewed = reviewing ? revisionById(reviewing) : null;
  const reviewedScope = reviewed ? scopeById.get(reviewed.scope) : null;

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
        <Tabs>
          {filters.map((f) => (
            <Tabs.Tab
              key={f}
              isSelected={tab === f}
              onClick={() => setTab(f)}
              count={f === "All" ? all.length : all.filter((r) => r.state === f).length}
            >
              {f}
            </Tabs.Tab>
          ))}
        </Tabs>

        <Section
          title="Revisions"
          description="Review opens the proposal here; decide it without leaving the queue."
        >
          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Header width={104}>Program</Table.Header>
                <Table.Header width={200}>Scope</Table.Header>
                <Table.Header width={52}>Rev</Table.Header>
                <Table.Header width={150}>State</Table.Header>
                <Table.Header>Reason</Table.Header>
                <Table.Header width={130}>Author</Table.Header>
                <Table.Header width={112}>Submitted</Table.Header>
                <Table.Header className="text-right" width={72}>
                  Ctrls
                </Table.Header>
                <Table.Header width={168}>Decision</Table.Header>
                <Table.Header className="text-right" width={88}>
                  Action
                </Table.Header>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const program = programs.find((p) => p.id === r.program);
                const scope = scopeById.get(r.scope);
                return (
                  <Table.Row key={r.id}>
                    <Table.Cell width={104}>
                      {program ? (
                        <Link
                          to="/programs/$programId"
                          params={{ programId: r.program }}
                          search={{ tab: "Systems" }}
                          className="hover:underline"
                        >
                          <Id className="text-brand">{r.program}</Id>
                        </Link>
                      ) : (
                        <Id>{r.program}</Id>
                      )}
                    </Table.Cell>
                    <Table.Cell className="truncate" width={200}>
                      {program && scope ? (
                        <Link
                          to="/programs/$programId/components/$componentId"
                          params={{ programId: r.program, componentId: scope.element }}
                          search={{ tab: "Control set" }}
                          className="text-brand hover:underline"
                        >
                          {scope.name}
                        </Link>
                      ) : (
                        (scope?.name ?? r.scope)
                      )}
                    </Table.Cell>
                    <Table.Cell width={52}>
                      <Id>v{r.number}</Id>
                    </Table.Cell>
                    <Table.Cell width={150}>
                      <Badge tone={revisionTone[r.state]}>{r.state}</Badge>
                    </Table.Cell>
                    <Table.Cell className="truncate" title={r.reason}>
                      {r.reason}
                    </Table.Cell>
                    <Table.Cell className="truncate" width={130}>
                      {r.author}
                    </Table.Cell>
                    <Table.Cell className="tabular-nums" width={112}>
                      {r.submitted ?? "—"}
                    </Table.Cell>
                    <Table.Cell className="tabular-nums text-right" width={72}>
                      {resolveDraft(r).total}
                    </Table.Cell>
                    <Table.Cell className="truncate" width={168}>
                      {r.decidedBy
                        ? `${r.decidedBy.replace(/\s*\(.*\)$/, "")} · ${r.decided}`
                        : "—"}
                    </Table.Cell>
                    <Table.Cell className="text-right" width={88}>
                      <Button size="small" variant="secondary" onClick={() => setReviewing(r.id)}>
                        {openStates.includes(r.state) ? "Review" : "Open"}
                      </Button>
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

      <Sheet
        open={!!reviewed}
        onClose={() => setReviewing(null)}
        width={780}
        title={reviewed ? `${reviewedScope?.name ?? reviewed.scope} · v${reviewed.number}` : ""}
        subtitle={reviewed ? `${reviewed.program} · ${reviewed.state}` : undefined}
        footer={
          reviewed ? (
            <Inline className="w-full" space="space.150" alignBlock="center" spread="space-between">
              {reviewedScope ? (
                <Link
                  to="/programs/$programId/components/$componentId"
                  params={{ programId: reviewed.program, componentId: reviewedScope.element }}
                  search={{ tab: "Control set" }}
                  className="font-body-small text-brand hover:underline"
                >
                  Open the record
                </Link>
              ) : (
                <span />
              )}
              <RevisionActions revision={reviewed} />
            </Inline>
          ) : null
        }
      >
        {reviewed ? (
          <Stack space="space.050">
            <RevisionReview revision={reviewed} programId={reviewed.program} compact />
          </Stack>
        ) : null}
      </Sheet>
    </Shell>
  );
}
