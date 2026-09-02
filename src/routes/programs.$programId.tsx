import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { ChevronDown, ChevronRight, Lock, MoreHorizontal, Pencil } from "lucide-react";

import { CdrPackageModal, DigitalThreadSection } from "@/components/app/digital-thread";
import { InheritChip } from "@/components/app/inheritance";
import { LifecycleSection } from "@/components/app/lifecycle";
import {
  Badge,
  Button,
  Kbd,
  Menu,
  Person,
  Toolbar,
  Dot,
  Field,
  Input,
  KeyValue,
  Meter,
  Select,
  Table,
  Textarea,
  Id,
  Tabs,
} from "@/ds/primitives";
import { EmptyState, Modal, RecordHeader, Section, ShowPage } from "@/ds/patterns";
import { Inspector } from "@/ds/shapes";
import { Shell } from "@/ds/shell";
import { TailoringSection } from "@/components/app/tailoring";
import { AuthorizationSection } from "@/components/app/authorization";
import { VerificationSection } from "@/components/app/verification";
import { TeamSection } from "@/components/app/team";
import { LockedNotice, OpenWorkSection } from "@/components/app/program-state";
import { CoverageBand, MilestoneTrack } from "@/components/app/coverage";
import { SctmMatrixSection } from "@/components/app/sctm-matrix";
import { ControlBoard } from "@/components/app/control-board";
import { GateOutlookSection, RmfTimeline } from "@/components/app/rmf-timeline";
import { useControlMatrix, type ControlStatus } from "@/lib/control-matrix";
import { ActivityTimeline } from "@/components/app/activity-timeline";
import { InlineSelect, InlineText } from "@/components/app/inline-edit";
import { saveProgramField } from "@/lib/program-save";
import { findingsForProgram, nextActions, programPosture } from "@/lib/program-actions";
import { programActivity } from "@/lib/program-activity";
import { coverageFromRows, gateOutlook, programMilestones } from "@/lib/program-coverage";
import { isOpen } from "@/lib/findings";
import { CommandPalette, useCommandPalette } from "@/components/app/command-palette";
import { programCommands } from "@/lib/program-commands";
import { NewRequirementModal } from "@/components/app/requirement-forms";
import { ScopeTable } from "@/components/app/scopes";
import { RequirementTable } from "@/components/app/requirements";
import { programControls, programStatuses, programStatusTone, programs } from "@/lib/grc-data";
import { allocationsFor, requirementsForProgram, useRequirementsVersion } from "@/lib/requirements";
import { rollupControlSet, scopesForProgram, useScopesVersion } from "@/lib/scopes";
import { poamItems as registerPoams } from "@/lib/register";
import { statusTone } from "@/lib/spine";
import { programState, stages, type Stage } from "@/lib/program-stage";
import { peopleForProgram, personById, workstreamsForProgram } from "@/lib/people";
import { inheritanceForProgram } from "@/lib/inheritance";
import { staleThresholdDays } from "@/lib/reusable-components";

