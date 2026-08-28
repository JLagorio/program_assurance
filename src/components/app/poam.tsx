import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import {
  Badge,
  Button,
  Dot,
  Field,
  FilterChip,
  Input,
  KeyValue,
  Meter,
  Modal,
  Mono,
  Section,
  Select,
  Table,
  Td,
  Textarea,
  Th,
  Tr,
} from "@/components/app/ui";
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
    return { text: formatOscalDate(item.scheduledCompletion), tone: null as null | "danger" | "warning" };
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
      list = list.filter((i) => !closedStatuses.includes(i.status) && daysOut(i.scheduledCompletion) < 0);
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
            <Plus className="size-3.5" /> New POA&amp;M item
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2 pb-3 pt-3">
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)}>
              <span
                className={
                  f === filter
                    ? "inline-flex h-7 items-center rounded-md bg-primary/10 px-2.5 text-[13px] font-medium text-primary"
                    : "inline-flex h-7 items-center rounded-md px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                }
              >
                {f}
              </span>
            </button>
          ))}
          <span className="ml-auto">
            <FilterChip label="Hide closed" active={openOnly} onClick={() => setOpenOnly((v) => !v)} />
          </span>
        </div>

        <Table>
          <thead>
            <tr>
              <Th className="w-[72px]">Item</Th>
              <Th>Weakness</Th>
              <Th className="w-[104px]">Controls</Th>
              <Th className="w-[92px]">Severity</Th>
              <Th className="w-[112px]">Status</Th>
              <Th className="w-[128px]">Milestones</Th>
              <Th className="w-[110px] text-right">Scheduled</Th>
              <Th className="w-[72px] text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => {
              const due = dueLabel(i);
              const pct = milestoneProgress(i);
              return (
                <Tr key={i.uuid} onClick={() => setActiveUuid(i.uuid)} className="group cursor-pointer">
                  <Td className="w-[72px]">
                    <Mono>{i.poamId}</Mono>
                  </Td>
                  <Td className="font-medium">{i.title}</Td>
                  <Td className="w-[104px] text-muted-foreground">{i.controls.join(", ")}</Td>
                  <Td className="w-[92px]">
                    <Badge tone={poamSeverityTone[i.severity]}>{i.severity}</Badge>
                  </Td>
                  <Td className="w-[112px]">
                    <span className="flex items-center gap-1.5">
                      <Dot tone={poamStatusTone[i.status]} />
                      <span className="truncate">{i.status}</span>
                    </span>
                  </Td>
                  <Td className="w-[128px]">
                    <span className="flex items-center gap-2">
                      <span className="w-12">
                        <Meter value={pct} tone={pct === 100 ? "success" : "info"} />
                      </span>
                      <span className="tnum text-muted-foreground">
                        {i.milestones.filter((m) => m.status === "Completed").length}/
                        {i.milestones.length}
                      </span>
                    </span>
                  </Td>
                  <Td
                    className={
                      due.tone === "danger"
                        ? "tnum w-[110px] text-right font-medium text-destructive"
                        : due.tone === "warning"
                          ? "tnum w-[110px] text-right text-warning-foreground"
                          : "tnum w-[110px] text-right text-muted-foreground"
                    }
                  >
                    {due.text}
                  </Td>
                  <Td className="w-[72px] text-right">
                    <span className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <button
                        aria-label={`Edit ${i.poamId}`}
                        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingUuid(i.uuid);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        aria-label={`Delete ${i.poamId}`}
                        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingUuid(i.uuid);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  </Td>
                </Tr>
              );
            })}
            {rows.length === 0 ? (
              <Tr>
                <Td colSpan={8} className="text-muted-foreground">
                  No POA&amp;M items match this view.
                </Td>
              </Tr>
            ) : null}
          </tbody>
        </Table>
      </Section>

      <Section
        title="Audit trail"
        description="Immutable record of every POA&M create, edit and delete with actor attribution and field-level changes."
        action={
          <span className="text-[12px] text-muted-foreground">
            Signed in as {currentUser.name} · {currentUser.role}
          </span>
        }
      >
        <Table>
          <thead>
            <tr>
              <Th className="w-[150px]">Timestamp</Th>
              <Th className="w-[84px]">Action</Th>
              <Th className="w-[72px]">Item</Th>
              <Th className="w-[150px]">User</Th>
              <Th>Changed fields</Th>
            </tr>
          </thead>
          <tbody>
            {audit.map((e) => (
              <Tr key={e.uuid}>
                <Td className="tnum w-[150px] text-muted-foreground">
                  {formatOscalDate(e.timestamp, true)}
                </Td>
                <Td className="w-[84px]">
                  <Badge
                    tone={
                      e.action === "Deleted" ? "danger" : e.action === "Created" ? "success" : "info"
                    }
                  >
                    {e.action}
                  </Badge>
                </Td>
                <Td className="w-[72px]">
                  <Mono>{e.poamId}</Mono>
                </Td>
                <Td className="w-[150px]">{e.actor}</Td>
                <Td className="text-muted-foreground">
                  {e.changes.length === 0
                    ? e.action === "Created"
                      ? "New poam-item recorded"
                      : e.action === "Deleted"
                        ? "Record removed"
                        : "No field changes"

                    : e.changes
                        .map((c) => `${c.field}: ${c.from} → ${c.to}`)
                        .join("  ·  ")}
                </Td>
              </Tr>
            ))}
            {audit.length === 0 ? (
              <Tr>
                <Td colSpan={5} className="text-muted-foreground">
                  No POA&amp;M changes recorded yet.
                </Td>
              </Tr>
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
    <Modal
      open
      onClose={onClose}
      width="lg"
      title={item.title}
      description={`${item.poamId} · ${item.controls.join(", ")} · ${item.origin}`}
      footer={
        <>
          <Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={onDelete}>
            <Trash2 className="size-3.5" /> Delete
          </Button>
          <span className="flex-1" />
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={onEdit}>
            <Pencil className="size-3.5" /> Edit item
          </Button>
        </>
      }
      aside={
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            OSCAL identifiers
          </div>
          <dl className="pt-1">
            <KeyValue label="uuid">
              <Mono className="break-all">{item.uuid}</Mono>
            </KeyValue>
            <KeyValue label="published">{formatOscalDate(item.published, true)}</KeyValue>
            <KeyValue label="last-modified">{formatOscalDate(item.lastModified, true)}</KeyValue>
            <KeyValue label="scheduled">{formatOscalDate(item.scheduledCompletion, true)}</KeyValue>
            <KeyValue label="point of contact">{item.pointOfContact}</KeyValue>
            <KeyValue label="detection source">{item.detectionSource}</KeyValue>
          </dl>

          <div className="mt-5 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            props
          </div>
          <div className="space-y-1 pt-2">
            {item.props.map((p) => (
              <div key={p.name} className="flex items-baseline justify-between gap-2 text-[12px]">
                <Mono>{p.name}</Mono>
                <span className="truncate text-right text-muted-foreground">{p.value}</span>
              </div>
            ))}
          </div>

          {item.links.length > 0 ? (
            <>
              <div className="mt-5 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                links
              </div>
              <div className="space-y-1 pt-2 text-[13px]">
                {item.links.map((l) => (
                  <Link key={l.href + l.rel} to={l.href} className="block truncate text-primary hover:underline">
                    {l.text}
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={poamSeverityTone[item.severity]}>{item.severity}</Badge>
          <Badge tone={poamStatusTone[item.status]}>{item.status}</Badge>
          <span className="text-[12px] text-muted-foreground">{dueLabel(item).text}</span>
        </div>

        <div>
          <div className="border-b border-border pb-2 text-[13px] font-semibold">Description</div>
          <p className="pt-2 text-[13px] leading-relaxed text-muted-foreground">{item.description}</p>
          {item.remarks ? (
            <p className="pt-2 text-[13px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Remarks. </span>
              {item.remarks}
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-[13px] font-semibold">Milestones</span>
            <span className="tnum text-[12px] text-muted-foreground">
              {item.milestones.filter((m) => m.status === "Completed").length} of {item.milestones.length}{" "}
              complete
            </span>
          </div>
          <ol className="pt-1">
            {item.milestones.map((m) => (
              <li key={m.uuid} className="flex items-center gap-3 border-b border-border/70 py-2.5 last:border-0">
                <Dot tone={milestoneStatusTone[m.status]} />
                <Mono className="w-[42px] shrink-0">{m.id}</Mono>
                <span className="min-w-0 flex-1 truncate text-[13px]">{m.title}</span>
                <span className="w-[92px] shrink-0 text-right text-[12px] text-muted-foreground">
                  {m.status}
                </span>
                <span className="tnum w-[92px] shrink-0 text-right text-[12px] text-muted-foreground">
                  {formatOscalDate(m.completedDate ?? m.targetDate)}
                </span>
              </li>
            ))}
            {item.milestones.length === 0 ? (
              <li className="py-2.5 text-[13px] text-muted-foreground">No milestones recorded.</li>
            ) : null}
          </ol>
        </div>

        <div>
          <div className="border-b border-border pb-2 text-[13px] font-semibold">
            Related observations
          </div>
          <ol className="pt-1">
            {item.relatedObservations.map((o) => (
              <li
                key={o.observationUuid}
                className="flex items-center gap-3 border-b border-border/70 py-2.5 last:border-0"
              >
                <Badge tone="neutral">{o.method}</Badge>
                <Link to={o.href} className="min-w-0 flex-1 truncate text-[13px] text-primary hover:underline">
                  {o.title}
                </Link>
                <Mono className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
                  {o.observationUuid.slice(0, 8)}
                </Mono>
                <span className="tnum w-[92px] shrink-0 text-right text-[12px] text-muted-foreground">
                  {formatOscalDate(o.collected)}
                </span>
              </li>
            ))}
            {item.relatedObservations.length === 0 ? (
              <li className="py-2.5 text-[13px] text-muted-foreground">No related observations.</li>
            ) : null}
          </ol>
        </div>

        <div>
          <div className="border-b border-border pb-2 text-[13px] font-semibold">Associated risks</div>
          {item.associatedRisks.length === 0 ? (
            <p className="pt-2 text-[13px] text-muted-foreground">No risk exposure entry linked.</p>
          ) : (
            <ol className="pt-1">
              {item.associatedRisks.map((r) => (
                <li key={r.riskUuid} className="flex items-center gap-3 border-b border-border/70 py-2.5 last:border-0">
                  <Mono className="w-[76px] shrink-0">{r.riskId}</Mono>
                  <Link
                    to="/risks/$riskId"
                    params={{ riskId: r.riskId }}
                    className="min-w-0 flex-1 truncate text-[13px] text-primary hover:underline"
                  >
                    {r.title}
                  </Link>
                  <Mono className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
                    {r.riskUuid.slice(0, 8)}
                  </Mono>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div>
          <div className="border-b border-border pb-2 text-[13px] font-semibold">Audit trail</div>
          {audit.length === 0 ? (
            <p className="pt-2 text-[13px] text-muted-foreground">
              No changes recorded for this item in this session.
            </p>
          ) : (
            <ol className="pt-1">
              {audit.map((e) => (
                <li key={e.uuid} className="border-b border-border/70 py-2.5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-medium">{e.action}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
                      {e.actor} · {e.actorRole}
                    </span>
                    <span className="tnum shrink-0 text-[12px] text-muted-foreground">
                      {formatOscalDate(e.timestamp, true)}
                    </span>
                  </div>
                  {e.changes.length > 0 ? (
                    <ul className="mt-1 space-y-0.5">
                      {e.changes.map((c) => (
                        <li key={c.field} className="flex items-baseline gap-2 text-[12px]">
                          <Mono className="shrink-0 text-[11px]">{c.field}</Mono>
                          <span className="min-w-0 truncate text-muted-foreground line-through">
                            {c.from}
                          </span>
                          <span className="shrink-0 text-muted-foreground">→</span>
                          <span className="min-w-0 truncate">{c.to}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

    </Modal>
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
  useEffect(() => setDraft(item), [item]);

  if (!item || !draft) return null;

  const set = <K extends keyof PoamItem>(key: K, value: PoamItem[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const setMilestone = (uid: string, patch: Partial<Milestone>) =>
    setDraft((d) =>
      d ? { ...d, milestones: d.milestones.map((m) => (m.uuid === uid ? { ...m, ...patch } : m)) } : d,
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
    const cleanedProps = draft.props
      .map((p) => ({ ...p, name: p.name.trim(), value: p.value.trim() }))
      .filter((p) => p.name.length > 0);
    const cleanedMilestones = draft.milestones
      .filter((m) => m.title.trim().length > 0)
      .map((m) => ({
        ...m,
        title: m.title.trim(),
        completedDate:
          m.status === "Completed" ? (m.completedDate ?? m.targetDate) : null,
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
    <Modal
      open
      onClose={onClose}
      width="lg"
      title="Edit POA&M item"
      description={`${item.poamId} · OSCAL poam-item · uuid preserved`}
      footer={
        <>
          <Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={onDelete}>
            <Trash2 className="size-3.5" /> Delete
          </Button>
          <span className="flex-1" />
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={draft.title.trim().length === 0}>
            Save changes
          </Button>
        </>
      }
      aside={
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            Preserved OSCAL fields
          </div>
          <dl className="pt-1">
            <KeyValue label="uuid">
              <Mono className="break-all">{item.uuid}</Mono>
            </KeyValue>
            <KeyValue label="poam-id">
              <Mono>{item.poamId}</Mono>
            </KeyValue>
            <KeyValue label="published">{formatOscalDate(item.published, true)}</KeyValue>
            <KeyValue label="last-modified">
              <span className="text-muted-foreground">set on save</span>
            </KeyValue>
            <KeyValue label="related-observations">{item.relatedObservations.length}</KeyValue>
            <KeyValue label="associated-risk">{item.associatedRisks.length}</KeyValue>
            <KeyValue label="links">{item.links.length}</KeyValue>
          </dl>
          <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
            Editing changes the mutable assembly only. Identifiers, publication timestamp and structural
            links stay bound so the item keeps its identity across OSCAL exports.
          </p>
        </div>
      }
    >
      <div className="space-y-3">
        <Field label="Weakness title" hint="markup-line — appears as the poam-item title.">
          <Input autoFocus value={draft.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Description" hint="markup-multiline">
          <Textarea value={draft.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <Field label="Remarks" hint="markup-multiline — compensating controls, AO notes.">
          <Textarea value={draft.remarks} onChange={(e) => set("remarks", e.target.value)} />
        </Field>

        <div className="grid grid-cols-3 gap-3">
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
            <Select value={draft.severity} onChange={(e) => set("severity", e.target.value as PoamSeverity)}>
              {severities.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={draft.status} onChange={(e) => set("status", e.target.value as PoamStatus)}>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Scheduled completion" hint="date-time-with-timezone">
            <Input
              type="date"
              value={toDateInput(draft.scheduledCompletion)}
              onChange={(e) => set("scheduledCompletion", toOscalDateTime(e.target.value))}
            />
          </Field>
          <Field label="Point of contact">
            <Select value={draft.pointOfContact} onChange={(e) => set("pointOfContact", e.target.value)}>
              {[draft.pointOfContact, ...contacts.filter((c) => c !== draft.pointOfContact)].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Detection source">
            <Select value={draft.detectionSource} onChange={(e) => set("detectionSource", e.target.value)}>
              {[
                draft.detectionSource,
                ...detectionSources.filter((s) => s !== draft.detectionSource),
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>

        {/* Milestones */}
        <div>
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-[13px] font-semibold">Milestones</span>
            <Button variant="link" onClick={addMilestone}>
              <Plus className="size-3.5" /> Add milestone
            </Button>
          </div>
          <div className="pt-1">
            {draft.milestones.map((m) => (
              <div
                key={m.uuid}
                className="grid grid-cols-[42px_minmax(0,1fr)_128px_132px_24px] items-center gap-2 border-b border-border/70 py-2 last:border-0"
              >
                <Mono className="text-[12px] text-muted-foreground">{m.id}</Mono>
                <Input
                  value={m.title}
                  placeholder="Milestone title"
                  onChange={(e) => setMilestone(m.uuid, { title: e.target.value })}
                />
                <Select
                  value={m.status}
                  onChange={(e) => setMilestone(m.uuid, { status: e.target.value as MilestoneStatus })}
                >
                  {milestoneStatuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
                <Input
                  type="date"
                  value={toDateInput(m.completedDate ?? m.targetDate)}
                  onChange={(e) =>
                    setMilestone(
                      m.uuid,
                      m.status === "Completed"
                        ? { completedDate: toOscalDateTime(e.target.value) }
                        : { targetDate: toOscalDateTime(e.target.value) },
                    )
                  }
                />
                <button
                  aria-label={`Remove milestone ${m.id}`}
                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeMilestone(m.uuid)}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {draft.milestones.length === 0 ? (
              <p className="py-2 text-[13px] text-muted-foreground">
                No milestones. Add one to track intermediate progress.
              </p>
            ) : null}
          </div>
        </div>

        {/* Props */}
        <div>
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-[13px] font-semibold">Props</span>
            <Button variant="link" onClick={addProp}>
              <Plus className="size-3.5" /> Add prop
            </Button>
          </div>
          <div className="pt-1">
            {draft.props.map((p, n) => (
              <div
                key={n}
                className="grid grid-cols-[minmax(0,180px)_minmax(0,1fr)_minmax(0,120px)_24px] items-center gap-2 border-b border-border/70 py-2 last:border-0"
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
                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeProp(n)}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {draft.props.length === 0 ? (
              <p className="py-2 text-[13px] text-muted-foreground">No props on this item.</p>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
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
    <Modal
      open
      onClose={onClose}
      title="Delete this POA&M item?"
      description={`${item.poamId} · ${item.title}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="bg-destructive hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Delete item
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-[13px] leading-relaxed text-muted-foreground">
        <p>
          The poam-item and its {item.milestones.length} milestone
          {item.milestones.length === 1 ? "" : "s"} are removed from the program&apos;s OSCAL POA&amp;M.
          Related observations and the risk exposure entries stay in place — only the links from this item
          are dropped.
        </p>
        <dl className="border-t border-border pt-1">
          <KeyValue label="uuid">
            <Mono className="break-all">{item.uuid}</Mono>
          </KeyValue>
          <KeyValue label="status">{item.status}</KeyValue>
          <KeyValue label="scheduled">{formatOscalDate(item.scheduledCompletion, true)}</KeyValue>
        </dl>
      </div>
    </Modal>
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

  const create = () => {
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
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="lg"
      title="Create a POA&M item"
      description={`${programName} · ${programId} · OSCAL poam-item`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={create} disabled={title.trim().length === 0}>
            Create item
          </Button>
        </>
      }
      aside={
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            OSCAL preview
          </div>
          <dl className="pt-1">
            <KeyValue label="uuid">
              <Mono>generated on save</Mono>
            </KeyValue>
            <KeyValue label="poam-id">
              <Mono>{nextId}</Mono>
            </KeyValue>
            <KeyValue label="title">{title || "—"}</KeyValue>
            <KeyValue label="control">
              <Mono>{control}</Mono>
            </KeyValue>
            <KeyValue label="scheduled">{formatOscalDate(toOscalDateTime(scheduled))}</KeyValue>
            <KeyValue label="milestones">{milestone ? "1 planned" : "0"}</KeyValue>
            <KeyValue label="associated-risk">{riskId ? <Mono>{riskId}</Mono> : "none"}</KeyValue>
          </dl>
          <div className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            props
          </div>
          <div className="space-y-1 pt-2 text-[12px]">
            <div className="flex justify-between gap-2">
              <Mono>marking</Mono>
              <span className="text-muted-foreground">{marking}</span>
            </div>
            <div className="flex justify-between gap-2">
              <Mono>weakness-source</Mono>
              <span className="truncate text-muted-foreground">{source}</span>
            </div>
            <div className="flex justify-between gap-2">
              <Mono>severity</Mono>
              <span className="text-muted-foreground">{severity}</span>
            </div>
            <div className="flex justify-between gap-2">
              <Mono>status</Mono>
              <span className="text-muted-foreground">{status}</span>
            </div>
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
            Saved entries serialize into the program&apos;s OSCAL POA&amp;M export alongside the SSP and SAR.
          </p>
        </div>
      }
    >
      <div className="space-y-3">
        <Field label="Weakness title" hint="markup-line — appears as the poam-item title.">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Privileged function invocations are not forwarded to the audit sink"
          />
        </Field>
        <Field label="Description" hint="markup-multiline — the weakness as it will read to the AO.">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the weakness, the affected component, and the sampling that identified it."
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Control">
            <Select value={control} onChange={(e) => setControl(e.target.value)}>
              {programControls.map((c) => (
                <option key={c.id}>{c.id}</option>
              ))}
            </Select>
          </Field>
          <Field label="Severity">
            <Select value={severity} onChange={(e) => setSeverity(e.target.value as PoamSeverity)}>
              {severities.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as PoamStatus)}>
              <option>Open</option>
              <option>Ongoing</option>
              <option>Risk accepted</option>
              <option>Deferred</option>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Scheduled completion">
            <Input type="date" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
          </Field>
          <Field label="Point of contact">
            <Select value={contact} onChange={(e) => setContact(e.target.value)}>
              {[defaultOwner, ...contacts.filter((c) => c !== defaultOwner)].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Marking">
            <Select value={marking} onChange={(e) => setMarking(e.target.value)}>
              <option>CUI</option>
              <option>CUI//SP-PRIV</option>
              <option>CUI//SP-PRVCY</option>
              <option>Unclassified</option>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Detection source">
            <Select value={source} onChange={(e) => setSource(e.target.value)}>
              {detectionSources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Associated risk" hint="Links the item to a risk exposure entry.">
            <Select value={riskId} onChange={(e) => setRiskId(e.target.value)}>
              <option value="">None</option>
              <option>RSK-2419</option>
              <option>RSK-2402</option>
              <option>RSK-2388</option>
              <option>RSK-2290</option>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_160px] gap-3">
          <Field label="First milestone" hint="Additional milestones can be added after creation.">
            <Input
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
              placeholder="Deploy audit forwarder to broker nodes"
            />
          </Field>
          <Field label="Target date">
            <Input type="date" value={milestoneDate} onChange={(e) => setMilestoneDate(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
