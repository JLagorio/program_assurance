import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Badge, KeyValue, Progress, Table, Id, Tabs } from "@/ds/primitives";
import { PreviewRail, Section } from "@/ds/patterns";
import { Inspector } from "@/ds/shapes";
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
      <Tabs
        className="mt-1"
        items={tabs.map((t) => ({
          key: t,
          label: t,
          active: tab === t,
          onSelect: () => {
            setTab(t);
            setWs(null);
            setPerson(null);
          },
          trailing: (
            <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
              {counts[t]}
            </span>
          ),
        }))}
      />

      <PreviewSplit open={Boolean(railOpen)}>
        <div className="min-w-0 pt-4 lg:pr-6">
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
                    <Table.Id id={w.id} active={ws?.id === w.id} onPreview={() => setWs(w)} />
                    <Table.Cell className="truncate">{w.title}</Table.Cell>
                    <Table.Cell className="truncate">
                      {personById.get(w.lead)?.name ?? "—"}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone={workstreamStatusTone(w.status)}>{w.status}</Badge>
                    </Table.Cell>
                    <Table.Cell className="tnum text-right">{w.members.length}</Table.Cell>
                    <Table.Cell className="truncate">
                      {w.dependsOn.length ? (
                        <Id>{w.dependsOn.join(", ")}</Id>
                      ) : (
                        <span className="text-muted-foreground">—</span>
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
                        active={person?.id === p.id}
                        onPreview={() => setPerson(p)}
                      />
                      <Table.Cell className="truncate">{p.name}</Table.Cell>
                      <Table.Cell className="truncate">{p.title}</Table.Cell>
                      <Table.Cell className="truncate">{p.discipline}</Table.Cell>
                      <Table.Cell className="truncate">{p.clearance}</Table.Cell>
                      <Table.Cell className="tnum text-right">
                        {workstreamsForPerson(p.id).length}
                      </Table.Cell>
                      <Table.Cell>
                        <span className="flex items-center gap-2">
                          <span className="w-12">
                            <Progress
                              value={Math.min(alloc, 100)}
                              tone={alloc > 100 ? "danger" : alloc > 85 ? "warning" : "info"}
                            />
                          </span>
                          <span
                            className={
                              alloc > 100
                                ? "tnum font-medium text-danger"
                                : "tnum text-muted-foreground"
                            }
                          >
                            {alloc}%
                          </span>
                        </span>
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
                    <Table.Cell className="tnum text-right">{e.via.length}</Table.Cell>
                    <Table.Cell className="truncate">
                      <span className="flex flex-wrap items-center gap-x-2">
                        {e.via.map((id) => (
                          <Link
                            key={id}
                            to="/workstreams/$workstreamId"
                            params={{ workstreamId: id }}
                            className="text-primary hover:underline"
                          >
                            <Id>{id}</Id>
                          </Link>
                        ))}
                      </span>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </tbody>
            </Table>
          ) : null}
        </div>

        {tab === "Workstreams" && ws ? (
          <PreviewRail
            id={ws.id}
            title={ws.title}
            onClose={() => setWs(null)}
            openTo={
              <Link
                to="/workstreams/$workstreamId"
                params={{ workstreamId: ws.id }}
                className="text-primary hover:underline"
              >
                Open workstream →
              </Link>
            }
          >
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">{ws.objective}</p>
            <div className="mt-3">
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
            </div>
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
                className="text-primary hover:underline"
              >
                Open person →
              </Link>
            }
          >
            <div className="mt-1">
              <Inspector.Group title="Profile">
                <KeyValue label="Title">{person.title}</KeyValue>
                <KeyValue label="Discipline">{person.discipline}</KeyValue>
                <KeyValue label="Org">{person.org}</KeyValue>
                <KeyValue label="Clearance">{person.clearance}</KeyValue>
                <KeyValue label="Site">{person.site}</KeyValue>
              </Inspector.Group>
              <Inspector.Group title="Workstreams">
                <div className="space-y-1.5 text-[12.5px]">
                  {workstreamsForPerson(person.id).map((w) => (
                    <div key={w.id} className="flex items-baseline justify-between gap-2">
                      <Link
                        to="/workstreams/$workstreamId"
                        params={{ workstreamId: w.id }}
                        className="min-w-0 truncate text-primary hover:underline"
                      >
                        {w.title}
                      </Link>
                      <span className="shrink-0 text-[12px] text-muted-foreground">{w.status}</span>
                    </div>
                  ))}
                </div>
              </Inspector.Group>
            </div>
          </PreviewRail>
        ) : null}
      </PreviewSplit>
    </Section>
  );
}
