import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import {
  Badge,
  Id,
  Inline,
  Inspector,
  KeyValue,
  Progress,
  RecordHeader,
  Section,
  ShowPage,
  Table,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
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
            back={
              <Link
                to="/programs/$programId"
                params={{ programId: streams[0]?.program ?? "PRG-1041" }}
              />
            }
            id={person.id}
            title={person.name}
            meta={`${person.title} · ${person.org} · ${person.site}`}
            actions={<Badge tone="neutral">{person.discipline}</Badge>}
          />
        }
        tabs={<div className="border-b border-default" />}
        showRail
        rail={
          <>
            <Inspector.Group title="Profile">
              <KeyValue label="Discipline">{person.discipline}</KeyValue>
              <KeyValue label="Org">{person.org}</KeyValue>
              <KeyValue label="Clearance">{person.clearance}</KeyValue>
              <KeyValue label="Site">{person.site}</KeyValue>
              <KeyValue label="Email">
                <span className="truncate font-body-small">{person.email}</span>
              </KeyValue>
            </Inspector.Group>

            <Inspector.Group title="Load">
              <KeyValue label="Workstreams">{streams.length}</KeyValue>
              <KeyValue label="Allocation">
                <Inline as="span" space="space.100" alignBlock="center">
                  <span className="w-600">
                    <Progress
                      value={Math.min(alloc, 100)}
                      tone={alloc > 100 ? "danger" : alloc > 85 ? "warning" : "information"}
                    />
                  </span>
                  <span className={alloc > 100 ? "tabular-nums text-danger" : "tabular-nums"}>
                    {alloc}%
                  </span>
                </Inline>
              </KeyValue>
            </Inspector.Group>

            <Inspector.Group title="Controls touched">
              <Inline className="py-050" space="space.075" shouldWrap>
                {controls.length ? (
                  controls.map((c) => (
                    <Id key={c} className="text-subtle">
                      {c}
                    </Id>
                  ))
                ) : (
                  <span className="font-body-small text-subtle">—</span>
                )}
              </Inline>
            </Inspector.Group>
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
                <Table.Header>Workstream</Table.Header>
                <Table.Header>Title</Table.Header>
                <Table.Header>Role</Table.Header>
                <Table.Header>Status</Table.Header>
                <Table.Header className="text-right">Allocation</Table.Header>
              </tr>
            </thead>
            <tbody>
              {streams.map((w) => {
                const m = w.members.find((x) => x.person === person.id);
                return (
                  <Table.Row key={w.id}>
                    <Table.Cell>
                      <Link
                        to="/workstreams/$workstreamId"
                        params={{ workstreamId: w.id }}
                        className="text-brand hover:underline"
                      >
                        <Id>{w.id}</Id>
                      </Link>
                    </Table.Cell>
                    <Table.Cell className="truncate">{w.title}</Table.Cell>
                    <Table.Cell className="truncate">
                      {m?.role ?? (w.lead === person.id ? "Workstream lead" : "—")}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone={workstreamStatusTone(w.status)}>{w.status}</Badge>
                    </Table.Cell>
                    <Table.Cell className="tabular-nums text-right">
                      {m ? `${m.allocation}%` : "—"}
                    </Table.Cell>
                  </Table.Row>
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
                <Table.Header>Person</Table.Header>
                <Table.Header>Name</Table.Header>
                <Table.Header>Title</Table.Header>
                <Table.Header>Discipline</Table.Header>
              </tr>
            </thead>
            <tbody>
              {collaborators.map((c) => (
                <Table.Row key={c.id}>
                  <Table.Cell>
                    <Link
                      to="/people/$personId"
                      params={{ personId: c.id }}
                      className="text-brand hover:underline"
                    >
                      <Id>{c.id}</Id>
                    </Link>
                  </Table.Cell>
                  <Table.Cell className="truncate">{c.name}</Table.Cell>
                  <Table.Cell className="truncate">{c.title}</Table.Cell>
                  <Table.Cell className="truncate">{c.discipline}</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>
      </ShowPage>
    </Shell>
  );
}
