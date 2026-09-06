import { useNavigate } from "@tanstack/react-router";
import { FileText, Link2, ListChecks, Send } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import {
  Button,
  Combobox,
  DatePicker,
  Dialog,
  Empty,
  Field,
  Section,
  Textarea,
  TextLink,
  ToggleGroup,
} from "@ledger/design-system";
import { Inline, Stack } from "@ledger/design-system";

import { Activity } from "@/components/app/activity";
import { TaskDialog } from "@/components/app/task-dialog";
import { SubjectWords } from "@/components/app/subject-link";
import {
  activityFor,
  activityForProgram,
  fullStamp,
  groupByWhen,
  record,
  relativeTime,
  subjectKey,
  useActivityVersion,
  type ActivityEntry,
  type ActivityKind,
  type Subject,
} from "@/lib/activity";
import { evidenceCatalog } from "@/lib/evidence-catalog";
import { mentionablePeople, personByName } from "@/lib/people";
import { createTask } from "@/lib/tasks";

const logItems = [
  { value: "note", label: "Note", icon: <FileText /> },
  { value: "task", label: "Task", icon: <ListChecks /> },
  { value: "request", label: "Request", icon: <Send /> },
  { value: "evidence", label: "Evidence", icon: <Link2 /> },
];

type Open = "note" | "task" | "request" | "evidence" | null;

/* ------------------------------------------------------------------ Feed */

/** Entries drawn as the kit's feed, grouped by when; the subject shown when the list spans records. */
export function ActivityFeed({
  entries,
  me,
  showSubject = false,
  emptyTitle = "Nothing yet",
}: {
  entries: ActivityEntry[];
  me: string;
  showSubject?: boolean | undefined;
  emptyTitle?: string | undefined;
}) {
  const navigate = useNavigate();
  const mention = (name: string) => {
    const person = personByName(name);
    return (
      <Activity.Mention
        name={name}
        onSelect={
          person
            ? () => navigate({ to: "/people/$personId", params: { personId: person.id } })
            : undefined
        }
      />
    );
  };
  if (entries.length === 0) {
    return (
      <Empty
        size="compact"
        title={emptyTitle}
        description="Notes, tasks, requests and links land here as they happen."
      />
    );
  }
  const groups = groupByWhen(entries);
  return (
    <Activity>
      {groups.map((g) => (
        <Activity.Group key={g.label} label={g.label} count={g.items.length}>
          {g.items.map((e) => (
            <Activity.Item
              key={e.id}
              actor={e.actor === "System" ? undefined : e.actor}
              kind={e.kind}
              title={e.summary}
              meta={
                showSubject ? <SubjectWords subject={e.subject} program={e.program} /> : undefined
              }
              time={relativeTime(e.at)}
              dateTime={e.at}
              timeTitle={fullStamp(e.at)}
              emphasis={e.mentions.includes(me)}
            >
              {e.body ? <Activity.Text mention={mention}>{e.body}</Activity.Text> : null}
            </Activity.Item>
          ))}
        </Activity.Group>
      ))}
    </Activity>
  );
}

/* --------------------------------------------------------------- Logging */

