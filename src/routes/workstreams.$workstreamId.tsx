import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import {
  Badge,
  Id,
  Inline,
  Inspector,
  KeyValue,
  Panel,
  RecordHeader,
  Section,
  Shell as DsShell,
  ShowPage,
  Table,
  TextLink,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import {
  dependentsOf,
  personById,
  workstreamById,
  workstreamStatusTone,
  workstreams,
} from "@/lib/people";

export const Route = createFileRoute("/workstreams/$workstreamId")({
  loader: ({ params }) => {
    const ws = workstreamById.get(params.workstreamId.toUpperCase());
    if (!ws) throw notFound();
    return ws;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Workstream"} — Equinox GRC` },
      {
        name: "description",
        content:
          loaderData?.objective ??
          "Program workstream: lead, disciplines, dependencies and the controls it satisfies.",
      },
      { property: "og:title", content: `${loaderData?.title ?? "Workstream"} — Equinox GRC` },
      {
        property: "og:description",
        content: loaderData?.objective ?? "Program workstream detail.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkstreamDetail,
});

function WorkstreamDetail() {
  const ws = Route.useLoaderData();
  const lead = personById.get(ws.lead);
  const blockers = ws.dependsOn
    .map((id) => workstreamById.get(id))
    .filter((w): w is NonNullable<typeof w> => !!w);
  const downstream = dependentsOf(ws.id);

  return (
    <Shell>
      <>
        <ShowPage
          header={
            <RecordHeader
              back={<Link to="/programs/$programId" params={{ programId: ws.program }} />}
              id={ws.id}
              title={ws.title}
              meta={`${ws.program} · ${ws.stage} · ${ws.gate} · due ${ws.due}`}
              actions={<Badge tone={workstreamStatusTone(ws.status)}>{ws.status}</Badge>}
            />
          }
          tabs={<div className="border-b border-default" />}
        >
          <Section title="Objective">
            <p className="max-w-layout-measure pt-150 font-body text-subtle">{ws.objective}</p>
            <p className="pt-150 max-w-layout-measure font-body-small">{ws.note}</p>
          </Section>

          <Section
            title="Assigned people"
            description="Allocation is the share of that person's time committed to this workstream."
          >
            <Table className="table-fixed">
              <thead>
                <tr>
                  <Table.Header width={104}>Person</Table.Header>
                  <Table.Header width={168}>Name</Table.Header>
                  <Table.Header>Role on this workstream</Table.Header>
                  <Table.Header width={148}>Discipline</Table.Header>
                  <Table.Header width={88} className="text-right">
                    Allocation
                  </Table.Header>
                </tr>
              </thead>
              <tbody>
                {ws.members.map((m) => {
                  const p = personById.get(m.person);
                  return (
                    <Table.Row key={m.person}>
                      <Table.Cell>
                        <TextLink>
                          <Link to="/people/$personId" params={{ personId: m.person }}>
                            <Id>{m.person}</Id>
                          </Link>
                        </TextLink>
                      </Table.Cell>
                      <Table.Cell className="truncate">{p?.name ?? "—"}</Table.Cell>
                      <Table.Cell className="truncate">{m.role}</Table.Cell>
                      <Table.Cell className="truncate">{p?.discipline ?? "—"}</Table.Cell>
                      <Table.Cell className="tabular-nums text-right">{m.allocation}%</Table.Cell>
                    </Table.Row>
                  );
                })}
              </tbody>
            </Table>
          </Section>

          <Section
            title="Dependencies"
            description="What this workstream is waiting on, and what is waiting on it."
          >
            <Table className="table-fixed">
              <thead>
                <tr>
                  <Table.Header width={108}>Direction</Table.Header>
                  <Table.Header width={104}>Workstream</Table.Header>
                  <Table.Header>Title</Table.Header>
                  <Table.Header width={96}>Status</Table.Header>
                  <Table.Header width={148}>Lead</Table.Header>
                </tr>
              </thead>
              <tbody>
                {[
                  ...blockers.map((w) => ["Waiting on", w] as const),
                  ...downstream.map((w) => ["Blocks", w] as const),
                ].map(([dir, w]) => (
                  <Table.Row key={`${dir}-${w.id}`}>
                    <Table.Cell>{dir}</Table.Cell>
                    <Table.Cell>
                      <TextLink>
                        <Link to="/workstreams/$workstreamId" params={{ workstreamId: w.id }}>
                          <Id>{w.id}</Id>
                        </Link>
                      </TextLink>
                    </Table.Cell>
                    <Table.Cell className="truncate">{w.title}</Table.Cell>
                    <Table.Cell>
                      <Badge tone={workstreamStatusTone(w.status)}>{w.status}</Badge>
                    </Table.Cell>
                    <Table.Cell className="truncate">
                      {personById.get(w.lead)?.name ?? "—"}
                    </Table.Cell>
                  </Table.Row>
                ))}
                {blockers.length === 0 && downstream.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={5}>No dependencies recorded.</Table.Cell>
                  </Table.Row>
                ) : null}
              </tbody>
            </Table>
          </Section>
        </ShowPage>
        <DsShell.Panel label="Details">
          <DsShell.Panel.Splitter label="Resize details" />
          <Panel flush>
            <Inspector.Group title="Workstream">
              <KeyValue label="Program">
                <TextLink>
                  <Link to="/programs/$programId" params={{ programId: ws.program }}>
                    <Id>{ws.program}</Id>
                  </Link>
                </TextLink>
              </KeyValue>
              <KeyValue label="Lead">
                {lead ? (
                  <TextLink>
                    <Link to="/people/$personId" params={{ personId: lead.id }}>
                      {lead.name}
                    </Link>
                  </TextLink>
                ) : (
                  "—"
                )}
              </KeyValue>
              <KeyValue label="Stage">{ws.stage}</KeyValue>
              <KeyValue label="Gate">{ws.gate}</KeyValue>
              <KeyValue label="Due">{ws.due}</KeyValue>
              <KeyValue label="Team size">{ws.members.length}</KeyValue>
            </Inspector.Group>

            <Inspector.Group title="Disciplines">
              <Inline className="py-050" space="space.075" shouldWrap>
                {ws.disciplines.map((d) => (
                  <Badge key={d} tone="neutral">
                    {d}
                  </Badge>
                ))}
              </Inline>
            </Inspector.Group>

            <Inspector.Group title="Joins">
              <KeyValue label="Controls">
                <Id>{ws.controls.join(", ")}</Id>
              </KeyValue>
              <KeyValue label="CCIs">
                {ws.ccis.length ? <Id>{ws.ccis.join(", ")}</Id> : "—"}
              </KeyValue>
              <KeyValue label="Sibling streams">{workstreams.length}</KeyValue>
            </Inspector.Group>
          </Panel>
        </DsShell.Panel>
      </>
    </Shell>
  );
}
