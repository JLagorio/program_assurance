import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { Shell } from "@/components/app/shell";
import { Badge, KeyValue, RecordHeader, ShowPage, Section, Table, Id } from "@/components/app/ui";
import { Inspector } from "@/components/app/shapes";
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
      <ShowPage
        header={
          <RecordHeader
            backTo="/programs/$programId"
            backParams={{ programId: ws.program }}
            id={ws.id}
            title={ws.title}
            meta={`${ws.program} · ${ws.stage} · ${ws.gate} · due ${ws.due}`}
            actions={<Badge tone={workstreamStatusTone(ws.status)}>{ws.status}</Badge>}
          />
        }
        tabs={<div className="border-b border-border" />}
        showRail
        rail={
          <>
            <Inspector.Group title="Workstream">
              <KeyValue label="Program">
                <Link
                  to="/programs/$programId"
                  params={{ programId: ws.program }}
                  className="text-primary hover:underline"
                >
                  <Id>{ws.program}</Id>
                </Link>
              </KeyValue>
              <KeyValue label="Lead">
                {lead ? (
                  <Link
                    to="/people/$personId"
                    params={{ personId: lead.id }}
                    className="text-primary hover:underline"
                  >
                    {lead.name}
                  </Link>
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
              <div className="flex flex-wrap gap-1.5 py-1">
                {ws.disciplines.map((d) => (
                  <Badge key={d} tone="neutral">
                    {d}
                  </Badge>
                ))}
              </div>
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
          </>
        }
      >
        <Section title="Objective">
          <p className="max-w-3xl pt-3 text-[13px] leading-relaxed text-muted-foreground">
            {ws.objective}
          </p>
          <p className="mt-3 max-w-3xl text-[12.5px] leading-relaxed">{ws.note}</p>
        </Section>

        <Section
          title="Assigned people"
          description="Allocation is the share of that person's time committed to this workstream."
        >
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: "104px" }} />
              <col style={{ width: "168px" }} />
              <col />
              <col style={{ width: "148px" }} />
              <col style={{ width: "88px" }} />
            </colgroup>
            <thead>
              <tr>
                <Table.Header>Person</Table.Header>
                <Table.Header>Name</Table.Header>
                <Table.Header>Role on this workstream</Table.Header>
                <Table.Header>Discipline</Table.Header>
                <Table.Header className="text-right">Allocation</Table.Header>
              </tr>
            </thead>
            <tbody>
              {ws.members.map((m) => {
                const p = personById.get(m.person);
                return (
                  <Table.Row key={m.person}>
                    <Table.Cell>
                      <Link
                        to="/people/$personId"
                        params={{ personId: m.person }}
                        className="text-primary hover:underline"
                      >
                        <Id>{m.person}</Id>
                      </Link>
                    </Table.Cell>
                    <Table.Cell className="truncate">{p?.name ?? "—"}</Table.Cell>
                    <Table.Cell className="truncate">{m.role}</Table.Cell>
                    <Table.Cell className="truncate">{p?.discipline ?? "—"}</Table.Cell>
                    <Table.Cell className="tnum text-right">{m.allocation}%</Table.Cell>
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
            <colgroup>
              <col style={{ width: "108px" }} />
              <col style={{ width: "104px" }} />
              <col />
              <col style={{ width: "96px" }} />
              <col style={{ width: "148px" }} />
            </colgroup>
            <thead>
              <tr>
                <Table.Header>Direction</Table.Header>
                <Table.Header>Workstream</Table.Header>
                <Table.Header>Title</Table.Header>
                <Table.Header>Status</Table.Header>
                <Table.Header>Lead</Table.Header>
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
                    <Link
                      to="/workstreams/$workstreamId"
                      params={{ workstreamId: w.id }}
                      className="text-primary hover:underline"
                    >
                      <Id>{w.id}</Id>
                    </Link>
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
    </Shell>
  );
}
