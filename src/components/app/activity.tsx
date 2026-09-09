import {
  avatarHue,
  AvatarFallback,
  avatarInitials,
  Box,
  Avatar,
  toneClasses,
  type Tone,
  Button,
  Composer,
  Id,
  Kbd,
  Timeline,
  type TimelineGroupProps,
  cn,
} from "@ledger/design-system";
import {
  ArrowRightLeft,
  CircleCheck,
  FileText,
  Link2,
  ListChecks,
  MessageSquare,
  Milestone,
  Plus,
  Send,
  UserRound,
} from "lucide-react";
import { cloneElement, useState, type ReactElement, type ReactNode } from "react";
import { mentionPattern, parseMentions } from "@/lib/mentions";

/* Everything that happened to a record, in one feed, and the way to add to it. The work happens
   outside the platform and comes back in through one box at the top: a comment, or the same draft
   as a task for someone. What the system did (a field changed, a stage moved, a task closed) and
   what other pages did (evidence linked on the control) sit in the same feed with an icon in place
   of a face. One feed, filtered by record, by person or by program; the record's page shows its own
   slice.

   A row reads like a line of talk: the face, then who did what with the names and the things in
   weight and the verbs quiet, the when at the far right, and what they said in a card. The kind is
   in the verb, not in a label. */

export type ActivityKind =
  | "note"
  | "comment"
  | "task"
  | "request"
  | "link"
  | "change"
  | "stage"
  | "assign"
  | "done"
  | "created";

type KindIcon = ReactElement<{
  className?: string | undefined;
  "aria-hidden"?: boolean | undefined;
}>;

const kinds: Record<ActivityKind, { icon: KindIcon; tone: Tone }> = {
  note: { icon: <FileText />, tone: "neutral" },
  comment: { icon: <MessageSquare />, tone: "neutral" },
  task: { icon: <ListChecks />, tone: "information" },
  request: { icon: <Send />, tone: "information" },
  link: { icon: <Link2 />, tone: "neutral" },
  change: { icon: <ArrowRightLeft />, tone: "neutral" },
  stage: { icon: <Milestone />, tone: "information" },
  assign: { icon: <UserRound />, tone: "neutral" },
  done: { icon: <CircleCheck />, tone: "success" },
  created: { icon: <Plus />, tone: "neutral" },
};

/* -------------------------------------------------------------- Sentence */

const strongClass = "font-medium text-default";

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Quoted titles, ids like EVD-0412 or AC-6(9), and the given phrases, longest first. */
function sentencePattern(strong: readonly string[]): RegExp {
  const phrases = [...new Set(strong.filter(Boolean))]
    .sort((a, b) => b.length - a.length)
    .map(escapeRe);
  const parts = ['"([^"]+)"'];
  if (phrases.length) parts.push(`(?<![A-Za-z0-9])(?:${phrases.join("|")})(?![A-Za-z0-9])`);
  parts.push("\\b[A-Z]{2,5}-\\d[\\w().]*");
  return new RegExp(parts.join("|"), "g");
}

export type ActivitySentenceProps = {
  /** The sentence after the name, as the log wrote it: `asked Joel Barrantes for the account review procedure`, `linked EVD-0412 Account review, Q3`, `closed "Write the statement"`. */
  children: string;
  /** Phrases to set in weight besides the quoted titles and the ids: the people's names, the record the event touches. */
  strong?: readonly string[] | undefined;
  /** The reader's name: where it appears, the sentence says "you". */
  me?: string | undefined;
};

/** Who did what, with the things in weight and the verbs quiet: a quoted title, an id, a name or a given phrase reads in medium weight, the rest of the words in the subtle colour. */
function ActivitySentence({ children, strong = [], me }: ActivitySentenceProps) {
  const parts: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of children.matchAll(sentencePattern(strong))) {
    const start = m.index ?? 0;
    if (start > last) parts.push(children.slice(last, start));
    const text = m[1] ?? m[0];
    const id = m[1] === undefined && /^[A-Z]{2,5}-\d/.test(text);
    parts.push(
      id ? (
        <Id key={i++} className={strongClass}>
          {text}
        </Id>
      ) : (
        <Box as="span" key={i++} className={strongClass}>
          {me && text === me ? "you" : text}
        </Box>
      ),
    );
    last = start + m[0].length;
  }
  if (last < children.length) parts.push(children.slice(last));
  return <>{parts}</>;
}

/* --------------------------------------------------------------- Mentions */

export type ActivityMentionProps = {
  /** The person's full name. */
  name: string;
  /** Makes the mention a button: open the person, filter the feed to them. */
  onSelect?: (() => void) | undefined;
  className?: string | undefined;
};

/** A name called out in a body: `@Name`, tinted, one line. */
function ActivityMention({ name, onSelect, className }: ActivityMentionProps) {
  const classes = cn(
    "inline rounded-small px-025 font-medium",
    toneClasses.information.subtle,
    onSelect && "hover:underline",
    className,
  );
  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className={classes}>
        @{name}
      </button>
    );
  }
  return (
    <Box as="span" className={classes}>
      @{name}
    </Box>
  );
}

