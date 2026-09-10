import { ProgramLibrary } from "@/components/app/program-library";
import {
  FieldLabel,
  FieldError,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Box,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  ButtonGroup,
  Combobox,
  CommandPalette,
  Count,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
  Editable,
  Field,
  IconButton,
  Id,
  Inline,
  Inspector,
  Kbd,
  KeyValue,
  Person,
  RecordHeader,
  Section,
  ShowPage,
  Stack,
  TabsList,
  TabsTrigger,
  TextLink,
  toast,
  useCommandPalette,
} from "@ledger/design-system";
import { saveProgramCommand, useProgramsVersion } from "@/lib/program-store";
import { useRecordForm } from "@/lib/record-form";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Lock } from "lucide-react";
import { useId, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CoverageBand } from "@/components/app/coverage";
import { CdrPackageModal } from "@/components/app/digital-thread";
import { ProgramAssessments } from "@/components/app/program-assessments";
import { ProgramControls } from "@/components/app/program-controls";
import { ProgramEvidence } from "@/components/app/program-evidence";
import { ProgramFindings } from "@/components/app/program-findings";
import { ProgramPoams } from "@/components/app/program-poams";
import { ProgramSchedule } from "@/components/app/program-schedule";
import { RecordActivity } from "@/components/app/record-activity";
import { RequirementCoverage } from "@/components/app/requirement-coverage";
import { ScopeTable } from "@/components/app/scopes";
import { Shell } from "@/components/app/shell";
import { StageStrip } from "@/components/app/stage-strip";
import { Task } from "@/components/app/task";
import { TaskRows } from "@/components/app/tasks-section";
import { useAssessmentsVersion } from "@/lib/assessment-store";
import { useAssuranceVersion } from "@/lib/assurance-record-store";
import { campaigns } from "@/lib/campaigns";
import { useCompositionGraph } from "@/lib/composition";
import { useControlMatrix, type ControlStatus } from "@/lib/control-matrix";
import { currentSession, useWorkVersion } from "@/lib/control-work";
import { evidenceForProgram, useEvidenceVersion } from "@/lib/evidence-catalog";
import { programs, programStatuses, programStatusTone } from "@/lib/grc-data";
import { inheritanceForProgram } from "@/lib/inheritance";
import { peopleForProgram, personById, workstreamsForProgram } from "@/lib/people";
import { programPosture } from "@/lib/program-actions";
import { programCommands } from "@/lib/program-commands";
import { programControlImplementations, programControlRows } from "@/lib/program-controls";
import { coverageFromRows } from "@/lib/program-coverage";
import { saveProgramField } from "@/lib/program-save";
import { useProgramScheduleVersion } from "@/lib/program-schedule";
import { programElementIds, resolveProgramElement } from "@/lib/program-scope";
import { programState, type Stage } from "@/lib/program-stage";
import { poamItems as registerPoams } from "@/lib/register";
import { requirementsForProgramElement } from "@/lib/requirement-context";
import { useRequirementsVersion } from "@/lib/requirements";
import { rollupControlSet, scopesForProgram, useScopesVersion } from "@/lib/scopes";
import { stageOf } from "@/lib/stages";
import { tasksForProgram, useTasksVersion } from "@/lib/tasks";

