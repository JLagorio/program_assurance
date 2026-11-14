import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const {
  ACTIVITY_COLUMNS,
  activityEntries,
  changedFields,
  eventRecord,
  eventWords,
  recentActivityRead,
} = await import("./activity-entries");
type ActivityEvent = import("./activity-entries").ActivityEvent;

/** An event with nothing but what a case says. */
const event = (fields: Partial<ActivityEvent> & Pick<ActivityEvent, "id">): ActivityEvent => ({
  occurred_at: "2026-11-13T10:00:00Z",
  event_type: "updated",
  actor_party_id: "ada",
  program_id: "program",
  requirement_revision_id: null,
  description: null,
  changes: null,
  task_id: null,
  risk_id: null,
  issue_id: null,
  poam_item_id: null,
  assessment_campaign_id: null,
  package_id: null,
  evidence_artifact_id: null,
  ...fields,
});

describe("the feed's read", () => {
  it("names the columns an entry draws, newest first, never every column", () => {
    expect(recentActivityRead.columns).toEqual(ACTIVITY_COLUMNS);
    expect(recentActivityRead.columns).not.toContain("tenant_id");
    expect(recentActivityRead.order).toEqual([{ column: "occurred_at", ascending: false }]);
  });
});

describe("eventWords", () => {
  it("takes a recorded verb phrase as the deed, and the lines after it as what was said", () => {
    expect(
      eventWords(event({ id: "1", description: "added a note\nTwo enforcement points sampled." })),
    ).toEqual({ deed: "added a note", said: "Two enforcement points sampled." });
    expect(eventWords(event({ id: "2", description: "accepted the risk" }))).toEqual({
      deed: "accepted the risk",
      said: undefined,
    });
  });

  it("says which record an update changed, and what changed in it, where the event records it", () => {
    expect(
      eventWords(
        event({
          id: "3",
          event_type: "updated",
          description: "X800-C-CUSB: took version 2 of X800 Missile.",
        }),
      ),
    ).toEqual({ deed: "updated X800-C-CUSB", said: "Took version 2 of X800 Missile." });
  });

  it("names the kind of record a bare event names, never the bare kind alone", () => {
    expect(eventWords(event({ id: "4", event_type: "updated", task_id: "task" }))).toEqual({
      deed: "updated a task",
      said: undefined,
    });
    expect(
      eventWords(
        event({
          id: "5",
          event_type: "updated",
          issue_id: "issue",
          description: "Severity raised.",
        }),
      ),
    ).toEqual({ deed: "updated an operational issue", said: "Severity raised." });
    // An event that names no record says its kind, as the event records nothing more.
    expect(eventWords(event({ id: "6", event_type: "completed" }))).toEqual({
      deed: "completed",
      said: undefined,
    });
  });
});

describe("activityEntries", () => {
  const requirement = { id: "req", code: "REQ-001", programId: "program" };
  const requirementOf = (revision: string) =>
    revision.startsWith("rev") ? requirement : undefined;

  it("joins consecutive edits of one requirement by one person, newest first", () => {
    const entries = activityEntries(
      [
        event({ id: "a", occurred_at: "2026-11-13T09:00:00Z", requirement_revision_id: "rev-1" }),
        event({ id: "b", occurred_at: "2026-11-13T11:00:00Z", requirement_revision_id: "rev-2" }),
        event({ id: "c", occurred_at: "2026-11-13T10:00:00Z", task_id: "task" }),
        event({ id: "d", occurred_at: "2026-11-13T12:00:00Z", requirement_revision_id: "rev-3" }),
      ],
      requirementOf,
    );
    expect(entries.map((entry) => entry.events.map((e) => e.id))).toEqual([
      ["d", "b"],
      ["c"],
      ["a"],
    ]);
    expect(entries[0]!.requirement).toEqual(requirement);
    expect(entries[1]!.requirement).toBeNull();
  });

  it("keeps a requirement's creation as its own entry, and another person's edit apart", () => {
    const entries = activityEntries(
      [
        event({
          id: "a",
          occurred_at: "2026-11-13T09:00:00Z",
          requirement_revision_id: "rev-1",
          event_type: "created",
        }),
        event({ id: "b", occurred_at: "2026-11-13T10:00:00Z", requirement_revision_id: "rev-1" }),
        event({
          id: "c",
          occurred_at: "2026-11-13T11:00:00Z",
          requirement_revision_id: "rev-2",
          actor_party_id: "grace",
        }),
      ],
      requirementOf,
    );
    expect(entries.map((entry) => entry.events.map((e) => e.id))).toEqual([["c"], ["b"], ["a"]]);
  });

  it("stops at the entries asked for", () => {
    const events = Array.from({ length: 12 }, (_, i) =>
      event({
        id: String(i),
        occurred_at: `2026-11-13T${String(10 + i).padStart(2, "0")}:00:00Z`,
        task_id: "task",
      }),
    );
    expect(activityEntries(events, requirementOf, 8)).toHaveLength(8);
    expect(activityEntries(events, requirementOf, 8)[0]!.events[0]!.id).toBe("11");
  });
});

describe("eventRecord and changedFields", () => {
  it("names the record an event names, in the order its columns are read", () => {
    expect(eventRecord({ risk_id: "risk", task_id: null })).toEqual({ table: "risks", id: "risk" });
    expect(eventRecord({})).toBeNull();
  });

  it("names the fields an edit changed in the reader's words", () => {
    expect(
      changedFields({
        changes: {
          title: { before: "A", after: "B" },
          statement: { before: "Same", after: "Same" },
          ownerPartyId: { before: null, after: "ada" },
        },
      }),
    ).toEqual(["title", "owner"]);
    expect(changedFields({ changes: null })).toEqual([]);
  });
});
