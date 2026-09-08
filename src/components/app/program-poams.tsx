import { useCallback, useId, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import {
  Badge,
  Block,
  Button,
  DataTable,
  Fact,
  Field,
  Grid,
  Id,
  Inline,
  Input,
  NativeSelect,
  Sheet,
  Stack,
  Table,
  Text,
  Textarea,
  TextLink,
  defineColumns,
  useDataTable,
  toast,
  type Preset,
} from "@ledger/design-system";
import { findingsForPoam, poamsForProgram, type PoamItem } from "@/lib/register";
import { programFindings, isDeficiency } from "@/lib/findings";
import {
  addPoamMilestone,
  createPoam,
  linkFindingToPoam,
  updatePoam,
  updatePoamMilestone,
  useAssuranceVersion,
} from "@/lib/assurance-record-store";
import { currentSession } from "@/lib/control-work";
import { statusTone } from "@/lib/spine";
import { FindingRecordSheet } from "@/components/app/program-findings";
import { nodeById } from "@/lib/composition";

function dateInput(value: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
function dueLabel(value: string) {
  return dateInput(value) || value || "Unscheduled";
}
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The POA&M could not be saved.";
}

const poamPresets: Preset[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active", filters: [{ id: "status", value: ["Ongoing", "Overdue"] }] },
  { id: "overdue", label: "Overdue", filters: [{ id: "status", value: ["Overdue"] }] },
  { id: "completed", label: "Completed", filters: [{ id: "status", value: ["Completed"] }] },
];

export function ProgramPoams({
  programId,
  initialPoamId,
  onPoamChange,
}: {
  programId: string;
  initialPoamId?: string | undefined;
  onPoamChange?: ((id: string | null) => void) | undefined;
}) {
  const version = useAssuranceVersion();
  const [selected, setSelected] = useState<string | null>(initialPoamId ?? null);
  const [creating, setCreating] = useState(false);
  const select = useCallback(
    (id: string | null) => {
      setSelected(id);
      onPoamChange?.(id);
    },
    [onPoamChange],
  );
  const rows = useMemo(
    () =>
      poamsForProgram(programId).map((item) => ({
        ...item,
        outstanding: findingsForPoam(item.id).filter(isDeficiency).length,
        progress: `${item.milestones?.filter((milestone) => milestone.status === "Completed").length ?? 0} / ${item.milestones?.length ?? 0}`,
      })),
    // Records mutate in the shared store; its version invalidates this projection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programId, version],
  );
  const columns = useMemo(
    () =>
      defineColumns<(typeof rows)[number]>((c) => [
        c.id("id", {
          header: "POA&M",
          width: 140,
          hideable: false,
          pin: "start",
          preview: (item) => select(item.id),
          cell: (item) => (
            <Button size="small" variant="link" onClick={() => select(item.id)}>
              <Id>{item.id}</Id>
            </Button>
          ),
        }),
        c.text("title", { header: "Remediation commitment", minWidth: 300, hideable: false }),
        c.status("status", {
          header: "Status",
          width: 140,
          tone: (item) => statusTone(item.status),
        }),
        c.text("owner", { header: "Owner", width: 170 }),
        c.text("scheduledCompletion", {
          header: "Due date",
          width: 140,
          cell: (item) => dueLabel(item.scheduledCompletion),
          sortBy: (item) => dateInput(item.scheduledCompletion),
        }),
        c.number("outstanding", { header: "Unresolved findings", width: 160 }),
        c.text("progress", { header: "Milestones complete", width: 160 }),
        c.text("resources", { header: "Resources", width: 220 }),
        c.actions((item) => [{ label: "Manage POA&M", onSelect: () => select(item.id) }]),
      ]),
    [select],
  );
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (item) => item.id,
    label: "Program POA&Ms",
    view: `program-poams-${programId}`,
    resizable: true,
    reorderable: true,
  });
  const create = (
    <Button size="small" variant="primary" iconBefore={<Plus />} onClick={() => setCreating(true)}>
      New POA&M
    </Button>
  );
  return (
    <>
      <DataTable
        table={table}
        toolbar={
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <DataTable.Search table={table} placeholder="Find a POA&M" />
            <DataTable.Presets
              table={table}
              presets={poamPresets}
              variant="menu"
              aria-label="Saved views"
            />
            <DataTable.Filter table={table} column="status" />
            <DataTable.Filter table={table} column="owner" />
            <Inline className="ml-auto" space="space.100" alignBlock="center">
              <DataTable.Columns table={table} />
              <DataTable.Settings table={table} />
              {create}
            </Inline>
          </Inline>
        }
        empty={{
          title: rows.length ? "No POA&Ms match" : "No remediation commitments",
          description: rows.length
            ? "Clear the filters or try another search."
            : "Create a dated remediation plan and link the findings it will resolve.",
          action: rows.length ? undefined : create,
        }}
      />
      {creating ? (
        <NewPoamSheet
          programId={programId}
          onClose={() => setCreating(false)}
          onCreated={(item) => {
            setCreating(false);
            select(item.id);
          }}
        />
      ) : null}
      {selected ? (
        <PoamRecordSheet
          key={selected}
          programId={programId}
          poamId={selected}
          onClose={() => select(null)}
        />
      ) : null}
    </>
  );
}