/** The log bar and what each item opens: the composer, the task dialog, the request, the evidence link. */
export function LogBar({
  program,
  subject,
  me,
  onLinkEvidence,
}: {
  program: string;
  subject: Subject;
  me: string;
  /** The control record links evidence to its work; elsewhere the link is an entry. */
  onLinkEvidence?: ((evidenceId: string, note: string) => void) | undefined;
}) {
  const [open, setOpen] = useState<Open>(null);
  const people = useMemo(() => mentionablePeople(program), [program]);
  const [to, setTo] = useState("");
  const [by, setBy] = useState("");
  const [evidence, setEvidence] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");

  const post = (text: string, mentions: string[]) => {
    record({
      program,
      actor: me,
      kind: mentions.length ? "comment" : "note",
      summary: mentions.length ? `mentioned ${mentions.join(", ")}` : "added a note",
      body: text,
      subject,
      mentions,
    });
    setOpen(null);
  };

  const request = (text: string, mentions: string[]) => {
    if (!to) return;
    const firstLine = text.split("\n")[0]!.trim();
    const title = firstLine.length > 90 ? `${firstLine.slice(0, 87)}…` : firstLine;
    const task = createTask({
      program,
      title,
      subject,
      assignee: to,
      requester: me,
      due: by || null,
      note: text,
      waitingOn: to,
      log: false,
    });
    record({
      program,
      actor: me,
      kind: "request",
      summary: `asked ${to} for ${title.replace(/[.?!]$/, "")}`,
      body: text,
      subject,
      about: { kind: "task", id: task.id, label: task.title },
      mentions: [...new Set([to, ...mentions])],
    });
    setTo("");
    setBy("");
    setOpen(null);
  };

  const link = () => {
    const artifact = evidenceCatalog.find((e) => e.id === evidence);
    if (!artifact) return;
    if (onLinkEvidence) {
      onLinkEvidence(artifact.id, evidenceNote);
    } else {
      record({
        program,
        actor: me,
        kind: "link",
        summary: `linked ${artifact.id} ${artifact.label}`,
        body: evidenceNote || undefined,
        subject,
        about: { kind: "evidence", id: artifact.id, label: artifact.label },
      });
    }
    setEvidence("");
    setEvidenceNote("");
    setOpen(null);
  };

  const options = people.map((p) => ({ value: p.name, label: p.name, meta: p.meta }));

  return (
    <Stack space="space.150">
      <Activity.LogBar
        items={logItems}
        value={open}
        onSelect={(v) => setOpen((cur) => (cur === v ? null : (v as Open)))}
      />
      {open === "note" ? (
        <Activity.Composer
          actor={me}
          people={people}
          placeholder="Add a note"
          submitLabel="Post"
          autoFocus
          onCancel={() => setOpen(null)}
          onSubmit={post}
        />
      ) : null}
      {open === "request" ? (
        <Activity.Composer
          actor={me}
          people={people}
          placeholder="What are you asking for?"
          submitLabel="Send"
          autoFocus
          onCancel={() => setOpen(null)}
          onSubmit={request}
        >
          <Inline space="space.150" alignBlock="end" shouldWrap>
            <Field isRequired label="To">
              <Combobox
                value={to}
                onChange={setTo}
                options={options}
                placeholder="Choose a person"
                searchPlaceholder="Search people…"
                width={280}
              />
            </Field>
            <Field label="By">
              <DatePicker value={by} onChange={setBy} placeholder="Choose a day" />
            </Field>
          </Inline>
        </Activity.Composer>
      ) : null}
      <TaskDialog
        open={open === "task"}
        onClose={() => setOpen(null)}
        program={program}
        subject={subject}
        requester={me}
      />
      <Dialog
        open={open === "evidence"}
        onClose={() => setOpen(null)}
        title="Link evidence"
        eyebrow={subject.label ? `${subject.id} · ${subject.label}` : subject.id}
        footer={
          <>
            <Button variant="subtle" onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={link} disabled={!evidence}>
              Link evidence
            </Button>
          </>
        }
      >
        <Stack space="space.150">
          <Field isRequired label="Artifact">
            <Combobox
              value={evidence}
              onChange={setEvidence}
              options={evidenceCatalog.map((e) => ({
                value: e.id,
                label: `${e.id} ${e.label}`,
                meta: e.collected,
                keywords: e.label,
              }))}
              placeholder="Search the evidence library"
              searchPlaceholder="Search evidence…"
              width={420}
              className="w-full"
            />
          </Field>
          <Field label="Note">
            <Textarea
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="What it shows"
              rows={2}
            />
          </Field>
        </Stack>
      </Dialog>
    </Stack>
  );
}

/* --------------------------------------------------------------- Section */

const kindFilters: { value: "all" | ActivityKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "note", label: "Notes" },
  { value: "comment", label: "Comments" },
  { value: "task", label: "Tasks" },
  { value: "request", label: "Requests" },
  { value: "link", label: "Evidence" },
  { value: "change", label: "Changes" },
];

/** A record's last section: the log bar, then its feed. `limit` shows the recent few with a way to the rest. */
export function RecordActivity({
  program,
  subject,
  me,
  onLinkEvidence,
  limit,
  seeAll,
  wholeProgram = false,
  filters = false,
  title = "Activity",
}: {
  program: string;
  subject: Subject;
  me: string;
  onLinkEvidence?: ((evidenceId: string, note: string) => void) | undefined;
  limit?: number | undefined;
  /** A link to the full feed, shown when `limit` cuts it. */
  seeAll?: ReactNode;
  /** The program's whole log, every record, for its Activity tab. */
  wholeProgram?: boolean | undefined;
  /** A row of kind filters above the feed. */
  filters?: boolean | undefined;
  title?: string | undefined;
}) {
  useActivityVersion();
  const [kind, setKind] = useState<"all" | ActivityKind>("all");
  const all = wholeProgram ? activityForProgram(program) : activityFor(subject);
  const filtered =
    kind === "all"
      ? all
      : all.filter((e) =>
          kind === "change"
            ? ["change", "stage", "assign", "done", "created"].includes(e.kind)
            : e.kind === kind,
        );
  const shown = limit ? filtered.slice(0, limit) : filtered;
  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const e of all) {
      const k = ["change", "stage", "assign", "done", "created"].includes(e.kind)
        ? "change"
        : e.kind;
      c.set(k, (c.get(k) ?? 0) + 1);
    }
    return c;
  }, [all]);

  return (
    <Section
      title={title}
      count={all.length || null}
      action={
        limit && filtered.length > limit && seeAll ? (
          <TextLink size="small">{seeAll}</TextLink>
        ) : undefined
      }
    >
      <Stack space="space.200" className="pt-100">
        <LogBar program={program} subject={subject} me={me} onLinkEvidence={onLinkEvidence} />
        {filters ? (
          <ToggleGroup<"all" | ActivityKind>
            aria-label="Kind"
            value={kind}
            onChange={setKind}
            items={kindFilters.map((f) => ({
              value: f.value,
              label: f.label,
              count: f.value === "all" ? all.length : (counts.get(f.value) ?? 0),
            }))}
          />
        ) : null}
        <ActivityFeed
          entries={shown}
          me={me}
          showSubject={
            wholeProgram || shown.some((e) => subjectKey(e.subject) !== subjectKey(subject))
          }
        />
      </Stack>
    </Section>
  );
}
