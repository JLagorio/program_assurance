import { useCallback, useMemo, useState, useEffect } from "react";
import { useRecordForm } from "@/lib/record-form";
import { saveProgramCommand, useProgramsVersion } from "@/lib/program-store";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Lock } from "lucide-react";

import { Task } from "@/components/app/task";
import { CdrPackageModal } from "@/components/app/digital-thread";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  AlertDialog,
  Badge,
  Box,
  Button,
  IconButton,
  ButtonGroup,
  Combobox,
  CommandPalette,
  Dialog,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuLinkItem,
  DropdownMenuItem,
  Editable,
  Field,
  Id,
  Inline,
  Inspector,
  Kbd,
  KeyValue,
  Person,
  RecordHeader,
  Section,
  Select,
  ShowPage,
  Stack,
  TabsList,
  TabsTrigger,
  Count,
  TextLink,
  toast,
  useCommandPalette,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { ProgramFindings } from "@/components/app/program-findings";
import { ProgramEvidence } from "@/components/app/program-evidence";
import { ProgramPoams } from "@/components/app/program-poams";
import { ProgramSchedule } from "@/components/app/program-schedule";
import { ProgramAssessments } from "@/components/app/program-assessments";
import { useAssuranceVersion } from "@/lib/assurance-record-store";
import { evidenceForProgram, useEvidenceVersion } from "@/lib/evidence-catalog";
import { useProgramScheduleVersion } from "@/lib/program-schedule";
import { useAssessmentsVersion } from "@/lib/assessment-store";
import { campaigns } from "@/lib/campaigns";
import { CoverageBand } from "@/components/app/coverage";
import { ProgramControls } from "@/components/app/program-controls";
import { RecordActivity } from "@/components/app/record-activity";
import { StageStrip } from "@/components/app/stage-strip";
import { TaskRows } from "@/components/app/tasks-section";
import { currentSession, useWorkVersion } from "@/lib/control-work";
import { stageOf } from "@/lib/stages";
import { tasksForProgram, useTasksVersion } from "@/lib/tasks";
import { useControlMatrix, type ControlStatus } from "@/lib/control-matrix";
import { saveProgramField } from "@/lib/program-save";
import { programPosture } from "@/lib/program-actions";
import { coverageFromRows } from "@/lib/program-coverage";
import { programCommands } from "@/lib/program-commands";
import { ScopeTable } from "@/components/app/scopes";
import { RequirementCoverage } from "@/components/app/requirement-coverage";
import { programStatuses, programStatusTone, programs } from "@/lib/grc-data";
import { useRequirementsVersion } from "@/lib/requirements";
import { requirementsForProgramElement } from "@/lib/requirement-context";
import { programControlRows } from "@/lib/program-controls";
import { ancestorsOf, useCompositionGraph } from "@/lib/composition";
import { programElementIds, resolveProgramElement } from "@/lib/program-scope";
import { rollupControlSet, scopesForProgram, useScopesVersion } from "@/lib/scopes";
import { poamItems as registerPoams } from "@/lib/register";
import { programState, type Stage } from "@/lib/program-stage";
import { peopleForProgram, personById, workstreamsForProgram } from "@/lib/people";
import { inheritanceForProgram } from "@/lib/inheritance";

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
  | "Schedule"
  | "Assessments"
  | "Findings"
  | "Evidence"
  | "POA&M"
  | "Activity";

const tabOrder: Tab[] = [
  "Overview",
  "System",
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
  const scopedRequirementCount = requirementsForProgramElement(
    program.id,
    selectedElement?.id,
  ).length;
  const scopedControls = programControlRows(program.id, selectedElement?.id);
  const changeElement = (element: string) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        element: element === "__all__" ? undefined : element || undefined,
        peek: undefined,
      }),
    });
  };
  useEffect(() => {
    if (search.element && !selectedElement) {
      void navigate({
        replace: true,
        search: (prev) => ({ ...prev, element: undefined, peek: undefined }),
      });
    }
  }, [search.element, selectedElement, navigate]);
  useProgramsVersion();
  const [assessing, setAssessing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const { form, values, setValue, formId, formRef } = useRecordForm(
    {
      assessControl: "AC-6(9)",
    },
    (value) => ({ assessControl: value.assessControl }),
  );
  const { assessControl } = values;
  useEffect(() => {
    if (assessing && !scopedControls.some((control) => control.id === assessControl))
      setValue("assessControl", scopedControls[0]?.id ?? "");
  }, [assessing, assessControl, scopedControls, setValue]);

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
                  ["System", selectedElementIds.size || null],
                  ["Requirements", scopedRequirementCount || null],
                  ["Controls", scopedControls.length || null],
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
          {["System", "Requirements"].includes(tab) ? (
            <Box paddingBlock="space.150">
              <Inline space="space.100" alignBlock="center" shouldWrap>
                <span className="font-body-small text-subtle">Scope</span>
                <Combobox
                  aria-label="System or component scope"
                  size="small"
                  width={360}
                  className="max-w-full"
                  value={selectedElement?.id ?? "__all__"}
                  onChange={changeElement}
                  placeholder="Find a system or component"
                  options={[
                    { value: "__all__", label: "Whole system" },
                    ...elements.map((element) => ({
                      value: element.id,
                      label: element.name,
                      meta: element.kind,
                      keywords: ancestorsOf(element.id)
                        .map((ancestor) => ancestor.name)
                        .join(" "),
                    })),
                  ]}
                />
                {selectedElement ? (
                  <>
                    {selectedElementIds.size > 1 ? (
                      <span className="font-body-small text-subtle">Includes parts</span>
                    ) : null}
                    <Button size="small" variant="subtle" onClick={() => changeElement("__all__")}>
                      Clear scope
                    </Button>
                  </>
                ) : null}
              </Inline>
            </Box>
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
            <ProgramControls
              programId={program.id}
              elementId={selectedElement?.id}
              onClearScope={() => changeElement("__all__")}
              scopeFilter={
                <Field
                  label="Scope"
                  hint={
                    selectedElement && selectedElementIds.size > 1 ? "Includes parts" : undefined
                  }
                >
                  <Combobox
                    aria-label="System or component scope"
                    size="small"
                    value={selectedElement?.id ?? "__all__"}
                    onChange={changeElement}
                    placeholder="Find a system or component"
                    options={[
                      { value: "__all__", label: "Whole system" },
                      ...elements.map((element) => ({
                        value: element.id,
                        label: element.name,
                        meta: element.kind,
                        keywords: ancestorsOf(element.id)
                          .map((ancestor) => ancestor.name)
                          .join(" "),
                      })),
                    ]}
                  />
                </Field>
              }
            />
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

          {tab === "System" ? (
            <ScopeTable
              scopes={scopeRows}
              rollup={rollup}
              programId={program.id}
              elementId={selectedElement?.id}
            />
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
                  search: {
                    scope: scopedControls.find((control) => control.id === assessControl)?.scopeId,
                    element: selectedElement?.id,
                  },
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
                    options={scopedControls.map((control) => ({
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