export function NewPoamSheet({
  programId,
  findingIds = [],
  onClose,
  onCreated,
}: {
  programId: string;
  findingIds?: string[];
  onClose: () => void;
  onCreated: (item: PoamItem) => void;
}) {
  useAssuranceVersion();
  const formId = useId();
  const members = programFindings(programId).filter((finding) => findingIds.includes(finding.id));
  const [draft, setDraft] = useState({
    title: members[0]?.title ?? "",
    remediation: members[0]?.recommendation ?? "",
    owner: members[0]?.owner ?? currentSession().name,
    due: "",
    resources: "",
    finding: "",
  });
  const [error, setError] = useState("");
  const set = (key: keyof typeof draft, value: string) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  const eligible = programFindings(programId).filter(
    (finding) => !finding.poam && isDeficiency(finding),
  );
  return (
    <Sheet
      open
      onClose={onClose}
      title="New POA&M"
      subtitle={
        members.length
          ? `Remediation for ${members.map((finding) => finding.id).join(", ")}`
          : "Assign an owner, remediation plan and completion date."
      }
      width={640}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" form={formId} type="submit">
            Create POA&M
          </Button>
        </>
      }
    >
      <form
        noValidate
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          try {
            const item = createPoam({
              program: programId,
              title: draft.title,
              owner: draft.owner,
              remediation: draft.remediation,
              resources: draft.resources,
              scheduledCompletion: draft.due,
              findingIds: members.length ? findingIds : draft.finding ? [draft.finding] : [],
            });
            toast.success("POA&M created");
            onCreated(item);
          } catch (failure) {
            setError(errorMessage(failure));
          }
        }}
      >
        <Stack space="space.150">
          {error ? (
            <p role="alert" className="font-body text-danger">
              {error}
            </p>
          ) : null}
          <Field label="Remediation title" isRequired>
            <Input value={draft.title} onChange={(event) => set("title", event.target.value)} />
          </Field>
          <Field label="Remediation plan" isRequired>
            <Textarea
              rows={5}
              value={draft.remediation}
              onChange={(event) => set("remediation", event.target.value)}
            />
          </Field>
          <Grid templateColumns="1fr 1fr" gap="space.150">
            <Field label="Owner" isRequired>
              <Input value={draft.owner} onChange={(event) => set("owner", event.target.value)} />
            </Field>
            <Field label="Completion date" isRequired>
              <Input
                type="date"
                value={draft.due}
                onChange={(event) => set("due", event.target.value)}
              />
            </Field>
          </Grid>
          <Field label="Resources required">
            <Input
              value={draft.resources}
              onChange={(event) => set("resources", event.target.value)}
            />
          </Field>
          {members.length ? (
            <Block title="Linked findings">
              {members.map((finding) => (
                <p key={finding.id} className="font-body">
                  <Id>{finding.id}</Id> · {finding.title}
                </p>
              ))}
            </Block>
          ) : (
            <Field label="Finding to remediate">
              <NativeSelect
                value={draft.finding}
                onChange={(event) => set("finding", event.target.value)}
              >
                <option value="">Link a finding after creating the plan</option>
                {eligible.map((finding) => (
                  <option key={finding.id} value={finding.id}>
                    {finding.id} · {finding.title}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}
        </Stack>
      </form>
    </Sheet>
  );
}

export function PoamRecordSheet({
  programId,
  poamId,
  onClose,
}: {
  programId: string;
  poamId: string;
  onClose: () => void;
}) {
  useAssuranceVersion();
  const item = poamsForProgram(programId).find((poam) => poam.id === poamId);
  return item ? (
    <PoamEditor key={item.id} item={item} onClose={onClose} />
  ) : (
    <Sheet open onClose={onClose} title="POA&M unavailable">
      <Text>This POA&M is not in this program.</Text>
    </Sheet>
  );
}

function PoamEditor({ item, onClose }: { item: PoamItem; onClose: () => void }) {
  const formId = useId();
  const [draft, setDraft] = useState({
    title: item.title,
    owner: item.owner,
    remediation: item.remediation,
    resources: item.resources,
    scheduledCompletion: dateInput(item.scheduledCompletion),
    status: item.status,
    milestoneNote: item.milestoneNote,
  });
  const [error, setError] = useState("");
  const [statusEdited, setStatusEdited] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDate, setMilestoneDate] = useState("");
  const [linkId, setLinkId] = useState("");
  const [findingId, setFindingId] = useState<string | null>(null);
  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  const members = findingsForPoam(item.id);
  const eligible = programFindings(item.program).filter(
    (finding) => !finding.poam && isDeficiency(finding),
  );
  const act = (action: () => void, message: string) => {
    setError("");
    try {
      action();
      toast.success(message);
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };
  return (
    <>
      <Sheet
        open
        onClose={onClose}
        title={item.title}
        subtitle={item.id}
        width={760}
        eyebrow={
          <Badge variant="secondary" tone={statusTone(item.status)}>
            {item.status}
          </Badge>
        }
        facts={
          <>
            <Fact label="Owner">{item.owner}</Fact>
            <Fact label="Due">{dueLabel(item.scheduledCompletion)}</Fact>
            <Fact label="Unresolved findings">{members.filter(isDeficiency).length}</Fact>
          </>
        }
        footer={
          <>
            <Button onClick={onClose}>Done</Button>
            <Button variant="primary" type="submit" form={formId}>
              Save changes
            </Button>
          </>
        }
      >
        <form
          noValidate
          id={formId}
          onSubmit={(event) => {
            event.preventDefault();
            act(() => {
              updatePoam(item.id, { ...draft, status: statusEdited ? draft.status : item.status });
              setStatusEdited(false);
            }, "POA&M updated");
          }}
        >
          <Stack space="space.200">
            {error ? (
              <p role="alert" className="font-body text-danger">
                {error}
              </p>
            ) : null}
            <Field label="Remediation title" isRequired>
              <Input value={draft.title} onChange={(event) => set("title", event.target.value)} />
            </Field>
            <Field label="Remediation plan" isRequired>
              <Textarea
                rows={4}
                value={draft.remediation}
                onChange={(event) => set("remediation", event.target.value)}
              />
            </Field>
            <Grid templateColumns="1fr 1fr" gap="space.150">
              <Field label="Owner" isRequired>
                <Input value={draft.owner} onChange={(event) => set("owner", event.target.value)} />
              </Field>
              <Field label="Completion date" isRequired>
                <Input
                  type="date"
                  value={draft.scheduledCompletion}
                  onChange={(event) => set("scheduledCompletion", event.target.value)}
                />
              </Field>
              <Field label="Status">
                <NativeSelect
                  value={statusEdited ? draft.status : item.status}
                  onChange={(event) => {
                    set("status", event.target.value as PoamItem["status"]);
                    setStatusEdited(true);
                  }}
                >
                  {["Ongoing", "Overdue", "Completed", "Risk accepted"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Resources required">
                <Input
                  value={draft.resources}
                  onChange={(event) => set("resources", event.target.value)}
                />
              </Field>
            </Grid>
            <Field label="Progress note">
              <Textarea
                rows={3}
                value={draft.milestoneNote}
                onChange={(event) => set("milestoneNote", event.target.value)}
              />
            </Field>
            <Block title="Linked findings" count={members.length}>
              {item.sourceStatus === "completed" &&
              members.some(
                (finding) => finding.sourceStatus === "closed" && !finding.retests?.length,
              ) ? (
                <Badge tone="warning">Imported completion · passing retest not recorded</Badge>
              ) : null}
              {item.controls?.length || item.requirements?.length ? (
                <Inline space="space.100" shouldWrap>
                  {item.controls?.map((controlId) => (
                    <TextLink key={controlId}>
                      <Link
                        to="/programs/$programId/controls/$controlId"
                        params={{ programId: item.program, controlId }}
                      >
                        {controlId}
                      </Link>
                    </TextLink>
                  ))}
                  {item.requirements?.map((requirementId) => (
                    <TextLink key={requirementId}>
                      <Link
                        to="/programs/$programId/requirements/$requirementId"
                        params={{ programId: item.program, requirementId }}
                      >
                        {requirementId}
                      </Link>
                    </TextLink>
                  ))}
                </Inline>
              ) : null}
              {item.nodes?.length ? (
                <Text as="p" size="small" color="color.text.subtle">
                  {item.nodes.map((id) => nodeById.get(id)?.name ?? id).join(", ")}
                </Text>
              ) : null}
              {members.length ? (
                <Table>
                  <thead>
                    <Table.Row>
                      <Table.Header>Finding</Table.Header>
                      <Table.Header>Observed condition</Table.Header>
                      <Table.Header>Status</Table.Header>
                    </Table.Row>
                  </thead>
                  <tbody>
                    {members.map((finding) => (
                      <Table.Row key={finding.id}>
                        <Table.Cell>
                          <Button
                            type="button"
                            size="small"
                            variant="link"
                            onClick={() => setFindingId(finding.id)}
                          >
                            <Id>{finding.id}</Id>
                          </Button>
                        </Table.Cell>
                        <Table.Cell className="whitespace-normal">{finding.title}</Table.Cell>
                        <Table.Cell>
                          <Badge variant="secondary" tone={statusTone(finding.lifecycle)}>
                            {finding.lifecycle}
                          </Badge>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Text size="small" color="color.text.subtle">
                  Link the findings this remediation plan resolves.
                </Text>
              )}
              {item.status !== "Completed" ? (
                <Inline space="space.100" alignBlock="end" className="pt-150">
                  <Field label="Attach finding" className="min-w-0 flex-1">
                    <NativeSelect
                      value={linkId}
                      onChange={(event) => setLinkId(event.target.value)}
                    >
                      <option value="">Select an unassigned finding</option>
                      {eligible.map((finding) => (
                        <option key={finding.id} value={finding.id}>
                          {finding.id} · {finding.title}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Button
                    type="button"
                    disabled={!linkId}
                    onClick={() =>
                      act(() => {
                        linkFindingToPoam(linkId, item.id);
                        setLinkId("");
                      }, "Finding attached")
                    }
                  >
                    Attach
                  </Button>
                </Inline>
              ) : null}
            </Block>
            <Block title="Milestones" count={item.milestones?.length ?? 0}>
              {item.milestones?.length ? (
                <Table>
                  <thead>
                    <Table.Row>
                      <Table.Header>Milestone</Table.Header>
                      <Table.Header>Target date</Table.Header>
                      <Table.Header>Status</Table.Header>
                      <Table.Header>Action</Table.Header>
                    </Table.Row>
                  </thead>
                  <tbody>
                    {item.milestones.map((milestone) => (
                      <Table.Row key={milestone.id}>
                        <Table.Cell className="whitespace-normal">{milestone.title}</Table.Cell>
                        <Table.Cell>{dueLabel(milestone.targetDate)}</Table.Cell>
                        <Table.Cell>
                          <Badge
                            variant="secondary"
                            tone={milestone.status === "Completed" ? "success" : "neutral"}
                          >
                            {milestone.status}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            type="button"
                            size="xsmall"
                            onClick={() =>
                              act(() => {
                                updatePoamMilestone(item.id, milestone.id, {
                                  status:
                                    milestone.status === "Completed" ? "In progress" : "Completed",
                                });
                              }, "Milestone updated")
                            }
                          >
                            {milestone.status === "Completed" ? "Reopen" : "Complete"}
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Text size="small" color="color.text.subtle">
                  Break the remediation into dated, verifiable milestones.
                </Text>
              )}
              <Stack space="space.100" className="pt-150">
                <Grid templateColumns="2fr 1fr" gap="space.100">
                  <Field label="New milestone">
                    <Input
                      value={milestoneTitle}
                      onChange={(event) => setMilestoneTitle(event.target.value)}
                    />
                  </Field>
                  <Field label="Target date">
                    <Input
                      type="date"
                      value={milestoneDate}
                      onChange={(event) => setMilestoneDate(event.target.value)}
                    />
                  </Field>
                </Grid>
                <Button
                  type="button"
                  size="small"
                  onClick={() =>
                    act(() => {
                      addPoamMilestone(item.id, {
                        title: milestoneTitle,
                        targetDate: milestoneDate,
                      });
                      setMilestoneTitle("");
                      setMilestoneDate("");
                    }, "Milestone added")
                  }
                >
                  Add milestone
                </Button>
              </Stack>
            </Block>
            <Text size="small" color="color.text.subtle">
              Completion requires resolved findings and completed milestones. Passing retests and
              supporting evidence are recorded on each finding.
            </Text>
          </Stack>
        </form>
      </Sheet>
      {findingId ? (
        <FindingRecordSheet
          key={findingId}
          programId={item.program}
          findingId={findingId}
          onClose={() => setFindingId(null)}
        />
      ) : null}
    </>
  );
}
