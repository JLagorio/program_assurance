import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  DataTable,
  Dialog,
  Field,
  Grid,
  Id,
  Inline,
  Input,
  KeyValue,
  NativeSelect,
  Section,
  Stack,
  Table,
  Tabs,
  Textarea,
  TextLink,
  defineColumns,
  useDataTable,
  type Tone,
} from "@ledger/design-system";

import { ProgramTasks } from "@/components/app/tasks-section";
import { useAssuranceVersion } from "@/lib/assurance-record-store";
import {
  updateAssessmentSchedule,
  updateEventSchedule,
  useAssessmentsVersion,
} from "@/lib/assessment-store";
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
        value={view}
        onValueChange={(next) => {
          setView(next as ScheduleView);
          onViewChange?.(next as ScheduleView);
        }}
      >
        <Tabs.List label="Schedule views">
          {(["Plan", "Tasks", "Assignments"] as const).map((item) => (
            <Tabs.Tab key={item} value={item}>
              {item}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel value="Plan">
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
        </Tabs.Panel>
        <Tabs.Panel value="Tasks">
          <ProgramTasks programId={programId} me={me} />
        </Tabs.Panel>
        <Tabs.Panel value="Assignments">
          <ScheduleAssignments
            programId={programId}
            onOpen={(id) => setSelectedId(`Workstream:${id}`)}
          />
        </Tabs.Panel>
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
  const [draft, setDraft] = useState(milestone);
  const [error, setError] = useState("");
  const set = <K extends keyof ProgramGate>(key: K, value: ProgramGate[K]) =>
    setDraft((old) => ({ ...old, [key]: value }));
  const gates = programScheduleMilestones(programId).filter((gate) => gate.id !== milestone.id);
  const workstreams = workstreamsForProgram(programId);
  const formId = `milestone-${milestone.id}`;
  return (
    <Dialog
      open
      onClose={onClose}
      width="large"
      title={milestone.name ? "Edit milestone" : "New milestone"}
      description={`${programId} · ${milestone.id}`}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={formId}>
            Save milestone
          </Button>
        </>
      }
    >
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
          <Field label="Milestone name" isRequired>
            <Input
              required
              value={draft.name}
              onChange={(event) => set("name", event.target.value)}
            />
          </Field>
          <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="space.150">
            <Field label="Track / type">
              <NativeSelect
                value={draft.kind}
                onChange={(event) => set("kind", event.target.value as ProgramGate["kind"])}
              >
                {["Milestone decision", "Engineering review", "RMF action", "Operational"].map(
                  (kind) => (
                    <option key={kind}>{kind}</option>
                  ),
                )}
              </NativeSelect>
            </Field>
            <Field label="Phase">
              <Input
                placeholder="e.g. Engineering & manufacturing development"
                value={draft.phase}
                onChange={(event) => set("phase", event.target.value)}
              />
            </Field>
            <Field label="Owner / team">
              <Input
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
            <Field label="Status">
              <NativeSelect
                value={draft.status}
                onChange={(event) => set("status", event.target.value as ProgramGate["status"])}
              >
                {Object.keys(gateStatusTone).map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Planned date">
              <Input
                type="date"
                value={scheduleDate(draft.planned) ?? ""}
                onChange={(event) => set("planned", event.target.value)}
              />
            </Field>
            <Field label="Actual date" isRequired={draft.status === "Complete"}>
              <Input
                type="date"
                required={draft.status === "Complete"}
                value={scheduleDate(draft.actual) ?? ""}
                onChange={(event) => set("actual", event.target.value)}
              />
            </Field>
            <Field label="Workstream">
              <NativeSelect
                value={draft.workstreams?.[0] ?? ""}
                onChange={(event) =>
                  set("workstreams", event.target.value ? [event.target.value] : [])
                }
              >
                <option value="">No workstream</option>
                {workstreams.map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {stream.id} — {stream.title}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Depends on milestone">
              <NativeSelect
                value={draft.dependsOn?.[0] ?? ""}
                onChange={(event) =>
                  set("dependsOn", event.target.value ? [event.target.value] : [])
                }
              >
                <option value="">No dependency</option>
                {gates.map((gate) => (
                  <option key={gate.id} value={gate.id}>
                    {gate.id} — {gate.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </Grid>
          <Field label="Required deliverable / readiness criterion">
            <Textarea
              value={draft.cyberGate}
              onChange={(event) => set("cyberGate", event.target.value)}
            />
          </Field>
          <Field label="Deliverable reference">
            <Input
              placeholder="Document or record reference"
              value={draft.artifact === "—" ? "" : draft.artifact}
              onChange={(event) => set("artifact", event.target.value)}
            />
          </Field>
          <Field label="Notes">
            <Textarea
              value={draft.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </Field>
        </Stack>
      </form>
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
      <TextLink>
        <Link to="/programs/$programId" params={{ programId }} search={{ tab: "POA&M" }}>
          Open program POA&Ms
        </Link>
      </TextLink>
    )
  ) : row.kind === "Workstream" ? (
    <TextLink>
      <Link to="/workstreams/$workstreamId" params={{ workstreamId: row.sourceId }}>
        Open workstream
      </Link>
    </TextLink>
  ) : row.kind === "Task" ? (
    <TextLink>
      <Link to="/tasks/$taskId" params={{ taskId: row.sourceId }}>
        Open task
      </Link>
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
      <TextLink>
        <Link to="/campaigns/$campaignId" params={{ campaignId }}>
          Open assessment
        </Link>
      </TextLink>
    )
  ) : null;
  return (
    <Dialog
      open
      onClose={onClose}
      width="large"
      title={row.title}
      description={`${programId} · ${row.sourceId}`}
      footer={
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
      }
    >
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
                setError(cause instanceof Error ? cause.message : "Schedule could not be saved.");
              }
            }}
          >
            <Stack space="space.150">
              {error ? (
                <p role="alert" className="font-body-small text-danger">
                  {error}
                </p>
              ) : null}
              <Field label="Owner / team" isRequired>
                <Input
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
                <Field label="Start date" isRequired>
                  <Input
                    type="date"
                    required
                    value={schedule.start}
                    onChange={(event) =>
                      setSchedule((old) => ({ ...old, start: event.target.value }))
                    }
                  />
                </Field>
                <Field label="End date" isRequired>
                  <Input
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
                        <TextLink>
                          <Link to="/people/$personId" params={{ personId: member.person }}>
                            {personById.get(member.person)?.name ?? member.person}
                          </Link>
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
    </Dialog>
  );
}
