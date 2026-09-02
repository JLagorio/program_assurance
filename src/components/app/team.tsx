import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import {
  Badge,
  IdCell,
  KeyValue,
  Meter,
  Mono,
  PreviewRail,
  RailGroup,
  Section,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
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
      <div className="mt-1 flex items-center gap-4 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setWs(null);
              setPerson(null);
            }}
          >
            <span
              className={
                t === tab
                  ? "-mb-px inline-flex items-center gap-1.5 border-b-2 border-primary px-0.5 pb-2.5 pt-1 text-[13px] font-semibold text-primary"
                  : "-mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-0.5 pb-2.5 pt-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {t}
              <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                {counts[t]}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className={railOpen ? "grid lg:grid-cols-[minmax(0,1fr)_272px]" : "grid"}>
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
                  <Th>Workstream</Th>
                  <Th>Title</Th>
                  <Th>Lead</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Team</Th>
                  <Th>Depends on</Th>
                  <Th className="text-right">Gate · due</Th>
                </tr>
              </thead>
              <tbody>
                {streams.map((w) => (
                  <Tr
                    key={w.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate({ to: "/workstreams/$workstreamId", params: { workstreamId: w.id } })
                    }
                  >
                    <IdCell id={w.id} active={ws?.id === w.id} onPreview={() => setWs(w)} />
                    <Td className="truncate">{w.title}</Td>
                    <Td className="truncate">{personById.get(w.lead)?.name ?? "—"}</Td>
                    <Td>
                      <Badge tone={workstreamStatusTone(w.status)}>{w.status}</Badge>
                    </Td>
                    <Td className="tnum text-right">{w.members.length}</Td>
                    <Td className="truncate">
                      {w.dependsOn.length ? (
                        <Mono>{w.dependsOn.join(", ")}</Mono>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </Td>
                    <Td className="truncate text-right">
                      {w.gate} · {w.due}
                    </Td>
                  </Tr>
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
                  <Th>Person</Th>
                  <Th>Name</Th>
                  <Th>Title</Th>
                  <Th>Discipline</Th>
                  <Th>Clearance</Th>
                  <Th className="text-right">WS</Th>
                  <Th>Allocation</Th>
                </tr>
              </thead>
              <tbody>
                {roster.map((p) => {
                  const alloc = allocationFor(p.id);
                  return (
                    <Tr
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate({ to: "/people/$personId", params: { personId: p.id } })
                      }
                    >
                      <IdCell
                        id={p.id}
                        active={person?.id === p.id}
                        onPreview={() => setPerson(p)}
                      />
                      <Td className="truncate">{p.name}</Td>
                      <Td className="truncate">{p.title}</Td>
                      <Td className="truncate">{p.discipline}</Td>
                      <Td className="truncate">{p.clearance}</Td>
                      <Td className="tnum text-right">{workstreamsForPerson(p.id).length}</Td>
                      <Td>
                        <span className="flex items-center gap-2">
                          <span className="w-12">
                            <Meter
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
                      </Td>
                    </Tr>
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
                  <Th>Discipline</Th>
                  <Th>Works with</Th>
                  <Th className="text-right">Shared</Th>
                  <Th>Via workstreams</Th>
                </tr>
              </thead>
              <tbody>
                {edges.map((e) => (
                  <Tr key={`${e.a}-${e.b}`}>
                    <Td className="truncate">{e.a}</Td>
                    <Td className="truncate">{e.b}</Td>
                    <Td className="tnum text-right">{e.via.length}</Td>
                    <Td className="truncate">
                      <span className="flex flex-wrap items-center gap-x-2">
                        {e.via.map((id) => (
                          <Link
                            key={id}
                            to="/workstreams/$workstreamId"
                            params={{ workstreamId: id }}
                            className="text-primary hover:underline"
                          >
                            <Mono>{id}</Mono>
                          </Link>
                        ))}
                      </span>
                    </Td>
                  </Tr>
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
              <RailGroup title="Workstream">
                <KeyValue label="Lead">{personById.get(ws.lead)?.name ?? "—"}</KeyValue>
                <KeyValue label="Status">
                  <Badge tone={workstreamStatusTone(ws.status)}>{ws.status}</Badge>
                </KeyValue>
                <KeyValue label="Stage">{ws.stage}</KeyValue>
                <KeyValue label="Gate">{ws.gate}</KeyValue>
                <KeyValue label="Due">{ws.due}</KeyValue>
              </RailGroup>
              <RailGroup title="Joins">
                <KeyValue label="Controls">
                  <Mono>{ws.controls.join(", ")}</Mono>
                </KeyValue>
                <KeyValue label="CCIs">
                  {ws.ccis.length ? <Mono>{ws.ccis.join(", ")}</Mono> : "—"}
                </KeyValue>
                <KeyValue label="Depends on">
                  {ws.dependsOn.length ? <Mono>{ws.dependsOn.join(", ")}</Mono> : "—"}
                </KeyValue>
              </RailGroup>
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
              <RailGroup title="Profile">
                <KeyValue label="Title">{person.title}</KeyValue>
                <KeyValue label="Discipline">{person.discipline}</KeyValue>
                <KeyValue label="Org">{person.org}</KeyValue>
                <KeyValue label="Clearance">{person.clearance}</KeyValue>
                <KeyValue label="Site">{person.site}</KeyValue>
              </RailGroup>
              <RailGroup title="Workstreams">
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
              </RailGroup>
            </div>
          </PreviewRail>
        ) : null}
      </div>
    </Section>
  );
}
