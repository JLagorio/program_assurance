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
import { cloneElement, type ReactElement, type ReactNode } from "react";

import {
  Box,
  Avatar,
  toneClasses,
  type Tone,
  Button,
  Composer,
  Kbd,
  Timeline,
  type TimelineGroupProps,
  cn,
} from "@ledger/design-system";
import { mentionPattern, parseMentions } from "@/lib/mentions";

/* Everything that happened to a record, in one feed, and the way to add to it. The work happens
   outside the platform and comes back in through the log bar: a note, a task, a request to someone,
   a link to what came back. What the system did (a field changed, a stage moved, a task closed) sits
   in the same feed with an icon in place of a face. One feed, filtered by record, by person or by
   program; the record's page shows its own slice. */

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

const kinds: Record<ActivityKind, { icon: KindIcon; tone: Tone; word: string }> = {
  note: { icon: <FileText />, tone: "neutral", word: "Note" },
  comment: { icon: <MessageSquare />, tone: "neutral", word: "Comment" },
  task: { icon: <ListChecks />, tone: "information", word: "Task" },
  request: { icon: <Send />, tone: "information", word: "Request" },
  link: { icon: <Link2 />, tone: "neutral", word: "Linked" },
  change: { icon: <ArrowRightLeft />, tone: "neutral", word: "Changed" },
  stage: { icon: <Milestone />, tone: "information", word: "Stage" },
  assign: { icon: <UserRound />, tone: "neutral", word: "Assigned" },
  done: { icon: <CircleCheck />, tone: "success", word: "Done" },
  created: { icon: <Plus />, tone: "neutral", word: "Created" },
};

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

/** A body with its mentions drawn: the rest of the text as written, wrapping, line breaks kept. */
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
    <p className={cn("max-w-layout-measure whitespace-pre-wrap font-body text-default", className)}>
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

/** The feed: events down one rail, newest first, each a face or an icon, a sentence, a time, and the body under it. */
function ActivityRoot({ label = "Activity", children, className }: ActivityProps) {
  return (
    <Timeline label={label} size="large" timePosition="end" className={className}>
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
  /** Who did it, by full name. The marker is their Avatar and the name leads the sentence. Unsaid, the system did it: the marker is the kind's icon. */
  actor?: string | undefined;
  /** What kind of event: the icon and its tone when there is no actor, and the word in the meta line. */
  kind?: ActivityKind | undefined;
  /** The sentence after the name, in the past tense: "asked Joel Barrantes for the account review procedure", "linked EVD-0412". */
  title: ReactNode;
  /** Where it happened, when the feed spans records: the record's id and name. */
  meta?: ReactNode;
  /** When, as the reader would say it: "2h ago", "28 Aug". */
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
  const metaLine =
    k || meta ? (
      <Box as="span" className="flex min-w-0 items-center gap-075">
        {k ? (
          <Box as="span" className="flex items-center gap-050">
            {cloneElement(k.icon, { className: "size-150 shrink-0", "aria-hidden": true })}
            {k.word}
          </Box>
        ) : null}
        {k && meta ? (
          <Box as="span" aria-hidden>
            ·
          </Box>
        ) : null}
        {meta ? (
          <Box as="span" className="min-w-0 truncate">
            {meta}
          </Box>
        ) : null}
      </Box>
    ) : undefined;
  return (
    <Timeline.Item
      marker={actor ? <Avatar name={actor} size="small" isDecorative /> : undefined}
      icon={!actor && k ? k.icon : undefined}
      tone={!actor && k ? k.tone : "neutral"}
      title={
        actor ? (
          <>
            <Box as="span" className="font-medium text-default">
              {actor}
            </Box>{" "}
            {title}
          </>
        ) : (
          title
        )
      }
      meta={metaLine}
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
  /** Shown while a Cancel is wanted: the composer was opened by the log bar. */
  onCancel?: (() => void) | undefined;
  /** What the field says while empty: "Add a note", "What did they say?". */
  placeholder?: string | undefined;
  /** The field's accessible name. Unsaid, the placeholder. */
  label?: string | undefined;
  /** The verb on the button: "Post", "Log", "Send". */
  submitLabel?: string | undefined;
  /** The author, whose Avatar sits beside the field. */
  actor?: string | undefined;
  /** The text to start with. */
  defaultValue?: string | undefined;
  /** Focus the field on mount: the log bar opened it. */
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

/** The box that adds to the feed: a body with `@` completion over `people`, ⌘↵ or the button to post. */
function ActivityComposer({
  people = [],
  onSubmit,
  onCancel,
  placeholder = "Add a note",
  label,
  submitLabel = "Post",
  actor,
  defaultValue = "",
  autoFocus,
  children,
  className,
}: ActivityComposerProps) {
  return (
    <Composer
      label={label ?? placeholder}
      placeholder={placeholder}
      submitLabel={submitLabel}
      onSubmit={(text) => onSubmit(text, parseMentions(text))}
      onCancel={onCancel}
      leading={actor ? <Avatar name={actor} size="small" isDecorative /> : undefined}
      defaultValue={defaultValue}
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
              leading: <Avatar name={person.name} size="xsmall" isDecorative />,
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

/* ---------------------------------------------------------------- Log bar */

export type ActivityLogItem = {
  /** What the button reports. */
  value: string;
  /** The verb or the noun on it: "Note", "Task", "Request", "Evidence". */
  label: string;
  /** Before the label, bare. */
  icon?: ReactElement | undefined;
};

export type ActivityLogBarProps = {
  /** The ways to add to the feed, in order. Four at most. */
  items: ActivityLogItem[];
  /** The one that is open, pressed. */
  value?: string | null | undefined;
  /** Called with the item's value. The caller opens its composer or its dialog. */
  onSelect: (value: string) => void;
  /** The bar's accessible name: "Log". */
  label?: string | undefined;
  className?: string | undefined;
};

/** The row of ways to add to the feed: what happened outside comes back in through one of these. */
function ActivityLogBar({ items, value, onSelect, label = "Log", className }: ActivityLogBarProps) {
  return (
    <Box
      role="group"
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-100", className)}
    >
      {items.map((item) => (
        <Button
          key={item.value}
          size="small"
          variant="secondary"
          iconBefore={item.icon}
          isSelected={value === item.value}
          aria-pressed={value === item.value}
          onClick={() => onSelect(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </Box>
  );
}

export const Activity = Object.assign(ActivityRoot, {
  Item: ActivityItem,
  Group: ActivityGroup,
  Text: ActivityText,
  Mention: ActivityMention,
  Composer: ActivityComposer,
  LogBar: ActivityLogBar,
});
