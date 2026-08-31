import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { ChevronDown, ChevronRight, Lock, MoreHorizontal, Pencil } from "lucide-react";

import { CdrPackageModal, DigitalThreadSection } from "@/components/app/digital-thread";
import { InheritChip } from "@/components/app/inheritance";
import { LifecycleSection } from "@/components/app/lifecycle";
import { Shell } from "@/components/app/shell";
import { TailoringSection } from "@/components/app/tailoring";
import { AuthorizationSection } from "@/components/app/authorization";
import { VerificationSection } from "@/components/app/verification";
import { TeamSection } from "@/components/app/team";
import { LockedNotice, OpenWorkSection } from "@/components/app/program-state";
import { CoverageBand, MilestoneTrack } from "@/components/app/coverage";
import { ControlMatrixSection, FamilyCoverageTable } from "@/components/app/control-matrix";
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
import {
  Badge,
  Button,
  EmptyState,
  Kbd,
  Menu,
  MenuItem,
  MenuLabel,
  Person,
  Toolbar,
  Dot,
  Field,
  Input,
  KeyValue,
  RailGroup,
  Meter,
  Modal,
  Mono,
  RecordHeader,
  Section,
  Select,
  ShowPage,
  Table,
  TabStrip,
  Td,
  Textarea,
  Th,
  Tr,
} from "@/components/app/ui";
import {
  controlFamilies,
  programControls,
  programStatuses,
  programStatusTone,
  programs,
} from "@/lib/grc-data";
import { poamItems as registerPoams } from "@/lib/register";
import { statusTone } from "@/lib/spine";
import { programState, stages, type Stage } from "@/lib/program-stage";
import { peopleForProgram, personById, workstreamsForProgram } from "@/lib/people";
import { inheritanceForProgram, staleThresholdDays } from "@/lib/reusable-components";

export const Route = createFileRoute("/programs/$programId")({
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
  "Overview" | "Controls" | "Timeline" | "Findings" | "Evidence" | "POA&M" | "Team" | "Activity";

const tabOrder: Tab[] = [
  "Overview",
  "Controls",
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
  const state = useMemo(() => programState(program), [program]);
  const [tab, setTab] = useState<Tab>("Overview");
  const [stageFilter, setStageFilter] = useState<Stage | null>(null);
  const teamSize = useMemo(() => peopleForProgram(program.id).length, [program.id]);
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
  const matrixFamilies = useMemo(
    () =>
      [...new Map(matrix.map((r) => [r.family, r.familyName])).entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    [matrix],
  );

  const posture = useMemo(() => programPosture(program), [program]);
  const coverage = useMemo(() => coverageFromRows(matrix), [matrix]);
  const outlook = useMemo(() => gateOutlook(program, matrix), [program, matrix]);
  const milestones = useMemo(() => programMilestones(program), [program]);
  const openFindings = useMemo(() => findingsForProgram(program.id).filter(isOpen), [program.id]);
  const programWorkstreams = useMemo(() => workstreamsForProgram(program.id), [program.id]);
  const feed = useMemo(() => programActivity(program), [program]);
  const navigate = useNavigate();
  const actions = useMemo(() => nextActions(program), [program]);

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
      <RailGroup
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
          <Mono>{program.id}</Mono>
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
      </RailGroup>

      <RailGroup title="Lifecycle">
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
                <MenuLabel>Jump to stage</MenuLabel>
                {stages.map((s) => (
                  <MenuItem
                    key={s}
                    selected={s === (stageFilter ?? state.currentStage)}
                    onSelect={() => {
                      selectStage(s === stageFilter ? null : s);
                      close();
                    }}
                  >
                    {s}
                  </MenuItem>
                ))}
              </>
            )}
          </Menu>
        </KeyValue>
        <KeyValue label="Current gate">
          {state.currentGate ? (
            <span className="flex items-center gap-1.5">
              <Mono className="text-muted-foreground">{state.currentGate.id}</Mono>
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
      </RailGroup>

      <RailGroup title="About">
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
      </RailGroup>

      <RailGroup title="Categorization">
        <KeyValue label="Impact">{program.impact}</KeyValue>
        <KeyValue label="Confidentiality">{program.confidentiality}</KeyValue>
        <KeyValue label="Integrity">{program.integrity}</KeyValue>
        <KeyValue label="Availability">{program.availability}</KeyValue>
      </RailGroup>

      <RailGroup title="Posture">
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
          <span className="tnum">{posture.inheritedControls} controls</span>
        </KeyValue>
      </RailGroup>

      <RailGroup title="Authorization">
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
      </RailGroup>

      <RailGroup title="Inherits from">
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
      </RailGroup>

      <RailGroup title="Linked records">
        <div className="space-y-1 text-[12.5px]">
          <Link
            to="/programs/$programId/dashboard"
            params={{ programId: program.id }}
            className="block text-primary hover:underline"
          >
            Program dashboard
          </Link>
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
      </RailGroup>
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
                      <MenuItem
                        onSelect={() => {
                          palette.setOpen(true);
                          close();
                        }}
                      >
                        Command palette
                        <Kbd>⌘K</Kbd>
                      </MenuItem>
                      <MenuItem
                        onSelect={() => {
                          setCdrOpen(true);
                          close();
                        }}
                      >
                        Export CDR package
                      </MenuItem>
                      <MenuItem
                        onSelect={() => {
                          setAssessing(true);
                          close();
                        }}
                      >
                        Record assessment
                      </MenuItem>
                      <MenuItem onSelect={close}>Duplicate program</MenuItem>
                      <MenuItem onSelect={close}>Archive</MenuItem>
                    </>
                  )}
                </Menu>
              </>
            }
          />
        }
        tabs={
          <TabStrip
            items={(
              [
                ["Overview", null],
                ["Controls", coverage.segments[2]?.value || null],
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
            <TailoringSection programId={program.id} programOwner={program.owner} />

            <FamilyCoverageTable
              coverage={coverage}
              onSelectFamily={(f) => {
                setFamily(f);
                setStatusFilter("All");
              }}
            />

            <ControlMatrixSection
              programId={program.id}
              rows={matrix}
              family={family}
              onFamily={setFamily}
              status={statusFilter}
              onStatus={setStatusFilter}
              families={matrixFamilies}
            />
          </>
        ) : null}

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

        {tab === "Findings" ? <VerificationSection programName={program.name} /> : null}

        {tab === "Evidence" ? (
          <>
            <LifecycleSection programId={program.id} programName={program.name} />
            <DigitalThreadSection programId={program.id} programName={program.name} />
          </>
        ) : null}

        {tab === "POA&M" ? (
          <>
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
                      <Th>ID</Th>
                      <Th>Weakness</Th>
                      <Th>Status</Th>
                      <Th>Owner</Th>
                      <Th className="text-right">Scheduled</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {programPoams.map((p) => (
                      <Tr key={p.id}>
                        <Td>
                          <Link
                            to="/register/poam/$poamId"
                            params={{ poamId: p.id }}
                            className="text-primary hover:underline"
                          >
                            <Mono className="text-primary">{p.id}</Mono>
                          </Link>
                        </Td>
                        <Td className="truncate font-medium">{p.title}</Td>
                        <Td>
                          <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                        </Td>
                        <Td className="truncate">
                          <Person name={p.owner} />
                        </Td>
                        <Td className="tnum text-right text-muted-foreground">
                          {p.scheduledCompletion}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Section>
          </>
        ) : null}

        {tab === "Activity" ? (
          <>
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
