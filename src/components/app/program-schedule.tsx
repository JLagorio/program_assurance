import {
  FieldLabel,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Box,
  Button,
  DataTable,
  defineColumns,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Grid,
  Id,
  Inline,
  Input,
  KeyValue,
  Section,
  Stack,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TextLink,
  type Tone,
  useDataTable,
} from "@ledger/design-system";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useId, useCallback, useEffect, useMemo, useState } from "react";
import { ProgramTasks } from "@/components/app/tasks-section";
import {
  updateAssessmentSchedule,
  updateEventSchedule,
  useAssessmentsVersion,
} from "@/lib/assessment-store";
import { useAssuranceVersion } from "@/lib/assurance-record-store";
import { events } from "@/lib/campaigns";
import { currentSession } from "@/lib/control-work";
import { gateStatusTone, type ProgramGate } from "@/lib/grc-data";
import { mentionablePeople, personById, workstreamsForProgram } from "@/lib/people";
import {
  nextMilestoneId,
  programScheduleMilestones,
  saveProgramMilestone,
  scheduleDate,
  scheduleForProgram,
  useProgramScheduleVersion,
  type ScheduleRow,
} from "@/lib/program-schedule";
import { useTasksVersion } from "@/lib/tasks";
import { useRunLogVersion } from "@/lib/test-execution";

export type ScheduleView = "Plan" | "Tasks" | "Assignments";
const tone = (row: ScheduleRow): Tone =>
  row.complete
    ? "success"
    : row.status === "Blocked" || row.overdue
      ? "danger"
      : row.status === "At risk" || row.status === "Waiting"
        ? "warning"
        : row.status === "Planned" || row.status === "Planning"
          ? "neutral"
          : "information";

