import { describe, expect, it } from "vitest";
import {
  daysBetween,
  programCategorization,
  programStanding,
  type StandingDecision,
  type StandingGate,
  type StandingPackageVersion,
} from "./program-standing";
import { authorizationStandings, statusLabel } from "./status";

const today = "2026-11-16";
const decision = (values: Partial<StandingDecision>): StandingDecision => ({
  id: "d1",
  package_revision_id: "v1",
  decision: "authorized",
  decided_at: "2026-09-18T12:00:00Z",
  expires_on: null,
  ...values,
});
const gate = (values: Partial<StandingGate>): StandingGate => ({
  id: "g1",
  title: "PDR",
  status: "not_started",
  due_on: null,
  ...values,
});
const version = (values: Partial<StandingPackageVersion>): StandingPackageVersion => ({
  id: "v1",
  state: "draft",
  submitted_at: null,
  ...values,
});
const words = (standing: string) => statusLabel(authorizationStandings, standing);

describe("program standing", () => {
  it("counts whole calendar days between two days", () => {
    expect(daysBetween("2026-11-16", "2026-10-10")).toBe(-37);
    expect(daysBetween("2026-11-16", "2026-11-16")).toBe(0);
    expect(daysBetween("2026-11-16", "2026-11-18T00:00:00Z")).toBe(2);
  });

  it("reads the newest decision in RMF's words, and its most overdue open gate", () => {
    const standing = programStanding({
      decisions: [
        decision({ id: "old", decision: "authorized", decided_at: "2023-06-01T00:00:00Z" }),
        decision({
          id: "new",
          decision: "authorized_with_conditions",
          expires_on: "2029-09-17",
        }),
      ],
      versions: [],
      gates: [
        gate({ id: "a", title: "PDR", status: "in_review", due_on: "2026-10-10" }),
        gate({ id: "b", title: "CDR", status: "not_started", due_on: "2026-10-01" }),
        gate({ id: "c", title: "SRR", status: "completed", due_on: "2025-04-22" }),
        gate({ id: "d", title: "kk", status: "not_started", due_on: null }),
      ],
      today,
    });
    expect(words(standing.standing)).toBe("ATO with conditions");
    expect(standing.urgent).toEqual({ kind: "gate", name: "CDR", day: "2026-10-01", days: -46 });
  });

  it("says an expiry when it comes before every open gate, and nothing when nothing is due", () => {
    const expiring = programStanding({
      decisions: [decision({ expires_on: "2026-11-30" })],
      versions: [],
      gates: [gate({ due_on: "2027-01-14" }), gate({ status: "passed", due_on: "2026-10-04" })],
      today,
    });
    expect(words(expiring.standing)).toBe("ATO");
    expect(expiring.urgent).toEqual({ kind: "expiry", name: "ATO", day: "2026-11-30", days: 14 });
    expect(programStanding({ decisions: [], versions: [], gates: [], today }).urgent).toBeNull();
  });

  it("reads an authorization whose expiry has passed as expired, a denial and a revocation", () => {
    const expired = programStanding({
      decisions: [decision({ expires_on: "2026-05-31" })],
      versions: [],
      gates: [],
      today,
    });
    expect(words(expired.standing)).toBe("ATO expired");
    expect(expired.urgent).toBeNull();
    const denied = programStanding({
      decisions: [
        decision({ id: "a", expires_on: "2026-05-31", decided_at: "2023-06-01T00:00:00Z" }),
        decision({ id: "b", decision: "denied", decided_at: "2026-06-12T00:00:00Z" }),
      ],
      versions: [],
      gates: [],
      today,
    });
    expect(words(denied.standing)).toBe("DATO");
    expect(
      words(
        programStanding({
          decisions: [decision({ decision: "revoked" })],
          versions: [],
          gates: [],
          today,
        }).standing,
      ),
    ).toBe("ATD");
  });

  it("reads the authorization the boundaries record where no decision is recorded here", () => {
    const standing = (boundaries: { authorization_status: string | null }[]) =>
      words(
        programStanding({ decisions: [], versions: [], gates: [], boundaries, today }).standing,
      );
    expect(standing([{ authorization_status: "authorized" }])).toBe("ATO");
    expect(
      standing([{ authorization_status: "authorized" }, { authorization_status: "expired" }]),
    ).toBe("ATO expired");
    expect(standing([{ authorization_status: "denied" }])).toBe("DATO");
    // A boundary still in progress has no decision: the package says where it stands.
    expect(
      standing([{ authorization_status: "authorized" }, { authorization_status: "in_progress" }]),
    ).toBe("No authorization package");
    // A decision recorded on a package outranks what a boundary records.
    expect(
      words(
        programStanding({
          decisions: [decision({ decision: "authorized_with_conditions" })],
          versions: [],
          gates: [],
          boundaries: [{ authorization_status: "in_progress" }],
          today,
        }).standing,
      ),
    ).toBe("ATO with conditions");
  });

  it("says what a program with no decision has instead", () => {
    const standing = (versions: StandingPackageVersion[]) =>
      words(programStanding({ decisions: [], versions, gates: [], today }).standing);
    expect(standing([])).toBe("No authorization package");
    expect(standing([version({})])).toBe("Package in draft");
    expect(standing([version({ state: "published" })])).toBe("Package in draft");
    expect(
      standing([
        version({}),
        version({ id: "v2", state: "published", submitted_at: "2026-11-03T00:00:00Z" }),
      ]),
    ).toBe("Package submitted");
  });
});

describe("program categorization", () => {
  it("takes each dimension's highest impact across the authorization boundaries", () => {
    expect(
      programCategorization([
        {
          confidentiality_impact: "moderate",
          integrity_impact: "high",
          availability_impact: "low",
        },
        {
          confidentiality_impact: "high",
          integrity_impact: "moderate",
          availability_impact: "moderate",
        },
      ]),
    ).toEqual(["high", "high", "moderate"]);
  });

  it("draws none where a dimension is recorded on no boundary", () => {
    expect(programCategorization([])).toBeNull();
    expect(
      programCategorization([
        { confidentiality_impact: "high", integrity_impact: null, availability_impact: "low" },
      ]),
    ).toBeNull();
  });
});