export type ActivityTextProps = {
  /** The body as written, mentions as `@[Full Name]`. Line breaks are kept. */
  children: string;
  /** Draws a mention; unsaid, an Activity.Mention. */
  mention?: ((name: string) => ReactNode) | undefined;
  className?: string | undefined;
};

/** What was said, in a card under the sentence: the mentions drawn, the rest as written, wrapping, line breaks kept. */
function ActivityText({ children, mention, className }: ActivityTextProps) {
  const parts: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of children.matchAll(mentionPattern)) {
    const start = m.index ?? 0;
    if (start > last) parts.push(children.slice(last, start));
    const name = m[1]!.trim();
    parts.push(
      <Box as="span" key={`m-${i++}`}>
        {mention ? mention(name) : <ActivityMention name={name} />}
      </Box>,
    );
    last = start + m[0].length;
  }
  if (last < children.length) parts.push(children.slice(last));
  return (
    <p
      className={cn(
        "max-w-layout-measure whitespace-pre-wrap rounded-large bg-neutral px-150 py-100 font-body text-default",
        className,
      )}
    >
      {parts}
    </p>
  );
}

/* ------------------------------------------------------------------- Feed */

export type ActivityProps = {
  /** The feed's accessible name: "Activity". */
  label?: string | undefined;
  /** Activity.Item rows, or Activity.Group sections of them, newest first. */
  children: ReactNode;
  className?: string | undefined;
};

/** The feed: events down one rail, newest first, each a face or an icon, a sentence that wraps with the time at the far right of its row, and what was said in a card under it. */
function ActivityRoot({ label = "Activity", children, className }: ActivityProps) {
  return (
    <Timeline label={label} size="large" timePosition="end" wrap className={className}>
      {children}
    </Timeline>
  );
}

export type ActivityGroupProps = TimelineGroupProps;

/** A run of events under one sticky label: "Today", "Last week", "August". */
function ActivityGroup(props: ActivityGroupProps) {
  return <Timeline.Group {...props} />;
}

export type ActivityItemProps = {
  /** Who did it, by full name. The marker is their Avatar, bold, and the name leads the sentence. Unsaid, the system did it: the marker is the kind's icon. */
  actor?: string | undefined;
  /** What kind of event: the icon and its tone when there is no actor. */
  kind?: ActivityKind | undefined;
  /** The sentence after the name, in the past tense, quiet: an Activity.Sentence sets its names and things in weight; a Badge may end it with the new state. */
  title: ReactNode;
  /** Where it happened, when the feed spans records: the record's id and name, on the line under the sentence. */
  meta?: ReactNode;
  /** When, at the far right of the row: "2h ago" today, the clock for yesterday, the day and the clock before that. */
  time?: ReactNode;
  /** The full stamp as the time's tooltip: "2026-09-02 14:10". */
  timeTitle?: string | undefined;
  /** The machine-readable stamp, which makes the time a `<time>` element. */
  dateTime?: string | undefined;
  /** It mentions the reader, or is unread: the title reads in weight 500. */
  emphasis?: boolean | undefined;
  /** A link element (a router's Link) that becomes the sentence and stretches over the row. */
  link?:
    | ReactElement<{
        id?: string | undefined;
        className?: string | undefined;
        children?: ReactNode;
      }>
    | undefined;
  /** Makes the sentence a button that stretches over the row. */
  onSelect?: (() => void) | undefined;
  /** The body: an Activity.Text, an attachment row, a field's before and after. */
  children?: ReactNode;
  /** The last line: Badges, or the actions on the event (Reply, Open the task). */
  footer?: ReactNode;
};

/** One event on the rail. A person's event carries their face; the system's carries its kind's icon. */
function ActivityItem({
  actor,
  kind,
  title,
  meta,
  time,
  timeTitle,
  dateTime,
  emphasis,
  link,
  onSelect,
  children,
  footer,
}: ActivityItemProps) {
  const k = kind ? kinds[kind] : null;
  return (
    <Timeline.Item
      marker={
        actor ? (
          <Avatar
            size="small"
            variant="bold"
            aria-hidden="true"
            hue={avatarHue(actor)}
            title={actor}
          >
            <AvatarFallback>{avatarInitials(actor, 2)}</AvatarFallback>
          </Avatar>
        ) : undefined
      }
      icon={!actor && k ? cloneElement(k.icon, { "aria-hidden": true }) : undefined}
      tone={!actor && k ? k.tone : "neutral"}
      title={
        <>
          {actor ? (
            <Box as="span" className={strongClass}>
              {actor}{" "}
            </Box>
          ) : null}
          <Box as="span" className="text-subtle">
            {title}
          </Box>
        </>
      }
      meta={meta}
      time={time}
      timeTitle={timeTitle}
      dateTime={dateTime}
      emphasis={emphasis}
      link={link}
      onSelect={onSelect}
      footer={footer}
    >
      {children}
    </Timeline.Item>
  );
}