export function ProgramSchedule({
  programId,
  initialView = "Plan",
  onOpenPoam,
  onOpenAssessment,
  onViewChange,
}: {
  programId: string;
  initialView?: ScheduleView | undefined;
  onOpenPoam?: (id: string) => void;
  onOpenAssessment?: (id: string) => void;
  onViewChange?: (view: ScheduleView) => void;
}) {
  const scheduleVersion = useProgramScheduleVersion();
  const assuranceVersion = useAssuranceVersion();
  const assessmentsVersion = useAssessmentsVersion();
  const taskVersion = useTasksVersion();
  const runVersion = useRunLogVersion();
  const [view, setView] = useState<ScheduleView>(initialView);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<ProgramGate | null>(null);
  useEffect(() => {
    setView(initialView);
    setSelectedId(null);
    setMilestone(null);
  }, [initialView, programId]);
  const rows = useMemo(
    () => scheduleForProgram(programId),
    // Each version subscribes to a source read by this shared projection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programId, scheduleVersion, assuranceVersion, assessmentsVersion, taskVersion, runVersion],
  );
  const selected = rows.find((row) => row.id === selectedId);
  const me = currentSession().name;
  const open = useCallback(
    (row: ScheduleRow) => {
      if (row.kind === "Milestone")
        setMilestone(
          programScheduleMilestones(programId).find((gate) => gate.id === row.sourceId) ?? null,
        );
      else setSelectedId(row.id);
    },
    [programId],
  );
  const columns = useMemo(
    () =>
      defineColumns<ScheduleRow>((c) => [
        c.id("sourceId", { header: "Record", width: 145, hideable: false, preview: open }),
        c.text("title", {
          header: "Work / milestone",
          minWidth: 290,
          hideable: false,
          cell: (row) => (
            <button
              type="button"
              className="block w-full truncate text-left font-medium hover:underline"
              onClick={() => open(row)}
            >
              {row.title}
            </button>
          ),
        }),
        c.status("track", { header: "Track", width: 140, tone: () => "neutral" }),
        c.text("kind", { header: "Type", width: 145 }),
        c.status("status", { header: "Status", width: 145, tone }),
        c.person("owner", { header: "Owner / team", width: 180 }),
        c.text("dates", {
          header: "Planned / window",
          width: 190,
          sortBy: (row) => row.due ?? "9999",
          cell: (row) => (
            <span className={row.overdue ? "text-danger" : ""}>
              {row.dates || "Undated"}
              {row.overdue ? " · Overdue" : ""}
            </span>
          ),
        }),
        c.text("phase", { header: "Phase / workstream", width: 240 }),
        c.text("dependency", { header: "Dependencies / related work", width: 230 }),
        c.text("team", { header: "Disciplines / workstream", width: 240 }),
      ]),
    [open],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Program schedule",
    view: `program-schedule-${programId}`,
    resizable: true,
    reorderable: true,
    initialState: { columnVisibility: { team: false } },
  });
  const addMilestone = () =>
    setMilestone({
      id: nextMilestoneId(programId),
      name: "",
      kind: "Milestone decision",
      phase: "",
      status: "Planned",
      planned: "",
      actual: "",
      owner: me,
      artifact: "",
      description: "",
      cyberGate: "",
      dependsOn: [],
      workstreams: [],
    });
  return (
    <Stack space="space.200">
      <Tabs
        className="gap-0"
        value={view}
        onValueChange={(next) => {
          setView(next as ScheduleView);
          onViewChange?.(next as ScheduleView);
        }}
      >
        <TabsList
          variant="line"
          activateOnFocus
          aria-label="Schedule views"
          className="w-full justify-start"
        >
          {(["Plan", "Tasks", "Assignments"] as const).map((item) => (
            <TabsTrigger key={item} value={item}>
              {item}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="Plan">
          <Stack space="space.150">
            <p className="font-body-small text-subtle">
              Program milestones, implementation work, assessments and remediation commitments.
              Filter by track to plan each part of the program.
            </p>
            <DataTable
              table={table}
              toolbar={
                <Inline space="space.100" shouldWrap alignBlock="center">
                  <DataTable.Search table={table} placeholder="Find scheduled work" />
                  <DataTable.Filter table={table} column="track" />
                  <DataTable.Filter table={table} column="status" />
                  <DataTable.Filter table={table} column="owner" />
                  <Inline className="ml-auto" space="space.100">
                    <DataTable.Columns table={table} />
                    <Button variant="primary" iconBefore={<Plus />} onClick={addMilestone}>
                      New milestone
                    </Button>
                  </Inline>
                </Inline>
              }
              empty={{
                title: "No scheduled work",
                description: "Add a milestone or task, or schedule an assessment for this program.",
                action: (
                  <Button variant="primary" onClick={addMilestone}>
                    New milestone
                  </Button>
                ),
              }}
            />
          </Stack>
        </TabsContent>
        <TabsContent value="Tasks">
          <ProgramTasks programId={programId} me={me} />
        </TabsContent>
        <TabsContent value="Assignments">
          <ScheduleAssignments
            programId={programId}
            onOpen={(id) => setSelectedId(`Workstream:${id}`)}
          />
        </TabsContent>
      </Tabs>
      {milestone ? (
        <MilestoneEditor
          key={`${programId}:${milestone.id}`}
          programId={programId}
          milestone={milestone}
          actor={me}
          onClose={() => setMilestone(null)}
        />
      ) : null}
      {selected ? (
        <ScheduleDetail
          row={selected}
          programId={programId}
          onClose={() => setSelectedId(null)}
          onOpenPoam={onOpenPoam}
          onOpenAssessment={onOpenAssessment}
        />
      ) : null}
    </Stack>
  );
}

function MilestoneEditor({
  programId,
  milestone,
  actor,
  onClose,
}: {
  programId: string;
  milestone: ProgramGate;
  actor: string;
  onClose: () => void;
}) {
  const fieldId = useId();

  const [draft, setDraft] = useState(milestone);
  const [error, setError] = useState("");
  const set = <K extends keyof ProgramGate>(key: K, value: ProgramGate[K]) =>
    setDraft((old) => ({ ...old, [key]: value }));
  const gates = programScheduleMilestones(programId).filter((gate) => gate.id !== milestone.id);
  const workstreams = workstreamsForProgram(programId);
  const formId = `milestone-${milestone.id}`;
  const kindItems = ["Milestone decision", "Engineering review", "RMF action", "Operational"].map(
    (kind) => ({
      value: kind,
      label: kind,
    }),
  );
  const statusItems = Object.keys(gateStatusTone).map((status) => ({
    value: status,
    label: status,
  }));
  const selectionItems = [
    { value: "", label: "No workstream" },
    ...workstreams.map((stream) => ({
      value: stream.id,
      label: (
        <>
          {stream.id}— {stream.title}
        </>
      ),
    })),
  ];
  const selectionItems2 = [
    { value: "", label: "No dependency" },
    ...gates.map((gate) => ({
      value: gate.id,
      label: (
        <>
          {gate.id}— {gate.name}
        </>
      ),
    })),
  ];
  return (
    <Dialog
      open={true}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent
        style={{ maxWidth: ({ medium: 520, large: 860 } as const)["large"] }}
        className="top-200 translate-y-0 sm:top-600"
      >
        <DialogHeader>
          <DialogTitle>{milestone.name ? "Edit milestone" : "New milestone"}</DialogTitle>
          <DialogDescription>{`${programId} · ${milestone.id}`}</DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
          <form
            id={formId}
            onSubmit={(event) => {
              event.preventDefault();
              try {
                saveProgramMilestone(programId, draft, actor);
                onClose();
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Milestone could not be saved.");
              }
            }}
          >
            <Stack space="space.200">
              {error ? (
                <p role="alert" className="font-body-small text-danger">
                  {error}
                </p>
              ) : null}
              <Field>
                <FieldLabel
                  id={`${fieldId}-milestone-name-1-label`}
                  htmlFor={`${fieldId}-milestone-name-1`}
                >
                  {"Milestone name"}
                  <span aria-hidden="true" className="text-danger">
                    {" "}
                    *
                  </span>
                </FieldLabel>
                <Input
                  id={`${fieldId}-milestone-name-1`}
                  aria-labelledby={`${fieldId}-milestone-name-1-label`}
                  aria-required={true}
                  required
                  value={draft.name}
                  onChange={(event) => set("name", event.target.value)}
                />
              </Field>
              <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="space.150">
                <Field>
                  <FieldLabel
                    id={`${fieldId}-track-type-2-label`}
                    htmlFor={`${fieldId}-track-type-2`}
                  >
                    {"Track / type"}
                  </FieldLabel>
                  <Select<string>
                    items={kindItems}
                    value={draft.kind}
                    onValueChange={(value) => {
                      if (value === null) return;
                      return set("kind", value as ProgramGate["kind"]);
                    }}
                  >
                    <SelectTrigger
                      id={`${fieldId}-track-type-2`}
                      aria-labelledby={`${fieldId}-track-type-2-label`}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent aria-labelledby={`${fieldId}-track-type-2-label`}>
                      {kindItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel id={`${fieldId}-phase-3-label`} htmlFor={`${fieldId}-phase-3`}>
                    {"Phase"}
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-phase-3`}
                    aria-labelledby={`${fieldId}-phase-3-label`}
                    placeholder="e.g. Engineering & manufacturing development"
                    value={draft.phase}
                    onChange={(event) => set("phase", event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel
                    id={`${fieldId}-owner-team-4-label`}
                    htmlFor={`${fieldId}-owner-team-4`}
                  >
                    {"Owner / team"}
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-owner-team-4`}
                    aria-labelledby={`${fieldId}-owner-team-4-label`}
                    list={`owners-${programId}`}
                    value={draft.owner}
                    onChange={(event) => set("owner", event.target.value)}
                  />
                  <datalist id={`owners-${programId}`}>
                    {mentionablePeople(programId).map((person) => (
                      <option key={person.name} value={person.name} />
                    ))}
                  </datalist>
                </Field>
                <Field>
                  <FieldLabel id={`${fieldId}-status-5-label`} htmlFor={`${fieldId}-status-5`}>
                    {"Status"}
                  </FieldLabel>
                  <Select<string>
                    items={statusItems}
                    value={draft.status}
                    onValueChange={(value) => {
                      if (value === null) return;
                      return set("status", value as ProgramGate["status"]);
                    }}
                  >
                    <SelectTrigger
                      id={`${fieldId}-status-5`}
                      aria-labelledby={`${fieldId}-status-5-label`}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent aria-labelledby={`${fieldId}-status-5-label`}>
                      {statusItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel
                    id={`${fieldId}-planned-date-6-label`}
                    htmlFor={`${fieldId}-planned-date-6`}
                  >
                    {"Planned date"}
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-planned-date-6`}
                    aria-labelledby={`${fieldId}-planned-date-6-label`}
                    type="date"
                    value={scheduleDate(draft.planned) ?? ""}
                    onChange={(event) => set("planned", event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel
                    id={`${fieldId}-actual-date-7-label`}
                    htmlFor={`${fieldId}-actual-date-7`}
                  >
                    {"Actual date"}
                    {draft.status === "Complete" ? (
                      <span aria-hidden="true" className="text-danger">
                        {" "}
                        *
                      </span>
                    ) : null}
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-actual-date-7`}
                    aria-labelledby={`${fieldId}-actual-date-7-label`}
                    aria-required={draft.status === "Complete"}
                    type="date"
                    required={draft.status === "Complete"}
                    value={scheduleDate(draft.actual) ?? ""}
                    onChange={(event) => set("actual", event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel
                    id={`${fieldId}-workstream-8-label`}
                    htmlFor={`${fieldId}-workstream-8`}
                  >
                    {"Workstream"}
                  </FieldLabel>
                  <Select<string>
                    items={selectionItems}
                    value={draft.workstreams?.[0] ?? ""}
                    onValueChange={(value) => {
                      if (value === null) return;
                      return set("workstreams", value ? [value] : []);
                    }}
                  >
                    <SelectTrigger
                      id={`${fieldId}-workstream-8`}
                      aria-labelledby={`${fieldId}-workstream-8-label`}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent aria-labelledby={`${fieldId}-workstream-8-label`}>
                      {selectionItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel
                    id={`${fieldId}-depends-on-milestone-9-label`}
                    htmlFor={`${fieldId}-depends-on-milestone-9`}
                  >
                    {"Depends on milestone"}
                  </FieldLabel>
                  <Select<string>
                    items={selectionItems2}
                    value={draft.dependsOn?.[0] ?? ""}
                    onValueChange={(value) => {
                      if (value === null) return;
                      return set("dependsOn", value ? [value] : []);
                    }}
                  >
                    <SelectTrigger
                      id={`${fieldId}-depends-on-milestone-9`}
                      aria-labelledby={`${fieldId}-depends-on-milestone-9-label`}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent aria-labelledby={`${fieldId}-depends-on-milestone-9-label`}>
                      {selectionItems2.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </Grid>
              <Field>
                <FieldLabel
                  id={`${fieldId}-required-deliverable-readiness-criterion-10-label`}
                  htmlFor={`${fieldId}-required-deliverable-readiness-criterion-10`}
                >
                  {"Required deliverable / readiness criterion"}
                </FieldLabel>
                <Textarea
                  id={`${fieldId}-required-deliverable-readiness-criterion-10`}
                  aria-labelledby={`${fieldId}-required-deliverable-readiness-criterion-10-label`}
                  value={draft.cyberGate}
                  onChange={(event) => set("cyberGate", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel
                  id={`${fieldId}-deliverable-reference-11-label`}
                  htmlFor={`${fieldId}-deliverable-reference-11`}
                >
                  {"Deliverable reference"}
                </FieldLabel>
                <Input
                  id={`${fieldId}-deliverable-reference-11`}
                  aria-labelledby={`${fieldId}-deliverable-reference-11-label`}
                  placeholder="Document or record reference"
                  value={draft.artifact === "—" ? "" : draft.artifact}
                  onChange={(event) => set("artifact", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel id={`${fieldId}-notes-12-label`} htmlFor={`${fieldId}-notes-12`}>
                  {"Notes"}
                </FieldLabel>
                <Textarea
                  id={`${fieldId}-notes-12`}
                  aria-labelledby={`${fieldId}-notes-12-label`}
                  value={draft.description}
                  onChange={(event) => set("description", event.target.value)}
                />
              </Field>
            </Stack>
          </form>
        </Box>
        <DialogFooter>
          <>
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId}>
              Save milestone
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleAssignments({
  programId,
  onOpen,
}: {
  programId: string;
  onOpen: (id: string) => void;
}) {
  const streams = workstreamsForProgram(programId);
  const rows = streams.map((stream) => ({
    id: stream.id,
    title: stream.title,
    owner: personById.get(stream.lead)?.name ?? stream.lead,
    disciplines: stream.disciplines.join(", "),
    people: stream.members
      .map((member) => personById.get(member.person)?.name ?? member.person)
      .join(", "),
    status: stream.status,
    due: stream.due,
    gate: stream.gate,
  }));
  const columns = useMemo(
    () =>
      defineColumns<(typeof rows)[number]>((c) => [
        c.id("id", { header: "Workstream", width: 135, preview: (row) => onOpen(row.id) }),
        c.text("title", {
          header: "Workstream",
          minWidth: 300,
          cell: (row) => (
            <button
              type="button"
              className="text-left font-medium hover:underline"
              onClick={() => onOpen(row.id)}
            >
              {row.title}
            </button>
          ),
        }),
        c.person("owner", { header: "Lead", width: 170 }),
        c.text("disciplines", { header: "Disciplines", width: 245 }),
        c.text("people", { header: "Assigned people", width: 260 }),
        c.status("status", {
          header: "Status",
          tone: (row) =>
            row.status === "Blocked" ? "danger" : row.status === "Done" ? "success" : "neutral",
          width: 120,
        }),
        c.text("due", { header: "Due", width: 130 }),
        c.text("gate", { header: "Milestone", width: 130 }),
      ]),
    [onOpen],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Program assignments",
    view: `program-assignments-${programId}`,
    resizable: true,
  });
  return (
    <DataTable
      table={table}
      toolbar={
        <Inline space="space.100" shouldWrap>
          <DataTable.Search table={table} placeholder="Find work or a person" />
          <DataTable.Filter table={table} column="owner" />
          <DataTable.Filter table={table} column="status" />
        </Inline>
      }
      empty={{
        title: "No workstreams assigned",
        description:
          "Milestone owners and task assignees can be assigned from the Plan and Tasks views.",
      }}
    />
  );
}

function ScheduleDetail({
  row,
  programId,
  onClose,
  onOpenPoam,
  onOpenAssessment,
}: {
  row: ScheduleRow;
  programId: string;
  onClose: () => void;
  onOpenPoam?: ((id: string) => void) | undefined;
  onOpenAssessment?: ((id: string) => void) | undefined;
}) {
  const fieldId = useId();

  const canEditSchedule = row.kind === "Assessment" || row.kind === "Test event";
  const [editing, setEditing] = useState(false);
  const [schedule, setSchedule] = useState({
    start: row.start ?? "",
    end: row.due ?? "",
    owner: row.owner,
  });
  const [error, setError] = useState("");
  const formId = `assessment-window-${row.sourceId}`;
  const stream =
    row.kind === "Workstream"
      ? workstreamsForProgram(programId).find((item) => item.id === row.sourceId)
      : undefined;
  const campaignId =
    row.kind === "Test event"
      ? events.find((event) => event.id === row.sourceId)?.campaign
      : row.sourceId;
  const source = row.poamId ? (
    onOpenPoam ? (
      <Button
        variant="primary"
        onClick={() => {
          onClose();
          onOpenPoam(row.poamId!);
        }}
      >
        Open POA&M
      </Button>
    ) : (
      <TextLink
        render={<Link to="/programs/$programId" params={{ programId }} search={{ tab: "POA&M" }} />}
      >
        Open program POA&Ms
      </TextLink>
    )
  ) : row.kind === "Workstream" ? (
    <TextLink
      render={<Link to="/workstreams/$workstreamId" params={{ workstreamId: row.sourceId }} />}
    >
      Open workstream
    </TextLink>
  ) : row.kind === "Task" ? (
    <TextLink render={<Link to="/tasks/$taskId" params={{ taskId: row.sourceId }} />}>
      Open task
    </TextLink>
  ) : campaignId ? (
    onOpenAssessment ? (
      <Button
        variant="primary"
        onClick={() => {
          onClose();
          onOpenAssessment(campaignId);
        }}
      >
        Open assessment
      </Button>
    ) : (
      <TextLink render={<Link to="/campaigns/$campaignId" params={{ campaignId }} />}>
        Open assessment
      </TextLink>
    )
  ) : null;
  return (
    <Dialog
      open={true}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent
        style={{ maxWidth: ({ medium: 520, large: 860 } as const)["large"] }}
        className="top-200 translate-y-0 sm:top-600"
      >
        <DialogHeader>
          <DialogTitle>{row.title}</DialogTitle>
          <DialogDescription>{`${programId} · ${row.sourceId}`}</DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
          <Stack space="space.200">
            {editing ? (
              <form
                id={formId}
                onSubmit={(event) => {
                  event.preventDefault();
                  try {
                    const save =
                      row.kind === "Test event" ? updateEventSchedule : updateAssessmentSchedule;
                    save(row.sourceId, schedule, currentSession().name);
                    setEditing(false);
                    setError("");
                  } catch (cause) {
                    setError(
                      cause instanceof Error ? cause.message : "Schedule could not be saved.",
                    );
                  }
                }}
              >
                <Stack space="space.150">
                  {error ? (
                    <p role="alert" className="font-body-small text-danger">
                      {error}
                    </p>
                  ) : null}
                  <Field>
                    <FieldLabel
                      id={`${fieldId}-owner-team-13-label`}
                      htmlFor={`${fieldId}-owner-team-13`}
                    >
                      {"Owner / team"}
                      <span aria-hidden="true" className="text-danger">
                        {" "}
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      id={`${fieldId}-owner-team-13`}
                      aria-labelledby={`${fieldId}-owner-team-13-label`}
                      aria-required={true}
                      required
                      value={schedule.owner}
                      onChange={(event) =>
                        setSchedule((old) => ({ ...old, owner: event.target.value }))
                      }
                    />
                  </Field>
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
                  >
                    <Field>
                      <FieldLabel
                        id={`${fieldId}-start-date-14-label`}
                        htmlFor={`${fieldId}-start-date-14`}
                      >
                        {"Start date"}
                        <span aria-hidden="true" className="text-danger">
                          {" "}
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id={`${fieldId}-start-date-14`}
                        aria-labelledby={`${fieldId}-start-date-14-label`}
                        aria-required={true}
                        type="date"
                        required
                        value={schedule.start}
                        onChange={(event) =>
                          setSchedule((old) => ({ ...old, start: event.target.value }))
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel
                        id={`${fieldId}-end-date-15-label`}
                        htmlFor={`${fieldId}-end-date-15`}
                      >
                        {"End date"}
                        <span aria-hidden="true" className="text-danger">
                          {" "}
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id={`${fieldId}-end-date-15`}
                        aria-labelledby={`${fieldId}-end-date-15-label`}
                        aria-required={true}
                        type="date"
                        required
                        min={schedule.start || undefined}
                        value={schedule.end}
                        onChange={(event) =>
                          setSchedule((old) => ({ ...old, end: event.target.value }))
                        }
                      />
                    </Field>
                  </Grid>
                </Stack>
              </form>
            ) : null}
            <div>
              <KeyValue label="Track">{row.track}</KeyValue>
              <KeyValue label="Status">
                <Badge variant="secondary" tone={tone(row)}>
                  {row.status}
                </Badge>
              </KeyValue>
              <KeyValue label="Owner / team">{row.owner || "Unassigned"}</KeyValue>
              <KeyValue label="Planned / window">{row.dates || "Undated"}</KeyValue>
              <KeyValue label="Phase">{row.phase || "—"}</KeyValue>
              <KeyValue label="Dependencies / related work">
                {row.dependency || "None recorded"}
              </KeyValue>
            </div>
            {stream ? (
              <>
                <p className="font-body-small">{stream.objective}</p>
                <Section title="Assigned people">
                  <Table>
                    <thead>
                      <tr>
                        <Table.Header>Person</Table.Header>
                        <Table.Header>Role</Table.Header>
                        <Table.Header>Allocation</Table.Header>
                      </tr>
                    </thead>
                    <tbody>
                      {stream.members.map((member) => (
                        <Table.Row key={member.person}>
                          <Table.Cell>
                            <TextLink
                              render={
                                <Link to="/people/$personId" params={{ personId: member.person }} />
                              }
                            >
                              {personById.get(member.person)?.name ?? member.person}
                            </TextLink>
                          </Table.Cell>
                          <Table.Cell>{member.role}</Table.Cell>
                          <Table.Cell>{member.allocation}%</Table.Cell>
                        </Table.Row>
                      ))}
                    </tbody>
                  </Table>
                </Section>
                <Section title="Controls">
                  <Inline space="space.100" shouldWrap>
                    {stream.controls.map((control) => (
                      <Id key={control}>{control}</Id>
                    ))}
                  </Inline>
                </Section>
                <p className="font-body-small text-subtle">{stream.note}</p>
              </>
            ) : (
              <p className="font-body-small text-subtle">
                Open the source record to update its dates, assignments or completion state.
              </p>
            )}
          </Stack>
        </Box>
        <DialogFooter>
          <>
            <Button variant="subtle" onClick={onClose}>
              Close
            </Button>
            {canEditSchedule ? (
              editing ? (
                <Button variant="primary" type="submit" form={formId}>
                  Save schedule
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  Edit dates and owner
                </Button>
              )
            ) : null}
            {source}
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