export const Route = createFileRoute("/programs/$programId")({
  // Read-only entry point: a record page links back to the tab the reader came
  // from. Tab clicks deliberately do NOT write here — the tab stays local
  // state, so the eight existing `setTab` call sites are unaffected.
  validateSearch: (search: Record<string, unknown>): { tab?: Tab | undefined } => {
    const raw = String(search["tab"] ?? "");
    return { tab: tabOrder.find((t) => t.toLowerCase() === raw.toLowerCase()) };
  },
  loader: ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    return program;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Program"} — Equinox GRC` },
      {
        name: "description",
        content:
          loaderData?.summary ??
          "Program detail: FIPS-199 categorization, NIST SP 800-53 control families, assessment results and authorization history.",
      },
      { property: "og:title", content: `${loaderData?.name ?? "Program"} — Equinox GRC` },
      {
        property: "og:description",
        content:
          loaderData?.summary ??
          "System assessment program with NIST SP 800-53 control families and results.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgramDetail,
});

/** Object-oriented tabs. The workflow lives in the lifecycle bar, not here. */
type Tab =
  | "Overview"
  | "Controls"
  | "Controls v2"
  | "Systems"
  | "Requirements"
  | "Timeline"
  | "Findings"
  | "Evidence"
  | "POA&M"
  | "Team"
  | "Activity";

const tabOrder: Tab[] = [
  "Overview",
  "Controls",
  "Controls v2",
  "Systems",
  "Requirements",
  "Timeline",
  "Findings",
  "Evidence",
  "POA&M",
  "Team",
  "Activity",
];

/** Where each lifecycle stage's work actually lives. */
const stageHome: Record<Stage, Tab> = {
  Scope: "Controls",
  Build: "Evidence",
  Assess: "Findings",
  Authorize: "Activity",
  Operate: "POA&M",
};

/** Coverage-band segment keys map straight onto matrix statuses. */
const segmentStatus: Record<string, ControlStatus> = {
  satisfied: "Satisfied",
  partial: "Partial",
  other: "Other than satisfied",
  notAssessed: "Not assessed",
};

function ProgramDetail() {
  const program = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>(Route.useSearch().tab ?? "Overview");
  const [stageFilter, setStageFilter] = useState<Stage | null>(null);
  const teamSize = useMemo(() => peopleForProgram(program.id).length, [program.id]);
  const scopesVersion = useScopesVersion();
  const scopeRows = useMemo(() => scopesForProgram(program.id), [program.id, scopesVersion]);
  const rollup = useMemo(() => rollupControlSet(program.id), [program.id, scopesVersion]);
  const requirementsVersion = useRequirementsVersion();
  const requirementRows = useMemo(
    () => requirementsForProgram(program.id),
    [program.id, requirementsVersion],
  );
  const [newRequirement, setNewRequirement] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [status, setStatus] = useState(program.status);
  const [owner, setOwner] = useState(program.owner);
  const palette = useCommandPalette();
  const [cdrOpen, setCdrOpen] = useState(false);
  const [family, setFamily] = useState("All");
  const [statusFilter, setStatusFilter] = useState<ControlStatus | "All">("All");
  const [fields, setFields] = useState({
    acronym: program.acronym,
    system: program.system,
    assessor: program.assessor,
  });
  const saveField = (field: string) => (value: string) =>
    saveProgramField({ programId: program.id, field, value });
  const required = (label: string) => (v: string) =>
    v.trim().length === 0 ? `${label} is required` : null;

  const inheritance = useMemo(() => inheritanceForProgram(program.id), [program.id]);
  const inheritedComponents = useMemo(
    () => [...new Set([...inheritance.values()].map((v) => v.component))],
    [inheritance],
  );
  const programPoams = useMemo(
    () => registerPoams.filter((p) => p.program === program.id),
    [program.id],
  );

  const matrix = useControlMatrix(program.id);

  // `matrix` is load-bearing in both dep lists: posture and the gate blocker
  // read the same rows the coverage card does, so an inline status edit moves
  // the rail with the card instead of leaving them 61 controls apart.
  const posture = useMemo(() => programPosture(program, matrix), [program, matrix]);
  // The Blocker reads the same deficiency count as the tab badge and the
  // coverage legend; `program.controlsFailing` is the last signed package
  // figure, not what this screen is showing.
  const state = useMemo(
    () => programState(program, undefined, posture.controlsFailing),
    [program, posture.controlsFailing],
  );
  const coverage = useMemo(() => coverageFromRows(matrix), [matrix]);
  const outlook = useMemo(() => gateOutlook(program, matrix), [program, matrix]);
  const milestones = useMemo(() => programMilestones(program), [program]);
  const openFindings = useMemo(() => findingsForProgram(program.id).filter(isOpen), [program.id]);
  const programWorkstreams = useMemo(() => workstreamsForProgram(program.id), [program.id]);
  const feed = useMemo(() => programActivity(program), [program]);
  const navigate = useNavigate();
  const actions = useMemo(() => nextActions(program, matrix), [program, matrix]);

  const ownerOptions = useMemo(() => {
    const names = peopleForProgram(program.id).map((p) => p.name);
    return [...new Set([program.owner, ...names])].slice(0, 8);
  }, [program.id, program.owner]);

  const locked = stageFilter !== null && state.stageStatus[stageFilter] === "locked";

  const runPrimary = () => {
    if (state.primaryAction === "Generate CDR package") setCdrOpen(true);
    else if (state.primaryAction === "Record assessment result") setAssessing(true);
  };

  const selectStage = (s: Stage | null) => {
    setStageFilter(s);
    if (s) setTab(stageHome[s]);
  };

  useEffect(() => {
    let armed = false;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (e.key === "g") {
        armed = true;
        return;
      }
      if (armed) {
        const i = Number(e.key);
        if (i >= 1 && i <= tabOrder.length) setTab(tabOrder[i - 1]!);
        armed = false;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const commands = useMemo(
    () =>
      programCommands(program, {
        goTab: (t) => setTab(t as Tab),
        setStage: (st) => selectStage(st),
        recordAssessment: () => setAssessing(true),
        generateCdr: () => setCdrOpen(true),
        openRecord: (to, params) => navigate({ to, params: params as never }),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [program],
  );

  const rail = (
    <>
      <Inspector.Group
        title="Properties"
        action={
          <button
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Edit properties"
          >
            <Pencil className="size-3.5" />
          </button>
        }
      >
        <KeyValue label="Program ID">
          <Id>{program.id}</Id>
        </KeyValue>
        <KeyValue label="Acronym">
          <InlineText
            value={fields.acronym}
            onChange={(v) => setFields((f) => ({ ...f, acronym: v }))}
            validate={(v) =>
              v.trim().length === 0
                ? "Acronym is required"
                : /^[A-Za-z0-9-]{2,12}$/.test(v.trim())
                  ? null
                  : "2–12 letters, numbers or dashes"
            }
            save={saveField("Acronym")}
          />
        </KeyValue>
        <KeyValue label="System type">{program.type}</KeyValue>
        <KeyValue label="Environment">{program.environment}</KeyValue>
        <KeyValue label="Owner">
          <InlineSelect
            label="Owner"
            value={owner}
            options={ownerOptions}
            onChange={setOwner}
            save={saveField("Owner")}
            render={(v) => <Person name={v} />}
          />
        </KeyValue>
        <KeyValue label="Status">
          <InlineSelect
            label="Status"
            value={status}
            options={programStatuses}
            onChange={setStatus}
            save={saveField("Status")}
            render={(v) => <Badge tone={programStatusTone[v]}>{v}</Badge>}
          />
        </KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Lifecycle">
        <KeyValue label="Stage">
          <Menu
            align="start"
            width={190}
            trigger={({ toggle }) => (
              <button
                type="button"
                onClick={toggle}
                className="-mx-1 flex w-[calc(100%+8px)] items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:bg-muted"
              >
                <Dot tone={state.blockerTone === "danger" ? "danger" : "info"} />
                <span className="truncate">{stageFilter ?? state.currentStage}</span>
                <ChevronDown className="ml-auto size-3 shrink-0 text-muted-foreground" />
              </button>
            )}
          >
            {(close) => (
              <>
                <Menu.Label>Jump to stage</Menu.Label>
                {stages.map((s) => (
                  <Menu.Item
                    key={s}
                    selected={s === (stageFilter ?? state.currentStage)}
                    onSelect={() => {
                      selectStage(s === stageFilter ? null : s);
                      close();
                    }}
                  >
                    {s}
                  </Menu.Item>
                ))}
              </>
            )}
          </Menu>
        </KeyValue>
        <KeyValue label="Current gate">
          {state.currentGate ? (
            <span className="flex items-center gap-1.5">
              <Id className="text-muted-foreground">{state.currentGate.id}</Id>
              <span className="truncate">{state.currentGate.name}</span>
            </span>
          ) : (
            "—"
          )}
        </KeyValue>
        <KeyValue label="Timing">
          {state.daysOut === null ? (
            "—"
          ) : (
            <span
              className={
                state.daysOut < 0
                  ? "tnum text-danger"
                  : state.daysOut < 30
                    ? "tnum text-warning"
                    : "tnum"
              }
            >
              {state.daysOut < 0 ? `${Math.abs(state.daysOut)}d overdue` : `${state.daysOut}d out`}
            </span>
          )}
        </KeyValue>
        <KeyValue label="Blocker">
          {state.blocker ? (
            <span className="block text-12 font-medium text-danger">{state.blocker}</span>
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </KeyValue>
      </Inspector.Group>

      <Inspector.Group title="About">
        <p className="pb-1 pt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
          {program.summary}
        </p>
        <KeyValue label="System">
          <InlineText
            value={fields.system}
            onChange={(v) => setFields((f) => ({ ...f, system: v }))}
            validate={required("System")}
            save={saveField("System")}
          />
        </KeyValue>
        <KeyValue label="Updated">{program.updated}</KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Categorization">
        <KeyValue label="Impact">{program.impact}</KeyValue>
        <KeyValue label="Confidentiality">{program.confidentiality}</KeyValue>
        <KeyValue label="Integrity">{program.integrity}</KeyValue>
        <KeyValue label="Availability">{program.availability}</KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Posture">
        <KeyValue label="Controls">
          <span className="tnum">
            {posture.controlsSatisfied}/{posture.controlsTotal} satisfied
          </span>
        </KeyValue>
        <KeyValue label="Open findings">
          <span className={posture.catI > 0 ? "tnum text-danger" : "tnum"}>
            {posture.findingsOpen}
            {posture.catI ? ` · ${posture.catI} CAT I` : ""}
          </span>
        </KeyValue>
        <KeyValue label="POA&M open">
          <span className={posture.poamOverdue > 0 ? "tnum text-danger" : "tnum"}>
            {posture.poamOpen}
            {posture.poamOverdue ? ` · ${posture.poamOverdue} overdue` : ""}
          </span>
        </KeyValue>
        <KeyValue label="Evidence stale">
          <span className={posture.evidenceStale > 0 ? "tnum text-warning" : "tnum"}>
            {posture.evidenceStale}
          </span>
        </KeyValue>
        <KeyValue label="Inherited">
          {/*
            The coverage card above this rail counts matrix rows the resolution
            designated Common; the inheritance page counts every resolved offer,
            including the Hybrid and System-Specific ones this system still owes
            work on. Both numbers are true and they are not the same number, so
            this row prints them together off the same two sources rather than
            giving the bare word "Inherited" a second, larger value.
          */}
          <span
            className="tnum"
            title={`${coverage.inherited} of ${inheritance.size} resolved offers are fully inherited (Common). The rest are Hybrid or System-Specific and still carry a consumer obligation.`}
          >
            {coverage.inherited} of {inheritance.size} resolved
          </span>
        </KeyValue>
      </Inspector.Group>

      {/*
        Ten sub-pages now hang off this record. Listed flat they read as an
        undifferentiated stack of blue text, and the numbers in "Posture" got
        lost among them — so the navigation is its own group, clustered by the
        question each page answers: what is the system made of, was it assessed,
        and is it still what we authorized.
      */}
      <Inspector.Group title="Program views">
        <div className="space-y-2.5 pt-0.5">
          <div>
            <div className="pb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80">
              System
            </div>
            <div className="space-y-1 text-[12.5px]">
              <Link
                to="/programs/$programId/composition"
                params={{ programId: program.id }}
                className="block text-primary hover:underline"
              >
                System composition
              </Link>
              <Link
                to="/programs/$programId/baseline"
                params={{ programId: program.id }}
                className="block text-primary hover:underline"
              >
                Configuration baseline
              </Link>
            </div>
          </div>

          <div>
            <div className="pb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80">
              Assessment
            </div>
            <div className="space-y-1 text-[12.5px]">
              <Link
                to="/programs/$programId/sctm"
                params={{ programId: program.id }}
                className="block text-primary hover:underline"
              >
                Traceability matrix
              </Link>
              <Link
                to="/programs/$programId/inheritance"
                params={{ programId: program.id }}
                search={{ tab: undefined, control: undefined }}
                className="block text-primary hover:underline"
              >
                Inheritance resolution
              </Link>
              <Link
                to="/programs/$programId/te-phases"
                params={{ programId: program.id }}
                search={{ tab: undefined }}
                className="block text-primary hover:underline"
              >
                Cyber T&amp;E phases
              </Link>
              <Link
                to="/programs/$programId/ingestion"
                params={{ programId: program.id }}
                className="block text-primary hover:underline"
              >
                Scanner ingestion
              </Link>
            </div>
          </div>

          <div>
            <div className="pb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80">
              Operate and report
            </div>
            <div className="space-y-1 text-[12.5px]">
              <Link
                to="/programs/$programId/dashboard"
                params={{ programId: program.id }}
                className="block text-primary hover:underline"
              >
                Program dashboard
              </Link>
              <Link
                to="/programs/$programId/conmon"
                params={{ programId: program.id }}
                search={{ tab: undefined }}
                className="block text-primary hover:underline"
              >
                Continuous monitoring
              </Link>
              <Link
                to="/programs/$programId/risk"
                params={{ programId: program.id }}
                search={{ tab: undefined }}
                className="block text-primary hover:underline"
              >
                Residual risk scoring
              </Link>
              <Link
                to="/programs/$programId/export"
                params={{ programId: program.id }}
                search={{ tab: undefined }}
                className="block text-primary hover:underline"
              >
                OSCAL, eMASS and transfer
              </Link>
            </div>
          </div>
        </div>
      </Inspector.Group>

      <Inspector.Group title="Authorization">
        <KeyValue label="Baseline">{program.baseline}</KeyValue>
        <KeyValue label="Assessor">
          <InlineText
            value={fields.assessor}
            onChange={(v) => setFields((f) => ({ ...f, assessor: v }))}
            validate={required("Assessor")}
            save={saveField("Assessor")}
          />
        </KeyValue>
        <KeyValue label="AO">{program.authorizingOfficial}</KeyValue>
        <KeyValue label="Authorized">{program.authorized}</KeyValue>
        <KeyValue label="Expires">{program.expires}</KeyValue>
        <KeyValue label="Updated">{program.updated}</KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Inherits from">
        <div className="space-y-1.5 text-[12.5px]">
          {inheritedComponents.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2">
              <Link
                to="/library/components/$componentKey"
                params={{ componentKey: c.key }}
                className="truncate text-primary hover:underline"
              >
                {c.name}
              </Link>
              {c.sourceProgramId && !c.sourceAccessible ? (
                <Lock
                  className="size-3 shrink-0 text-muted-foreground"
                  aria-label="Source system not in your enclave"
                />
              ) : null}
            </div>
          ))}
        </div>
      </Inspector.Group>

      <Inspector.Group title="Linked records">
        <div className="space-y-1 text-[12.5px]">
          <Link to="/register" className="block text-primary hover:underline">
            {programPoams.length} POA&M items
          </Link>
          <Link to="/controls" className="block text-primary hover:underline">
            Control library mappings
          </Link>
          <Link to="/evidence" className="block text-primary hover:underline">
            128 evidence artifacts
          </Link>
        </div>
      </Inspector.Group>
    </>
  );

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/programs"
            id={program.id}
            title={program.name}
            actions={
              <>
                <Link to="/programs/$programId/dashboard" params={{ programId: program.id }}>
                  <Button variant="secondary" size="sm">
                    Dashboard
                  </Button>
                </Link>

                <Button variant="primary" size="sm" onClick={runPrimary}>
                  {state.primaryAction}
                </Button>

                <Menu
                  align="end"
                  width={200}
                  trigger={({ toggle }) => (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-7 px-0"
                      aria-label="More actions"
                      onClick={toggle}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  )}
                >
                  {(close) => (
                    <>
                      <Menu.Item
                        onSelect={() => {
                          palette.setOpen(true);
                          close();
                        }}
                      >
                        Command palette
                        <Kbd>⌘K</Kbd>
                      </Menu.Item>
                      <Menu.Item
                        onSelect={() => {
                          setCdrOpen(true);
                          close();
                        }}
                      >
                        Export CDR package
                      </Menu.Item>
                      <Menu.Item
                        onSelect={() => {
                          setAssessing(true);
                          close();
                        }}
                      >
                        Record assessment
                      </Menu.Item>
                      <Menu.Item onSelect={close}>Duplicate program</Menu.Item>
                      <Menu.Item onSelect={close}>Archive</Menu.Item>
                    </>
                  )}
                </Menu>
              </>
            }
          />
        }
        tabs={
          <Tabs
            items={(
              [
                ["Overview", null],
                ["Controls", coverage.segments[2]?.value || null],
                ["Controls v2", null],
                ["Systems", scopeRows.length || null],
                ["Requirements", requirementRows.length || null],
                ["Timeline", outlook.remaining.length || null],
                ["Findings", posture.findingsOpen || null],
                ["Evidence", posture.evidenceStale || null],
                ["POA&M", posture.poamOpen || null],
                ["Team", teamSize],
                ["Activity", null],
              ] as [Tab, number | null][]
            ).map(([key, count]) => ({
              key,
              label: key,
              active: tab === key,
              onSelect: () => setTab(key),
              trailing: count ? (
                <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                  {count}
                </span>
              ) : null,
            }))}
          />
        }
        showRail={tab === "Overview"}
        rail={rail}
      >
        {locked ? <LockedNotice stage={stageFilter!} gate={state.currentGate?.id} /> : null}

        {tab === "Overview" ? (
          <>
            <CoverageBand
              coverage={coverage}
              baseline={`${program.baseline} — ${program.impact}`}
              onSelectFamily={(f) => {
                setFamily(f);
                setStatusFilter("All");
                setTab("Controls");
              }}
              onSelectSegment={(key) => {
                setStatusFilter(segmentStatus[key] ?? "All");
                setFamily("All");
                setTab("Controls");
              }}
            />

            <MilestoneTrack nodes={milestones} onSelect={() => setTab("Timeline")} />

            <GateOutlookSection
              rows={outlook.remaining}
              programId={program.id}
              onSelect={() => setTab("Timeline")}
            />

            <OpenWorkSection
              actions={actions}
              onRun={(a) => {
                if (a.cta === "Record result") setAssessing(true);
                else setTab(a.target);
              }}
            />

            <Section title="Activity">
              <ActivityTimeline programId={program.id} events={feed} />
            </Section>
          </>
        ) : null}

        {tab === "Controls" ? (
          <>
            <Section
              title="Inheritance"
              description="Which common control provider actually satisfies each inherited row, what this program still owes on a shared control, and where an accepted inheritance has drifted from the provider's current assessment."
              action={
                <Link
                  to="/programs/$programId/inheritance"
                  params={{ programId: program.id }}
                  search={{ tab: undefined, control: undefined }}
                  className="inline-flex items-center gap-0.5 text-[12.5px] text-primary hover:underline"
                >
                  Open inheritance
                </Link>
              }
            >
              <p className="pt-2 text-[12.5px] text-muted-foreground">
                {inheritedComponents.length} common control{" "}
                {inheritedComponents.length === 1 ? "provider reaches" : "providers reach"}{" "}
                {program.acronym}. Precedence between overlapping offers, applicability against this
                program's own inventory, and the residual consumer obligations are resolved there.
              </p>
            </Section>

            <Section
              title="Configuration baseline"
              description="The authorized build, the changes proposed against it, and which determinations those changes invalidate. A change the ISSE analysed as having no security impact is recorded and contained — it does not turn the matrix amber."
              action={
                <Link
                  to="/programs/$programId/baseline"
                  params={{ programId: program.id }}
                  className="inline-flex items-center gap-0.5 text-[12.5px] text-primary hover:underline"
                >
                  Open baseline
                </Link>
              }
            >
              <p className="pt-2 text-[12.5px] text-muted-foreground">
                A determination is only as current as the configuration it was taken against. The
                baseline page carries the pin diff, the CM-3(2) security impact analyses, the
                invalidated rows and the retest queue.
              </p>
            </Section>

            <TailoringSection programId={program.id} programOwner={program.owner} />

            <SctmMatrixSection
              programId={program.id}
              family={family}
              onFamily={setFamily}
              status={statusFilter}
              onStatus={setStatusFilter}
            />
          </>
        ) : null}

        {tab === "Controls v2" ? <ControlBoard programId={program.id} /> : null}

        {tab === "Timeline" ? (
          <RmfTimeline
            programId={program.id}
            rows={matrix}
            onOpenControls={(f) => {
              setFamily(f);
              setStatusFilter("All");
              setTab("Controls");
            }}
          />
        ) : null}

        {tab === "Findings" ? (
          <>
            <Section
              title="Cyber test and evaluation"
              description="The six DoD Cybersecurity T&E phases, their entry and exit criteria, the threat scenarios the red team walks and the mission effects those scenarios actually achieved."
              action={
                <Link
                  to="/programs/$programId/te-phases"
                  params={{ programId: program.id }}
                  search={{ tab: undefined }}
                  className="inline-flex items-center gap-0.5 text-[12.5px] text-primary hover:underline"
                >
                  Open T&amp;E phases
                </Link>
              }
            >
              <p className="pt-2 text-[12.5px] text-muted-foreground">
                A phase gate that is a checkbox is worthless. Wherever the platform can already
                judge a criterion it does — off {program.acronym}&apos;s own scan record, SCTM,
                finding register and change log — and the gate page prints the computed sentence and
                the evidence ids behind it rather than a tick.
              </p>
            </Section>

            <Section
              title="Verification"
              description={`Scanner ingest, findings and assessor readiness for ${program.name}.`}
              action={
                <Link
                  to="/programs/$programId/ingestion"
                  params={{ programId: program.id }}
                  className="inline-flex items-center gap-0.5 text-[12.5px] text-primary hover:underline"
                >
                  Open ingestion
                </Link>
              }
            >
              <div className="pt-4">
                <VerificationSection programName={program.name} />
              </div>
            </Section>
          </>
        ) : null}

        {tab === "Evidence" ? (
          <>
            <Section
              title="Interoperability and transfer"
              description="The same body of evidence has to leave this platform three ways: as OSCAL 1.1.2 an assessor can import, as the eMASS CSV column sets a package submission actually requires, and as a hashed bundle that can cross an air gap and be reconciled on the far side."
              action={
                <Link
                  to="/programs/$programId/export"
                  params={{ programId: program.id }}
                  search={{ tab: undefined }}
                  className="inline-flex items-center gap-0.5 text-[12.5px] text-primary hover:underline"
                >
                  Open export
                </Link>
              }
            >
              <p className="pt-2 text-[12.5px] text-muted-foreground">
                Every artifact is generated from {program.acronym}&apos;s live SCTM, composition
                graph and finding register rather than re-keyed, so an export taken twice is byte
                identical and the manifest hash means something. The reconciliation view diffs a
                bundle received from the far side against the one generated here and says, in one
                sentence, what moved.
              </p>
            </Section>

            <LifecycleSection programId={program.id} programName={program.name} />
            <DigitalThreadSection programId={program.id} programName={program.name} />
          </>
        ) : null}

        {tab === "POA&M" ? (
          <>
            <Section
              title="Residual risk"
              description="CAT I/II/III is a severity, not a risk. Every finding carries a 0-100 residual built from severity, mitigation credit, exploitability, exposure, mission impact and evidence currency — with the whole calculation attached to it."
              action={
                <Link
                  to="/programs/$programId/risk"
                  params={{ programId: program.id }}
                  search={{ tab: undefined }}
                  className="inline-flex items-center gap-0.5 text-[12.5px] text-primary hover:underline"
                >
                  Open risk scoring
                </Link>
              }
            >
              <p className="pt-2 text-[12.5px] text-muted-foreground">
                {posture.findingsOpen} open finding
                {posture.findingsOpen === 1 ? " is" : "s are"} scored, banded and ranked there, and
                the register risks show the computed residual beside the number the assessor wrote
                down. Where the two disagree, the disagreement is the finding — the authored value
                is never overwritten.
              </p>
            </Section>

            <Section
              title="POA&M items"
              description="Open commitments for this program. Managed in the register."
              action={
                <Link
                  to="/register"
                  className="inline-flex items-center gap-0.5 text-[12.5px] text-primary hover:underline"
                >
                  Open register
                  <ChevronRight className="size-3.5" />
                </Link>
              }
            >
              {programPoams.length === 0 ? (
                <EmptyState
                  title="No POA&M items"
                  description="Commitments raised against this program will appear here."
                />
              ) : (
                <Table className="table-fixed">
                  <colgroup>
                    <col style={{ width: "96px" }} />
                    <col />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "140px" }} />
                    <col style={{ width: "120px" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <Table.Header>ID</Table.Header>
                      <Table.Header>Weakness</Table.Header>
                      <Table.Header>Status</Table.Header>
                      <Table.Header>Owner</Table.Header>
                      <Table.Header className="text-right">Scheduled</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {programPoams.map((p) => (
                      <Table.Row key={p.id}>
                        <Table.Cell>
                          <Link
                            to="/register/poam/$poamId"
                            params={{ poamId: p.id }}
                            className="text-primary hover:underline"
                          >
                            <Id className="text-primary">{p.id}</Id>
                          </Link>
                        </Table.Cell>
                        <Table.Cell className="truncate">{p.title}</Table.Cell>
                        <Table.Cell>
                          <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          <Person name={p.owner} />
                        </Table.Cell>
                        <Table.Cell className="tnum text-right">{p.scheduledCompletion}</Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              )}
            </Section>
          </>
        ) : null}

        {tab === "Systems" ? (
          <ScopeTable scopes={scopeRows} rollup={rollup} programId={program.id} />
        ) : null}

        {tab === "Requirements" ? (
          <>
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setNewRequirement(true)}>
                New requirement
              </Button>
            </div>
            <NewRequirementModal
              open={newRequirement}
              onClose={() => setNewRequirement(false)}
              programId={program.id}
            />
          </>
        ) : null}

        {tab === "Requirements" ? (
          requirementRows.length ? (
            <RequirementTable
              requirements={requirementRows}
              programId={program.id}
              allocationCount={(id) => allocationsFor(id).length}
            />
          ) : (
            <EmptyState
              title="No security requirements"
              description={`${program.id} has no engineering requirements yet. Controls are obligations until a requirement states what the system must do.`}
            />
          )
        ) : null}

        {tab === "Activity" ? (
          <>
            <Section
              title="Continuous monitoring"
              description="After the ATO the question stops being whether this system was ever assessed and becomes whether what is running is still what was authorized. The drift score, the SLCM assessment schedule, evidence freshness against its SLA, scan cadence and POA&M slippage are all computed there."
              action={
                <Link
                  to="/programs/$programId/conmon"
                  params={{ programId: program.id }}
                  search={{ tab: undefined }}
                  className="inline-flex items-center gap-0.5 text-[12.5px] text-primary hover:underline"
                >
                  Open ConMon
                </Link>
              }
            >
              <p className="pt-2 text-[12.5px] text-muted-foreground">
                The timeline below records what happened to {program.acronym}. The ConMon page
                records what has drifted since — an unrecorded configuration change, a determination
                the change invalidated, evidence past its collection interval, an SLCM assessment
                that has gone overdue — each stated with the numbers behind it and the next step.
              </p>
            </Section>

            <AuthorizationSection programId={program.id} programName={program.name} />

            <Section
              title="Activity"
              description="Continuous monitoring events and record changes for this program."
            >
              <ActivityTimeline programId={program.id} events={feed} />
            </Section>
          </>
        ) : null}

        {tab === "Team" ? <TeamSection programId={program.id} /> : null}
      </ShowPage>

      <CommandPalette
        open={palette.open}
        onClose={() => palette.setOpen(false)}
        commands={commands}
        placeholder={`Search ${program.id}…`}
      />

      <CdrPackageModal
        open={cdrOpen}
        onClose={() => setCdrOpen(false)}
        programId={program.id}
        programName={program.name}
      />

      <Modal
        open={assessing}
        onClose={() => setAssessing(false)}
        title="Record a control assessment"
        description={`${program.id} · ${program.baseline}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssessing(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setAssessing(false)}>
              Save assessment
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Control">
              <Select defaultValue="AC-6(9)">
                {programControls.map((c) => (
                  <option key={c.id}>{c.id}</option>
                ))}
              </Select>
            </Field>
            <Field label="Result">
              <Select defaultValue="Other than satisfied">
                <option>Satisfied</option>
                <option>Other than satisfied</option>
                <option>Not applicable</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Assessment method">
              <Select defaultValue="Test">
                <option>Examine</option>
                <option>Interview</option>
                <option>Test</option>
              </Select>
            </Field>
            <Field label="Assessed on">
              <Input type="date" defaultValue="2026-08-27" />
            </Field>
          </div>
          <Field label="Assessor findings" hint="Included verbatim in the SAR export.">
            <Textarea placeholder="Privileged function invocations on the settlement service are not forwarded to the audit sink; sampling of 20 events found 6 missing." />
          </Field>
        </div>
      </Modal>
    </Shell>
  );
}
