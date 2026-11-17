import { describe, expect, it } from "vitest";
import {
  authorizationSchedule,
  gateState,
  type ScheduleDecision,
  type ScheduleGate,
  type ScheduleReview,
  type ScheduleVersion,
} from "./authorization-schedule";

const today = "2026-11-16";
const dayOf = (moment: string) => moment.slice(0, 10);
const pkg = { id: "p1", title: "WS-X90 authorization package", system_id: "s1" };
const version = (values: Partial<ScheduleVersion>): ScheduleVersion => ({
  id: "v1",
  package_id: "p1",
  version_number: 1,
  state: "published",
  submitted_at: null,
  published_at: null,
  ...values,
});
const decision = (values: Partial<ScheduleDecision>): ScheduleDecision => ({
  id: "d1",
  package_revision_id: "v1",
  decision: "authorized_with_conditions",
  decided_at: "2026-09-18T19:00:00Z",
  expires_on: null,
  decision_maker_party_id: "ao",
  ...values,
});
const review = (values: Partial<ScheduleReview>): ScheduleReview => ({
  id: "r1",
  package_revision_id: "v1",
  decision: "accepted",
  decided_at: "2026-09-05T15:00:00Z",
  reviewer_party_id: "assessor",
  ...values,
});
const gate = (values: Partial<ScheduleGate>): ScheduleGate => ({
  id: "g1",
  title: "PDR",
  status: "not_started",
  due_on: null,
  decided_at: null,
  sequence_number: null,
  ...values,
});
const schedule = (
  values: Partial<Omit<Parameters<typeof authorizationSchedule>[0], "today" | "dayOf">>,
) =>
  authorizationSchedule({
    packages: [pkg],
    versions: [],
    decisions: [],
    reviews: [],
    gates: [],
    today,
    dayOf,
    ...values,
  });
const keys = (result: ReturnType<typeof schedule>) => result.stops.map((stop) => stop.key);

describe("authorization schedule", () => {
  it("puts both lanes on one time axis, in date order, with no date last", () => {
    const result = schedule({
      versions: [
        version({ submitted_at: "2026-08-29T15:00:00Z", published_at: "2026-09-02T15:00:00Z" }),
        version({ id: "v2", version_number: 2, state: "draft" }),
      ],
      reviews: [review({})],
      decisions: [decision({ expires_on: "2029-09-17" })],
      gates: [
        gate({ id: "pdr", title: "PDR", status: "in_review", due_on: "2026-10-10" }),
        gate({ id: "cdr", title: "CDR", due_on: "2026-12-01" }),
        gate({ id: "ms-c", title: "Milestone C" }),
      ],
    });
    expect(keys(result)).toEqual([
      "version-v1",
      "review-r1",
      "decision-d1",
      "gate-pdr",
      "gate-cdr",
      "expiry-d1",
      "version-v2",
      "gate-ms-c",
    ]);
    expect(result.lanes).toEqual({ authorization: 5, acquisition: 3 });
    // Today stands after the late gate and before the first stop ahead.
    expect(result.today).toBe(4);
  });

  it("says a version by what it records: submitted, else published, else a draft with no date", () => {
    const result = schedule({
      versions: [
        version({
          id: "a",
          submitted_at: "2026-08-29T15:00:00Z",
          published_at: "2026-09-02T15:00:00Z",
        }),
        version({ id: "b", version_number: 2, published_at: "2026-10-01T15:00:00Z" }),
        version({ id: "c", version_number: 3, state: "draft" }),
      ],
    });
    expect(result.stops.map((stop) => [stop.kind, stop.day, stop.state])).toEqual([
      ["submitted", "2026-08-29", "done"],
      ["published", "2026-10-01", "done"],
      ["draft", null, "upcoming"],
    ]);
  });

  it("ends a package's authorization on its newest decision's expiry, only while it authorizes", () => {
    const withdrawn = schedule({
      versions: [version({})],
      decisions: [
        decision({ expires_on: "2029-09-17" }),
        decision({ id: "d2", decision: "revoked", decided_at: "2026-10-01T00:00:00Z" }),
      ],
    });
    expect(withdrawn.stops.map((stop) => [stop.kind, stop.state])).toEqual([
      ["decision", "done"],
      ["decision", "blocked"],
    ]);
    const soon = schedule({
      versions: [version({})],
      decisions: [decision({ expires_on: "2027-01-10" })],
    });
    expect(soon.stops.at(-1)).toMatchObject({ kind: "expiry", tone: "warning", passed: false });
    const lapsed = schedule({
      versions: [version({})],
      decisions: [decision({ expires_on: "2026-11-01" })],
    });
    expect(lapsed.stops.at(-1)).toMatchObject({ kind: "expiry", state: "blocked", passed: true });
    expect(lapsed.today).toBe(2);
  });

  it("flags a gate late or soon while it is open, and stands a decided gate on its decision", () => {
    const result = schedule({
      gates: [
        gate({ id: "late", due_on: "2026-10-01" }),
        gate({ id: "soon", due_on: "2026-11-18" }),
        gate({ id: "risk", status: "at_risk", due_on: "2027-01-01" }),
        gate({ id: "later", due_on: "2027-02-01" }),
        gate({
          id: "passed",
          status: "passed",
          due_on: "2026-11-01",
          decided_at: "2026-10-20T09:00:00Z",
        }),
      ],
    });
    const tone = Object.fromEntries(
      result.stops.map((stop) => [stop.key, [stop.day, stop.state, stop.tone ?? null]]),
    );
    expect(tone).toEqual({
      "gate-late": ["2026-10-01", "upcoming", "danger"],
      "gate-soon": ["2026-11-18", "upcoming", "warning"],
      "gate-risk": ["2027-01-01", "current", "warning"],
      "gate-later": ["2027-02-01", "upcoming", null],
      "gate-passed": ["2026-10-20", "done", null],
    });
    expect(keys(result).slice(0, result.today)).toEqual(["gate-late", "gate-passed"]);
  });

  it("orders gates with no date by their workflow order, then by name", () => {
    const result = schedule({
      gates: [
        gate({ id: "b", title: "B" }),
        gate({ id: "a", title: "A" }),
        gate({ id: "second", title: "Z", sequence_number: 2 }),
        gate({ id: "first", title: "Y", sequence_number: 1 }),
      ],
    });
    expect(keys(result)).toEqual(["gate-first", "gate-second", "gate-a", "gate-b"]);
    expect(result.today).toBe(0);
  });

  it("leaves out what names a version or a package the reader does not hold", () => {
    const result = schedule({
      versions: [version({ package_id: "elsewhere", submitted_at: "2026-08-29T15:00:00Z" })],
      reviews: [review({ package_revision_id: "unknown" })],
      decisions: [decision({ package_revision_id: "unknown" })],
    });
    expect(result.stops).toEqual([]);
    expect(result.today).toBe(0);
  });

  it("reads a gate's status as the path's state", () => {
    expect(["passed", "waived", "failed", "in_review", "not_started"].map(gateState)).toEqual([
      "done",
      "done",
      "blocked",
      "current",
      "upcoming",
    ]);
  });
});
