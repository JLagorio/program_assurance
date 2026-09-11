import { Id, Inline, Shell, Stack } from "@ledger/design-system";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import {
  allocationFor,
  crossDisciplineEdges,
  peopleForProgram,
  personById,
  workstreamStatusTone,
  workstreamsForPerson,
  workstreamsForProgram,
  type Person,
  type Workstream,
} from "@/lib/people";
import {
  Badge,
  Box,
  Count,
  Inspector,
  KeyValue,
  Progress,
  Section,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
} from "@ledger/design-system";

const tabs = ["Workstreams", "People", "Coordination"] as const;
type Tab = (typeof tabs)[number];

export function TeamSection({ programId }: { programId: string }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Workstreams");
  const [ws, setWs] = useState<Workstream | null>(null);
  const [person, setPerson] = useState<Person | null>(null);

  const streams = useMemo(() => workstreamsForProgram(programId), [programId]);
  const roster = useMemo(() => peopleForProgram(programId), [programId]);
  const edges = useMemo(() => crossDisciplineEdges(programId), [programId]);

  const counts: Record<Tab, number> = {
    Workstreams: streams.length,
    People: roster.length,
    Coordination: edges.length,
  };

  const railOpen = (tab === "Workstreams" && ws) || (tab === "People" && person);

  return (
    <Section title="Team">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as typeof tab);
          setWs(null);
          setPerson(null);
        }}
        className="contents"
      >
        <TabsList variant="line" activateOnFocus className="w-full justify-start pt-050">
          {tabs.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t}
              {counts[t] != null ? <Count value={counts[t]} max={9999} /> : null}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="contents">
          <>
            <Box className="min-w-0 lg:pe-300" paddingBlockStart="space.200">
              {tab === "Workstreams" ? (
                <Table className="table-fixed">
                  <thead>
                    <tr>
                      <Table.Header width={104}>Workstream</Table.Header>
                      <Table.Header>Title</Table.Header>
                      <Table.Header width={148}>Lead</Table.Header>
                      <Table.Header width={96}>Status</Table.Header>
                      <Table.Header width={60} className="text-right">
                        Team
                      </Table.Header>
                      <Table.Header width={104}>Depends on</Table.Header>
                      <Table.Header width={112} className="text-right">
                        Gate · due
                      </Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {streams.map((w) => (
                      <Table.Row
                        key={w.id}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate({
                            to: "/workstreams/$workstreamId",
                            params: { workstreamId: w.id },
                          })
                        }
                      >
                        <Table.Id id={w.id} isActive={ws?.id === w.id} onPreview={() => setWs(w)} />
                        <Table.Cell className="truncate">{w.title}</Table.Cell>
                        <Table.Cell className="truncate">
                          {personById.get(w.lead)?.name ?? "—"}
                        </Table.Cell>
                        <Table.Cell>
                          <Badge variant="secondary" tone={workstreamStatusTone(w.status)}>
                            {w.status}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell className="tabular-nums text-right">
                          {w.members.length}
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          {w.dependsOn.length ? (
                            <Id>{w.dependsOn.join(", ")}</Id>
                          ) : (
                            <span className="text-subtle">—</span>
                          )}
                        </Table.Cell>
                        <Table.Cell className="truncate text-right">
                          {w.gate} · {w.due}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              ) : null}

              {tab === "People" ? (
                <Table className="table-fixed">
                  <thead>
                    <tr>
                      <Table.Header width={104}>Person</Table.Header>
                      <Table.Header width={156}>Name</Table.Header>
                      <Table.Header>Title</Table.Header>
                      <Table.Header width={144}>Discipline</Table.Header>
                      <Table.Header width={92}>Clearance</Table.Header>
                      <Table.Header width={60} className="text-right">
                        WS
                      </Table.Header>
                      <Table.Header width={128}>Allocation</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((p) => {
                      const alloc = allocationFor(p.id);
                      return (
                        <Table.Row
                          key={p.id}
                          className="cursor-pointer"
                          onClick={() =>
                            navigate({ to: "/people/$personId", params: { personId: p.id } })
                          }
                        >
                          <Table.Id
                            id={p.id}
                            isActive={person?.id === p.id}
                            onPreview={() => setPerson(p)}
                          />
                          <Table.Cell className="truncate">{p.name}</Table.Cell>
                          <Table.Cell className="truncate">{p.title}</Table.Cell>
                          <Table.Cell className="truncate">{p.discipline}</Table.Cell>
                          <Table.Cell className="truncate">{p.clearance}</Table.Cell>
                          <Table.Cell className="tabular-nums text-right">
                            {workstreamsForPerson(p.id).length}
                          </Table.Cell>
                          <Table.Cell>
                            <Inline as="span" space="space.100" alignBlock="center">
                              <span className="w-600">
                                <Progress
                                  value={Math.min(alloc, 100)}
                                  tone={
                                    alloc > 100 ? "danger" : alloc > 85 ? "warning" : "information"
                                  }
                                  aria-hidden
                                />
                              </span>
                              <span
                                className={
                                  alloc > 100
                                    ? "tabular-nums font-medium text-danger"
                                    : "tabular-nums text-subtle"
                                }
                              >
                                {alloc}%
                              </span>
                            </Inline>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </tbody>
                </Table>
              ) : null}

              {tab === "Coordination" ? (
                <Table className="table-fixed">
                  <thead>
                    <tr>
                      <Table.Header width={180}>Discipline</Table.Header>
                      <Table.Header width={180}>Works with</Table.Header>
                      <Table.Header width={72} className="text-right">
                        Shared
                      </Table.Header>
                      <Table.Header>Via workstreams</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {edges.map((e) => (
                      <Table.Row key={`${e.a}-${e.b}`}>
                        <Table.Cell className="truncate">{e.a}</Table.Cell>
                        <Table.Cell className="truncate">{e.b}</Table.Cell>
                        <Table.Cell className="tabular-nums text-right">{e.via.length}</Table.Cell>
                        <Table.Cell className="truncate">
                          <Inline as="span" space="space.100" alignBlock="center" shouldWrap>
                            {e.via.map((id) => (
                              <TextLink
                                key={id}
                                render={
                                  <Link
                                    to="/workstreams/$workstreamId"
                                    params={{ workstreamId: id }}
                                  />
                                }
                              >
                                <Id>{id}</Id>
                              </TextLink>
                            ))}
                          </Inline>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              ) : null}
            </Box>
            {tab === "Workstreams" && ws ? (
              <Shell.Panel title={ws.title} onClose={() => setWs(null)}>
                <Stack space="space.150" className="min-w-0">
                  <Inline space="space.100" alignBlock="center" shouldWrap>
                    <Id>{ws.id}</Id>
                  </Inline>
                  <div className="font-body">
                    <TextLink
                      render={
                        <Link to="/workstreams/$workstreamId" params={{ workstreamId: ws.id }} />
                      }
                    >
                      Open workstream
                    </TextLink>
                  </div>
                  <p className="font-body-small text-subtle">{ws.objective}</p>
                  <Box paddingBlockStart="space.150">
                    <Inspector.Group title="Workstream">
                      <KeyValue label="Lead">{personById.get(ws.lead)?.name ?? "—"}</KeyValue>
                      <KeyValue label="Status">
                        <Badge variant="secondary" tone={workstreamStatusTone(ws.status)}>
                          {ws.status}
                        </Badge>
                      </KeyValue>
                      <KeyValue label="Stage">{ws.stage}</KeyValue>
                      <KeyValue label="Gate">{ws.gate}</KeyValue>
                      <KeyValue label="Due">{ws.due}</KeyValue>
                    </Inspector.Group>
                    <Inspector.Group title="Joins">
                      <KeyValue label="Controls">
                        <Id>{ws.controls.join(", ")}</Id>
                      </KeyValue>
                      <KeyValue label="CCIs">
                        {ws.ccis.length ? <Id>{ws.ccis.join(", ")}</Id> : "—"}
                      </KeyValue>
                      <KeyValue label="Depends on">
                        {ws.dependsOn.length ? <Id>{ws.dependsOn.join(", ")}</Id> : "—"}
                      </KeyValue>
                    </Inspector.Group>
                  </Box>
                </Stack>
              </Shell.Panel>
            ) : null}
            {tab === "People" && person ? (
              <Shell.Panel title={person.name} onClose={() => setPerson(null)}>
                <Stack space="space.150" className="min-w-0">
                  <Inline space="space.100" alignBlock="center" shouldWrap>
                    <Id>{person.id}</Id>
                  </Inline>
                  <div className="font-body">
                    <TextLink
                      render={<Link to="/people/$personId" params={{ personId: person.id }} />}
                    >
                      Open person
                    </TextLink>
                  </div>
                  <Box paddingBlockStart="space.050">
                    <Inspector.Group title="Profile">
                      <KeyValue label="Title">{person.title}</KeyValue>
                      <KeyValue label="Discipline">{person.discipline}</KeyValue>
                      <KeyValue label="Org">{person.org}</KeyValue>
                      <KeyValue label="Clearance">{person.clearance}</KeyValue>
                      <KeyValue label="Site">{person.site}</KeyValue>
                    </Inspector.Group>
                    <Inspector.Group title="Workstreams">
                      <Stack className="font-body-small" space="space.075">
                        {workstreamsForPerson(person.id).map((w) => (
                          <Inline
                            key={w.id}
                            space="space.100"
                            alignBlock="baseline"
                            spread="space-between"
                          >
                            <TextLink
                              className="min-w-0 truncate"
                              render={
                                <Link
                                  to="/workstreams/$workstreamId"
                                  params={{ workstreamId: w.id }}
                                />
                              }
                            >
                              {w.title}
                            </TextLink>
                            <span className="shrink-0 font-body-small text-subtle">{w.status}</span>
                          </Inline>
                        ))}
                      </Stack>
                    </Inspector.Group>
                  </Box>
                </Stack>
              </Shell.Panel>
            ) : null}
          </>
        </TabsContent>
      </Tabs>
    </Section>
  );
}
