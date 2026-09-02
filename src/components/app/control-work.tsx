/**
 * The control work surface.
 *
 * Rebuilt on the shapes in `shapes.tsx` after an audit found this screen was
 * nineteen stacked Sections carrying 194 words of explanatory prose. The rule
 * here: the work is expanded, the reference is collapsed, the facts are in the
 * Inspector, and nothing carries a description.
 */

import { useState } from "react";

import { RecordPicker } from "@/components/app/record-picker";
import { ActionBar, Block, type BarAction } from "@/components/app/shapes";
import { Badge, Button, Field, Modal, Select, Table, Textarea } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import {
  activityFor,
  addComment,
  assessmentStates,
  assessmentTone,
  commentsFor,
  currentSession,
  gatesFor,
  implementationStates,
  implementationTone,
  linkEvidence,
  offersFor,
  perform,
  setDeterminationNote,
  setNarrative,
  unlinkEvidence,
  type ControlWork,
  type WorkContext,
} from "@/lib/control-work";

/* ------------------------------------------------------------- Action bar */

export function ControlActionBar({
  work,
  context,
  title,
  scopeName,
  breadcrumb,
  tabs,
  onChange,
}: {
  work: ControlWork;
  context: WorkContext;
  title: string;
  scopeName: string;
  breadcrumb?: React.ReactNode;
  tabs?: React.ReactNode;
  onChange: () => void;
}) {
  const session = currentSession();
  const offers = offersFor(work, context, session.role);
  const [pending, setPending] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const chosen = offers.find((o) => o.def.key === pending);

  const actions: BarAction[] = offers.map((o) => ({
    label: o.def.label,
    primary:
      o.allowed && (o.def.key === "implement" || o.def.key === "submit" || o.def.key === "satisfy"),
    blocked: o.blocked,
    onSelect: () => {
      setPending(o.def.key);
      setNote("");
      setError(null);
    },
  }));

  const fire = () => {
    if (!pending) return;
    const result = perform(work.id, pending, context, note);
    if (!result.ok) return setError(result.reason);
    setPending(null);
    setNote("");
    onChange();
  };

  return (
    <>
      <ActionBar
        breadcrumb={breadcrumb}
        tabs={tabs}
        id={work.control}
        title={title}
        context={`${scopeName} · ${work.owner ?? "unassigned"}`}
        states={[
          {
            label: "Implementation",
            value: work.implementation,
            tone: implementationTone[work.implementation],
          },
          {
            label: "Assessment",
            value: work.assessment,
            tone: assessmentTone[work.assessment],
          },
          ...(work.submitted
            ? [{ label: "Status", value: "With the assessor", tone: "info" as const }]
            : []),
        ]}
        actions={actions}
      />

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title={chosen?.def.label ?? "Confirm"}
        footer={
          <>
            {error ? <span className="mr-auto text-[12.5px] text-danger">{error}</span> : null}
            <Button onClick={() => setPending(null)}>Cancel</Button>
            <Button variant="primary" onClick={fire}>
              {chosen?.def.label ?? "Confirm"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <div className="rounded-lg border border-border bg-subtle px-3 py-2 text-[12.5px]">
            {session.name} · {session.role}
          </div>
          <Field label={chosen?.def.note === "required" ? "Reason (required)" : "Note"}>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </>
  );
}

/* --------------------------------------------------------------- Gate list */

/** Compact enough for the Inspector: a dot, a label, and what is missing. */
export function GateList({ work, context }: { work: ControlWork; context: WorkContext }) {
  return (
    <ul className="space-y-1">
      {gatesFor(work, context).map((g) => (
        <li key={g.key} className="flex items-baseline gap-2" title={g.detail}>
          <span
            className={cn(
              "mt-[5px] size-1.5 shrink-0 rounded-full",
              g.met ? "bg-success" : "bg-warning",
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[12px]">{g.label}</span>
            {!g.met ? (
              <span className="block truncate text-[11.5px] text-muted-foreground">{g.detail}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------------------------------------- Narrative */

export function Narrative({ work, onChange }: { work: ControlWork; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(work.narrative);

  if (editing) {
    return (
      <div>
        <Textarea
          className="min-h-[132px]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="How this system satisfies the control, in terms an assessor can verify."
        />
        <div className="mt-2 flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setNarrative(work.id, draft);
              setEditing(false);
              onChange();
            }}
          >
            Save revision
          </Button>
          <Button size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {work.narrative ? (
        <p className="max-w-[76ch] text-[13px] leading-[1.55]">{work.narrative}</p>
      ) : (
        <p className="text-[13px] text-muted-foreground">Not written.</p>
      )}
      <Button
        className="mt-2"
        size="sm"
        onClick={() => {
          setDraft(work.narrative);
          setEditing(true);
        }}
      >
        {work.narrative ? "Revise" : "Write"}
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- Evidence */

export function EvidenceBlock({
  work,
  available,
  onChange,
}: {
  work: ControlWork;
  available: { id: string; label: string; collected: string }[];
  onChange: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const unlinked = available.filter((a) => !work.evidence.includes(a.id));

  return (
    <div>
      {work.evidence.length ? (
        <Table>
          <colgroup>
            <col style={{ width: "118px" }} />
            <col />
            <col style={{ width: "124px" }} />
            <col style={{ width: "72px" }} />
          </colgroup>
          <tbody>
            {work.evidence.map((id) => {
              const meta = available.find((a) => a.id === id);
              return (
                <Table.Row key={id}>
                  <Table.Id id={id} />
                  <Table.Cell className="truncate">
                    {meta?.label ?? "Not in the evidence store"}
                  </Table.Cell>
                  <Table.Cell>{meta?.collected ?? "—"}</Table.Cell>
                  <Table.Cell>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        unlinkEvidence(work.id, id);
                        onChange();
                      }}
                    >
                      Unlink
                    </Button>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <p className="text-[13px] text-muted-foreground">None linked.</p>
      )}

      <Button className="mt-2" size="sm" onClick={() => setPicking(true)}>
        Link evidence…
      </Button>

      <RecordPicker
        open={picking}
        onClose={() => setPicking(false)}
        title="Link evidence"
        placeholder="Search by id, source, control or test run…"
        emptyHint="No artifact matches. Evidence is harvested from findings and test runs."
        records={unlinked.map((a) => ({
          id: a.id,
          title: a.label,
          meta: `Collected ${a.collected}`,
          badge: { label: a.collected.slice(0, 6), tone: "neutral" as const },
          keywords: a.id,
        }))}
        onPick={(r) => {
          linkEvidence(work.id, r.id);
          onChange();
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------ Determination */

export function Determination({ work, onChange }: { work: ControlWork; onChange: () => void }) {
  const session = currentSession();
  const [draft, setDraft] = useState(work.determinationNote);

  if (session.role !== "Assessor") {
    return work.determinationNote ? (
      <p className="max-w-[76ch] text-[13px] leading-[1.55]">{work.determinationNote}</p>
    ) : (
      <p className="text-[13px] text-muted-foreground">None recorded. Assessor only.</p>
    );
  }

  return (
    <div>
      <Textarea
        className="min-h-[92px]"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="What was examined, what was found, what it supports."
      />
      <Button
        className="mt-2"
        size="sm"
        onClick={() => {
          setDeterminationNote(work.id, draft);
          onChange();
        }}
      >
        Save
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- Comments */

export function Comments({ work, onChange }: { work: ControlWork; onChange: () => void }) {
  const [body, setBody] = useState("");
  const thread = commentsFor(work.id);
  const session = currentSession();

  return (
    <div>
      {thread.length ? (
        <ul className="divide-y divide-border-subtle">
          {thread.map((c) => (
            <li key={c.id} className="py-2.5">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-[13px] font-medium">{c.author}</span>
                <Badge size="xs">{c.role}</Badge>
                <span className="text-[11.5px] text-muted-foreground">{c.at}</span>
              </div>
              <p className="mt-1 max-w-[76ch] text-[13px] leading-[1.5]">{c.body}</p>
            </li>
          ))}
        </ul>
      ) : null}
      <Textarea
        className="mt-2"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={`Reply as ${session.name}`}
      />
      <Button
        className="mt-2"
        size="sm"
        onClick={() => {
          addComment(work.id, body);
          setBody("");
          onChange();
        }}
      >
        Comment
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- History */

export function History({ work }: { work: ControlWork }) {
  const events = activityFor(work.id);
  if (!events.length) return <p className="text-[13px] text-muted-foreground">Nothing yet.</p>;
  return (
    <Table>
      <colgroup>
        <col style={{ width: "108px" }} />
        <col style={{ width: "140px" }} />
        <col style={{ width: "200px" }} />
        <col />
      </colgroup>
      <tbody>
        {events.map((e) => (
          <Table.Row key={e.id}>
            <Table.Cell>{e.at}</Table.Cell>
            <Table.Cell className="truncate">{e.actor}</Table.Cell>
            <Table.Cell className="truncate">{e.summary}</Table.Cell>
            <Table.Cell className="truncate" title={e.note}>
              {e.note ?? "—"}
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/* ------------------------------------------------------- Axis edit controls */

/** The two axes as Inspector controls, each refusing what its gates forbid. */
export function AxisControls({ work, context }: { work: ControlWork; context: WorkContext }) {
  const session = currentSession();
  const canAssess = session.role === "Assessor";
  return (
    <div className="space-y-2">
      <Field label="Implementation">
        <Select
          value={work.implementation}
          disabled
          aria-label="Implementation"
          title="Changed through the actions above, so the gates apply"
        >
          {implementationStates.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </Field>
      <Field label="Assessment">
        <Select
          value={work.assessment}
          disabled
          aria-label="Assessment"
          title={canAssess ? "Changed through the actions above" : "Assessor only"}
        >
          {assessmentStates.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </Field>
      <Block title="Gates">
        <GateList work={work} context={context} />
      </Block>
    </div>
  );
}
