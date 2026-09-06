import { Fragment, useMemo, useState, useEffect } from "react";
import { useRecordForm } from "@/lib/record-form";
import { saveProgramCommand, useProgramsVersion } from "@/lib/program-store";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChevronDown, ChevronRight, Lock, Pencil } from "lucide-react";

import { Task } from "@/components/app/task";
import { CdrPackageModal, DigitalThreadSection } from "@/components/app/digital-thread";
import { LifecycleSection } from "@/components/app/lifecycle";
import {
  Breadcrumb,
  AlertDialog,
  Badge,
  Box,
  Button,
  IconButton,
  ButtonGroup,
  Combobox,
  CommandPalette,
  DatePicker,
  Dialog,
  Dot,
  DropdownMenu,
  Editable,
  Empty,
  Field,
  Grid,
  Id,
  Inline,
  Inspector,
  Kbd,
  KeyValue,
  Person,
  Progress,
  RecordHeader,
  Section,
  Select,
  ShowPage,
  Stack,
  Table,
  Tabs,
  Textarea,
  TextLink,
  toast,
  Toolbar,
  useCommandPalette,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { AuthorizationSection } from "@/components/app/authorization";
import { VerificationSection } from "@/components/app/verification";
import { CoverageBand } from "@/components/app/coverage";
import { ControlBoard } from "@/components/app/control-board";
import { RecordActivity } from "@/components/app/record-activity";
import { StageStrip } from "@/components/app/stage-strip";
import { ProgramTasks, TaskRows } from "@/components/app/tasks-section";
import { currentSession } from "@/lib/control-work";
import { stageOf } from "@/lib/stages";
import { tasksForProgram, useTasksVersion } from "@/lib/tasks";
import { useControlMatrix, type ControlStatus } from "@/lib/control-matrix";
import { saveProgramField } from "@/lib/program-save";
import { findingsForProgram, programPosture } from "@/lib/program-actions";
import { coverageFromRows } from "@/lib/program-coverage";
import { isOpen } from "@/lib/findings";
import { programCommands } from "@/lib/program-commands";
import { NewRequirementModal } from "@/components/app/requirement-forms";
import { ScopeTable } from "@/components/app/scopes";
import { RequirementCoverage } from "@/components/app/requirement-coverage";
import { RequirementTable } from "@/components/app/requirements";
import { programControls, programStatuses, programStatusTone, programs } from "@/lib/grc-data";
import { allocationsFor, requirementsForProgram, useRequirementsVersion } from "@/lib/requirements";
import { rollupControlSet, scopesForProgram, useScopesVersion } from "@/lib/scopes";
import { poamItems as registerPoams } from "@/lib/register";
import { statusTone } from "@/lib/spine";
import { programState, type Stage } from "@/lib/program-stage";
import { peopleForProgram, personById, workstreamsForProgram } from "@/lib/people";
import { inheritanceForProgram } from "@/lib/inheritance";
import { staleThresholdDays } from "@/lib/reusable-components";

export const Route = createFileRoute("/programs/$programId")({
  // Read-only entry point: a record page links back to the tab the reader came
  // from. Tab clicks deliberately do NOT write here — the tab stays local
  // state, so the eight existing `setTab` call sites are unaffected.
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: Tab | undefined; peek?: string | undefined } => {
    const raw = String(search["tab"] ?? "");
    // The peek stack: element ids, outermost first. The browser's back is the sheet's back.
    const peek = typeof search["peek"] === "string" && search["peek"] ? search["peek"] : undefined;
    return {
      tab:
        tabOrder.find((t) => t.toLowerCase() === raw.toLowerCase()) ?? tabAlias[raw.toLowerCase()],
      peek,
    };
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
  | "System"
  | "Requirements"
  | "Controls"
  | "Tasks"
  | "Findings"
  | "Evidence"
  | "POA&M"
  | "Activity";

const tabOrder: Tab[] = [
  "Overview",
  "System",
  "Requirements",
  "Controls",
  "Tasks",
  "Findings",
  "Evidence",
  "POA&M",
  "Activity",
];

/** Old tab names still linked from elsewhere land on the tab that holds them now. */
const tabAlias: Record<string, Tab> = {
  systems: "System",
  team: "Overview",
  timeline: "Overview",
  "controls v2": "Controls",
  "controls v3": "Controls",
};

/**
 * The pages that hang off a program. They live in the header's Views menu,
 * grouped by the question each answers: what is the system made of, was it
 * assessed, and is it still what we authorized. Not in the rail — the rail
 * holds properties, not navigation.
 */
const programViews = [
  {
    label: "System",
    items: [
      { label: "System composition", to: "/programs/$programId/composition", search: undefined },
      { label: "Configuration baseline", to: "/programs/$programId/baseline", search: undefined },
    ],
  },
  {
    label: "Assessment",
    items: [
      { label: "Traceability matrix", to: "/programs/$programId/sctm", search: undefined },
      {
        label: "Inheritance resolution",
        to: "/programs/$programId/inheritance",
        search: { tab: undefined, control: undefined },
      },
      {
        label: "Cyber T&E phases",
        to: "/programs/$programId/te-phases",
        search: { tab: undefined },
      },
      { label: "Scanner ingestion", to: "/programs/$programId/ingestion", search: undefined },
    ],
  },
  {
    label: "Operate and report",
    items: [
      { label: "Program dashboard", to: "/programs/$programId/dashboard", search: undefined },
      {
        label: "Continuous monitoring",
        to: "/programs/$programId/conmon",
        search: { tab: undefined },
      },
      {
        label: "Residual risk scoring",
        to: "/programs/$programId/risk",
        search: { tab: undefined },
      },
      {
        label: "OSCAL, eMASS and transfer",
        to: "/programs/$programId/export",
        search: { tab: undefined },
      },
    ],
  },
] as const;

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
  useProgramsVersion();
  const [assessing, setAssessing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const { form, values, formId, formRef } = useRecordForm(
    {
      assessControl: "AC-6(9)",
    },
    (value) => ({ assessControl: value.assessControl }),
  );
  const { assessControl } = values;

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
  const openFindings = useMemo(() => findingsForProgram(program.id).filter(isOpen), [program.id]);
  const programWorkstreams = useMemo(() => workstreamsForProgram(program.id), [program.id]);
  const navigate = useNavigate();

  const ownerOptions = useMemo(() => {
    const names = peopleForProgram(program.id).map((p) => p.name);
    return [...new Set([program.owner, ...names])].slice(0, 8);
  }, [program.id, program.owner]);

  const runPrimary = () => {
    if (state.primaryAction === "Generate CDR package") setCdrOpen(true);
    else if (state.primaryAction === "Record assessment result") setAssessing(true);
  };

  const selectStage = (s: Stage | null) => {
    if (s) setTab(stageHome[s]);
  };
  const me = currentSession().name;
  useTasksVersion();
  const programTasks = tasksForProgram(program.id);
  const openTaskCount = programTasks.filter((t) => t.state !== "Done").length;

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
      <Inspector.Group title="Details">
        <KeyValue label="Status">
          <Editable.Select
            label="Status"
            value={status}
            options={programStatuses}
            onChange={setStatus}
            save={saveField("Status")}
            render={(v) => <Badge tone={programStatusTone[v]}>{v}</Badge>}
          />
        </KeyValue>
        <KeyValue label="Stage">{stageOf(program.id)}</KeyValue>
        <KeyValue label="Owner">
          <Editable.Select
            label="Owner"
            value={owner}
            options={ownerOptions}
            onChange={setOwner}
            save={saveField("Owner")}
            render={(v) => <Person name={v} />}
          />
        </KeyValue>
        <KeyValue label="Acronym">
          <Editable.Text
            label="Acronym"
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
        <KeyValue label="System">
          <Editable.Text
            label="System"
            value={fields.system}
            onChange={(v) => setFields((f) => ({ ...f, system: v }))}
            validate={required("System")}
            save={saveField("System")}
          />
        </KeyValue>
        <KeyValue label="Type">{program.type}</KeyValue>
        <KeyValue label="Environment">{program.environment}</KeyValue>
        <KeyValue label="Next gate">
          {state.currentGate ? (
            <Inline as="span" space="space.075" alignBlock="center">
              <Id className="text-subtle">{state.currentGate.id}</Id>
              <span className="truncate">{state.currentGate.name}</span>
            </Inline>
          ) : (
            "—"
          )}
        </KeyValue>
        <KeyValue label="Updated">{program.updated}</KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Team">
        <KeyValue label="Assessor">
          <Editable.Text
            label="Assessor"
            value={fields.assessor}
            onChange={(v) => setFields((f) => ({ ...f, assessor: v }))}
            validate={required("Assessor")}
            save={saveField("Assessor")}
          />
        </KeyValue>
        <KeyValue label="AO">{program.authorizingOfficial}</KeyValue>
        {programWorkstreams.map((w) => (
          <KeyValue key={w.id} label={w.title} wrap>
            <TextLink>
              <Link to="/workstreams/$workstreamId" params={{ workstreamId: w.id }}>
                {personById.get(w.lead)?.name ?? w.lead}
              </Link>
            </TextLink>
          </KeyValue>
        ))}
      </Inspector.Group>

      <Inspector.Group title="Categorization">
        <KeyValue label="Impact">{program.impact}</KeyValue>
        <KeyValue label="Confidentiality">{program.confidentiality}</KeyValue>
        <KeyValue label="Integrity">{program.integrity}</KeyValue>
        <KeyValue label="Availability">{program.availability}</KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Authorization">
        <KeyValue label="Baseline">{program.baseline}</KeyValue>
        <KeyValue label="Authorized">{program.authorized}</KeyValue>
        <KeyValue label="Expires">{program.expires}</KeyValue>
      </Inspector.Group>

      <Inspector.Group title="Inherits from">
        <Stack className="font-body-small" space="space.075">
          {inheritedComponents.map((c) => (
            <Inline key={c.id} space="space.100" alignBlock="center" spread="space-between">
              <TextLink className="truncate">
                <Link to="/library/components/$componentKey" params={{ componentKey: c.key }}>
                  {c.name}
                </Link>
              </TextLink>
              {c.sourceProgramId && !c.sourceAccessible ? (
                <Lock
                  className="shrink-0 text-subtle size-150"
                  aria-label="Source system not in your enclave"
                />
              ) : null}
            </Inline>
          ))}
        </Stack>
      </Inspector.Group>
    </>
  );

  return (
    <Shell>
      <>
        <ShowPage
          tab={tab}
          onTabChange={(value) => setTab(value as typeof tab)}
          rail={tab === "Overview" ? rail : null}
          header={
            <RecordHeader
              crumbs={
                <>
                  <Breadcrumb.Item asChild>
                    <Link to="/programs">Programs</Link>
                  </Breadcrumb.Item>
                </>
              }
              id={program.id}
              title={program.name}
              actions={
                <>
                  <DropdownMenu
                    align="end"
                    width={240}
                    trigger={
                      <Button variant="secondary" size="small" iconAfter={<ChevronDown />}>
                        Views
                      </Button>
                    }
                  >
                    {(close) => (
                      <>
                        {programViews.map((group) => (
                          <Fragment key={group.label}>
                            <DropdownMenu.Label>{group.label}</DropdownMenu.Label>
                            {group.items.map((v) => (
                              <DropdownMenu.Item
                                key={v.to}
                                onSelect={() => {
                                  close();
                                  navigate({
                                    to: v.to,
                                    params: { programId: program.id },
                                    search: v.search,
                                  } as never);
                                }}
                              >
                                {v.label}
                              </DropdownMenu.Item>
                            ))}
                          </Fragment>
                        ))}
                      </>
                    )}
                  </DropdownMenu>

                  <ButtonGroup>
                    <Button variant="primary" size="small" onClick={runPrimary}>
                      {state.primaryAction}
                    </Button>
                    <DropdownMenu
                      width={200}
                      align="end"
                      trigger={
                        <IconButton
                          variant="primary"
                          size="small"
                          label="More actions"
                          icon={<ChevronDown />}
                        />
                      }
                    >
                      {(close) => (
                        <>
                          <DropdownMenu.Item
                            onSelect={() => {
                              palette.setOpen(true);
                              close();
                            }}
                          >
                            Command palette
                            <Kbd>⌘K</Kbd>
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onSelect={() => {
                              setCdrOpen(true);
                              close();
                            }}
                          >
                            Export CDR package
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onSelect={() => {
                              setAssessing(true);
                              close();
                            }}
                          >
                            Record assessment
                          </DropdownMenu.Item>
                          <DropdownMenu.Item onSelect={close}>Duplicate program</DropdownMenu.Item>
                          <DropdownMenu.Item
                            onSelect={() => {
                              setArchiving(true);
                              close();
                            }}
                          >
                            Archive
                          </DropdownMenu.Item>
                        </>
                      )}
                    </DropdownMenu>
                  </ButtonGroup>
                </>
              }
            />
          }
          tabs={
            <Tabs.List>
              {(
                [
                  ["Overview", null],
                  ["System", scopeRows.length || null],
                  ["Requirements", requirementRows.length || null],
                  ["Controls", posture.controlsFailing || null],
                  ["Tasks", openTaskCount || null],
                  ["Findings", posture.findingsOpen || null],
                  ["Evidence", posture.evidenceStale || null],
                  ["POA&M", posture.poamOpen || null],
                  ["Activity", null],
                ] as [Tab, number | null][]
              ).map(([key, count]) => (
                <Tabs.Tab key={key} value={key} count={count || null}>
                  {key}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          }
        >
          {tab === "Overview" ? (
            <>
              <StageStrip programId={program.id} />

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

              <Section
                title="Tasks"
                count={openTaskCount || null}
                action={
                  <Button size="small" variant="subtle" onClick={() => setTab("Tasks")}>
                    See all
                  </Button>
                }
              >
                <Box paddingBlockStart="space.100">
                  <Task.List empty="No open tasks. Ask for something from a record's log bar.">
                    <TaskRows
                      tasks={programTasks.filter((t) => t.state !== "Done").slice(0, 6)}
                      me={me}
                      showSubject
                    />
                  </Task.List>
                </Box>
              </Section>

              <RecordActivity
                program={program.id}
                subject={{ kind: "program", id: program.id, label: program.name }}
                me={me}
                wholeProgram
                limit={8}
                seeAll={
                  <button type="button" onClick={() => setTab("Activity")}>
                    See all
                  </button>
                }
              />
            </>
          ) : null}

          {tab === "Controls" ? <ControlBoard programId={program.id} /> : null}

          {tab === "Findings" ? (
            <Section
              title="Verification"
              action={
                <Inline space="space.150" alignBlock="center">
                  <TextLink size="small">
                    <Link
                      to="/programs/$programId/te-phases"
                      params={{ programId: program.id }}
                      search={{ tab: undefined }}
                    >
                      T&amp;E phases
                    </Link>
                  </TextLink>
                  <TextLink size="small">
                    <Link to="/programs/$programId/ingestion" params={{ programId: program.id }}>
                      Ingestion
                    </Link>
                  </TextLink>
                </Inline>
              }
            >
              <Box paddingBlockStart="space.200">
                <VerificationSection programName={program.name} />
              </Box>
            </Section>
          ) : null}

          {tab === "Evidence" ? (
            <>
              <Inline alignInline="end">
                <TextLink size="small">
                  <Link
                    to="/programs/$programId/export"
                    params={{ programId: program.id }}
                    search={{ tab: undefined }}
                  >
                    Export
                  </Link>
                </TextLink>
              </Inline>
              <LifecycleSection programId={program.id} programName={program.name} />
              <DigitalThreadSection programId={program.id} programName={program.name} />
              <AuthorizationSection programId={program.id} programName={program.name} />
            </>
          ) : null}

          {tab === "POA&M" ? (
            <>
              <Section
                title="POA&M items"
                action={
                  <Inline space="space.150" alignBlock="center">
                    <TextLink size="small">
                      <Link
                        to="/programs/$programId/risk"
                        params={{ programId: program.id }}
                        search={{ tab: undefined }}
                      >
                        Risk scoring
                      </Link>
                    </TextLink>
                    <TextLink size="small">
                      <Link to="/register">Register</Link>
                    </TextLink>
                  </Inline>
                }
              >
                {programPoams.length === 0 ? (
                  <Empty
                    title="No POA&M items"
                    description="Commitments raised against this program will appear here."
                  />
                ) : (
                  <Table className="table-fixed">
                    <thead>
                      <tr>
                        <Table.Header width={96}>ID</Table.Header>
                        <Table.Header>Weakness</Table.Header>
                        <Table.Header width={120}>Status</Table.Header>
                        <Table.Header width={140}>Owner</Table.Header>
                        <Table.Header width={120} className="text-right">
                          Scheduled
                        </Table.Header>
                      </tr>
                    </thead>
                    <tbody>
                      {programPoams.map((p) => (
                        <Table.Row key={p.id}>
                          <Table.Cell>
                            <TextLink>
                              <Link to="/register/poam/$poamId" params={{ poamId: p.id }}>
                                <Id>{p.id}</Id>
                              </Link>
                            </TextLink>
                          </Table.Cell>
                          <Table.Cell className="truncate">{p.title}</Table.Cell>
                          <Table.Cell>
                            <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                          </Table.Cell>
                          <Table.Cell className="truncate">
                            <Person name={p.owner} />
                          </Table.Cell>
                          <Table.Cell className="tabular-nums text-right">
                            {p.scheduledCompletion}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Section>
            </>
          ) : null}

          {tab === "System" ? (
            <ScopeTable scopes={scopeRows} rollup={rollup} programId={program.id} />
          ) : null}

          {tab === "Requirements" ? (
            <>
              <Inline alignInline="end">
                <Button variant="primary" size="small" onClick={() => setNewRequirement(true)}>
                  New requirement
                </Button>
              </Inline>
              <NewRequirementModal
                open={newRequirement}
                onClose={() => setNewRequirement(false)}
                programId={program.id}
              />
            </>
          ) : null}

          {tab === "Requirements" ? (
            requirementRows.length ? (
              <RequirementCoverage programId={program.id} />
            ) : (
              <Empty
                title="No security requirements"
                description={`${program.id} has no engineering requirements yet. Controls are obligations until a requirement states what the system must do.`}
              />
            )
          ) : null}

          {tab === "Tasks" ? <ProgramTasks programId={program.id} me={me} /> : null}

          {tab === "Activity" ? (
            <RecordActivity
              program={program.id}
              subject={{ kind: "program", id: program.id, label: program.name }}
              me={me}
              wholeProgram
              filters
            />
          ) : null}
        </ShowPage>
      </>

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

      <AlertDialog
        open={archiving}
        onClose={() => setArchiving(false)}
        onConfirm={() => {
          try {
            saveProgramCommand(program.id, { archivedAt: new Date().toISOString() });
            setArchiving(false);
            toast.success("Program archived", {
              description: "Saved in this browser. Restore it from the Archived list.",
            });
            void navigate({ to: "/programs" });
          } catch {
            toast.error("Program could not be archived", {
              description: "Browser storage is unavailable. Try again after freeing storage.",
            });
          }
        }}
        tone="danger"
        title={`Archive ${program.name}?`}
        description="Moves the program from the active program list to Archived in this browser. Its record and history remain readable."
        confirmLabel="Archive program"
      />

      <Dialog
        open={assessing}
        onClose={() => setAssessing(false)}
        title="Open a control assessment"
        description={`${program.id} · ${program.baseline}`}
        footer={
          <>
            <Button variant="subtle" onClick={() => setAssessing(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form={formId + "-1"}
              disabled={form.state.isSubmitting}
            >
              Open assessment workspace
            </Button>
          </>
        }
      >
        <form
          id={formId + "-1"}
          ref={formRef}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit({
              save: () => {
                setAssessing(false);
                void navigate({
                  to: "/programs/$programId/controls/$controlId",
                  params: { programId: program.id, controlId: assessControl },
                  search: {},
                });
              },
            });
          }}
        >
          <Stack space="space.150">
            <form.Field name="assessControl">
              {(field) => (
                <Field
                  isRequired
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? field.state.meta.errors.join(" ")
                      : undefined
                  }
                  label="Control"
                  hint="Review the evidence and record the determination in the control workspace. Your role and the control's readiness determine which actions are available."
                >
                  <Combobox
                    value={field.state.value}
                    onChange={field.handleChange}
                    options={programControls.map((control) => ({
                      value: control.id,
                      label: control.id,
                      meta: control.title,
                    }))}
                    placeholder="Choose a control"
                    searchPlaceholder="Search controls…"
                    className="w-full"
                    name={field.name}
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>
          </Stack>
        </form>
      </Dialog>
    </Shell>
  );
}
