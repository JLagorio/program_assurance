import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import {
  Badge,
  Box,
  Button,
  DatePicker,
  Dialog,
  Dot,
  Field,
  FilterChip,
  Grid,
  Id,
  Inline,
  Input,
  Item,
  KeyValue,
  NativeSelect,
  Progress,
  Section,
  Stack,
  Table,
  Textarea,
  TextLink,
  Timeline,
  useRequired,
} from "@ledger/design-system";
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
        description="OSCAL poam-item entries scoped to this program, ordered by severity then scheduled completion."
        action={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus className="size-icon-small" /> New POA&amp;M item
          </Button>
        }
      >
        <Inline className="pb-150 pt-150" space="space.100" alignBlock="center" shouldWrap>
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)}>
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
                    <Badge tone={poamSeverityTone[i.severity]}>{i.severity}</Badge>
                  </Table.Cell>
                  <Table.Cell width={112}>
                    <Inline as="span" space="space.075" alignBlock="center">
                      <Dot tone={poamStatusTone[i.status]} />
                      <span className="truncate">{i.status}</span>
                    </Inline>
                  </Table.Cell>
                  <Table.Cell width={128}>
                    <Inline as="span" space="space.100" alignBlock="center">
                      <span className="w-600">
                        <Progress value={pct} tone={pct === 100 ? "success" : "information"} />
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
        description="Immutable record of every POA&M create, edit and delete with actor attribution and field-level changes."
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
      open
      onClose={onClose}
      width="large"
      title={item.title}
      description={`${item.poamId} · ${item.controls.join(", ")} · ${item.origin}`}
      footer={
        <>
          <Button variant="subtle" className="text-danger hover:bg-danger" onClick={onDelete}>
            <Trash2 className="size-icon-small" /> Delete
          </Button>
          <span className="flex-1" />
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={onEdit}>
            <Pencil className="size-icon-small" /> Edit item
          </Button>
        </>
      }
      aside={
        <div>
          <div className="font-heading-xxsmall uppercase text-subtle">OSCAL identifiers</div>
          <dl className="pt-050">
            <KeyValue label="uuid">
              <Id className="break-all">{item.uuid}</Id>
            </KeyValue>
            <KeyValue label="published">{formatOscalDate(item.published, true)}</KeyValue>
            <KeyValue label="last-modified">{formatOscalDate(item.lastModified, true)}</KeyValue>
            <KeyValue label="scheduled">{formatOscalDate(item.scheduledCompletion, true)}</KeyValue>
            <KeyValue label="point of contact">{item.pointOfContact}</KeyValue>
            <KeyValue label="detection source">{item.detectionSource}</KeyValue>
          </dl>

          <Box className="font-heading-xxsmall uppercase text-subtle" paddingBlockStart="space.250">
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
      }
    >
      <Stack space="space.250">
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <Badge tone={poamSeverityTone[item.severity]}>{item.severity}</Badge>
          <Badge tone={poamStatusTone[item.status]}>{item.status}</Badge>
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
          <Inline
            className="border-b border-default pb-100"
            alignBlock="center"
            spread="space-between"
          >
            <span className="font-body font-semibold">Milestones</span>
            <span className="tabular-nums font-body-small text-subtle">
              {item.milestones.filter((m) => m.status === "Completed").length} of{" "}
              {item.milestones.length} complete
            </span>
          </Inline>
          <Item.Group empty="No milestones recorded.">
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
          <Box
            className="border-b border-default font-body font-semibold"
            paddingBlockEnd="space.100"
          >
            Related observations
          </Box>
          <Item.Group empty="No related observations.">
            {item.relatedObservations.map((o) => (
              <Item
                key={o.observationUuid}
                link={<Link to={o.href} />}
                leading={<Badge tone="neutral">{o.method}</Badge>}
                title={o.title}
                meta={<Id>{o.observationUuid.slice(0, 8)}</Id>}
                trailing={formatOscalDate(o.collected)}
              />
            ))}
          </Item.Group>
        </div>

        <div>
          <Box
            className="border-b border-default font-body font-semibold"
            paddingBlockEnd="space.100"
          >
            Associated risks
          </Box>
          <Item.Group empty="No risk exposure entry linked.">
            {item.associatedRisks.map((r) => (
              <Item
                key={r.riskUuid}
                link={<Link to="/risks/$riskId" params={{ riskId: r.riskId }} />}
                id={r.riskId}
                idWidth={76}
                title={r.title}
                trailing={<Id>{r.riskUuid.slice(0, 8)}</Id>}
              />
            ))}
          </Item.Group>
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
  const [draft, setDraft] = useState<PoamItem | null>(item);
  const req = useRequired({ title: draft?.title });
  useEffect(() => setDraft(item), [item]);

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
    if (!req.check()) return;
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
  };

  return (
    <Dialog
      open
      onClose={onClose}
      width="large"
      title="Edit POA&M item"
      description={`${item.poamId} · OSCAL poam-item · uuid preserved`}
      footer={
        <>
          <Button variant="subtle" className="text-danger hover:bg-danger" onClick={onDelete}>
            <Trash2 className="size-icon-small" /> Delete
          </Button>
          <span className="flex-1" />
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save changes
          </Button>
        </>
      }
      aside={
        <div>
          <div className="font-heading-xxsmall uppercase text-subtle">Preserved OSCAL fields</div>
          <dl className="pt-050">
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
            <KeyValue label="related-observations">{item.relatedObservations.length}</KeyValue>
            <KeyValue label="associated-risk">{item.associatedRisks.length}</KeyValue>
            <KeyValue label="links">{item.links.length}</KeyValue>
          </dl>
          <p className="pt-200 font-body-small text-subtle">
            Editing changes the mutable assembly only. Identifiers, publication timestamp and
            structural links stay bound so the item keeps its identity across OSCAL exports.
          </p>
        </div>
      }
    >
      <Stack space="space.150">
        <Field
          isRequired
          error={req.errorFor("title")}
          label="Weakness title"
          hint="markup-line — appears as the poam-item title."
        >
          <Input autoFocus value={draft.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Description" hint="markup-multiline">
          <Textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
        <Field label="Remarks" hint="markup-multiline — compensating controls, AO notes.">
          <Textarea value={draft.remarks} onChange={(e) => set("remarks", e.target.value)} />
        </Field>

        <Grid gap="space.150" templateColumns="repeat(3, minmax(0, 1fr))">
          <Field label="Controls" hint="token list">
            <Input
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
          </Field>
          <Field label="Severity">
            <NativeSelect
              value={draft.severity}
              onChange={(e) => set("severity", e.target.value as PoamSeverity)}
            >
              {severities.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Status">
            <NativeSelect
              value={draft.status}
              onChange={(e) => set("status", e.target.value as PoamStatus)}
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </NativeSelect>
          </Field>
        </Grid>

        <Grid gap="space.150" templateColumns="repeat(3, minmax(0, 1fr))">
          <Field label="Scheduled completion" hint="date-time-with-timezone">
            <DatePicker
              value={toDateInput(draft.scheduledCompletion)}
              onChange={(iso) => set("scheduledCompletion", toOscalDateTime(iso))}
            />
          </Field>
          <Field label="Point of contact">
            <NativeSelect
              value={draft.pointOfContact}
              onChange={(e) => set("pointOfContact", e.target.value)}
            >
              {[draft.pointOfContact, ...contacts.filter((c) => c !== draft.pointOfContact)].map(
                (c) => (
                  <option key={c}>{c}</option>
                ),
              )}
            </NativeSelect>
          </Field>
          <Field label="Detection source">
            <NativeSelect
              value={draft.detectionSource}
              onChange={(e) => set("detectionSource", e.target.value)}
            >
              {[
                draft.detectionSource,
                ...detectionSources.filter((s) => s !== draft.detectionSource),
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </NativeSelect>
          </Field>
        </Grid>

        {/* Milestones */}
        <div>
          <Inline
            className="border-b border-default pb-100"
            alignBlock="center"
            spread="space-between"
          >
            <span className="font-body font-semibold">Milestones</span>
            <Button variant="link" onClick={addMilestone}>
              <Plus className="size-icon-small" /> Add milestone
            </Button>
          </Inline>
          <Box paddingBlockStart="space.050">
            {draft.milestones.map((m) => (
              <Grid
                key={m.uuid}
                className="border-b border-default py-100 last:border-0"
                gap="space.100"
                templateColumns="42px minmax(0,1fr) 128px 132px 24px"
                alignItems="center"
              >
                <Id className="font-body-small text-subtle">{m.id}</Id>
                <Input
                  value={m.title}
                  placeholder="Milestone title"
                  onChange={(e) => setMilestone(m.uuid, { title: e.target.value })}
                />
                <NativeSelect
                  value={m.status}
                  onChange={(e) =>
                    setMilestone(m.uuid, { status: e.target.value as MilestoneStatus })
                  }
                >
                  {milestoneStatuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </NativeSelect>
                <DatePicker
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
            ))}
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
            <Button variant="link" onClick={addProp}>
              <Plus className="size-icon-small" /> Add prop
            </Button>
          </Inline>
          <Box paddingBlockStart="space.050">
            {draft.props.map((p, n) => (
              <Grid
                key={n}
                className="border-b border-default py-100 last:border-0"
                gap="space.100"
                templateColumns="minmax(0,180px) minmax(0,1fr) minmax(0,120px) 24px"
                alignItems="center"
              >
                <Input
                  value={p.name}
                  placeholder="name (token)"
                  onChange={(e) => setProp(n, { name: e.target.value })}
                />
                <Input
                  value={p.value}
                  placeholder="value"
                  onChange={(e) => setProp(n, { value: e.target.value })}
                />
                <Input
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
      open
      onClose={onClose}
      title="Delete this POA&M item?"
      description={`${item.poamId} · ${item.title}`}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" className="bg-danger-bold hover:bg-danger" onClick={onConfirm}>
            Delete item
          </Button>
        </>
      }
    >
      <Stack className="font-body text-subtle" space="space.150">
        <p>
          The poam-item and its {item.milestones.length} milestone
          {item.milestones.length === 1 ? "" : "s"} are removed from the program&apos;s OSCAL
          POA&amp;M. Related observations and the risk exposure entries stay in place — only the
          links from this item are dropped.
        </p>
        <dl className="border-t border-default pt-050">
          <KeyValue label="uuid">
            <Id className="break-all">{item.uuid}</Id>
          </KeyValue>
          <KeyValue label="status">{item.status}</KeyValue>
          <KeyValue label="scheduled">{formatOscalDate(item.scheduledCompletion, true)}</KeyValue>
        </dl>
      </Stack>
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [control, setControl] = useState(programControls[0]?.id ?? "AC-2");
  const [severity, setSeverity] = useState<PoamSeverity>("Moderate");
  const [status, setStatus] = useState<PoamStatus>("Open");
  const [scheduled, setScheduled] = useState("2026-10-31");
  const [source, setSource] = useState("Security assessment");
  const [contact, setContact] = useState(defaultOwner);
  const [marking, setMarking] = useState("CUI");
  const [milestone, setMilestone] = useState("");
  const [milestoneDate, setMilestoneDate] = useState("2026-09-30");
  const [riskId, setRiskId] = useState("");
  const req = useRequired({ title, control, contact });

  const create = () => {
    if (!req.check()) return;
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
      associatedRisks: riskId ? [{ riskUuid: uuid(), riskId, title: `Linked risk ${riskId}` }] : [],
      links: [],
    };
    onCreate(item);
    setTitle("");
    setDescription("");
    setMilestone("");
    setRiskId("");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="large"
      title="Create a POA&M item"
      description={`${programName} · ${programId} · OSCAL poam-item`}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={create}>
            Create item
          </Button>
        </>
      }
      aside={
        <div>
          <div className="font-heading-xxsmall uppercase text-subtle">OSCAL preview</div>
          <dl className="pt-050">
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
            <KeyValue label="scheduled">{formatOscalDate(toOscalDateTime(scheduled))}</KeyValue>
            <KeyValue label="milestones">{milestone ? "1 planned" : "0"}</KeyValue>
            <KeyValue label="associated-risk">{riskId ? <Id>{riskId}</Id> : "none"}</KeyValue>
          </dl>
          <Box className="font-heading-xxsmall uppercase text-subtle" paddingBlockStart="space.200">
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
            Saved entries serialize into the program&apos;s OSCAL POA&amp;M export alongside the SSP
            and SAR.
          </p>
        </div>
      }
    >
      <Stack space="space.150">
        <Field
          isRequired
          error={req.errorFor("title")}
          label="Weakness title"
          hint="markup-line — appears as the poam-item title."
        >
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Privileged function invocations are not forwarded to the audit sink"
          />
        </Field>
        <Field
          label="Description"
          hint="markup-multiline — the weakness as it will read to the AO."
        >
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the weakness, the affected component, and the sampling that identified it."
          />
        </Field>
        <Grid gap="space.150" templateColumns="repeat(3, minmax(0, 1fr))">
          <Field isRequired error={req.errorFor("control")} label="Control">
            <NativeSelect value={control} onChange={(e) => setControl(e.target.value)}>
              {programControls.map((c) => (
                <option key={c.id}>{c.id}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Severity">
            <NativeSelect
              value={severity}
              onChange={(e) => setSeverity(e.target.value as PoamSeverity)}
            >
              {severities.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Status">
            <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as PoamStatus)}>
              <option>Open</option>
              <option>Ongoing</option>
              <option>Risk accepted</option>
              <option>Deferred</option>
            </NativeSelect>
          </Field>
        </Grid>
        <Grid gap="space.150" templateColumns="repeat(3, minmax(0, 1fr))">
          <Field label="Scheduled completion">
            <DatePicker value={scheduled} onChange={setScheduled} />
          </Field>
          <Field isRequired error={req.errorFor("contact")} label="Point of contact">
            <NativeSelect value={contact} onChange={(e) => setContact(e.target.value)}>
              {[defaultOwner, ...contacts.filter((c) => c !== defaultOwner)].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Marking">
            <NativeSelect value={marking} onChange={(e) => setMarking(e.target.value)}>
              <option>CUI</option>
              <option>CUI//SP-PRIV</option>
              <option>CUI//SP-PRVCY</option>
              <option>Unclassified</option>
            </NativeSelect>
          </Field>
        </Grid>
        <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
          <Field label="Detection source">
            <NativeSelect value={source} onChange={(e) => setSource(e.target.value)}>
              {detectionSources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Associated risk" hint="Links the item to a risk exposure entry.">
            <NativeSelect value={riskId} onChange={(e) => setRiskId(e.target.value)}>
              <option value="">None</option>
              <option>RSK-2419</option>
              <option>RSK-2402</option>
              <option>RSK-2388</option>
              <option>RSK-2290</option>
            </NativeSelect>
          </Field>
        </Grid>
        <Grid gap="space.150" templateColumns="minmax(0,1fr) 160px">
          <Field label="First milestone" hint="Additional milestones can be added after creation.">
            <Input
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
              placeholder="Deploy audit forwarder to broker nodes"
            />
          </Field>
          <Field label="Target date">
            <DatePicker value={milestoneDate} onChange={setMilestoneDate} />
          </Field>
        </Grid>
      </Stack>
    </Dialog>
  );
}
