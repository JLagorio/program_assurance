/**
 * The full RMF timeline: acquisition phases → gates → milestones.
 *
 * Phases come from the DoD lifecycle, gates from the program's lifecycle
 * record, and the milestones under each gate auto-populate from the controls
 * and workstreams that are tied to that gate. Nothing here is hand-maintained.
 */

import { useMemo } from "react";
import { Link } from "@tanstack/react-router";

import { Badge, Dot, Person, Table, Id, Meter } from "@/ds/primitives";
import { Section } from "@/ds/patterns";
import { cn } from "@/lib/utils";
import { gatesForProgram, gateKindTone, lifecyclePhases, type ProgramGate } from "@/lib/grc-data";
import { daysUntil } from "@/lib/program-stage";
import { workstreamsForProgram } from "@/lib/people";
import type { ControlRow } from "@/lib/control-matrix";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

function gateTone(g: ProgramGate, daysOut: number | null): Tone {
  if (g.status === "Complete") return "success";
  if (g.status === "Blocked") return "danger";
  if (g.status === "At risk") return "danger";
  if (daysOut !== null && daysOut < 0) return "danger";
  if (g.status === "In progress") return daysOut !== null && daysOut < 30 ? "warning" : "info";
  return "neutral";
}

function timing(g: ProgramGate, daysOut: number | null) {
  if (g.status === "Complete") return `Closed ${g.actual}`;
  if (daysOut === null) return g.planned;
  if (daysOut < 0) return `${Math.abs(daysOut)}d overdue`;
  return `${daysOut}d out`;
}

