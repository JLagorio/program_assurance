import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  KeyValue,
  Mono,
  RailGroup,
  RecordHeader,
  ShowPage,
  Section,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
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
            <RailGroup title="Workstream">
              <KeyValue label="Program">
                <Link
                  to="/programs/$programId"
                  params={{ programId: ws.program }}
                  className="text-primary hover:underline"
                >
                  <Mono>{ws.program}</Mono>
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
            </RailGroup>

            <RailGroup title="Disciplines">
              <div className="flex flex-wrap gap-1.5 py-1">
                {ws.disciplines.map((d) => (
                  <Badge key={d} tone="neutral">
                    {d}
                  </Badge>
                ))}
              </div>
            </RailGroup>

            <RailGroup title="Joins">
              <KeyValue label="Controls">
                <Mono>{ws.controls.join(", ")}</Mono>
              </KeyValue>
              <KeyValue label="CCIs">
                {ws.ccis.length ? <Mono>{ws.ccis.join(", ")}</Mono> : "—"}
              </KeyValue>
              <KeyValue label="Sibling streams">{workstreams.length}</KeyValue>
            </RailGroup>
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
                <Th>Person</Th>
                <Th>Name</Th>
                <Th>Role on this workstream</Th>
                <Th>Discipline</Th>
                <Th className="text-right">Allocation</Th>
              </tr>
            </thead>
            <tbody>
              {ws.members.map((m) => {
                const p = personById.get(m.person);
                return (
                  <Tr key={m.person}>
                    <Td>
                      <Link
                        to="/people/$personId"
                        params={{ personId: m.person }}
                        className="text-primary hover:underline"
                      >
                        <Mono>{m.person}</Mono>
                      </Link>
                    </Td>
                    <Td className="truncate font-medium">{p?.name ?? "—"}</Td>
                    <Td className="truncate text-muted-foreground">{m.role}</Td>
                    <Td className="truncate text-muted-foreground">{p?.discipline ?? "—"}</Td>
                    <Td className="tnum text-right text-muted-foreground">{m.allocation}%</Td>
                  </Tr>
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
                <Th>Direction</Th>
                <Th>Workstream</Th>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Lead</Th>
              </tr>
            </thead>
            <tbody>
              {[
                ...blockers.map((w) => ["Waiting on", w] as const),
                ...downstream.map((w) => ["Blocks", w] as const),
              ].map(([dir, w]) => (
                <Tr key={`${dir}-${w.id}`}>
                  <Td className="text-muted-foreground">{dir}</Td>
                  <Td>
                    <Link
                      to="/workstreams/$workstreamId"
                      params={{ workstreamId: w.id }}
                      className="text-primary hover:underline"
                    >
                      <Mono>{w.id}</Mono>
                    </Link>
                  </Td>
                  <Td className="truncate font-medium">{w.title}</Td>
                  <Td>
                    <Badge tone={workstreamStatusTone(w.status)}>{w.status}</Badge>
                  </Td>
                  <Td className="truncate text-muted-foreground">
                    {personById.get(w.lead)?.name ?? "—"}
                  </Td>
                </Tr>
              ))}
              {blockers.length === 0 && downstream.length === 0 ? (
                <Tr>
                  <Td className="text-muted-foreground" colSpan={5}>
                    No dependencies recorded.
                  </Td>
                </Tr>
              ) : null}
            </tbody>
          </Table>
        </Section>
      </ShowPage>
    </Shell>
  );
}
