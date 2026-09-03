import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import {
  Badge,
  Box,
  Id,
  Inline,
  Inspector,
  KeyValue,
  PreviewRail,
  Progress,
  Section,
  Stack,
  Table,
  Tabs,
} from "@ledger/design-system";
import { PreviewSplit } from "@/components/app/preview-split";
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
    <Section
      title="Team"
      description="Who is building what. A workstream is the unit of work — it has a lead, the disciplines it pulls in, the controls it satisfies, and the workstreams it cannot finish without."
    >
      <Tabs className="pt-050">
        {tabs.map((t) => (
          <Tabs.Tab
            key={t}
            isSelected={tab === t}
            onClick={() => {
              setTab(t);
              setWs(null);
              setPerson(null);
            }}
            count={counts[t]}
          >
            {t}
          </Tabs.Tab>
        ))}
      </Tabs>

      <PreviewSplit open={Boolean(railOpen)}>
        <Box className="min-w-0 lg:pe-300" paddingBlockStart="space.200">
          {tab === "Workstreams" ? (
            <Table className="table-fixed">
              <colgroup>
                <col style={{ width: "104px" }} />
                <col />
                <col style={{ width: "148px" }} />
                <col style={{ width: "96px" }} />
                <col style={{ width: "60px" }} />
                <col style={{ width: "104px" }} />
                <col style={{ width: "112px" }} />
              </colgroup>
              <thead>
                <tr>
                  <Table.Header>Workstream</Table.Header>
                  <Table.Header>Title</Table.Header>
                  <Table.Header>Lead</Table.Header>
                  <Table.Header>Status</Table.Header>
                  <Table.Header className="text-right">Team</Table.Header>
                  <Table.Header>Depends on</Table.Header>
                  <Table.Header className="text-right">Gate · due</Table.Header>
                </tr>
              </thead>
              <tbody>
                {streams.map((w) => (
                  <Table.Row
                    key={w.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate({ to: "/workstreams/$workstreamId", params: { workstreamId: w.id } })
                    }
                  >
                    <Table.Id id={w.id} isActive={ws?.id === w.id} onPreview={() => setWs(w)} />
                    <Table.Cell className="truncate">{w.title}</Table.Cell>
                    <Table.Cell className="truncate">
                      {personById.get(w.lead)?.name ?? "—"}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone={workstreamStatusTone(w.status)}>{w.status}</Badge>
                    </Table.Cell>
                    <Table.Cell className="tabular-nums text-right">{w.members.length}</Table.Cell>
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
              <colgroup>
                <col style={{ width: "104px" }} />
                <col style={{ width: "156px" }} />
                <col />
                <col style={{ width: "144px" }} />
                <col style={{ width: "92px" }} />
                <col style={{ width: "60px" }} />
                <col style={{ width: "128px" }} />
              </colgroup>
              <thead>
                <tr>
                  <Table.Header>Person</Table.Header>
                  <Table.Header>Name</Table.Header>
                  <Table.Header>Title</Table.Header>
                  <Table.Header>Discipline</Table.Header>
                  <Table.Header>Clearance</Table.Header>
                  <Table.Header className="text-right">WS</Table.Header>
                  <Table.Header>Allocation</Table.Header>
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
                              tone={alloc > 100 ? "danger" : alloc > 85 ? "warning" : "information"}
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
              <colgroup>
                <col style={{ width: "180px" }} />
                <col style={{ width: "180px" }} />
                <col style={{ width: "72px" }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <Table.Header>Discipline</Table.Header>
                  <Table.Header>Works with</Table.Header>
                  <Table.Header className="text-right">Shared</Table.Header>
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
                          <Link
                            key={id}
                            to="/workstreams/$workstreamId"
                            params={{ workstreamId: id }}
                            className="text-brand hover:underline"
                          >
                            <Id>{id}</Id>
                          </Link>
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
          <PreviewRail
            id={ws.id}
            title={ws.title}
            onClose={() => setWs(null)}
            openTo={
              <Link
                to="/workstreams/$workstreamId"
                params={{ workstreamId: ws.id }}
                className="text-brand hover:underline"
              >
                Open workstream →
              </Link>
            }
          >
            <p className="font-body-small text-subtle">{ws.objective}</p>
            <Box paddingBlockStart="space.150">
              <Inspector.Group title="Workstream">
                <KeyValue label="Lead">{personById.get(ws.lead)?.name ?? "—"}</KeyValue>
                <KeyValue label="Status">
                  <Badge tone={workstreamStatusTone(ws.status)}>{ws.status}</Badge>
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
          </PreviewRail>
        ) : null}

        {tab === "People" && person ? (
          <PreviewRail
            id={person.id}
            title={person.name}
            onClose={() => setPerson(null)}
            openTo={
              <Link
                to="/people/$personId"
                params={{ personId: person.id }}
                className="text-brand hover:underline"
              >
                Open person →
              </Link>
            }
          >
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
                      <Link
                        to="/workstreams/$workstreamId"
                        params={{ workstreamId: w.id }}
                        className="min-w-0 truncate text-brand hover:underline"
                      >
                        {w.title}
                      </Link>
                      <span className="shrink-0 font-body-small text-subtle">{w.status}</span>
                    </Inline>
                  ))}
                </Stack>
              </Inspector.Group>
            </Box>
          </PreviewRail>
        ) : null}
      </PreviewSplit>
    </Section>
  );
}
