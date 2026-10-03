import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Section, Timeline, useLedgerLocale } from "@ledger/design-system";
import { useRows, type Row, type TableName } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { programRequirementScope } from "@/lib/requirement-reads";
import { recordDestination } from "./record-preview";
import { EmptyMessage, QueryState } from "./work-common";

/** An entry: one event, or consecutive edits of one requirement by one person. */
type ActivityEntry = {
  events: Row<"activity_events">[];
  actor: string | null;
  requirement: { id: string; code: string } | null;
};

/** The record an event names, when it has a page of its own. */
function eventRecord(event: Row<"activity_events">): { table: TableName; id: string } | null {
  const targets: [TableName, string | null][] = [
    ["tasks", event.task_id],
    ["risks", event.risk_id],
    ["operational_issues", event.issue_id],
    ["poam_items", event.poam_item_id],
    ["assessment_campaigns", event.assessment_campaign_id],
    ["authorization_packages", event.package_id],
    ["evidence_artifacts", event.evidence_artifact_id],
  ];
  const found = targets.find(([, id]) => !!id);
  return found ? { table: found[0], id: found[1]! } : null;
}

/** A requirement edit's changed fields, in the reader's words. */
const changeLabels: Record<string, string> = {
  title: "title",
  statement: "statement",
  acceptanceCriteria: "acceptance criteria",
  rationale: "rationale",
  requirementType: "requirement type",
  ownerPartyId: "owner",
};
function changedFields(event: Row<"activity_events">) {
  const changes = event.changes;
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return [];
  return Object.entries(changes)
    .filter(([, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      const change = value as Record<string, unknown>;
      return change["before"] !== change["after"];
    })
    .map(([field]) => changeLabels[field] ?? labelFor(field).toLowerCase());
}

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
    { order: { column: "occurred_at", ascending: false } },
  );
  const parties = useRows("parties", undefined, { columns: ["id", "name"] as const });
  const requirements = useRows(
    "engineering_requirements",
    { program_id: programId },
    { columns: ["id", "code"] as const },
  );
  // Which requirement each revision belongs to, so a revision's edits name their requirement.
  const revisions = useRows(
    "requirement_revisions",
    programRequirementScope(programId, "requirement_revisions"),
    { columns: ["id", "engineering_requirement_id"] as const },
  );
  const partyName = useMemo(
    () => new Map((parties.data ?? []).map((row) => [row.id, row.name])),
    [parties.data],
  );
  const entries = useMemo(() => {
    const requirementOf = new Map(
      (revisions.data ?? []).map((row) => [row.id, row.engineering_requirement_id]),
    );
    const requirementById = new Map((requirements.data ?? []).map((row) => [row.id, row]));
    const list: ActivityEntry[] = [];
    const events = (activity.data ?? [])
      .slice()
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
    for (const event of events) {
      const requirementId = event.requirement_revision_id
        ? requirementOf.get(event.requirement_revision_id)
        : undefined;
      const record = requirementId ? requirementById.get(requirementId) : undefined;
      const requirement = record ? { id: record.id, code: record.code } : null;
      const previous = list.at(-1);
      if (
        requirement &&
        previous?.requirement?.id === requirement.id &&
        previous.actor === event.actor_party_id
      )
        previous.events.push(event);
      else list.push({ events: [event], actor: event.actor_party_id, requirement });
    }
    return list;
  }, [activity.data, revisions.data, requirements.data]);

  const formatList = (items: string[]) =>
    new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(items);
  /** An entry as the record reads it: who did what, and to which record. */
  const entryItem = (entry: ActivityEntry) => {
    const [latest] = entry.events as [Row<"activity_events">];
    const actor = entry.actor ? partyName.get(entry.actor) : undefined;
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
        link: (
          <Link
            {...recordDestination("engineering_requirements", {
              id: entry.requirement.id,
              program_id: programId,
            })}
          />
        ),
      };
    }
    // A recorded verb phrase ("assigned …") reads after the person who did it; any other text is
    // what was said, under the kind of event, so the title still says who did what.
    const [first = "", ...rest] = (latest.description ?? "").split("\n");
    const phrase = /^[a-z]/.test(first.trim());
    const deed = phrase ? first.trim() : labelFor(latest.event_type).toLowerCase();
    const said = (phrase ? rest : [first, ...rest]).join(" ").trim();
    const record = eventRecord(latest);
    return {
      // A person the event does not record, or one the roster does not name, is "Someone".
      title: `${actor ?? "Someone"} ${deed}`,
      description: said || undefined,
      link: record ? (
        <Link {...recordDestination(record.table, { id: record.id, program_id: programId })} />
      ) : undefined,
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
