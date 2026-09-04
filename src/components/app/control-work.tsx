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
import {
  ActionBar,
  Badge,
  Block,
  Box,
  Button,
  Dialog,
  Field,
  Grid,
  Inline,
  NativeSelect,
  Stack,
  Table,
  Textarea,
} from "@ledger/design-system";
import type { ActionBarAction } from "@ledger/design-system";
import { required, useFormErrors } from "@/lib/form";
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
  const noteErrors = useFormErrors<"note">();

  const chosen = offers.find((o) => o.def.key === pending);
  const noteRequired = chosen?.def.note === "required";

  const actions: ActionBarAction[] = offers.map((o) => ({
    label: o.def.label,
    primary:
      o.allowed && (o.def.key === "implement" || o.def.key === "submit" || o.def.key === "satisfy"),
    blocked: o.blocked,
    onSelect: () => {
      setPending(o.def.key);
      setNote("");
      setError(null);
      noteErrors.clear();
    },
  }));

  const fire = () => {
    if (!pending) return;
    if (noteRequired && !noteErrors.validate({ note: required(note, "A reason is required.") }))
      return;
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
            ? [{ label: "Status", value: "With the assessor", tone: "information" as const }]
            : []),
        ]}
        actions={actions}
      />

      <Dialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={chosen?.def.label ?? "Confirm"}
        footer={
          <>
            {error ? <span className="mr-auto font-body-small text-danger">{error}</span> : null}
            <Button onClick={() => setPending(null)}>Cancel</Button>
            <Button variant="primary" onClick={fire}>
              {chosen?.def.label ?? "Confirm"}
            </Button>
          </>
        }
      >
        <Grid gap="space.150">
          <Box
            className="rounded-large border border-default bg-surface-sunken font-body-small"
            paddingInline="space.150"
            paddingBlock="space.100"
          >
            {session.name} · {session.role}
          </Box>
          <Field
            label={noteRequired ? "Reason" : "Note"}
            isRequired={noteRequired}
            error={noteErrors.errors.note}
          >
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </Grid>
      </Dialog>
    </>
  );
}

/* --------------------------------------------------------------- Gate list */

/** Compact enough for the Inspector: a dot, a label, and what is missing. */
export function GateList({ work, context }: { work: ControlWork; context: WorkContext }) {
  return (
    <Stack as="ul" space="space.050">
      {gatesFor(work, context).map((g) => (
        <Inline key={g.key} title={g.detail} as="li" space="space.100" alignBlock="baseline">
          <Box paddingBlockStart="space.050">
            <span
              className={cn(
                "shrink-0 rounded-full",
                g.met ? "bg-success-bold" : "bg-warning-bold",
                "size-075",
              )}
            />
          </Box>
          <span className="min-w-0 flex-1">
            <span className="block font-body-small">{g.label}</span>
            {!g.met ? (
              <span className="block truncate font-body-xsmall text-subtle">{g.detail}</span>
            ) : null}
          </span>
        </Inline>
      ))}
    </Stack>
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
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="How this system satisfies the control, in terms an assessor can verify."
          style={{ minHeight: 132 }}
        />
        <Inline className="pt-100" space="space.100">
          <Button
            variant="primary"
            size="small"
            onClick={() => {
              setNarrative(work.id, draft);
              setEditing(false);
              onChange();
            }}
          >
            Save revision
          </Button>
          <Button size="small" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </Inline>
      </div>
    );
  }

  return (
    <div>
      {work.narrative ? (
        <p className="max-w-layout-measure font-body">{work.narrative}</p>
      ) : (
        <p className="font-body text-subtle">Not written.</p>
      )}
      <Button
        className="pt-100"
        size="small"
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
          <tbody>
            {work.evidence.map((id) => {
              const meta = available.find((a) => a.id === id);
              return (
                <Table.Row key={id}>
                  <Table.Id id={id} width={118} />
                  <Table.Cell className="truncate">
                    {meta?.label ?? "Not in the evidence store"}
                  </Table.Cell>
                  <Table.Cell width={124}>{meta?.collected ?? "—"}</Table.Cell>
                  <Table.Cell width={72}>
                    <Button
                      size="xsmall"
                      variant="subtle"
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
        <p className="font-body text-subtle">None linked.</p>
      )}

      <Button className="pt-100" size="small" onClick={() => setPicking(true)}>
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
      <p className="max-w-layout-measure font-body">{work.determinationNote}</p>
    ) : (
      <p className="font-body text-subtle">None recorded. Assessor only.</p>
    );
  }

  return (
    <div>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="What was examined, what was found, what it supports."
        style={{ minHeight: 92 }}
      />
      <Button
        className="pt-100"
        size="small"
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
        <ul className="divide-y">
          {thread.map((c) => (
            <Box key={c.id} as="li" paddingBlock="space.100">
              <Inline space="space.100" alignBlock="baseline" shouldWrap>
                <span className="font-body font-medium">{c.author}</span>
                <Badge size="xsmall">{c.role}</Badge>
                <span className="font-body-xsmall text-subtle">{c.at}</span>
              </Inline>
              <p className="pt-050 max-w-layout-measure font-body">{c.body}</p>
            </Box>
          ))}
        </ul>
      ) : null}
      <Textarea
        className="pt-100"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={`Reply as ${session.name}`}
      />
      <Button
        className="pt-100"
        size="small"
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
  if (!events.length) return <p className="font-body text-subtle">Nothing yet.</p>;
  return (
    <Table>
      <tbody>
        {events.map((e) => (
          <Table.Row key={e.id}>
            <Table.Cell width={108}>{e.at}</Table.Cell>
            <Table.Cell className="truncate" width={140}>
              {e.actor}
            </Table.Cell>
            <Table.Cell className="truncate" width={200}>
              {e.summary}
            </Table.Cell>
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
    <Stack space="space.100">
      <Field label="Implementation">
        <NativeSelect
          value={work.implementation}
          disabled
          aria-label="Implementation"
          title="Changed through the actions above, so the gates apply"
        >
          {implementationStates.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Assessment">
        <NativeSelect
          value={work.assessment}
          disabled
          aria-label="Assessment"
          title={canAssess ? "Changed through the actions above" : "Assessor only"}
        >
          {assessmentStates.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </NativeSelect>
      </Field>
      <Block title="Gates">
        <GateList work={work} context={context} />
      </Block>
    </Stack>
  );
}
