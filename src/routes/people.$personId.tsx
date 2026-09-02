import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  KeyValue,
  Meter,
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
  allocationFor,
  personById,
  workstreamStatusTone,
  workstreamsForPerson,
} from "@/lib/people";

export const Route = createFileRoute("/people/$personId")({
  loader: ({ params }) => {
    const person = personById.get(params.personId.toUpperCase());
    if (!person) throw notFound();
    return person;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Person"} — Equinox GRC` },
      {
        name: "description",
        content: loaderData
          ? `${loaderData.title}, ${loaderData.org}. Workstreams, allocation and the controls this engineer touches.`
          : "Program team member: workstreams, allocation and controls.",
      },
      { property: "og:title", content: `${loaderData?.name ?? "Person"} — Equinox GRC` },
      {
        property: "og:description",
        content: loaderData?.title ?? "Program team member detail.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PersonDetail,
});

function PersonDetail() {
  const person = Route.useLoaderData();
  const streams = workstreamsForPerson(person.id);
  const alloc = allocationFor(person.id);
  const controls = Array.from(new Set(streams.flatMap((w) => w.controls))).sort();
  const collaborators = Array.from(
    new Map(
      streams
        .flatMap((w) => w.members.map((m) => m.person))
        .filter((id) => id !== person.id)
        .map((id) => [id, personById.get(id)!]),
    ).values(),
  );

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/programs/$programId"
            backParams={{ programId: streams[0]?.program ?? "PRG-1041" }}
            id={person.id}
            title={person.name}
            meta={`${person.title} · ${person.org} · ${person.site}`}
            actions={<Badge tone="neutral">{person.discipline}</Badge>}
          />
        }
        tabs={<div className="border-b border-border" />}
        showRail
        rail={
          <>
            <RailGroup title="Profile">
              <KeyValue label="Discipline">{person.discipline}</KeyValue>
              <KeyValue label="Org">{person.org}</KeyValue>
              <KeyValue label="Clearance">{person.clearance}</KeyValue>
              <KeyValue label="Site">{person.site}</KeyValue>
              <KeyValue label="Email">
                <span className="truncate text-[12px]">{person.email}</span>
              </KeyValue>
            </RailGroup>

            <RailGroup title="Load">
              <KeyValue label="Workstreams">{streams.length}</KeyValue>
              <KeyValue label="Allocation">
                <span className="flex items-center gap-2">
                  <span className="w-12">
                    <Meter
                      value={Math.min(alloc, 100)}
                      tone={alloc > 100 ? "danger" : alloc > 85 ? "warning" : "info"}
                    />
                  </span>
                  <span className={alloc > 100 ? "tnum text-danger" : "tnum"}>{alloc}%</span>
                </span>
              </KeyValue>
            </RailGroup>

            <RailGroup title="Controls touched">
              <div className="flex flex-wrap gap-1.5 py-1">
                {controls.length ? (
                  controls.map((c) => (
                    <Mono key={c} className="text-muted-foreground">
                      {c}
                    </Mono>
                  ))
                ) : (
                  <span className="text-[12.5px] text-muted-foreground">—</span>
                )}
              </div>
            </RailGroup>
          </>
        }
      >
        <Section
          title="Workstreams"
          description="Everything this person is committed to, and what they do on it."
        >
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: "104px" }} />
              <col />
              <col style={{ width: "200px" }} />
              <col style={{ width: "92px" }} />
              <col style={{ width: "88px" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>Workstream</Th>
                <Th>Title</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th className="text-right">Allocation</Th>
              </tr>
            </thead>
            <tbody>
              {streams.map((w) => {
                const m = w.members.find((x) => x.person === person.id);
                return (
                  <Tr key={w.id}>
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
                    <Td className="truncate text-muted-foreground">
                      {m?.role ?? (w.lead === person.id ? "Workstream lead" : "—")}
                    </Td>
                    <Td>
                      <Badge tone={workstreamStatusTone(w.status)}>{w.status}</Badge>
                    </Td>
                    <Td className="tnum text-right text-muted-foreground">
                      {m ? `${m.allocation}%` : "—"}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </Section>

        <Section
          title="Works with"
          description="People sharing at least one workstream — the coordination surface, not the org chart."
        >
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: "104px" }} />
              <col style={{ width: "176px" }} />
              <col />
              <col style={{ width: "156px" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>Person</Th>
                <Th>Name</Th>
                <Th>Title</Th>
                <Th>Discipline</Th>
              </tr>
            </thead>
            <tbody>
              {collaborators.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Link
                      to="/people/$personId"
                      params={{ personId: c.id }}
                      className="text-primary hover:underline"
                    >
                      <Mono>{c.id}</Mono>
                    </Link>
                  </Td>
                  <Td className="truncate font-medium">{c.name}</Td>
                  <Td className="truncate text-muted-foreground">{c.title}</Td>
                  <Td className="truncate text-muted-foreground">{c.discipline}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>
      </ShowPage>
    </Shell>
  );
}
