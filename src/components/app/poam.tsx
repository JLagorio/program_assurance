import {
  FieldLabel,
  FieldDescription,
  FieldError,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Box,
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dot,
  Eyebrow,
  Field,
  FilterChip,
  Grid,
  Id,
  Indicator,
  Inline,
  Input,
  Item,
  KeyValue,
  Progress,
  Related,
  Section,
  Stack,
  Table,
  Textarea,
  TextLink,
  Timeline,
} from "@ledger/design-system";
import { useRecordForm } from "@/lib/record-form";
import { Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useId, useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";
import {
  formatOscalDate,
  milestoneStatusTone,
  poamForProgram,
  poamSeverityTone,
  poamStatusTone,
  programControls,
  type Milestone,
  type MilestoneStatus,
  type OscalProp,
  type PoamItem,
  type PoamSeverity,
  type PoamStatus,
} from "@/lib/grc-data";
import {
  currentUser,
  diffPoamItems,
  makeAuditEntry,
  type AuditAction,
  type AuditEntry,
  type FieldChange,
} from "@/lib/poam-audit";

const NOW = new Date("2026-08-27T13:28:00Z");

const severityRank: Record<PoamSeverity, number> = {
  Critical: 0,
  High: 1,
  Moderate: 2,
  Low: 3,
};

const closedStatuses: PoamStatus[] = ["Completed", "Risk accepted"];
const severities: PoamSeverity[] = ["Low", "Moderate", "High", "Critical"];
const statuses: PoamStatus[] = ["Open", "Ongoing", "Risk accepted", "Completed", "Deferred"];
const milestoneStatuses: MilestoneStatus[] = ["Planned", "In progress", "Completed", "Missed"];
const contacts = ["Grace Hoppel", "Marcus Ryde", "Dana Whitlock", "Priya Raghavan", "Sarah Chen"];
const detectionSources = [
  "Security assessment",
  "Continuous monitoring",
  "Vulnerability scan",
  "Incident",
  "Self-identified",
];

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** date-time-with-timezone from a yyyy-mm-dd date input */
function toOscalDateTime(date: string, time = "17:00:00-04:00") {
  return `${date}T${time}`;
}

/** yyyy-mm-dd for a date input, from a date-time-with-timezone */
function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

function nowOscal() {
  return NOW.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function daysOut(iso: string) {
  return Math.round((new Date(iso).getTime() - NOW.getTime()) / 86_400_000);
}

function dueLabel(item: PoamItem) {
  const d = daysOut(item.scheduledCompletion);
  if (closedStatuses.includes(item.status))
    return {
      text: formatOscalDate(item.scheduledCompletion),
      tone: null as null | "danger" | "warning",
    };
  if (d < 0) return { text: `${Math.abs(d)}d overdue`, tone: "danger" as const };
  if (d <= 30) return { text: `in ${d}d`, tone: "warning" as const };
  return { text: formatOscalDate(item.scheduledCompletion), tone: null };
}

function milestoneProgress(item: PoamItem) {
  if (item.milestones.length === 0) return 0;
  const done = item.milestones.filter((m) => m.status === "Completed").length;
  return Math.round((done / item.milestones.length) * 100);
}

const filters = ["All", "Open", "Ongoing", "Overdue", "Completed", "Deferred"] as const;

export function PoamSection({
  programId,
  programName,
  defaultOwner,
}: {
  programId: string;
  programName: string;
  defaultOwner: string;
}) {
  const seed = useMemo(() => poamForProgram(programId), [programId]);
  const [items, setItems] = useState<PoamItem[]>(seed);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  useEffect(() => {
    setItems(seed);
    setAudit([]);
  }, [seed]);

  const log = (action: AuditAction, item: PoamItem, changes: FieldChange[]) =>
    setAudit((list) => [makeAuditEntry(action, item, changes, nowOscal()), ...list]);

  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [openOnly, setOpenOnly] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeUuid, setActiveUuid] = useState<string | null>(null);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);

  const active = items.find((i) => i.uuid === activeUuid) ?? null;
  const editing = items.find((i) => i.uuid === editingUuid) ?? null;
  const deleting = items.find((i) => i.uuid === deletingUuid) ?? null;

  const rows = useMemo(() => {
    let list = items;
    if (filter === "Overdue") {
      list = list.filter(
        (i) => !closedStatuses.includes(i.status) && daysOut(i.scheduledCompletion) < 0,
      );
    } else if (filter !== "All") {
      list = list.filter((i) => i.status === filter);
    }
    if (openOnly) list = list.filter((i) => !closedStatuses.includes(i.status));
    return [...list].sort((a, b) => {
      const s = severityRank[a.severity] - severityRank[b.severity];
      if (s !== 0) return s;
      return daysOut(a.scheduledCompletion) - daysOut(b.scheduledCompletion);
    });
  }, [items, filter, openOnly]);

  return (
    <>
      <Section
        title="Plan of action and milestones"
        action={
          <Button variant="primary" onClick={() => setCreating(true)} iconBefore={<Plus />}>
            New POA&amp;M item
          </Button>
        }
      >
        <Inline className="pb-150 pt-150" space="space.100" alignBlock="center" shouldWrap>
          {filters.map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              <Inline
                as="span"
                display="inline-flex"
                alignBlock="center"
                className={
                  f === filter
                    ? "h-control-small rounded-medium bg-brand-subtlest px-100 font-body font-medium text-brand"
                    : "h-control-small rounded-medium px-100 font-body text-subtle transition-colors hover:bg-neutral-subtle-hovered hover:text-default"
                }
              >
                {f}
              </Inline>
            </button>
          ))}
          <span className="ml-auto">
            <FilterChip
              label="Hide closed"
              isActive={openOnly}
              onClick={() => setOpenOnly((v) => !v)}
            />
          </span>
        </Inline>

        <Table>
          <thead>
            <tr>
              <Table.Header width={72}>Item</Table.Header>
              <Table.Header>Weakness</Table.Header>
              <Table.Header width={104}>Controls</Table.Header>
              <Table.Header width={92}>Severity</Table.Header>
              <Table.Header width={112}>Status</Table.Header>
              <Table.Header width={128}>Milestones</Table.Header>
              <Table.Header className="text-right" width={110}>
                Scheduled
              </Table.Header>
              <Table.Header className="text-right" width={72}>
                Actions
              </Table.Header>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => {
              const due = dueLabel(i);
              const pct = milestoneProgress(i);
              return (
                <Table.Row
                  key={i.uuid}
                  onClick={() => setActiveUuid(i.uuid)}
                  className="group cursor-pointer"
                >
                  <Table.Cell width={72}>
                    <Id>{i.poamId}</Id>
                  </Table.Cell>
                  <Table.Cell>{i.title}</Table.Cell>
                  <Table.Cell width={104}>{i.controls.join(", ")}</Table.Cell>
                  <Table.Cell width={92}>
                    <Badge variant="secondary" tone={poamSeverityTone[i.severity]}>
                      {i.severity}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell width={112}>
                    <Indicator tone={poamStatusTone[i.status]}>{i.status}</Indicator>
                  </Table.Cell>
                  <Table.Cell width={128}>
                    <Inline as="span" space="space.100" alignBlock="center">
                      <span className="w-600">
                        <Progress
                          value={pct}
                          tone={pct === 100 ? "success" : "information"}
                          aria-hidden
                        />
                      </span>
                      <span className="tabular-nums text-subtle">
                        {i.milestones.filter((m) => m.status === "Completed").length}/
                        {i.milestones.length}
                      </span>
                    </Inline>
                  </Table.Cell>
                  <Table.Cell
                    className={
                      due.tone === "danger"
                        ? "tabular-nums text-right text-danger"
                        : due.tone === "warning"
                          ? "tabular-nums text-right text-warning"
                          : "tabular-nums text-right"
                    }
                    width={110}
                  >
                    {due.text}
                  </Table.Cell>
                  <Table.Cell className="text-right" width={72}>
                    <Inline
                      className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                      as="span"
                      space="space.025"
                      alignBlock="center"
                      alignInline="end"
                    >
                      <button
                        aria-label={`Edit ${i.poamId}`}
                        className="inline-flex items-center justify-center rounded-medium text-subtle transition-colors hover:bg-neutral-subtle-hovered hover:text-default size-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingUuid(i.uuid);
                        }}
                      >
                        <Pencil className="size-icon-small" />
                      </button>
                      <button
                        aria-label={`Delete ${i.poamId}`}
                        className="inline-flex items-center justify-center rounded-medium text-subtle transition-colors hover:bg-danger hover:text-danger size-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingUuid(i.uuid);
                        }}
                      >
                        <Trash2 className="size-icon-small" />
                      </button>
                    </Inline>
                  </Table.Cell>
                </Table.Row>
              );
            })}
            {rows.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={8}>No POA&amp;M items match this view.</Table.Cell>
              </Table.Row>
            ) : null}
          </tbody>
        </Table>
      </Section>

      <Section
        title="Audit trail"
        action={
          <span className="font-body-small text-subtle">
            Signed in as {currentUser.name} · {currentUser.role}
          </span>
        }
      >
        <Table>
          <thead>
            <tr>
              <Table.Header width={150}>Timestamp</Table.Header>
              <Table.Header width={84}>Action</Table.Header>
              <Table.Header width={72}>Item</Table.Header>
              <Table.Header width={150}>User</Table.Header>
              <Table.Header>Changed fields</Table.Header>
            </tr>
          </thead>
          <tbody>
            {audit.map((e) => (
              <Table.Row key={e.uuid}>
                <Table.Cell className="tabular-nums" width={150}>
                  {formatOscalDate(e.timestamp, true)}
                </Table.Cell>
                <Table.Cell width={84}>
                  <Badge
                    variant="secondary"
                    tone={
                      e.action === "Deleted"
                        ? "danger"
                        : e.action === "Created"
                          ? "success"
                          : "information"
                    }
                  >
                    {e.action}
                  </Badge>
                </Table.Cell>
                <Table.Cell width={72}>
                  <Id>{e.poamId}</Id>
                </Table.Cell>
                <Table.Cell width={150}>{e.actor}</Table.Cell>
                <Table.Cell>
                  {e.changes.length === 0
                    ? e.action === "Created"
                      ? "New poam-item recorded"
                      : e.action === "Deleted"
                        ? "Record removed"
                        : "No field changes"
                    : e.changes.map((c) => `${c.field}: ${c.from} → ${c.to}`).join("  ·  ")}
                </Table.Cell>
              </Table.Row>
            ))}
            {audit.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5}>No POA&amp;M changes recorded yet.</Table.Cell>
              </Table.Row>
            ) : null}
          </tbody>
        </Table>
      </Section>

      <PoamDetailModal
        item={active}
        audit={audit.filter((e) => e.itemUuid === activeUuid)}
        onClose={() => setActiveUuid(null)}
        onEdit={() => {
          setEditingUuid(activeUuid);
          setActiveUuid(null);
        }}
        onDelete={() => {
          setDeletingUuid(activeUuid);
          setActiveUuid(null);
        }}
      />

      <PoamEditModal
        item={editing}
        onClose={() => setEditingUuid(null)}
        onSave={(next) => {
          const prev = items.find((i) => i.uuid === next.uuid);
          if (prev) log("Updated", next, diffPoamItems(prev, next));
          setItems((list) => list.map((i) => (i.uuid === next.uuid ? next : i)));
          setEditingUuid(null);
        }}
        onDelete={() => {
          setDeletingUuid(editingUuid);
          setEditingUuid(null);
        }}
      />

      <PoamDeleteModal
        item={deleting}
        onClose={() => setDeletingUuid(null)}
        onConfirm={() => {
          if (deleting) log("Deleted", deleting, []);
          setItems((list) => list.filter((i) => i.uuid !== deletingUuid));
          setDeletingUuid(null);
        }}
      />

      <PoamCreateModal
        open={creating}
        onClose={() => setCreating(false)}
        programId={programId}
        programName={programName}
        defaultOwner={defaultOwner}
        nextId={`V-${String(items.length + 1).padStart(4, "0")}`}
        onCreate={(item) => {
          log("Created", item, []);
          setItems((list) => [...list, item]);
          setCreating(false);
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------- Detail */

function PoamDetailModal({
  item,
  audit,
  onClose,
  onEdit,
  onDelete,
}: {
  item: PoamItem | null;
  audit: AuditEntry[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!item) return null;

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
          <DialogTitle>{item.title}</DialogTitle>
          <DialogDescription>{`${item.poamId} · ${item.controls.join(", ")} · ${item.origin}`}</DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none">
          <Box className="grid grid-cols-1 md:grid-cols-3">
            <Box className="px-250 py-200 md:col-span-2">
              <Stack space="space.250">
                <Inline space="space.100" alignBlock="center" shouldWrap>
                  <Badge variant="secondary" tone={poamSeverityTone[item.severity]}>
                    {item.severity}
                  </Badge>
                  <Badge variant="secondary" tone={poamStatusTone[item.status]}>
                    {item.status}
                  </Badge>
                  <span className="font-body-small text-subtle">{dueLabel(item).text}</span>
                </Inline>

                <div>
                  <Box
                    className="border-b border-default font-body font-semibold"
                    paddingBlockEnd="space.100"
                  >
                    Description
                  </Box>
                  <p className="pt-100 font-body text-subtle">{item.description}</p>
                  {item.remarks ? (
                    <p className="pt-100 font-body text-subtle">
                      <span className="font-medium text-default">Remarks. </span>
                      {item.remarks}
                    </p>
                  ) : null}
                </div>

                <div>
                  <Item.Group
                    title="Milestones"
                    trailing={`${item.milestones.filter((m) => m.status === "Completed").length} of ${item.milestones.length} complete`}
                    empty="No milestones recorded."
                  >
                    {item.milestones.map((m) => (
                      <Item
                        key={m.uuid}
                        leading={<Dot tone={milestoneStatusTone[m.status]} />}
                        id={m.id}
                        idWidth={42}
                        title={m.title}
                        meta={m.status}
                        trailing={formatOscalDate(m.completedDate ?? m.targetDate)}
                      />
                    ))}
                  </Item.Group>
                </div>

                <div>
                  <Related
                    title="Related observations"
                    count={item.relatedObservations.length || undefined}
                    layout="cards"
                    empty={{
                      title: "No related observations",
                      description:
                        "Observations that led to this item appear here when the assessor links them.",
                    }}
                  >
                    {item.relatedObservations.map((o) => (
                      <Related.Card
                        key={o.observationUuid}
                        link={<Link to={o.href} />}
                        title={o.title}
                        status={
                          <Badge variant="secondary" tone="neutral">
                            {o.method}
                          </Badge>
                        }
                        meta={<Id>{o.observationUuid.slice(0, 8)}</Id>}
                        properties={[{ label: "Collected", value: formatOscalDate(o.collected) }]}
                      />
                    ))}
                  </Related>
                </div>

                <div>
                  <Related
                    title="Associated risks"
                    count={item.associatedRisks.length || undefined}
                    layout="cards"
                    empty={{
                      title: "No risk linked",
                      description: "A risk exposure entry that rests on this item appears here.",
                    }}
                  >
                    {item.associatedRisks.map((r) => (
                      <Related.Card
                        key={r.riskUuid}
                        link={<Link to="/risks/$riskId" params={{ riskId: r.riskId }} />}
                        title={r.title}
                        meta={<Id>{r.riskId}</Id>}
                        properties={[{ label: "Entry", value: <Id>{r.riskUuid.slice(0, 8)}</Id> }]}
                      />
                    ))}
                  </Related>
                </div>

                <div>
                  <Box
                    className="border-b border-default font-body font-semibold"
                    paddingBlockEnd="space.100"
                  >
                    Audit trail
                  </Box>
                  {audit.length === 0 ? (
                    <p className="pt-100 font-body text-subtle">
                      No changes recorded for this item in this session.
                    </p>
                  ) : (
                    <Timeline className="pt-100">
                      {audit.map((e) => (
                        <Timeline.Item
                          key={e.uuid}
                          title={e.action}
                          meta={`${e.actor} · ${e.actorRole}`}
                          time={formatOscalDate(e.timestamp, true)}
                        >
                          {e.changes.length > 0 ? (
                            <Stack className="block" as="span" space="space.025">
                              {e.changes.map((c) => (
                                <Inline
                                  key={c.field}
                                  className="font-body-small"
                                  as="span"
                                  space="space.100"
                                  alignBlock="baseline"
                                >
                                  <Id className="shrink-0 font-body-xsmall">{c.field}</Id>
                                  <span className="min-w-0 truncate text-subtle line-through">
                                    {c.from}
                                  </span>
                                  <span className="shrink-0 text-subtle">→</span>
                                  <span className="min-w-0 truncate">{c.to}</span>
                                </Inline>
                              ))}
                            </Stack>
                          ) : null}
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  )}
                </div>
              </Stack>
            </Box>
            <Box className="border-t border-default bg-surface-sunken px-250 py-200 md:border-s md:border-t-0">
              <div>
                <Eyebrow>OSCAL identifiers</Eyebrow>
                <Box paddingBlockStart="space.050">
                  <KeyValue label="uuid">
                    <Id className="break-all">{item.uuid}</Id>
                  </KeyValue>
                  <KeyValue label="published">{formatOscalDate(item.published, true)}</KeyValue>
                  <KeyValue label="last-modified">
                    {formatOscalDate(item.lastModified, true)}
                  </KeyValue>
                  <KeyValue label="scheduled">
                    {formatOscalDate(item.scheduledCompletion, true)}
                  </KeyValue>
                  <KeyValue label="point of contact">{item.pointOfContact}</KeyValue>
                  <KeyValue label="detection source">{item.detectionSource}</KeyValue>
                </Box>

                <Box
                  className="font-heading-xxsmall uppercase text-subtle"
                  paddingBlockStart="space.250"
                >
                  props
                </Box>
                <Stack className="pt-100" space="space.050">
                  {item.props.map((p) => (
                    <Inline
                      key={p.name}
                      className="font-body-small"
                      space="space.100"
                      alignBlock="baseline"
                      spread="space-between"
                    >
                      <Id>{p.name}</Id>
                      <span className="truncate text-right text-subtle">{p.value}</span>
                    </Inline>
                  ))}
                </Stack>

                {item.links.length > 0 ? (
                  <>
                    <Box
                      className="font-heading-xxsmall uppercase text-subtle"
                      paddingBlockStart="space.250"
                    >
                      links
                    </Box>
                    <Stack className="pt-100 font-body" space="space.050">
                      {item.links.map((l) => (
                        <TextLink key={l.href + l.rel} className="block truncate">
                          <Link to={l.href}>{l.text}</Link>
                        </TextLink>
                      ))}
                    </Stack>
                  </>
                ) : null}
              </div>
            </Box>
          </Box>
        </Box>
        <DialogFooter>
          <>
            <Button
              variant="subtle"
              className="text-danger hover:bg-danger"
              onClick={onDelete}
              iconBefore={<Trash2 />}
            >
              Delete
            </Button>
            <span className="flex-1" />
            <Button variant="subtle" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={onEdit} iconBefore={<Pencil />}>
              Edit item
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------------------------------------- Edit */

function PoamEditModal({
  item,
  onClose,
  onSave,
  onDelete,
}: {
  item: PoamItem | null;
  onClose: () => void;
  onSave: (next: PoamItem) => void;
  onDelete: () => void;
}) {
  const fieldId = useId();

  const { form, values, setValue, formId, formRef } = useRecordForm(
    {
      draft: item as PoamItem | null,
    },
    (value) => ({ "draft.title": value.draft?.title }),
  );
  const { draft } = values;
  const setDraft = useCallback(
    (value: SetStateAction<typeof draft>) => setValue("draft", value),
    [setValue],
  );

  useEffect(() => {
    form.reset({ draft: item });
  }, [item, form]);

  if (!item || !draft) return null;

  const set = <K extends keyof PoamItem>(key: K, value: PoamItem[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const setMilestone = (uid: string, patch: Partial<Milestone>) =>
    setDraft((d) =>
      d
        ? { ...d, milestones: d.milestones.map((m) => (m.uuid === uid ? { ...m, ...patch } : m)) }
        : d,
    );

  const addMilestone = () =>
    setDraft((d) =>
      d
        ? {
            ...d,
            milestones: [
              ...d.milestones,
              {
                uuid: uuid(),
                id: `MS-${String(d.milestones.length + 1).padStart(2, "0")}`,
                title: "",
                description: "",
                targetDate: toOscalDateTime(toDateInput(d.scheduledCompletion)),
                completedDate: null,
                status: "Planned" as MilestoneStatus,
              },
            ],
          }
        : d,
    );

  const removeMilestone = (uid: string) =>
    setDraft((d) => (d ? { ...d, milestones: d.milestones.filter((m) => m.uuid !== uid) } : d));

  const setProp = (index: number, patch: Partial<OscalProp>) =>
    setDraft((d) =>
      d ? { ...d, props: d.props.map((p, n) => (n === index ? { ...p, ...patch } : p)) } : d,
    );

  const addProp = () =>
    setDraft((d) => (d ? { ...d, props: [...d.props, { name: "", value: "" }] } : d));

  const removeProp = (index: number) =>
    setDraft((d) => (d ? { ...d, props: d.props.filter((_, n) => n !== index) } : d));

  const save = () => {
    return form.handleSubmit({
      save: () => {
        const cleanedProps = draft.props
          .map((p) => ({ ...p, name: p.name.trim(), value: p.value.trim() }))
          .filter((p) => p.name.length > 0);
        const cleanedMilestones = draft.milestones
          .filter((m) => m.title.trim().length > 0)
          .map((m) => ({
            ...m,
            title: m.title.trim(),
            completedDate: m.status === "Completed" ? (m.completedDate ?? m.targetDate) : null,
          }));
        onSave({
          ...draft,
          title: draft.title.trim(),
          props: cleanedProps,
          milestones: cleanedMilestones,
          // uuid, poamId, published, links, observations and risk links are preserved
          lastModified: nowOscal(),
        });
      },
    });
  };

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
          <DialogTitle>{"Edit POA&M item"}</DialogTitle>
          <DialogDescription>{`${item.poamId} · OSCAL poam-item · uuid preserved`}</DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none">
          <Box className="grid grid-cols-1 md:grid-cols-3">
            <Box className="px-250 py-200 md:col-span-2">
              <form
                id={formId + "-1"}
                ref={formRef}
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void save();
                }}
              >
                <Stack space="space.150">
                  <form.Field name="draft.title">
                    {(field) => {
                      const fieldError1 =
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? [...new Set(field.state.meta.errors)].join(" ")
                          : undefined;
                      return (
                        <Field data-invalid={Boolean(fieldError1)}>
                          <FieldLabel
                            id={`${fieldId}-weakness-title-1-label`}
                            htmlFor={`${fieldId}-weakness-title-1`}
                          >
                            {"Weakness title"}
                            <span aria-hidden="true" className="text-danger">
                              {" "}
                              *
                            </span>
                          </FieldLabel>
                          <Input
                            id={`${fieldId}-weakness-title-1`}
                            aria-labelledby={`${fieldId}-weakness-title-1-label`}
                            aria-required={true}
                            aria-invalid={Boolean(fieldError1)}
                            aria-describedby={`${fieldId}-weakness-title-1-message`}
                            autoFocus
                            value={field.state.value ?? ""}
                            onChange={(e) => field.handleChange(e.target.value)}
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                          {fieldError1 ? (
                            <FieldError id={`${fieldId}-weakness-title-1-message`}>
                              {fieldError1}
                            </FieldError>
                          ) : (
                            <FieldDescription id={`${fieldId}-weakness-title-1-message`}>
                              {"markup-line — appears as the poam-item title."}
                            </FieldDescription>
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <form.Field name="draft.description">
                    {(field) => {
                      const fieldError2 =
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? [...new Set(field.state.meta.errors)].join(" ")
                          : undefined;
                      return (
                        <Field data-invalid={Boolean(fieldError2)}>
                          <FieldLabel
                            id={`${fieldId}-description-2-label`}
                            htmlFor={`${fieldId}-description-2`}
                          >
                            {"Description"}
                          </FieldLabel>
                          <Textarea
                            id={`${fieldId}-description-2`}
                            aria-labelledby={`${fieldId}-description-2-label`}
                            aria-invalid={Boolean(fieldError2)}
                            aria-describedby={`${fieldId}-description-2-message`}
                            value={field.state.value ?? ""}
                            onChange={(e) => field.handleChange(e.target.value)}
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                          {fieldError2 ? (
                            <FieldError id={`${fieldId}-description-2-message`}>
                              {fieldError2}
                            </FieldError>
                          ) : (
                            <FieldDescription id={`${fieldId}-description-2-message`}>
                              {"markup-multiline"}
                            </FieldDescription>
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <form.Field name="draft.remarks">
                    {(field) => {
                      const fieldError3 =
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? [...new Set(field.state.meta.errors)].join(" ")
                          : undefined;
                      return (
                        <Field data-invalid={Boolean(fieldError3)}>
                          <FieldLabel
                            id={`${fieldId}-remarks-3-label`}
                            htmlFor={`${fieldId}-remarks-3`}
                          >
                            {"Remarks"}
                          </FieldLabel>
                          <Textarea
                            id={`${fieldId}-remarks-3`}
                            aria-labelledby={`${fieldId}-remarks-3-label`}
                            aria-invalid={Boolean(fieldError3)}
                            aria-describedby={`${fieldId}-remarks-3-message`}
                            value={field.state.value ?? ""}
                            onChange={(e) => field.handleChange(e.target.value)}
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                          {fieldError3 ? (
                            <FieldError id={`${fieldId}-remarks-3-message`}>
                              {fieldError3}
                            </FieldError>
                          ) : (
                            <FieldDescription id={`${fieldId}-remarks-3-message`}>
                              {"markup-multiline — compensating controls, AO notes."}
                            </FieldDescription>
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>

                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" }}
                  >
                    <Field>
                      <FieldLabel
                        id={`${fieldId}-controls-4-label`}
                        htmlFor={`${fieldId}-controls-4`}
                      >
                        {"Controls"}
                      </FieldLabel>
                      <Input
                        id={`${fieldId}-controls-4`}
                        aria-labelledby={`${fieldId}-controls-4-label`}
                        aria-describedby={`${fieldId}-controls-4-message`}
                        value={draft.controls.join(", ")}
                        onChange={(e) =>
                          set(
                            "controls",
                            e.target.value
                              .split(",")
                              .map((c) => c.trim())
                              .filter(Boolean),
                          )
                        }
                      />
                      <FieldDescription id={`${fieldId}-controls-4-message`}>
                        {"token list"}
                      </FieldDescription>
                    </Field>
                    <form.Field name="draft.severity">
                      {(field) => {
                        const valueItems = severities.map((s) => ({ value: s, label: s }));
                        const fieldError5 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError5)}>
                            <FieldLabel
                              id={`${fieldId}-severity-5-label`}
                              htmlFor={`${fieldId}-severity-5`}
                            >
                              {"Severity"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems}
                              value={field.state.value ?? ""}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value as PoamSeverity);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-severity-5`}
                                aria-labelledby={`${fieldId}-severity-5-label`}
                                aria-invalid={Boolean(fieldError5)}
                                aria-describedby={
                                  fieldError5 ? `${fieldId}-severity-5-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent aria-labelledby={`${fieldId}-severity-5-label`}>
                                {valueItems.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError5 ? (
                              <FieldError id={`${fieldId}-severity-5-message`}>
                                {fieldError5}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="draft.status">
                      {(field) => {
                        const valueItems2 = statuses.map((s) => ({ value: s, label: s }));
                        const fieldError6 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError6)}>
                            <FieldLabel
                              id={`${fieldId}-status-6-label`}
                              htmlFor={`${fieldId}-status-6`}
                            >
                              {"Status"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems2}
                              value={field.state.value ?? ""}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value as PoamStatus);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-status-6`}
                                aria-labelledby={`${fieldId}-status-6-label`}
                                aria-invalid={Boolean(fieldError6)}
                                aria-describedby={
                                  fieldError6 ? `${fieldId}-status-6-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent aria-labelledby={`${fieldId}-status-6-label`}>
                                {valueItems2.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError6 ? (
                              <FieldError id={`${fieldId}-status-6-message`}>
                                {fieldError6}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </Grid>

                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" }}
                  >
                    <Field>
                      <FieldLabel
                        id={`${fieldId}-scheduled-completion-7-label`}
                        htmlFor={`${fieldId}-scheduled-completion-7`}
                      >
                        {"Scheduled completion"}
                      </FieldLabel>
                      <DatePicker
                        id={`${fieldId}-scheduled-completion-7`}
                        aria-labelledby={`${fieldId}-scheduled-completion-7-label`}
                        aria-describedby={`${fieldId}-scheduled-completion-7-message`}
                        value={toDateInput(draft.scheduledCompletion)}
                        onChange={(iso) => set("scheduledCompletion", toOscalDateTime(iso))}
                      />
                      <FieldDescription id={`${fieldId}-scheduled-completion-7-message`}>
                        {"date-time-with-timezone"}
                      </FieldDescription>
                    </Field>
                    <form.Field name="draft.pointOfContact">
                      {(field) => {
                        const valueItems3 = [
                          draft.pointOfContact,
                          ...contacts.filter((c) => c !== draft.pointOfContact),
                        ].map((c) => ({ value: c, label: c }));
                        const fieldError8 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError8)}>
                            <FieldLabel
                              id={`${fieldId}-point-of-contact-8-label`}
                              htmlFor={`${fieldId}-point-of-contact-8`}
                            >
                              {"Point of contact"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems3}
                              value={field.state.value ?? ""}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-point-of-contact-8`}
                                aria-labelledby={`${fieldId}-point-of-contact-8-label`}
                                aria-invalid={Boolean(fieldError8)}
                                aria-describedby={
                                  fieldError8 ? `${fieldId}-point-of-contact-8-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent
                                aria-labelledby={`${fieldId}-point-of-contact-8-label`}
                              >
                                {valueItems3.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError8 ? (
                              <FieldError id={`${fieldId}-point-of-contact-8-message`}>
                                {fieldError8}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="draft.detectionSource">
                      {(field) => {
                        const valueItems4 = [
                          draft.detectionSource,
                          ...detectionSources.filter((s) => s !== draft.detectionSource),
                        ].map((s) => ({ value: s, label: s }));
                        const fieldError9 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError9)}>
                            <FieldLabel
                              id={`${fieldId}-detection-source-9-label`}
                              htmlFor={`${fieldId}-detection-source-9`}
                            >
                              {"Detection source"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems4}
                              value={field.state.value ?? ""}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-detection-source-9`}
                                aria-labelledby={`${fieldId}-detection-source-9-label`}
                                aria-invalid={Boolean(fieldError9)}
                                aria-describedby={
                                  fieldError9 ? `${fieldId}-detection-source-9-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent
                                aria-labelledby={`${fieldId}-detection-source-9-label`}
                              >
                                {valueItems4.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError9 ? (
                              <FieldError id={`${fieldId}-detection-source-9-message`}>
                                {fieldError9}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </Grid>

                  {/* Milestones */}
                  <div>
                    <Inline
                      className="border-b border-default pb-100"
                      alignBlock="center"
                      spread="space-between"
                    >
                      <span className="font-body font-semibold">Milestones</span>
                      <Button variant="link" onClick={addMilestone} iconBefore={<Plus />}>
                        Add milestone
                      </Button>
                    </Inline>
                    <Box paddingBlockStart="space.050">
                      {draft.milestones.map((m) => {
                        const statusItems = milestoneStatuses.map((s) => ({
                          value: s,
                          label: s,
                        }));
                        return (
                          <Grid
                            key={m.uuid}
                            className="border-b border-default py-100 last:border-0"
                            gap="space.100"
                            templateColumns={{
                              base: "minmax(0,1fr)",
                              md: "42px minmax(0,1fr) 128px 132px 24px",
                            }}
                            alignItems="center"
                          >
                            <Id className="font-body-small text-subtle">{m.id}</Id>
                            <Input
                              aria-label={`Milestone ${m.id} title`}
                              value={m.title}
                              placeholder="Milestone title"
                              onChange={(e) => setMilestone(m.uuid, { title: e.target.value })}
                            />
                            <Select<string>
                              items={statusItems}
                              value={m.status}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return setMilestone(m.uuid, { status: value as MilestoneStatus });
                              }}
                            >
                              <SelectTrigger
                                className="w-full"
                                aria-label={`Milestone ${m.id} status`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusItems.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <DatePicker
                              aria-label={`Milestone ${m.id} date`}
                              value={toDateInput(m.completedDate ?? m.targetDate)}
                              onChange={(iso) =>
                                setMilestone(
                                  m.uuid,
                                  m.status === "Completed"
                                    ? { completedDate: toOscalDateTime(iso) }
                                    : { targetDate: toOscalDateTime(iso) },
                                )
                              }
                            />
                            <button
                              aria-label={`Remove milestone ${m.id}`}
                              className="inline-flex items-center justify-center rounded-medium text-subtle transition-colors hover:bg-danger hover:text-danger size-300"
                              onClick={() => removeMilestone(m.uuid)}
                            >
                              <X className="size-icon-small" />
                            </button>
                          </Grid>
                        );
                      })}
                      {draft.milestones.length === 0 ? (
                        <p className="py-100 font-body text-subtle">
                          No milestones. Add one to track intermediate progress.
                        </p>
                      ) : null}
                    </Box>
                  </div>

                  {/* Props */}
                  <div>
                    <Inline
                      className="border-b border-default pb-100"
                      alignBlock="center"
                      spread="space-between"
                    >
                      <span className="font-body font-semibold">Props</span>
                      <Button variant="link" onClick={addProp} iconBefore={<Plus />}>
                        Add prop
                      </Button>
                    </Inline>
                    <Box paddingBlockStart="space.050">
                      {draft.props.map((p, n) => (
                        <Grid
                          key={n}
                          className="border-b border-default py-100 last:border-0"
                          gap="space.100"
                          templateColumns={{
                            base: "minmax(0,1fr)",
                            md: "minmax(0,180px) minmax(0,1fr) minmax(0,120px) 24px",
                          }}
                          alignItems="center"
                        >
                          <Input
                            aria-label={`Property ${n + 1} name`}
                            value={p.name}
                            placeholder="name (token)"
                            onChange={(e) => setProp(n, { name: e.target.value })}
                          />
                          <Input
                            aria-label={`Property ${n + 1} value`}
                            value={p.value}
                            placeholder="value"
                            onChange={(e) => setProp(n, { value: e.target.value })}
                          />
                          <Input
                            aria-label={`Property ${n + 1} class`}
                            value={p.class ?? ""}
                            placeholder="class"
                            onChange={(e) => setProp(n, { class: e.target.value })}
                          />
                          <button
                            aria-label={`Remove prop ${p.name || n + 1}`}
                            className="inline-flex items-center justify-center rounded-medium text-subtle transition-colors hover:bg-danger hover:text-danger size-300"
                            onClick={() => removeProp(n)}
                          >
                            <X className="size-icon-small" />
                          </button>
                        </Grid>
                      ))}
                      {draft.props.length === 0 ? (
                        <p className="py-100 font-body text-subtle">No props on this item.</p>
                      ) : null}
                    </Box>
                  </div>
                </Stack>
              </form>
            </Box>
            <Box className="border-t border-default bg-surface-sunken px-250 py-200 md:border-s md:border-t-0">
              <div>
                <Eyebrow>Preserved OSCAL fields</Eyebrow>
                <Box paddingBlockStart="space.050">
                  <KeyValue label="uuid">
                    <Id className="break-all">{item.uuid}</Id>
                  </KeyValue>
                  <KeyValue label="poam-id">
                    <Id>{item.poamId}</Id>
                  </KeyValue>
                  <KeyValue label="published">{formatOscalDate(item.published, true)}</KeyValue>
                  <KeyValue label="last-modified">
                    <span className="text-subtle">set on save</span>
                  </KeyValue>
                  <KeyValue label="related-observations">
                    {item.relatedObservations.length}
                  </KeyValue>
                  <KeyValue label="associated-risk">{item.associatedRisks.length}</KeyValue>
                  <KeyValue label="links">{item.links.length}</KeyValue>
                </Box>
                <p className="pt-200 font-body-small text-subtle">
                  Editing changes the mutable assembly only. Identifiers, publication timestamp and
                  structural links stay bound so the item keeps its identity across OSCAL exports.
                </p>
              </div>
            </Box>
          </Box>
        </Box>
        <DialogFooter>
          <>
            <Button
              variant="subtle"
              className="text-danger hover:bg-danger"
              onClick={onDelete}
              iconBefore={<Trash2 />}
            >
              Delete
            </Button>
            <span className="flex-1" />
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form={formId + "-1"}
              disabled={form.state.isSubmitting}
            >
              Save changes
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------- Delete */

function PoamDeleteModal({
  item,
  onClose,
  onConfirm,
}: {
  item: PoamItem | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!item) return null;
  return (
    <Dialog
      open={true}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
        <DialogHeader>
          <DialogTitle>{"Delete this POA&M item?"}</DialogTitle>
          <DialogDescription>{`${item.poamId} · ${item.title}`}</DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
          <Stack className="font-body text-subtle" space="space.150">
            <p>
              The poam-item and its {item.milestones.length} milestone
              {item.milestones.length === 1 ? "" : "s"} are removed from the program&apos;s OSCAL
              POA&amp;M. Related observations and the risk exposure entries stay in place — only the
              links from this item are dropped.
            </p>
            <Box paddingBlockStart="space.050" className="border-t border-default">
              <KeyValue label="uuid">
                <Id className="break-all">{item.uuid}</Id>
              </KeyValue>
              <KeyValue label="status">{item.status}</KeyValue>
              <KeyValue label="scheduled">
                {formatOscalDate(item.scheduledCompletion, true)}
              </KeyValue>
            </Box>
          </Stack>
        </Box>
        <DialogFooter>
          <>
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-danger-bold hover:bg-danger"
              onClick={onConfirm}
            >
              Delete item
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------- Create */

function PoamCreateModal({
  open,
  onClose,
  programId,
  programName,
  defaultOwner,
  nextId,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  programId: string;
  programName: string;
  defaultOwner: string;
  nextId: string;
  onCreate: (item: PoamItem) => void;
}) {
  const fieldId = useId();

  const { form, values, setValue, formId, formRef } = useRecordForm(
    {
      title: "",
      description: "",
      control: programControls[0]?.id ?? "AC-2",
      severity: "Moderate" as PoamSeverity,
      status: "Open" as PoamStatus,
      scheduled: "2026-10-31",
      source: "Security assessment",
      contact: defaultOwner,
      marking: "CUI",
      milestone: "",
      milestoneDate: "2026-09-30",
      riskId: "",
    },
    (value) => ({ title: value.title, control: value.control, contact: value.contact }),
  );
  const {
    title,
    description,
    control,
    severity,
    status,
    scheduled,
    source,
    contact,
    marking,
    milestone,
    milestoneDate,
    riskId,
  } = values;
  const setTitle = useCallback(
    (value: SetStateAction<typeof title>) => setValue("title", value),
    [setValue],
  );
  const setDescription = useCallback(
    (value: SetStateAction<typeof description>) => setValue("description", value),
    [setValue],
  );

  const setMilestone = useCallback(
    (value: SetStateAction<typeof milestone>) => setValue("milestone", value),
    [setValue],
  );

  const setRiskId = useCallback(
    (value: SetStateAction<typeof riskId>) => setValue("riskId", value),
    [setValue],
  );

  const create = () => {
    return form.handleSubmit({
      save: () => {
        const item: PoamItem = {
          uuid: uuid(),
          programId,
          poamId: nextId,
          title: title.trim(),
          description: description.trim(),
          remarks: "",
          status,
          severity,
          controls: [control],
          origin: contact,
          detectionSource: source,
          pointOfContact: contact,
          published: nowOscal(),
          lastModified: nowOscal(),
          scheduledCompletion: toOscalDateTime(scheduled),
          props: [
            { name: "marking", value: marking, class: "banner" },
            { name: "weakness-source", value: source, ns: "https://equinox.example/ns/oscal" },
          ],
          milestones: milestone.trim()
            ? [
                {
                  uuid: uuid(),
                  id: "MS-01",
                  title: milestone.trim(),
                  description: "",
                  targetDate: toOscalDateTime(milestoneDate),
                  completedDate: null,
                  status: "Planned",
                },
              ]
            : [],
          relatedObservations: [],
          associatedRisks: riskId
            ? [{ riskUuid: uuid(), riskId, title: `Linked risk ${riskId}` }]
            : [],
          links: [],
        };
        onCreate(item);
        setTitle("");
        setDescription("");
        setMilestone("");
        setRiskId("");
      },
    });
  };

  return (
    <Dialog
      open={open}
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
          <DialogTitle>{"Create a POA&M item"}</DialogTitle>
          <DialogDescription>{`${programName} · ${programId} · OSCAL poam-item`}</DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none">
          <Box className="grid grid-cols-1 md:grid-cols-3">
            <Box className="px-250 py-200 md:col-span-2">
              <form
                id={formId + "-2"}
                ref={formRef}
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void create();
                }}
              >
                <Stack space="space.150">
                  <form.Field name="title">
                    {(field) => {
                      const fieldError10 =
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? [...new Set(field.state.meta.errors)].join(" ")
                          : undefined;
                      return (
                        <Field data-invalid={Boolean(fieldError10)}>
                          <FieldLabel
                            id={`${fieldId}-weakness-title-10-label`}
                            htmlFor={`${fieldId}-weakness-title-10`}
                          >
                            {"Weakness title"}
                            <span aria-hidden="true" className="text-danger">
                              {" "}
                              *
                            </span>
                          </FieldLabel>
                          <Input
                            id={`${fieldId}-weakness-title-10`}
                            aria-labelledby={`${fieldId}-weakness-title-10-label`}
                            aria-required={true}
                            aria-invalid={Boolean(fieldError10)}
                            aria-describedby={`${fieldId}-weakness-title-10-message`}
                            autoFocus
                            value={field.state.value ?? ""}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Privileged function invocations are not forwarded to the audit sink"
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                          {fieldError10 ? (
                            <FieldError id={`${fieldId}-weakness-title-10-message`}>
                              {fieldError10}
                            </FieldError>
                          ) : (
                            <FieldDescription id={`${fieldId}-weakness-title-10-message`}>
                              {"markup-line — appears as the poam-item title."}
                            </FieldDescription>
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <form.Field name="description">
                    {(field) => {
                      const fieldError11 =
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? [...new Set(field.state.meta.errors)].join(" ")
                          : undefined;
                      return (
                        <Field data-invalid={Boolean(fieldError11)}>
                          <FieldLabel
                            id={`${fieldId}-description-11-label`}
                            htmlFor={`${fieldId}-description-11`}
                          >
                            {"Description"}
                          </FieldLabel>
                          <Textarea
                            id={`${fieldId}-description-11`}
                            aria-labelledby={`${fieldId}-description-11-label`}
                            aria-invalid={Boolean(fieldError11)}
                            aria-describedby={`${fieldId}-description-11-message`}
                            value={field.state.value ?? ""}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Describe the weakness, the affected component, and the sampling that identified it."
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                          {fieldError11 ? (
                            <FieldError id={`${fieldId}-description-11-message`}>
                              {fieldError11}
                            </FieldError>
                          ) : (
                            <FieldDescription id={`${fieldId}-description-11-message`}>
                              {"markup-multiline — the weakness as it will read to the AO."}
                            </FieldDescription>
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" }}
                  >
                    <form.Field name="control">
                      {(field) => {
                        const valueItems5 = programControls.map((c) => ({
                          value: c.id,
                          label: c.id,
                        }));
                        const fieldError12 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError12)}>
                            <FieldLabel
                              id={`${fieldId}-control-12-label`}
                              htmlFor={`${fieldId}-control-12`}
                            >
                              {"Control"}
                              <span aria-hidden="true" className="text-danger">
                                {" "}
                                *
                              </span>
                            </FieldLabel>
                            <Select<string>
                              items={valueItems5}
                              value={field.state.value ?? ""}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-control-12`}
                                aria-labelledby={`${fieldId}-control-12-label`}
                                aria-required={true}
                                aria-invalid={Boolean(fieldError12)}
                                aria-describedby={
                                  fieldError12 ? `${fieldId}-control-12-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent aria-labelledby={`${fieldId}-control-12-label`}>
                                {valueItems5.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError12 ? (
                              <FieldError id={`${fieldId}-control-12-message`}>
                                {fieldError12}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="severity">
                      {(field) => {
                        const valueItems6 = severities.map((s) => ({ value: s, label: s }));
                        const fieldError13 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError13)}>
                            <FieldLabel
                              id={`${fieldId}-severity-13-label`}
                              htmlFor={`${fieldId}-severity-13`}
                            >
                              {"Severity"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems6}
                              value={field.state.value ?? ""}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value as PoamSeverity);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-severity-13`}
                                aria-labelledby={`${fieldId}-severity-13-label`}
                                aria-invalid={Boolean(fieldError13)}
                                aria-describedby={
                                  fieldError13 ? `${fieldId}-severity-13-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent aria-labelledby={`${fieldId}-severity-13-label`}>
                                {valueItems6.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError13 ? (
                              <FieldError id={`${fieldId}-severity-13-message`}>
                                {fieldError13}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="status">
                      {(field) => {
                        const valueItems7 = [
                          { value: "Open", label: "Open" },
                          { value: "Ongoing", label: "Ongoing" },
                          { value: "Risk accepted", label: "Risk accepted" },
                          { value: "Deferred", label: "Deferred" },
                        ];
                        const fieldError14 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError14)}>
                            <FieldLabel
                              id={`${fieldId}-status-14-label`}
                              htmlFor={`${fieldId}-status-14`}
                            >
                              {"Status"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems7}
                              value={field.state.value ?? ""}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value as PoamStatus);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-status-14`}
                                aria-labelledby={`${fieldId}-status-14-label`}
                                aria-invalid={Boolean(fieldError14)}
                                aria-describedby={
                                  fieldError14 ? `${fieldId}-status-14-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent aria-labelledby={`${fieldId}-status-14-label`}>
                                {valueItems7.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError14 ? (
                              <FieldError id={`${fieldId}-status-14-message`}>
                                {fieldError14}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </Grid>
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" }}
                  >
                    <form.Field name="scheduled">
                      {(field) => {
                        const fieldError15 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError15)}>
                            <FieldLabel
                              id={`${fieldId}-scheduled-completion-15-label`}
                              htmlFor={`${fieldId}-scheduled-completion-15`}
                            >
                              {"Scheduled completion"}
                            </FieldLabel>
                            <DatePicker
                              id={`${fieldId}-scheduled-completion-15`}
                              aria-labelledby={`${fieldId}-scheduled-completion-15-label`}
                              aria-invalid={Boolean(fieldError15)}
                              aria-describedby={
                                fieldError15
                                  ? `${fieldId}-scheduled-completion-15-message`
                                  : undefined
                              }
                              value={field.state.value ?? ""}
                              onChange={field.handleChange}
                              name={field.name}
                              onBlur={field.handleBlur}
                            />
                            {fieldError15 ? (
                              <FieldError id={`${fieldId}-scheduled-completion-15-message`}>
                                {fieldError15}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="contact">
                      {(field) => {
                        const valueItems8 = [
                          defaultOwner,
                          ...contacts.filter((c) => c !== defaultOwner),
                        ].map((c) => ({ value: c, label: c }));
                        const fieldError16 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError16)}>
                            <FieldLabel
                              id={`${fieldId}-point-of-contact-16-label`}
                              htmlFor={`${fieldId}-point-of-contact-16`}
                            >
                              {"Point of contact"}
                              <span aria-hidden="true" className="text-danger">
                                {" "}
                                *
                              </span>
                            </FieldLabel>
                            <Select<string>
                              items={valueItems8}
                              value={field.state.value ?? ""}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-point-of-contact-16`}
                                aria-labelledby={`${fieldId}-point-of-contact-16-label`}
                                aria-required={true}
                                aria-invalid={Boolean(fieldError16)}
                                aria-describedby={
                                  fieldError16
                                    ? `${fieldId}-point-of-contact-16-message`
                                    : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent
                                aria-labelledby={`${fieldId}-point-of-contact-16-label`}
                              >
                                {valueItems8.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError16 ? (
                              <FieldError id={`${fieldId}-point-of-contact-16-message`}>
                                {fieldError16}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="marking">
                      {(field) => {
                        const valueItems9 = [
                          { value: "CUI", label: "CUI" },
                          { value: "CUI//SP-PRIV", label: "CUI//SP-PRIV" },
                          { value: "CUI//SP-PRVCY", label: "CUI//SP-PRVCY" },
                          { value: "Unclassified", label: "Unclassified" },
                        ];
                        const fieldError17 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError17)}>
                            <FieldLabel
                              id={`${fieldId}-marking-17-label`}
                              htmlFor={`${fieldId}-marking-17`}
                            >
                              {"Marking"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems9}
                              value={field.state.value ?? ""}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-marking-17`}
                                aria-labelledby={`${fieldId}-marking-17-label`}
                                aria-invalid={Boolean(fieldError17)}
                                aria-describedby={
                                  fieldError17 ? `${fieldId}-marking-17-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent aria-labelledby={`${fieldId}-marking-17-label`}>
                                {valueItems9.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError17 ? (
                              <FieldError id={`${fieldId}-marking-17-message`}>
                                {fieldError17}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </Grid>
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
                  >
                    <form.Field name="source">
                      {(field) => {
                        const valueItems10 = detectionSources.map((s) => ({ value: s, label: s }));
                        const fieldError18 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError18)}>
                            <FieldLabel
                              id={`${fieldId}-detection-source-18-label`}
                              htmlFor={`${fieldId}-detection-source-18`}
                            >
                              {"Detection source"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems10}
                              value={field.state.value ?? ""}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-detection-source-18`}
                                aria-labelledby={`${fieldId}-detection-source-18-label`}
                                aria-invalid={Boolean(fieldError18)}
                                aria-describedby={
                                  fieldError18
                                    ? `${fieldId}-detection-source-18-message`
                                    : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent
                                aria-labelledby={`${fieldId}-detection-source-18-label`}
                              >
                                {valueItems10.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError18 ? (
                              <FieldError id={`${fieldId}-detection-source-18-message`}>
                                {fieldError18}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="riskId">
                      {(field) => {
                        const valueItems11 = [
                          { value: "", label: "None" },
                          { value: "RSK-2419", label: "RSK-2419" },
                          { value: "RSK-2402", label: "RSK-2402" },
                          { value: "RSK-2388", label: "RSK-2388" },
                          { value: "RSK-2290", label: "RSK-2290" },
                        ];
                        const fieldError19 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError19)}>
                            <FieldLabel
                              id={`${fieldId}-associated-risk-19-label`}
                              htmlFor={`${fieldId}-associated-risk-19`}
                            >
                              {"Associated risk"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems11}
                              value={field.state.value ?? ""}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-associated-risk-19`}
                                aria-labelledby={`${fieldId}-associated-risk-19-label`}
                                aria-invalid={Boolean(fieldError19)}
                                aria-describedby={`${fieldId}-associated-risk-19-message`}
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent
                                aria-labelledby={`${fieldId}-associated-risk-19-label`}
                              >
                                {valueItems11.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError19 ? (
                              <FieldError id={`${fieldId}-associated-risk-19-message`}>
                                {fieldError19}
                              </FieldError>
                            ) : (
                              <FieldDescription id={`${fieldId}-associated-risk-19-message`}>
                                {"Links the item to a risk exposure entry."}
                              </FieldDescription>
                            )}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </Grid>
                  <Grid gap="space.150" templateColumns="minmax(0,1fr) 160px">
                    <form.Field name="milestone">
                      {(field) => {
                        const fieldError20 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError20)}>
                            <FieldLabel
                              id={`${fieldId}-first-milestone-20-label`}
                              htmlFor={`${fieldId}-first-milestone-20`}
                            >
                              {"First milestone"}
                            </FieldLabel>
                            <Input
                              id={`${fieldId}-first-milestone-20`}
                              aria-labelledby={`${fieldId}-first-milestone-20-label`}
                              aria-invalid={Boolean(fieldError20)}
                              aria-describedby={`${fieldId}-first-milestone-20-message`}
                              value={field.state.value ?? ""}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="Deploy audit forwarder to broker nodes"
                              name={field.name}
                              onBlur={field.handleBlur}
                            />
                            {fieldError20 ? (
                              <FieldError id={`${fieldId}-first-milestone-20-message`}>
                                {fieldError20}
                              </FieldError>
                            ) : (
                              <FieldDescription id={`${fieldId}-first-milestone-20-message`}>
                                {"Additional milestones can be added after creation."}
                              </FieldDescription>
                            )}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="milestoneDate">
                      {(field) => {
                        const fieldError21 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError21)}>
                            <FieldLabel
                              id={`${fieldId}-target-date-21-label`}
                              htmlFor={`${fieldId}-target-date-21`}
                            >
                              {"Target date"}
                            </FieldLabel>
                            <DatePicker
                              id={`${fieldId}-target-date-21`}
                              aria-labelledby={`${fieldId}-target-date-21-label`}
                              aria-invalid={Boolean(fieldError21)}
                              aria-describedby={
                                fieldError21 ? `${fieldId}-target-date-21-message` : undefined
                              }
                              value={field.state.value ?? ""}
                              onChange={field.handleChange}
                              name={field.name}
                              onBlur={field.handleBlur}
                            />
                            {fieldError21 ? (
                              <FieldError id={`${fieldId}-target-date-21-message`}>
                                {fieldError21}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </Grid>
                </Stack>
              </form>
            </Box>
            <Box className="border-t border-default bg-surface-sunken px-250 py-200 md:border-s md:border-t-0">
              <div>
                <Eyebrow>OSCAL preview</Eyebrow>
                <Box paddingBlockStart="space.050">
                  <KeyValue label="uuid">
                    <Id>generated on save</Id>
                  </KeyValue>
                  <KeyValue label="poam-id">
                    <Id>{nextId}</Id>
                  </KeyValue>
                  <KeyValue label="title">{title || "—"}</KeyValue>
                  <KeyValue label="control">
                    <Id>{control}</Id>
                  </KeyValue>
                  <KeyValue label="scheduled">
                    {formatOscalDate(toOscalDateTime(scheduled))}
                  </KeyValue>
                  <KeyValue label="milestones">{milestone ? "1 planned" : "0"}</KeyValue>
                  <KeyValue label="associated-risk">{riskId ? <Id>{riskId}</Id> : "none"}</KeyValue>
                </Box>
                <Box
                  className="font-heading-xxsmall uppercase text-subtle"
                  paddingBlockStart="space.200"
                >
                  props
                </Box>
                <Stack className="pt-100 font-body-small" space="space.050">
                  <Inline space="space.100" spread="space-between">
                    <Id>marking</Id>
                    <span className="text-subtle">{marking}</span>
                  </Inline>
                  <Inline space="space.100" spread="space-between">
                    <Id>weakness-source</Id>
                    <span className="truncate text-subtle">{source}</span>
                  </Inline>
                  <Inline space="space.100" spread="space-between">
                    <Id>severity</Id>
                    <span className="text-subtle">{severity}</span>
                  </Inline>
                  <Inline space="space.100" spread="space-between">
                    <Id>status</Id>
                    <span className="text-subtle">{status}</span>
                  </Inline>
                </Stack>
                <p className="pt-200 font-body-small text-subtle">
                  Saved entries serialize into the program&apos;s OSCAL POA&amp;M export alongside
                  the SSP and SAR.
                </p>
              </div>
            </Box>
          </Box>
        </Box>
        <DialogFooter>
          <>
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form={formId + "-2"}
              disabled={form.state.isSubmitting}
            >
              Create item
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