export const Route = createFileRoute("/programs/$programId")({
  // Program context and open records survive navigation and browser history.
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    tab?: Tab | undefined;
    peek?: string | undefined;
    element?: string | undefined;
    findingId?: string | undefined;
    poamId?: string | undefined;
    assessmentId?: string | undefined;
    assessmentRunId?: string | undefined;
    newFindingAssessment?: string | undefined;
    scheduleView?: "Plan" | "Tasks" | "Assignments" | undefined;
  } => {
    const raw = String(search["tab"] ?? "");
    // The peek stack: element ids, outermost first. The browser's back is the sheet's back.
    const peek = typeof search["peek"] === "string" && search["peek"] ? search["peek"] : undefined;
    return {
      tab:
        tabOrder.find((t) => t.toLowerCase() === raw.toLowerCase()) ?? tabAlias[raw.toLowerCase()],
      peek,
      element:
        typeof search["element"] === "string" && search["element"] ? search["element"] : undefined,
      findingId: typeof search["findingId"] === "string" ? search["findingId"] : undefined,
      poamId: typeof search["poamId"] === "string" ? search["poamId"] : undefined,
      assessmentId: typeof search["assessmentId"] === "string" ? search["assessmentId"] : undefined,
      assessmentRunId:
        typeof search["assessmentRunId"] === "string" ? search["assessmentRunId"] : undefined,
      newFindingAssessment:
        typeof search["newFindingAssessment"] === "string"
          ? search["newFindingAssessment"]
          : undefined,
      scheduleView:
        raw.toLowerCase() === "team"
          ? "Assignments"
          : raw.toLowerCase() === "tasks"
            ? "Tasks"
            : ["Plan", "Tasks", "Assignments"].includes(String(search["scheduleView"]))
              ? (search["scheduleView"] as "Plan" | "Tasks" | "Assignments")
              : undefined,
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
  | "Library"
  | "Schedule"
  | "Assessments"
  | "Findings"
  | "Evidence"
  | "POA&M"
  | "Activity";

const tabOrder: Tab[] = [
  "Overview",
  "System",
  "Library",
  "Requirements",
  "Controls",
  "Assessments",
  "Schedule",
  "Findings",
  "Evidence",
  "POA&M",
  "Activity",
];

/** Old tab names still linked from elsewhere land on the tab that holds them now. */
const tabAlias: Record<string, Tab> = {
  systems: "System",
  team: "Schedule",
  timeline: "Schedule",
  tasks: "Schedule",
  poams: "POA&M",
  "poa&ms": "POA&M",
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
      { label: "Authorization", to: "/programs/$programId/authorization", search: undefined },
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
  Scope: "System",
  Build: "Controls",
  Assess: "Assessments",
  Authorize: "Overview",
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
  const fieldId = useId();

  const alertCancelRef = useRef<HTMLButtonElement>(null);

  const program = Route.useLoaderData();
  const search = Route.useSearch();
  const tab = search.tab ?? "Overview";
  const navigate = useNavigate({ from: Route.fullPath });
  const setTab = useCallback(
    (next: Tab) => {
      void navigate({
        search: (prev) => ({
          ...prev,
          tab: next,
          element: undefined,
          peek: undefined,
          findingId: undefined,
          poamId: undefined,
          assessmentId: undefined,
          assessmentRunId: undefined,
          newFindingAssessment: undefined,
        }),
      });
    },
    [navigate],
  );
  useAssuranceVersion();
  useEvidenceVersion();
  useProgramScheduleVersion();
  useAssessmentsVersion();
  const evidenceCount = evidenceForProgram(program.id).length;
  const assessmentCount = campaigns.filter((c) => c.program === program.id).length;
  useScopesVersion();
  const scopeRows = scopesForProgram(program.id);
  const rollup = rollupControlSet(program.id);
  useRequirementsVersion();
  useWorkVersion();
  const elements = useCompositionGraph(program.id);
  const selectedElement = resolveProgramElement(program.id, search.element);
  const selectedElementIds = programElementIds(program.id, selectedElement?.id);
  const requirementCount = requirementsForProgramElement(program.id).length;
  const programControls = programControlRows(program.id);
  const scopedControls =
    selectedElement && tab === "Controls"
      ? programControlRows(program.id, selectedElement.id)
      : programControls;
  const clearElement = () => {
    void navigate({
      search: (prev) => ({
        ...prev,
        element: undefined,
        peek: undefined,
      }),
    });
  };
  useEffect(() => {
    if (search.element && (!selectedElement || tab === "System")) {
      void navigate({
        replace: true,
        search: (prev) => ({ ...prev, element: undefined, peek: undefined }),
      });
    }
  }, [search.element, selectedElement, navigate, tab]);
  useProgramsVersion();
  const [assessing, setAssessing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const { form, values, setValue, formId, formRef } = useRecordForm(
    {
      assessControl: "",
      assessScope: "",
    },
    (value) => ({ assessControl: value.assessControl, assessScope: value.assessScope }),
  );
  const { assessControl, assessScope } = values;
  const assessmentSubjects = assessing
    ? programControlImplementations(program.id, assessControl)
    : [];
  const assessmentSubjectAvailable = assessmentSubjects.some(
    (subject) => subject.scopeId === assessScope,
  );
  useEffect(() => {
    if (
      assessing &&
      assessControl &&
      !scopedControls.some((control) => control.id === assessControl)
    )
      setValue("assessControl", "");
  }, [assessing, assessControl, scopedControls, setValue]);
  useEffect(() => {
    if (assessing && assessScope && !assessmentSubjectAvailable) setValue("assessScope", "");
  }, [assessing, assessScope, assessmentSubjectAvailable, setValue]);

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
  const programPoams = registerPoams.filter((p) => p.program === program.id);

  const matrix = useControlMatrix(program.id);

  // Posture and the gate blocker read the same live rows as the coverage card.
  const posture = programPosture(program, matrix);
  // The Blocker reads the same deficiency count as the tab badge and the
  // coverage legend; `program.controlsFailing` is the last signed package
  // figure, not what this screen is showing.
  const state = programState(program, undefined, posture.controlsFailing);
  const coverage = useMemo(() => coverageFromRows(matrix), [matrix]);
  const programWorkstreams = useMemo(() => workstreamsForProgram(program.id), [program.id]);

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
  }, [setTab]);

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
            render={(v) => (
              <Badge variant="secondary" tone={programStatusTone[v]}>
                {v}
              </Badge>
            )}
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
            <TextLink
              render={<Link to="/workstreams/$workstreamId" params={{ workstreamId: w.id }} />}
            >
              {personById.get(w.lead)?.name ?? w.lead}
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
              <TextLink
                className="truncate"
                render={
                  <Link to="/library/components/$componentKey" params={{ componentKey: c.key }} />
                }
              >
                {c.name}
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
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to="/programs" />}>Programs</BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              }
              id={program.id}
              title={program.name}
              actions={
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="secondary" size="small" iconAfter={<ChevronDown />}>
                          Views
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" style={{ width: 240 }}>
                      {programViews.map((group) => (
                        <DropdownMenuGroup key={group.label}>
                          <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                          {group.items.map((v) => (
                            <DropdownMenuLinkItem
                              key={v.to}
                              closeOnClick
                              render={
                                <Link
                                  to={v.to}
                                  params={{ programId: program.id }}
                                  search={v.search ?? {}}
                                />
                              }
                            >
                              {v.label}
                            </DropdownMenuLinkItem>
                          ))}
                        </DropdownMenuGroup>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <ButtonGroup>
                    <Button variant="primary" size="small" onClick={runPrimary}>
                      {state.primaryAction}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <IconButton
                            variant="primary"
                            size="small"
                            label="More actions"
                            icon={<ChevronDown />}
                          />
                        }
                      />
                      <DropdownMenuContent align="end" style={{ width: 200 }}>
                        <DropdownMenuItem
                          onClick={() => {
                            palette.setOpen(true);
                          }}
                        >
                          Command palette
                          <Kbd>⌘K</Kbd>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setCdrOpen(true);
                          }}
                        >
                          Export CDR package
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setAssessing(true);
                          }}
                        >
                          Record assessment
                        </DropdownMenuItem>
                        <DropdownMenuItem>Duplicate program</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setArchiving(true);
                          }}
                        >
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ButtonGroup>
                </>
              }
            />
          }
          tabs={
            <TabsList className="w-full justify-start" variant="line" activateOnFocus>
              {(
                [
                  ["Overview", null],
                  ["System", elements.length || null],
                  ["Library", null],
                  ["Requirements", requirementCount || null],
                  ["Controls", programControls.length || null],
                  ["Assessments", assessmentCount || null],
                  ["Schedule", null],
                  ["Findings", posture.findingsOpen || null],
                  ["Evidence", evidenceCount || null],
                  ["POA&M", posture.poamOpen || null],
                  ["Activity", null],
                ] as [Tab, number | null][]
              ).map(([key, count]) => (
                <TabsTrigger key={key} value={key}>
                  {key}
                  {count ? <Count value={count} max={9999} /> : null}
                </TabsTrigger>
              ))}
            </TabsList>
          }
        >
          {selectedElement && ["Requirements", "Controls"].includes(tab) ? (
            <Inline space="space.100" alignBlock="center" shouldWrap className="pb-150">
              <span className="font-body-small">
                {tab === "Requirements" ? "Allocated to" : "Applicable to"}{" "}
                <strong>{selectedElement.name}</strong>
                {selectedElementIds.size > 1 ? " and its parts" : ""}
              </span>
              <Button size="small" variant="subtle" onClick={clearElement}>
                {tab === "Requirements" ? "Show all requirements" : "Show all controls"}
              </Button>
            </Inline>
          ) : null}
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
                  <Button
                    size="small"
                    variant="subtle"
                    onClick={() => {
                      void navigate({
                        search: (prev) => ({ ...prev, tab: "Schedule", scheduleView: "Tasks" }),
                      });
                    }}
                  >
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

          {tab === "Controls" ? (
            <ProgramControls programId={program.id} elementId={selectedElement?.id} />
          ) : null}

          {tab === "Findings" ? (
            <ProgramFindings
              key={`${program.id}/${search.findingId ?? ""}/${search.newFindingAssessment ?? ""}`}
              programId={program.id}
              initialFindingId={search.findingId}
              onFindingChange={(findingId) => {
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    findingId: findingId ?? undefined,
                    newFindingAssessment: undefined,
                  }),
                });
              }}
              initialAssessmentId={search.newFindingAssessment}
            />
          ) : null}
          {tab === "Evidence" ? (
            <ProgramEvidence programId={program.id} elementId={selectedElement?.id} />
          ) : null}
          {tab === "POA&M" ? (
            <ProgramPoams
              key={`${program.id}/${search.poamId ?? ""}`}
              programId={program.id}
              initialPoamId={search.poamId}
              onPoamChange={(poamId) => {
                void navigate({ search: (prev) => ({ ...prev, poamId: poamId ?? undefined }) });
              }}
            />
          ) : null}
          {tab === "Assessments" ? (
            <ProgramAssessments
              key={`${program.id}/${search.assessmentId ?? ""}/${search.assessmentRunId ?? ""}`}
              programId={program.id}
              initialAssessmentId={search.assessmentId}
              initialRunId={search.assessmentRunId}
              elementId={selectedElement?.id}
              onAssessmentChange={(assessmentId) => {
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    assessmentId: assessmentId ?? undefined,
                    assessmentRunId: undefined,
                  }),
                });
              }}
              onRunChange={(assessmentRunId) => {
                void navigate({
                  search: (prev) => ({ ...prev, assessmentRunId: assessmentRunId ?? undefined }),
                });
              }}
              onRaiseFinding={(assessmentId) => {
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    tab: "Findings",
                    newFindingAssessment: assessmentId,
                  }),
                });
              }}
            />
          ) : null}
          {tab === "Schedule" ? (
            <ProgramSchedule
              key={`${program.id}/${search.scheduleView ?? "Plan"}`}
              programId={program.id}
              initialView={search.scheduleView}
              onViewChange={(scheduleView) => {
                void navigate({ search: (prev) => ({ ...prev, scheduleView }) });
              }}
              onOpenPoam={(poamId) => {
                void navigate({ search: (prev) => ({ ...prev, tab: "POA&M", poamId }) });
              }}
              onOpenAssessment={(assessmentId) => {
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    tab: "Assessments",
                    assessmentId,
                    assessmentRunId: undefined,
                  }),
                });
              }}
            />
          ) : null}

          {tab === "Library" ? <ProgramLibrary programId={program.id} /> : null}
          {tab === "System" ? (
            <ScopeTable scopes={scopeRows} rollup={rollup} programId={program.id} />
          ) : null}

          {tab === "Requirements" ? (
            <RequirementCoverage programId={program.id} elementId={selectedElement?.id} />
          ) : null}

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
        onOpenChange={(next) => {
          if (!next) {
            setArchiving(false);
          }
        }}
      >
        <AlertDialogContent
          initialFocus={alertCancelRef}
          className="top-200 translate-y-0 sm:top-1000"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{`Archive ${program.name}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              Moves the program from the active program list to Archived in this browser. Its record
              and history remain readable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={alertCancelRef}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"

              onClick={() => {
                (() => {
                  try {
                    saveProgramCommand(program.id, { archivedAt: new Date().toISOString() });
                    setArchiving(false);
                    toast.add({
                      title: "Program archived",
                      type: "success",
                      description: "Saved in this browser. Restore it from the Archived list.",
                    });
                    void navigate({ to: "/programs" });
                  } catch {
                    toast.add({
                      title: "Program could not be archived",
                      type: "error",
                      timeout: 8000,
                      description:
                        "Browser storage is unavailable. Try again after freeing storage.",
                    });
                  }
                })();
              }}
            >
              Archive program
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={assessing}
        onOpenChange={(next) => {
          if (!next) {
            setAssessing(false);
          }
        }}
      >
        <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>Choose what to assess</DialogTitle>
            <DialogDescription>{`${program.id} · ${program.baseline}`}</DialogDescription>
          </DialogHeader>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
            <form
              id={formId + "-1"}
              ref={formRef}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                if (!assessControl || !assessmentSubjectAvailable) return;
                void form.handleSubmit({
                  save: () => {
                    setAssessing(false);
                    void navigate({
                      to: "/programs/$programId/controls/$controlId",
                      params: { programId: program.id, controlId: assessControl },
                      search: {
                        scope: assessScope,
                        element: selectedElement?.id,
                      },
                    });
                  },
                });
              }}
            >
              <Stack space="space.150">
                <form.Field name="assessControl">
                  {(field) => {
                    const valueItems = scopedControls.map((control) => ({
                      value: control.id,
                      label: control.id,
                      meta: control.title,
                    }));
                    const fieldError1 =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? field.state.meta.errors.join(" ")
                        : undefined;
                    return (
                      <Field data-invalid={Boolean(fieldError1)}>
                        <FieldLabel
                          id={`${fieldId}-control-1-label`}
                          htmlFor={`${fieldId}-control-1`}
                        >
                          {"Control"}
                          <span aria-hidden="true" className="text-danger">
                            {" "}
                            *
                          </span>
                        </FieldLabel>
                        <div className={"w-full"}>
                          <Combobox<(typeof valueItems)[number]>
                            items={valueItems}

                            isItemEqualToValue={(item, selected) => item.value === selected.value}
                            filter={(item, query) =>
                              [item.label, item.value, "keywords" in item ? item.keywords : ""]
                                .join(" ")
                                .toLocaleLowerCase()
                                .includes(query.toLocaleLowerCase())
                            }
                            value={
                              valueItems.find((item) => item.value === field.state.value) ?? null
                            }
                            onValueChange={(item) => field.handleChange(item?.value ?? "")}
                            name={field.name}
                          >
                            <ComboboxInput
                              id={`${fieldId}-control-1`}
                              aria-labelledby={`${fieldId}-control-1-label`}
                              aria-required={true}
                              aria-invalid={Boolean(fieldError1)}
                              aria-describedby={
                                fieldError1 ? `${fieldId}-control-1-message` : undefined
                              }
                              placeholder="Choose a control"
                              onBlur={field.handleBlur}
                            />
                            <ComboboxContent>
                              <ComboboxEmpty>{"No matches."}</ComboboxEmpty>
                              <ComboboxList aria-labelledby={`${fieldId}-control-1-label`}>
                                {(item) => (
                                  <ComboboxItem
                                    key={item.value}
                                    value={item}
                                    disabled={"disabled" in item && Boolean(item.disabled)}
                                  >
                                    <span className="min-w-0 flex-1">{item.label}</span>
                                    {"meta" in item && item.meta ? (
                                      <span className="text-subtle font-body-small">
                                        {String(item.meta)}
                                      </span>
                                    ) : null}
                                  </ComboboxItem>
                                )}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                        </div>
                        {fieldError1 ? (
                          <FieldError id={`${fieldId}-control-1-message`}>{fieldError1}</FieldError>
                        ) : null}
                      </Field>
                    );
                  }}
                </form.Field>
                <form.Field name="assessScope">
                  {(field) => {
                    const valueItems2 = assessmentSubjects.map((subject) => ({
                      value: subject.scopeId,
                      label: subject.name,
                    }));
                    const fieldError2 =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? field.state.meta.errors.join(" ")
                        : undefined;
                    return (
                      <Field data-invalid={Boolean(fieldError2)}>
                        <FieldLabel
                          id={`${fieldId}-system-component-2-label`}
                          htmlFor={`${fieldId}-system-component-2`}
                        >
                          {"System / component"}
                          <span aria-hidden="true" className="text-danger">
                            {" "}
                            *
                          </span>
                        </FieldLabel>
                        <Combobox<(typeof valueItems2)[number]>
                          items={valueItems2}

                          isItemEqualToValue={(item, selected) => item.value === selected.value}
                          filter={(item, query) =>
                            [item.label, item.value, "keywords" in item ? item.keywords : ""]
                              .join(" ")
                              .toLocaleLowerCase()
                              .includes(query.toLocaleLowerCase())
                          }
                          value={
                            valueItems2.find((item) => item.value === field.state.value) ?? null
                          }
                          onValueChange={(item) => field.handleChange(item?.value ?? "")}
                          name={field.name}
                        >
                          <ComboboxInput
                            id={`${fieldId}-system-component-2`}
                            aria-labelledby={`${fieldId}-system-component-2-label`}
                            aria-required={true}
                            aria-invalid={Boolean(fieldError2)}
                            aria-describedby={
                              fieldError2 ? `${fieldId}-system-component-2-message` : undefined
                            }
                            placeholder="Choose the system or component to assess"
                            onBlur={field.handleBlur}
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>{"No matches."}</ComboboxEmpty>
                            <ComboboxList aria-labelledby={`${fieldId}-system-component-2-label`}>
                              {(item) => (
                                <ComboboxItem
                                  key={item.value}
                                  value={item}
                                  disabled={"disabled" in item && Boolean(item.disabled)}
                                >
                                  <span className="min-w-0 flex-1">{item.label}</span>
                                  {"meta" in item && item.meta ? (
                                    <span className="text-subtle font-body-small">
                                      {String(item.meta)}
                                    </span>
                                  ) : null}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        {fieldError2 ? (
                          <FieldError id={`${fieldId}-system-component-2-message`}>
                            {fieldError2}
                          </FieldError>
                        ) : null}
                      </Field>
                    );
                  }}
                </form.Field>
              </Stack>
            </form>
          </Box>
          <DialogFooter>
            <>
              <Button variant="subtle" onClick={() => setAssessing(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                form={formId + "-1"}
                disabled={form.state.isSubmitting || !assessControl || !assessScope}
              >
                Open implementation
              </Button>
            </>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
