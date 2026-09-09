import {
  Badge,
  Box,
  Button,
  Dot,
  Eyebrow,
  Id,
  Inline,
  Person,
  ProgressStacked,
  Section,
  Stack,
  Table,
  TextLink,
} from "@ledger/design-system";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";

import type { ControlRow } from "@/lib/control-matrix";
import { gateKindTone, gatesForProgram, lifecyclePhases, type ProgramGate } from "@/lib/grc-data";
import { workstreamsForProgram } from "@/lib/people";
import { daysUntil } from "@/lib/program-stage";

import { cn } from "@ledger/design-system/cn";

type Tone = "success" | "warning" | "danger" | "information" | "neutral";

function gateTone(g: ProgramGate, daysOut: number | null): Tone {
  if (g.status === "Complete") return "success";
  if (g.status === "Blocked") return "danger";
  if (g.status === "At risk") return "danger";
  if (daysOut !== null && daysOut < 0) return "danger";
  if (g.status === "In progress")
    return daysOut !== null && daysOut < 30 ? "warning" : "information";
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
      action={
        <Box style={{ width: 240, maxWidth: "100%" }}>
          <Inline space="space.100" alignBlock="center">
            <ProgressStacked
              size="small"
              segments={[
                { key: "d", value: done, tone: "success" },
                { key: "r", value: gates.length - done, tone: "neutral" },
              ]}
            ></ProgressStacked>
            <span className="tabular-nums shrink-0 font-body-small text-subtle">
              {done}/{gates.length}
            </span>
          </Inline>
        </Box>
      }
    >
      <Box paddingBlockStart="space.050">
        {byPhase.map(({ phase, gates: phaseGates }) => (
          <Box
            key={phase}
            className="border-b border-default last:border-0"
            paddingBlock="space.150"
          >
            <Inline className="pb-075" space="space.100" alignBlock="baseline">
              <Eyebrow as="h3">{phase}</Eyebrow>
              <span className="tabular-nums font-body-xsmall text-subtle">
                {phaseGates.filter((g) => g.status === "Complete").length}/{phaseGates.length} gates
                closed
              </span>
            </Inline>

            <Stack as="ol" space="space.0">
              {phaseGates.map((g) => {
                const daysOut = daysUntil(g.planned);
                const tone = gateTone(g, daysOut);
                const gateStreams = streams.filter((w) => w.gate === g.id);
                const gateControls = [...new Set(gateStreams.flatMap((w) => w.controls))]
                  .map((id) => controlById.get(id))
                  .filter((c): c is ControlRow => !!c);
                const openControls = gateControls.filter((c) => c.status !== "Satisfied");

                return (
                  <Box
                    key={g.id}
                    className="border-b border-default last:border-0"
                    as="li"
                    paddingBlock="space.100"
                  >
                    <Inline space="space.150" alignBlock="center">
                      <Dot tone={tone} />
                      <Id className="shrink-0 w-800">{g.id}</Id>
                      <span className="min-w-0 flex-1 truncate font-body-small font-medium">
                        {g.name}
                      </span>
                      <Badge variant="secondary" tone={gateKindTone[g.kind]} size="xsmall">
                        {g.kind}
                      </Badge>
                      <Badge variant="secondary" tone={tone} size="xsmall">
                        {g.status}
                      </Badge>
                      <span className="tabular-nums shrink-0 text-right font-body-small text-subtle w-1000">
                        {g.planned}
                      </span>
                      <span
                        className={cn(
                          "tabular-nums shrink-0 text-right font-body-small",
                          tone === "danger" ? "text-danger" : "text-subtle",
                          "w-1000",
                        )}
                      >
                        {timing(g, daysOut)}
                      </span>
                      <span className="shrink-0 truncate font-body-small" style={{ width: 112 }}>
                        <Person name={g.owner} />
                      </span>
                    </Inline>

                    <p
                      className="pt-025 font-body-small text-subtle"
                      style={{ paddingInlineStart: 76 }}
                    >
                      {g.cyberGate}
                    </p>

                    {gateStreams.length > 0 ? (
                      <Box paddingBlockStart="space.075" style={{ paddingInlineStart: 76 }}>
                        <Table className="table-fixed">
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
                                  <Table.Cell width={88}>
                                    <TextLink
                                      render={
                                        <Link
                                          to="/workstreams/$workstreamId"
                                          params={{ workstreamId: w.id }}
                                        />
                                      }
                                    >
                                      <Id>{w.id}</Id>
                                    </TextLink>
                                  </Table.Cell>
                                  <Table.Cell className="truncate">{w.title}</Table.Cell>
                                  <Table.Cell width={120}>{w.status}</Table.Cell>
                                  <Table.Cell width={140}>
                                    {w.controls.length ? (
                                      <TextLink
                                        render={
                                          <button
                                            type="button"
                                            onClick={() =>
                                              onOpenControls?.(w.controls[0]!.split("-")[0]!)
                                            }
                                          />
                                        }
                                      >
                                        {w.controls.length} controls
                                        {wOpen ? ` · ${wOpen} open` : ""}
                                      </TextLink>
                                    ) : (
                                      "—"
                                    )}
                                  </Table.Cell>
                                  <Table.Cell className="tabular-nums text-right" width={112}>
                                    {w.due}
                                  </Table.Cell>
                                </Table.Row>
                              );
                            })}
                          </tbody>
                        </Table>
                      </Box>
                    ) : null}

                    {openControls.length > 0 ? (
                      <p
                        className="tabular-nums pt-050 font-body-xsmall text-danger"
                        style={{ paddingInlineStart: 76 }}
                      >
                        {openControls.length} linked controls not yet satisfied
                      </p>
                    ) : null}
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Box>
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
          <Button onClick={onSelect} variant="link" size="small">
            Full timeline
          </Button>
        ) : null
      }
    >
      <Table className="table-fixed">
        <tbody>
          {shown.map(({ gate, daysOut, tone, blockers }) => (
            <Table.Row key={gate.id}>
              <Table.Cell width={72}>
                <Id>{gate.id}</Id>
              </Table.Cell>
              <Table.Cell className="truncate">{gate.name}</Table.Cell>
              <Table.Cell width={100}>
                <Badge variant="secondary" tone={tone} size="xsmall">
                  {gate.status}
                </Badge>
              </Table.Cell>
              <Table.Cell className="tabular-nums" width={104}>
                {gate.planned}
              </Table.Cell>
              <Table.Cell
                className={cn("tabular-nums", tone === "danger" ? "text-danger" : "")}
                width={92}
              >
                {timing(gate, daysOut)}
              </Table.Cell>
              <Table.Cell className="truncate" width={124}>
                {blockers ? `${blockers} open controls` : <Person name={gate.owner} />}
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </Section>
  );
}
