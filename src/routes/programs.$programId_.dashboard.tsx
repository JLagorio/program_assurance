import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { Badge, Dot, Progress, Person, Table, Id } from "@/ds/primitives";
import { RecordHeader, Section, ShowPage } from "@/ds/patterns";
import { Shell } from "@/ds/shell";
import { ControlMatrixSection, FamilyCoverageTable } from "@/components/app/control-matrix";
import { CoverageBand } from "@/components/app/coverage";
import { cn } from "@/lib/utils";
import { useControlMatrix, type ControlStatus } from "@/lib/control-matrix";
import { gatesForProgram, lifecyclePhases, programs, gateKindTone } from "@/lib/grc-data";
import { catalogVersion } from "@/lib/nist-catalog";
import { findingsForProgram, programPosture } from "@/lib/program-actions";
import {
  coverageFromRows,
  gateOutlook,
  programDeadlines,
  type Deadline,
} from "@/lib/program-coverage";
import { isOpen } from "@/lib/findings";
import { poamItems } from "@/lib/register";

export const Route = createFileRoute("/programs/$programId_/dashboard")({
  loader: ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    return program;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Program"} dashboard — Equinox` },
      {
        name: "description",
        content: `Program dashboard: 800-53 coverage by control family, remaining RMF gates, the next deadlines, and the full control matrix for ${loaderData?.id ?? "the program"}.`,
      },
      { property: "og:title", content: `${loaderData?.name ?? "Program"} dashboard — Equinox` },
      {
        property: "og:description",
        content: "Coverage by family, remaining gates, next deadlines and the control matrix.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgramDashboard,
});

/** A single headline number. No plot, so no hover layer — the number is the mark. */
function DashboardStat({
  label,
  value,
  hint,
  tone = "neutral",
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0 border-l border-border pl-3 first:border-0 first:pl-0">
      <div className="text-11 uppercase tracking-[0.04em] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "tnum mt-1 text-[22px] font-semibold leading-none",
          tone === "danger" && "text-danger",
          tone === "warning" && "text-warning",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </div>
      {hint ? <div className="mt-1 truncate text-12 text-muted-foreground">{hint}</div> : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

const deadlineTone: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  Gate: "info",
  "POA&M": "warning",
  Control: "neutral",
};

function DeadlineRow({ programId, d }: { programId: string; d: Deadline }) {
  const timing =
    d.daysOut === null
      ? d.date
      : d.daysOut < 0
        ? `${Math.abs(d.daysOut)}d overdue`
        : `${d.daysOut}d out`;

  const idCell =
    d.kind === "POA&M" ? (
      <Link to="/register/poam/$poamId" params={{ poamId: d.id }} className="hover:underline">
        <Id className="text-primary">{d.id}</Id>
      </Link>
    ) : d.kind === "Control" ? (
      <Link
        to="/programs/$programId/controls/$controlId"
        params={{ programId, controlId: d.id }}
        className="hover:underline"
      >
        <Id className="text-primary">{d.id}</Id>
      </Link>
    ) : (
      <Id>{d.id}</Id>
    );

  return (
    <Table.Row>
      <Table.Cell>{idCell}</Table.Cell>
      <Table.Cell>
        <Badge tone={deadlineTone[d.kind] ?? "neutral"} size="xs">
          {d.kind}
        </Badge>
      </Table.Cell>
      <Table.Cell className="truncate" title={d.label}>
        {d.label}
      </Table.Cell>
      <Table.Cell className="truncate" title={d.note}>
        {d.note}
      </Table.Cell>
      <Table.Cell className="tnum text-right">{d.date}</Table.Cell>
      <Table.Cell
        className={cn(
          "tnum text-right",
          d.tone === "danger" ? "text-danger" : d.tone === "warning" ? "text-warning" : "",
        )}
      >
        {timing}
      </Table.Cell>
      <Table.Cell className="truncate">
        <Person name={d.owner} />
      </Table.Cell>
    </Table.Row>
  );
}

function ProgramDashboard() {
  const program = Route.useLoaderData();
  const [family, setFamily] = useState("All");
  const [statusFilter, setStatusFilter] = useState<ControlStatus | "All">("All");

  const matrix = useControlMatrix(program.id);
  const coverage = useMemo(() => coverageFromRows(matrix), [matrix]);
  const outlook = useMemo(() => gateOutlook(program, matrix), [program, matrix]);
  const posture = useMemo(() => programPosture(program), [program]);
  const openFindings = useMemo(() => findingsForProgram(program.id).filter(isOpen), [program.id]);
  const programPoams = useMemo(
    () => poamItems.filter((p) => p.program === program.id),
    [program.id],
  );
  const deadlines = useMemo(
    () => programDeadlines(program, matrix, programPoams),
    [program, matrix, programPoams],
  );

  const gates = useMemo(() => gatesForProgram(program.id), [program.id]);
  const byPhase = useMemo(
    () =>
      lifecyclePhases
        .map((phase) => {
          const inPhase = gates.filter((g) => g.phase === phase);
          return {
            phase,
            total: inPhase.length,
            done: inPhase.filter((g) => g.status === "Complete").length,
          };
        })
        .filter((p) => p.total > 0),
    [gates],
  );

  const overdueGates = outlook.remaining.filter((g) => g.daysOut !== null && g.daysOut < 0).length;
  const catI = openFindings.filter((f) => f.mitigatedSeverity === "CAT I").length;
  const next = outlook.next;

  const families = useMemo(
    () =>
      [...new Map(matrix.map((r) => [r.family, r.familyName])).entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    [matrix],
  );

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/programs/$programId"
            backParams={{ programId: program.id }}
            id={program.id}
            title={`${program.name} — dashboard`}
            meta={`${program.baseline} · ${catalogVersion} · ${coverage.total} tailored controls`}
            actions={
              <Link
                to="/programs/$programId"
                params={{ programId: program.id }}
                className="inline-flex items-center gap-0.5 text-[12.5px] text-primary hover:underline"
              >
                Program record
                <ChevronRight className="size-3.5" />
              </Link>
            }
          />
        }
        tabs={<div className="border-b border-border" />}
      >
        <Section
          title="Where the program stands"
          description="Everything below is derived from the live matrix, the lifecycle gates and the register."
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 pt-4 md:grid-cols-3 lg:grid-cols-5">
            <DashboardStat
              label="Control coverage"
              value={`${coverage.pct}%`}
              hint={`${coverage.satisfied} of ${coverage.total} satisfied`}
              tone={coverage.pct >= 90 ? "success" : coverage.pct >= 75 ? "neutral" : "warning"}
            >
              <Progress.Stacked
                height={4}
                segments={coverage.segments.map((s) => ({
                  key: s.key,
                  value: s.value,
                  tone: s.tone,
                  title: `${s.label} — ${s.value}`,
                }))}
              />
            </DashboardStat>
            <DashboardStat
              label="Not satisfied"
              value={coverage.total - coverage.satisfied}
              hint={`${coverage.segments[2]?.value ?? 0} other than satisfied · ${coverage.segments[1]?.value ?? 0} partial`}
              tone={(coverage.segments[2]?.value ?? 0) > 0 ? "warning" : "neutral"}
            />
            <DashboardStat
              label="Open findings"
              value={openFindings.length}
              hint={catI ? `${catI} CAT I` : "No CAT I open"}
              tone={catI > 0 ? "danger" : openFindings.length ? "warning" : "success"}
            />
            <DashboardStat
              label="POA&M open"
              value={posture.poamOpen}
              hint={posture.poamOverdue ? `${posture.poamOverdue} overdue` : "None overdue"}
              tone={posture.poamOverdue > 0 ? "danger" : "neutral"}
            />
            <DashboardStat
              label="Gates remaining"
              value={`${outlook.remaining.length}`}
              hint={
                next
                  ? `Next: ${next.gate.id} ${next.daysOut !== null && next.daysOut < 0 ? `${Math.abs(next.daysOut)}d overdue` : `in ${next.daysOut}d`}`
                  : "All gates closed"
              }
              tone={overdueGates > 0 ? "danger" : "neutral"}
            >
              <Progress
                value={outlook.total ? (outlook.completed / outlook.total) * 100 : 0}
                tone={overdueGates > 0 ? "danger" : "success"}
              />
            </DashboardStat>
          </div>
        </Section>

        <CoverageBand
          coverage={coverage}
          baseline={`${program.baseline} — ${program.impact} impact`}
          onSelectFamily={(f) => {
            setFamily(f);
            setStatusFilter("All");
          }}
          onSelectSegment={(key) => {
            const map: Record<string, ControlStatus> = {
              satisfied: "Satisfied",
              partial: "Partial",
              other: "Other than satisfied",
              notAssessed: "Not assessed",
            };
            setStatusFilter(map[key] ?? "All");
            setFamily("All");
          }}
        />

        <FamilyCoverageTable
          coverage={coverage}
          onSelectFamily={(f) => {
            setFamily(f);
            setStatusFilter("All");
          }}
        />

        <Section
          title="Remaining gates"
          description={`${outlook.completed} of ${outlook.total} closed. A gate cannot pass while the controls under it are other than satisfied.`}
          action={
            <Link
              to="/programs/$programId"
              params={{ programId: program.id }}
              className="text-12 text-primary hover:underline"
            >
              Full timeline
            </Link>
          }
        >
          <div className="flex flex-wrap gap-x-6 gap-y-2 py-3">
            {byPhase.map((p) => (
              <span key={p.phase} className="flex min-w-[136px] items-center gap-2">
                <span className="w-16 shrink-0">
                  <Progress.Stacked
                    height={4}
                    segments={[
                      { key: "d", value: p.done, tone: "success" },
                      { key: "r", value: p.total - p.done, tone: "neutral" },
                    ]}
                  />
                </span>
                <span className="truncate text-12 text-muted-foreground">{p.phase}</span>
                <span className="tnum text-12">
                  {p.done}/{p.total}
                </span>
              </span>
            ))}
          </div>

          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: "72px" }} />
              <col />
              <col style={{ width: "128px" }} />
              <col style={{ width: "104px" }} />
              <col style={{ width: "104px" }} />
              <col style={{ width: "96px" }} />
              <col style={{ width: "128px" }} />
            </colgroup>
            <thead>
              <tr>
                <Table.Header>Gate</Table.Header>
                <Table.Header>Name</Table.Header>
                <Table.Header>Kind</Table.Header>
                <Table.Header>Status</Table.Header>
                <Table.Header className="text-right">Planned</Table.Header>
                <Table.Header className="text-right">Timing</Table.Header>
                <Table.Header>Blocking</Table.Header>
              </tr>
            </thead>
            <tbody>
              {outlook.remaining.map(({ gate, daysOut, tone, blockers }) => (
                <Table.Row key={gate.id}>
                  <Table.Cell>
                    <span className="flex items-center gap-1.5">
                      <Dot tone={tone} />
                      <Id>{gate.id}</Id>
                    </span>
                  </Table.Cell>
                  <Table.Cell className="truncate" title={gate.cyberGate}>
                    {gate.name}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge tone={gateKindTone[gate.kind]} size="xs">
                      {gate.kind}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge tone={tone} size="xs">
                      {gate.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="tnum text-right">{gate.planned}</Table.Cell>
                  <Table.Cell
                    className={cn("tnum text-right", tone === "danger" ? "text-danger" : "")}
                  >
                    {daysOut === null
                      ? "—"
                      : daysOut < 0
                        ? `${Math.abs(daysOut)}d overdue`
                        : `${daysOut}d out`}
                  </Table.Cell>
                  <Table.Cell className="truncate">
                    {blockers ? `${blockers} controls open` : <Person name={gate.owner} />}
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Section>

        <Section
          title="Next RMF deadlines"
          description="One calendar: gates, POA&M commitments and dated control remediation, soonest first."
        >
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: "92px" }} />
              <col style={{ width: "80px" }} />
              <col />
              <col style={{ width: "220px" }} />
              <col style={{ width: "104px" }} />
              <col style={{ width: "96px" }} />
              <col style={{ width: "128px" }} />
            </colgroup>
            <thead>
              <tr>
                <Table.Header>ID</Table.Header>
                <Table.Header>Kind</Table.Header>
                <Table.Header>What is due</Table.Header>
                <Table.Header>Context</Table.Header>
                <Table.Header className="text-right">Date</Table.Header>
                <Table.Header className="text-right">Timing</Table.Header>
                <Table.Header>Owner</Table.Header>
              </tr>
            </thead>
            <tbody>
              {deadlines.map((d) => (
                <DeadlineRow key={`${d.kind}-${d.id}`} programId={program.id} d={d} />
              ))}
            </tbody>
          </Table>
        </Section>

        <ControlMatrixSection
          programId={program.id}
          rows={matrix}
          family={family}
          onFamily={setFamily}
          status={statusFilter}
          onStatus={setStatusFilter}
          families={families}
        />
      </ShowPage>
    </Shell>
  );
}
