import {
  dependentsOf,
  personById,
  workstreamById,
  workstreams,
  workstreamStatusTone,
} from "@/lib/people";
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Id,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Section,
  Shell,
  Stack,
  Table,
  TextLink,
} from "@ledger/design-system";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";

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
    <Stack space="space.200" className="min-w-0">
      <PageHeader>
        <Breadcrumb className="col-span-full">
          <BreadcrumbList>
            <>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/programs" />}>Programs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link to="/programs/$programId" params={{ programId: ws.program }} />}
                >
                  {ws.program}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                <Id>{ws.id}</Id>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="min-w-0">
          <PageHeader.Title>{ws.title}</PageHeader.Title>
          <Inline
            space="space.100"
            alignBlock="center"
            shouldWrap
            className="pt-050 font-body-small text-subtle"
          >{`${ws.program} · ${ws.stage} · ${ws.gate} · due ${ws.due}`}</Inline>
        </div>
        <PageHeader.Actions>
          <Badge variant="secondary" tone={workstreamStatusTone(ws.status)}>
            {ws.status}
          </Badge>
        </PageHeader.Actions>
      </PageHeader>
      <div className="border-b border-default" />
      <Stack space="space.300" className="min-w-0 pt-200">
        <Section title="Objective">
          <p className="max-w-layout-measure pt-150 font-body text-subtle">{ws.objective}</p>
          <p className="pt-150 max-w-layout-measure font-body-small">{ws.note}</p>
        </Section>
        <Section title="Assigned people">
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
                      <TextLink
                        render={<Link to="/people/$personId" params={{ personId: m.person }} />}
                      >
                        <Id>{m.person}</Id>
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
        <Section title="Dependencies">
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
                    <TextLink
                      render={
                        <Link to="/workstreams/$workstreamId" params={{ workstreamId: w.id }} />
                      }
                    >
                      <Id>{w.id}</Id>
                    </TextLink>
                  </Table.Cell>
                  <Table.Cell className="truncate">{w.title}</Table.Cell>
                  <Table.Cell>
                    <Badge variant="secondary" tone={workstreamStatusTone(w.status)}>
                      {w.status}
                    </Badge>
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
      </Stack>
      <Shell.Aside label="Record properties">
        <>
          <Inspector.Group title="Workstream">
            <KeyValue label="Program">
              <TextLink
                render={<Link to="/programs/$programId" params={{ programId: ws.program }} />}
              >
                <Id>{ws.program}</Id>
              </TextLink>
            </KeyValue>
            <KeyValue label="Lead">
              {lead ? (
                <TextLink render={<Link to="/people/$personId" params={{ personId: lead.id }} />}>
                  {lead.name}
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
                <Badge variant="secondary" key={d} tone="neutral">
                  {d}
                </Badge>
              ))}
            </Inline>
          </Inspector.Group>

          <Inspector.Group title="Joins">
            <KeyValue label="Controls">
              <Id>{ws.controls.join(", ")}</Id>
            </KeyValue>
            <KeyValue label="CCIs">{ws.ccis.length ? <Id>{ws.ccis.join(", ")}</Id> : "—"}</KeyValue>
            <KeyValue label="Sibling streams">{workstreams.length}</KeyValue>
          </Inspector.Group>
        </>
      </Shell.Aside>
    </Stack>
  );
}
