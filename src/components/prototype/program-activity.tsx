import { useMemo } from "react";
import { Section, Timeline, useLedgerLocale } from "@ledger/design-system";
import {
  ACTIVITY_COLUMNS,
  activityEntries,
  changedFields,
  eventRecord,
  eventWords,
  type ActivityEntry,
  type ActivityEvent,
} from "@/lib/activity-entries";
import { useRows } from "@/lib/models";
import { recordLink } from "./record-preview";
import { EmptyMessage, QueryState } from "./work-common";

/**
 * The program's activity, the last section of its Overview: a Timeline, newest first, grouped by
 * month with each month's count. Each entry says who did what, links to the record it names when
 * that record has a page, and shows its day and minute in the reader's zone, the full moment as its
 * tooltip. Consecutive edits of one requirement by one person are one entry that says what changed
 * and in how many edits.
 */
export function ProgramActivity({ programId }: { programId: string }) {
  const { locale, formatDate, formatPlural } = useLedgerLocale();
  const activity = useRows(
    "activity_events",
    { program_id: programId },
    { columns: ACTIVITY_COLUMNS, order: { column: "occurred_at", ascending: false } },
  );
  const parties = useRows("parties", undefined, { columns: ["id", "name"] as const });
  // Which requirement each edited revision belongs to, so a revision's edits name their
  // requirement: the revisions the events name, then their requirements.
  const revisionIds = useMemo(
    () => [...new Set((activity.data ?? []).flatMap((e) => e.requirement_revision_id ?? []))],
    [activity.data],
  );
  const revisions = useRows(
    "requirement_revisions",
    { id: revisionIds },
    {
      columns: ["id", "engineering_requirement_id"] as const,
      enabled: activity.data !== undefined,
    },
  );
  const requirementIds = useMemo(
    () => [...new Set((revisions.data ?? []).map((row) => row.engineering_requirement_id))],
    [revisions.data],
  );
  const requirements = useRows(
    "engineering_requirements",
    { id: requirementIds },
    { columns: ["id", "code"] as const, enabled: revisions.data !== undefined },
  );
  const partyName = useMemo(
    () => new Map((parties.data ?? []).map((row) => [row.id, row.name])),
    [parties.data],
  );
  // A requirement's creation is its own entry; consecutive edits of it by one person share one.
  const entries = useMemo(() => {
    const requirementOf = new Map(
      (revisions.data ?? []).map((row) => [row.id, row.engineering_requirement_id]),
    );
    const requirementById = new Map((requirements.data ?? []).map((row) => [row.id, row]));
    return activityEntries(activity.data ?? [], (revisionId) => {
      const record = requirementById.get(requirementOf.get(revisionId) ?? "");
      return record ? { id: record.id, code: record.code, programId } : undefined;
    });
  }, [activity.data, revisions.data, requirements.data, programId]);

  const formatList = (items: string[]) =>
    new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(items);
  /** An entry as the record reads it: who did what, and to which record. */
  const entryItem = (entry: ActivityEntry) => {
    const [latest] = entry.events as [ActivityEvent];
    const actor = entry.actor ? partyName.get(entry.actor) : undefined;
    if (entry.requirement && latest.event_type === "created")
      return {
        title: `${actor ?? "Someone"} created ${entry.requirement.code}`,
        link: recordLink("engineering_requirements", {
          id: entry.requirement.id,
          program_id: programId,
        }),
      };
    if (entry.requirement) {
      const fields = [...new Set(entry.events.flatMap(changedFields))];
      const edits = formatPlural(entry.events.length, {
        one: "{count} edit",
        other: "{count} edits",
      });
      return {
        title: `${actor ?? "Someone"} edited ${entry.requirement.code}`,
        description: fields.length
          ? `Changed the ${formatList(fields)} in ${edits}.`
          : entry.events.length > 1
            ? `Saved ${edits} as draft revisions.`
            : "Saved a draft revision.",
        link: recordLink("engineering_requirements", {
          id: entry.requirement.id,
          program_id: programId,
        }),
      };
    }
    // What the person did, and what was said (activity-entries).
    const { deed, said } = eventWords(latest);
    const record = eventRecord(latest);
    return {
      // A person the event does not record, or one the roster does not name, is "Someone".
      title: `${actor ?? "Someone"} ${deed}`,
      description: said,
      // The record it names, where that record has a page.
      link: record ? recordLink(record.table, { id: record.id, program_id: programId }) : undefined,
    };
  };
  /** The day and the minute in the reader's zone; the full moment is the tooltip. */
  const eventTime = (value: string) => {
    const instant = new Date(value);
    return {
      time: formatDate(instant, { dateStyle: "medium", timeStyle: "short" }),
      timeTitle: formatDate(instant, { dateStyle: "full", timeStyle: "long" }),
      dateTime: value,
    };
  };
  /** The entries by the month of their newest event, in the reader's zone, newest month first. */
  const months: { label: string; entries: ActivityEntry[] }[] = [];
  for (const entry of entries) {
    const label = formatDate(new Date(entry.events[0]!.occurred_at), {
      month: "long",
      year: "numeric",
    });
    const month = months.at(-1);
    if (month?.label === label) month.entries.push(entry);
    else months.push({ label, entries: [entry] });
  }

  return (
    <Section title="Activity">
      {/* A failed refresh keeps the entries the reader has, under one alert; a missing name reads
          as "Someone", never as an id. */}
      <QueryState
        queries={[activity, parties, requirements, revisions]}
        retryLabel="Retry loading activity"
      >
        {entries.length ? (
          <Timeline label="Program activity" size="small" wrap>
            {months.map((month) => (
              <Timeline.Group key={month.label} label={month.label} count={month.entries.length}>
                {month.entries.map((entry) => {
                  const item = entryItem(entry);
                  const newest = entry.events[0]!;
                  return (
                    <Timeline.Item
                      key={newest.id}
                      title={item.title}
                      {...(item.description ? { description: item.description } : {})}
                      {...(item.link ? { link: item.link } : {})}
                      {...eventTime(newest.occurred_at)}
                    />
                  );
                })}
              </Timeline.Group>
            ))}
          </Timeline>
        ) : (
          <EmptyMessage
            compact
            title="No activity yet"
            description="Changes to this program's records appear here as the team works."
          />
        )}
      </QueryState>
    </Section>
  );
}