/* --------------------------------------------------------------- Composer */

export type ActivityPerson = {
  /** The full name, as it is written in a mention. */
  name: string;
  /** A word after the name in the menu: the role, the team. */
  meta?: string | undefined;
};

export type ActivityComposerProps = {
  /** Who can be mentioned. Typing `@` opens the list, filtered as the reader types; Enter or Tab writes `@[Full Name]`. */
  people?: ActivityPerson[] | undefined;
  /** Called with the body and mentioned names. Successful submission clears the draft; rejection preserves it. */
  onSubmit: (text: string, mentions: string[]) => void | Promise<void>;
  /** The other way in: a Task button beside Comment that hands the draft over. The caller opens its task dialog with the first line as the title, and clears `value` once the task is made. */
  onTask?: ((text: string, mentions: string[]) => void) | undefined;
  /** Shown while a Cancel is wanted: the composer was opened for one reply. */
  onCancel?: (() => void) | undefined;
  /** What the field says while empty: "Leave a comment". */
  placeholder?: string | undefined;
  /** The field's accessible name. Unsaid, the placeholder. */
  label?: string | undefined;
  /** The verb on the button: "Post", "Log", "Send". */
  submitLabel?: string | undefined;
  /** The author, whose Avatar sits beside the field. */
  actor?: string | undefined;
  /** The text to start with, when the draft is the composer's own. */
  defaultValue?: string | undefined;
  /** The draft, when the caller keeps it: to clear it once the task is made. */
  value?: string | undefined;
  onValueChange?: ((next: string) => void) | undefined;
  /** Focus the field on mount: it was opened for one reply. */
  autoFocus?: boolean | undefined;
  /** Fields above the body: a "To" for a request. */
  children?: ReactNode;
  className?: string | undefined;
};

type Menu = { start: number; query: string };

function detectMention(text: string, caret: number): Menu | null {
  const before = text.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  if (at > 0 && !/\s/.test(before[at - 1]!)) return null;
  const query = before.slice(at + 1);
  if (/[\]\n]/.test(query) || query.length > 40) return null;
  return { start: at, query };
}

/** The box at the top of the feed: a comment with `@` completion over `people`, ⌘↵ or the button to post; with `onTask`, the draft as a task instead. */
function ActivityComposer({
  people = [],
  onSubmit,
  onTask,
  onCancel,
  placeholder = "Leave a comment",
  label,
  submitLabel = "Comment",
  actor,
  defaultValue = "",
  value,
  onValueChange,
  autoFocus,
  children,
  className,
}: ActivityComposerProps) {
  const [own, setOwn] = useState(defaultValue);
  const text = value ?? own;
  const change = (next: string) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };
  return (
    <Composer
      label={label ?? placeholder}
      placeholder={placeholder}
      submitLabel={submitLabel}
      onSubmit={(body) => onSubmit(body, parseMentions(body))}
      onCancel={onCancel}
      actions={
        onTask ? (
          <Button
            size="small"
            variant="secondary"
            iconBefore={<ListChecks />}
            onClick={() => onTask(text.trim(), parseMentions(text))}
          >
            Task
          </Button>
        ) : undefined
      }
      leading={
        actor ? (
          <Avatar
            size="small"
            variant="bold"
            aria-hidden="true"
            hue={avatarHue(actor)}
            title={actor}
          >
            <AvatarFallback>{avatarInitials(actor, 2)}</AvatarFallback>
          </Avatar>
        ) : undefined
      }
      value={text}
      onValueChange={change}
      autoFocus={autoFocus}
      className={className}
      suggestionsLabel="People"
      getSuggestions={(text, caret) => {
        const menu = detectMention(text, caret);
        if (!menu) return null;
        return {
          start: menu.start,
          end: caret,
          items: people
            .filter((person) => person.name.toLowerCase().includes(menu.query.toLowerCase()))
            .slice(0, 6)
            .map((person) => ({
              id: person.name,
              label: person.name,
              insertText: `@[${person.name}] `,
              leading: (
                <Avatar
                  size="xsmall"
                  aria-hidden="true"
                  hue={avatarHue(person.name)}
                  title={person.name}
                >
                  <AvatarFallback>{avatarInitials(person.name, 1)}</AvatarFallback>
                </Avatar>
              ),
              description: person.meta,
            })),
        };
      }}
      hint={
        <Box as="span" className="flex items-center gap-075">
          {people.length ? <Box as="span">@ mentions</Box> : null}
          <Box as="span" className="flex items-center gap-050">
            <Kbd>⌘↵</Kbd> posts
          </Box>
        </Box>
      }
    >
      {children}
    </Composer>
  );
}

export const Activity = Object.assign(ActivityRoot, {
  Item: ActivityItem,
  Group: ActivityGroup,
  Sentence: ActivitySentence,
  Text: ActivityText,
  Mention: ActivityMention,
  Composer: ActivityComposer,
});