export function RmfTimeline({
  programId,
  rows,
  onOpenControls,
}: {
  programId: string;
  rows: ControlRow[];
  onOpenControls?: (family: string) => void;
}) {
  const gates = useMemo(() => gatesForProgram(programId), [programId]);
  const streams = useMemo(() => workstreamsForProgram(programId), [programId]);

  const controlById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  const byPhase = lifecyclePhases.map((phase) => ({
    phase,
    gates: gates.filter((g) => g.phase === phase),
  }));

  const done = gates.filter((g) => g.status === "Complete").length;

  return (
    <Section
      title="RMF timeline"
      description="Acquisition phases, decision gates and the work that has to close under each."
      action={
        <span className="flex w-[240px] items-center gap-2">
          <Meter.Stacked
            height={4}
            segments={[
              { key: "d", value: done, tone: "success" },
              { key: "r", value: gates.length - done, tone: "neutral" },
            ]}
          />
          <span className="tnum shrink-0 text-12 text-muted-foreground">
            {done}/{gates.length}
          </span>
        </span>
      }
    >
      <div className="pt-1">
        {byPhase.map(({ phase, gates: phaseGates }) => (
          <div key={phase} className="border-b border-border-subtle py-3 last:border-0">
            <div className="flex items-baseline gap-2 pb-1.5">
              <h3 className="text-12 font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {phase}
              </h3>
              <span className="tnum text-11 text-muted-foreground">
                {phaseGates.filter((g) => g.status === "Complete").length}/{phaseGates.length} gates
                closed
              </span>
            </div>

            <ol className="space-y-0">
              {phaseGates.map((g) => {
                const daysOut = daysUntil(g.planned);
                const tone = gateTone(g, daysOut);
                const gateStreams = streams.filter((w) => w.gate === g.id);
                const gateControls = [...new Set(gateStreams.flatMap((w) => w.controls))]
                  .map((id) => controlById.get(id))
                  .filter((c): c is ControlRow => !!c);
                const openControls = gateControls.filter((c) => c.status !== "Satisfied");

                return (
                  <li key={g.id} className="border-b border-border-subtle py-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <Dot tone={tone} />
                      <Id className="w-16 shrink-0">{g.id}</Id>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                        {g.name}
                      </span>
                      <Badge tone={gateKindTone[g.kind]} size="xs">
                        {g.kind}
                      </Badge>
                      <Badge tone={tone} size="xs">
                        {g.status}
                      </Badge>
                      <span className="tnum w-24 shrink-0 text-right text-12 text-muted-foreground">
                        {g.planned}
                      </span>
                      <span
                        className={cn(
                          "tnum w-24 shrink-0 text-right text-12",
                          tone === "danger" ? "text-danger" : "text-muted-foreground",
                        )}
                      >
                        {timing(g, daysOut)}
                      </span>
                      <span className="w-28 shrink-0 truncate text-12">
                        <Person name={g.owner} />
                      </span>
                    </div>

                    <p className="pl-[76px] pt-0.5 text-12 text-muted-foreground">{g.cyberGate}</p>

                    {gateStreams.length > 0 ? (
                      <div className="pl-[76px] pt-1.5">
                        <Table className="table-fixed">
                          <colgroup>
                            <col style={{ width: "88px" }} />
                            <col />
                            <col style={{ width: "120px" }} />
                            <col style={{ width: "140px" }} />
                            <col style={{ width: "112px" }} />
                          </colgroup>
                          <tbody>
                            {gateStreams.map((w) => {
                              const wControls = w.controls
                                .map((id) => controlById.get(id))
                                .filter((c): c is ControlRow => !!c);
                              const wOpen = wControls.filter(
                                (c) => c.status !== "Satisfied",
                              ).length;
                              return (
                                <Table.Row key={w.id}>
                                  <Table.Cell>
                                    <Link
                                      to="/workstreams/$workstreamId"
                                      params={{ workstreamId: w.id }}
                                      className="text-primary hover:underline"
                                    >
                                      <Id className="text-primary">{w.id}</Id>
                                    </Link>
                                  </Table.Cell>
                                  <Table.Cell className="truncate">{w.title}</Table.Cell>
                                  <Table.Cell>{w.status}</Table.Cell>
                                  <Table.Cell>
                                    {w.controls.length ? (
                                      <button
                                        type="button"
                                        className="hover:underline"
                                        onClick={() =>
                                          onOpenControls?.(w.controls[0]!.split("-")[0]!)
                                        }
                                      >
                                        {w.controls.length} controls
                                        {wOpen ? ` · ${wOpen} open` : ""}
                                      </button>
                                    ) : (
                                      "—"
                                    )}
                                  </Table.Cell>
                                  <Table.Cell className="tnum text-right">{w.due}</Table.Cell>
                                </Table.Row>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                    ) : null}

                    {openControls.length > 0 ? (
                      <p className="tnum pl-[76px] pt-1 text-11 text-danger">
                        {openControls.length} linked controls not yet satisfied
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** Remaining gates and the next RMF deadlines — the Overview dashboard block. */
export function GateOutlookSection({
  rows,
  programId,
  onSelect,
}: {
  rows: { gate: ProgramGate; daysOut: number | null; tone: Tone; blockers: number }[];
  programId: string;
  onSelect?: () => void;
}) {
  if (rows.length === 0) return null;
  const shown = rows.slice(0, 5);

  return (
    <Section
      title="Next RMF deadlines"
      description={`${rows.length} gates remaining for ${programId}.`}
      action={
        onSelect ? (
          <button type="button" onClick={onSelect} className="text-12 text-primary hover:underline">
            Full timeline
          </button>
        ) : null
      }
    >
      <Table className="table-fixed">
        <colgroup>
          <col style={{ width: "72px" }} />
          <col />
          <col style={{ width: "100px" }} />
          <col style={{ width: "104px" }} />
          <col style={{ width: "92px" }} />
          <col style={{ width: "124px" }} />
        </colgroup>
        <tbody>
          {shown.map(({ gate, daysOut, tone, blockers }) => (
            <Table.Row key={gate.id}>
              <Table.Cell>
                <Id>{gate.id}</Id>
              </Table.Cell>
              <Table.Cell className="truncate">{gate.name}</Table.Cell>
              <Table.Cell>
                <Badge tone={tone} size="xs">
                  {gate.status}
                </Badge>
              </Table.Cell>
              <Table.Cell className="tnum">{gate.planned}</Table.Cell>
              <Table.Cell
                className={cn("tnum", tone === "danger" ? "text-danger" : "text-muted-foreground")}
              >
                {timing(gate, daysOut)}
              </Table.Cell>
              <Table.Cell className="truncate">
                {blockers ? `${blockers} open controls` : <Person name={gate.owner} />}
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </Section>
  );
}
