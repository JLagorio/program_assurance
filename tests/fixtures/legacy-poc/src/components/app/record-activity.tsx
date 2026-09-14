import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ReactElement } from "react";

import {
  Badge,
  Count,
  Empty,
  Section,
  TextLink,
  ToggleGroup,
  ToggleGroupItem,
  type Tone,
} from "@ledger/design-system";
import { Stack, EmptyHeader, EmptyTitle, EmptyDescription } from "@ledger/design-system";

import { Activity } from "@/components/app/activity";
import { TaskDialog } from "@/components/app/task-dialog";
import { SubjectWords } from "@/components/app/subject-link";
import {
  activityFor,
  activityForProgram,
  feedStamp,
  fullStamp,
  groupByWhen,
  record,
  subjectKey,
  useActivityVersion,
  type ActivityEntry,
  type ActivityKind,
  type Subject,
} from "@/lib/activity";
import { mentionablePeople, people, personByName } from "@/lib/people";

/* ------------------------------------------------------------------ Feed */

const names = people.map((p) => p.name);

/** The tone of a task's state as the log wrote it: "Done", "Waiting on Joel Barrantes", "Open". */
const stateToneOf = (state: string): Tone =>
  state === "Done"
    ? "success"
    : state === "Blocked"
      ? "danger"
      : state.startsWith("Waiting")
        ? "warning"
        : "neutral";

/**
 * The sentence for an entry: the names, the quoted titles, the ids and the record it touches in
 * weight; a move of stage or state ends in a Badge with the new one; a closed task ends in Done.
 */
function Sentence({ entry, me }: { entry: ActivityEntry; me: string }) {
  const strong = [...names, entry.about?.label ?? ""];
  if (entry.field === "stage" && entry.before && entry.after) {
    return (
      <>
        <Activity.Sentence strong={strong} me={me}>
          {`moved the program from ${entry.before} to`}
        </Activity.Sentence>{" "}
        <Badge variant="secondary" tone="information">
          {entry.after}
        </Badge>
      </>
    );
  }
  if (entry.field === "state" && entry.after) {
    return (
      <>
        <Activity.Sentence strong={strong} me={me}>
          {`marked "${entry.about?.label ?? entry.subject.label ?? entry.subject.id}"`}
        </Activity.Sentence>{" "}
        <Badge variant="secondary" tone={stateToneOf(entry.after)}>
          {entry.after}
        </Badge>
      </>
    );
  }
  return (
    <>
      <Activity.Sentence strong={strong} me={me}>
        {entry.summary}
      </Activity.Sentence>
      {entry.kind === "done" ? (
        <>
          {" "}
          <Badge variant="secondary" tone="success">
            Done
          </Badge>
        </>
      ) : null}
    </>
  );
}

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
      <Empty size="compact">
        <EmptyHeader>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>
            {"Notes, tasks, requests and links land here as they happen."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
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
              title={<Sentence entry={e} me={me} />}
              meta={
                showSubject ? <SubjectWords subject={e.subject} program={e.program} /> : undefined
              }
              time={feedStamp(e.at)}
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

/* --------------------------------------------------------------- Section */

type Filter = "all" | "comment" | "task" | "link" | "change";

/** Which filter an entry falls under: what people said, what was asked and done, what was linked, what moved. */
const filterOf = (kind: ActivityKind): Exclude<Filter, "all"> =>
  kind === "note" || kind === "comment"
    ? "comment"
    : kind === "task" || kind === "request" || kind === "done" || kind === "assign"
      ? "task"
      : kind === "link"
        ? "link"
        : "change";

const kindFilters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "comment", label: "Comments" },
  { value: "task", label: "Tasks" },
  { value: "link", label: "Evidence" },
  { value: "change", label: "Changes" },
];

/** The draft as a task: the first line is the title, the rest the note. */
function draftToTask(text: string): { title: string; note: string } {
  const [first = "", ...rest] = text.split("\n");
  const line = first.trim();
  return {
    title: line.length > 90 ? `${line.slice(0, 87)}…` : line,
    note: rest.join("\n").trim(),
  };
}

/**
 * A record's last section: the composer at the top, two ways in (a comment, or the draft as a task
 * for someone), then the feed. Evidence is linked where it lives and logged here. `limit` shows the
 * recent few with a way to the rest.
 */
export function RecordActivity({
  program,
  subject,
  me,
  limit,
  seeAll,
  wholeProgram = false,
  filters = false,
  title = "Activity",
}: {
  program: string;
  subject: Subject;
  me: string;
  limit?: number | undefined;
  /** A link to the full feed, shown when `limit` cuts it. */
  seeAll?: ReactElement;
  /** The program's whole log, every record, for its Activity tab. */
  wholeProgram?: boolean | undefined;
  /** A row of kind filters above the feed. */
  filters?: boolean | undefined;
  title?: string | undefined;
}) {
  useActivityVersion();
  const [kind, setKind] = useState<Filter>("all");
  const [draft, setDraft] = useState("");
  const [task, setTask] = useState<{ title: string; note: string } | null>(null);
  const mentionable = useMemo(() => mentionablePeople(program), [program]);
  const all = wholeProgram ? activityForProgram(program) : activityFor(subject, program);
  const filtered = kind === "all" ? all : all.filter((e) => filterOf(e.kind) === kind);
  const shown = limit ? filtered.slice(0, limit) : filtered;
  const counts = useMemo(() => {
    const c = new Map<Filter, number>();
    for (const e of all) {
      const k = filterOf(e.kind);
      c.set(k, (c.get(k) ?? 0) + 1);
    }
    return c;
  }, [all]);

  const comment = (text: string, mentions: string[]) => {
    record({
      program,
      actor: me,
      kind: "comment",
      summary: mentions.length ? `mentioned ${mentions.join(", ")}` : "commented",
      body: text,
      subject,
      mentions,
    });
  };

  return (
    <Section
      title={title}
      count={all.length || null}
      action={
        limit && filtered.length > limit && seeAll ? (
          <TextLink size="small" render={seeAll} />
        ) : undefined
      }
    >
      <Stack space="space.200" className="pt-100">
        <Activity.Composer
          actor={me}
          people={mentionable}
          value={draft}
          onValueChange={setDraft}
          onSubmit={comment}
          onTask={(text) => setTask(draftToTask(text))}
        />
        {filters ? (
          <ToggleGroup<Filter>
            aria-label="Kind"
            size="sm"
            value={[kind]}
            onValueChange={([next]) => {
              if (next !== undefined) setKind(next);
            }}
          >
            {kindFilters.map((f) => (
              <ToggleGroupItem key={f.value} value={f.value}>
                {f.label}
                <Count
                  value={f.value === "all" ? all.length : (counts.get(f.value) ?? 0)}
                  max={9999}
                />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}
        <ActivityFeed
          entries={shown}
          me={me}
          showSubject={
            wholeProgram || shown.some((e) => subjectKey(e.subject) !== subjectKey(subject))
          }
        />
      </Stack>
      <TaskDialog
        open={task !== null}
        onClose={() => setTask(null)}
        program={program}
        subject={subject}
        requester={me}
        defaultTitle={task?.title}
        defaultNote={task?.note}
        onCreated={() => setDraft("")}
      />
    </Section>
  );
}
