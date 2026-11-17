import { describe, expect, it } from "vitest";
import {
  assessmentWait,
  citedEvidence,
  implementationParts,
  latestRevisions,
  requirementCoverage,
  type ControlMapping,
} from "./control-work";
import type { ProgramRoleLine, RoleHolder } from "./program-roles";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const requirement = (n: number, evidence = 0) => ({
  id: id(n),
  code: `REQ-${String(n).padStart(3, "0")}`,
  title: `Requirement ${n}`,
  state: "draft",
  evidence_count: evidence,
});

// SI-2's objectives as SP 800-53A prints them, with the headings they sit under.
const A = id(500);
const objectives = [
  { id: id(501), label: "SI-02a.[01]", ancestors: [A] },
  { id: id(502), label: "SI-02a.[02]", ancestors: [A] },
  { id: id(503), label: "SI-02a.[03]", ancestors: [A] },
  { id: id(504), label: "SI-02d.", ancestors: [] },
];

const mapping = (
  n: number,
  revision: string,
  part: string | null,
  system: string | null,
): ControlMapping => ({
  id: id(n),
  requirement_revision_id: revision,
  control_part_id: part,
  system_id: system,
  relationship_type: "maps_to",
});

describe("latestRevisions", () => {
  it("keeps each requirement's highest version", () => {
    const latest = latestRevisions([
      { id: id(11), engineering_requirement_id: id(1), version_number: 1 },
      { id: id(12), engineering_requirement_id: id(1), version_number: 3 },
      { id: id(13), engineering_requirement_id: id(1), version_number: 2 },
      { id: id(21), engineering_requirement_id: id(2), version_number: 1 },
    ]);
    expect(latest.get(id(1))).toBe(id(12));
    expect(latest.get(id(2))).toBe(id(21));
  });
});

describe("implementationParts", () => {
  const part = (
    n: number,
    parent: number | null,
    name: string,
    label: string | null,
    ordinal: number,
  ) => ({
    id: id(n),
    parent_part_id: parent === null ? null : id(parent),
    name,
    prose: label ? `Part ${label}` : null,
    props: label ? [{ name: "label", value: label }] : [],
    ordinal,
  });
  const parts = [
    part(1, null, "statement", null, 1),
    part(3, 1, "item", "b.", 2),
    part(2, 1, "item", "a.", 1),
    part(4, 3, "item", "1.", 1),
    part(5, null, "guidance", null, 2),
    part(6, null, "assessment-objective", "SI-02a.", 3),
  ];

  it("lists the Summary, then each item in reading order with its statement and contributions", () => {
    const rows = implementationParts({
      parts,
      statements: [{ id: id(20), control_part_id: id(3) }],
      contributions: [
        { id: id(30), implementation_statement_id: id(20) },
        { id: id(31), implementation_statement_id: null },
        // Recorded on a statement of no listed part: it stands under the Summary.
        { id: id(32), implementation_statement_id: id(29) },
      ],
    });
    expect(rows.map((row) => row.label)).toEqual([null, "a.", "b.", "b.1."]);
    expect(rows[0]).toMatchObject({ partId: null, contributionIds: [id(31), id(32)] });
    expect(rows[2]).toMatchObject({ statementId: id(20), contributionIds: [id(30)] });
    expect(rows[1]).toMatchObject({ statementId: null, contributionIds: [] });
  });
});

describe("requirementCoverage", () => {
  const latest = new Map([
    [id(1), id(11)],
    [id(2), id(21)],
    [id(3), id(31)],
  ]);

  it("says the whole control for a mapping that names no part, on the system it names", () => {
    const [line] = requirementCoverage({
      requirements: [requirement(1)],
      latest,
      mappings: [mapping(1, id(11), null, id(900))],
      objectives,
    });
    expect(line).toMatchObject({
      whole: true,
      objectives: [],
      covered: 4,
      total: 4,
      systems: [id(900)],
      everySystem: false,
      revisionId: id(11),
    });
  });

  it("names the objectives a heading and a leaf cover, in reading order, and every system", () => {
    const [line] = requirementCoverage({
      requirements: [requirement(1)],
      latest,
      mappings: [mapping(1, id(11), id(504), null), mapping(2, id(11), A, null)],
      objectives,
    });
    expect(line).toMatchObject({
      whole: false,
      objectives: ["SI-02a.[01]", "SI-02a.[02]", "SI-02a.[03]", "SI-02d."],
      covered: 4,
      everySystem: true,
      systems: [],
    });
  });

  it("counts only the latest revision's mappings", () => {
    const [line] = requirementCoverage({
      requirements: [requirement(2)],
      latest,
      // A mapping of an earlier revision counts for nothing.
      mappings: [mapping(1, id(20), null, null)],
      objectives,
    });
    expect(line).toMatchObject({ whole: false, objectives: [], covered: 0, everySystem: false });
  });

  it("covers the whole control for a mapping that names a statement of its text", () => {
    const [line] = requirementCoverage({
      requirements: [requirement(3)],
      latest,
      mappings: [mapping(1, id(31), id(700), id(900))],
      objectives,
    });
    expect(line).toMatchObject({ whole: true, covered: 4 });
  });
});

describe("citedEvidence", () => {
  const latest = new Map([
    [id(1), id(11)],
    [id(2), id(21)],
  ]);
  const version = (n: number, artifact: number, number = 1) => ({
    id: id(n),
    artifact_id: id(artifact),
    version_number: number,
    state: "published",
    collected_at: "2026-11-01T00:00:00Z",
    expires_at: null,
  });

  it("lists each version once with the requirements citing it and its latest review", () => {
    const lines = citedEvidence({
      requirements: [requirement(2), requirement(1)],
      latest,
      links: [
        { id: id(61), requirement_revision_id: id(21), evidence_version_id: id(41) },
        { id: id(62), requirement_revision_id: id(11), evidence_version_id: id(41) },
        { id: id(63), requirement_revision_id: id(11), evidence_version_id: id(42) },
        // An earlier revision's link is not the requirement's evidence.
        { id: id(64), requirement_revision_id: id(10), evidence_version_id: id(43) },
      ],
      versions: [version(41, 81, 2), version(42, 82), version(43, 83)],
      artifacts: [
        { id: id(81), title: "Patch report", artifact_kind: "report" },
        { id: id(82), title: "Attestation", artifact_kind: "test_result" },
        { id: id(83), title: "Old", artifact_kind: "report" },
      ],
      reviews: [
        {
          id: id(71),
          evidence_version_id: id(41),
          reviewer_party_id: id(91),
          decision: "pending",
          reviewed_at: null,
          created_at: "2026-11-02T00:00:00Z",
        },
        {
          id: id(72),
          evidence_version_id: id(41),
          reviewer_party_id: id(92),
          decision: "accepted",
          reviewed_at: "2026-11-05T00:00:00Z",
          created_at: "2026-11-01T00:00:00Z",
        },
      ],
    });
    expect(lines.map((line) => line.title)).toEqual(["Attestation", "Patch report"]);
    expect(lines[0]).toMatchObject({
      review: "not_reviewed",
      reviewerId: null,
      citedBy: ["REQ-001"],
    });
    expect(lines[1]).toMatchObject({
      version: 2,
      review: "accepted",
      reviewerId: id(92),
      citedBy: ["REQ-001", "REQ-002"],
    });
  });
});

describe("assessmentWait", () => {
  const holder = (n: number, name: string): RoleHolder => ({
    assignmentId: id(n),
    partyId: id(n + 100),
    name,
    partyType: "person",
    startsOn: null,
    endsOn: null,
    revision: 1,
  });
  const line = (role: ProgramRoleLine["role"], holders: RoleHolder[]): ProgramRoleLine => ({
    role,
    oneHolder: role === "lead_assessor",
    recorded: holders.length > 0,
    holders,
  });
  const campaigns = [{ id: id(1), title: "Expanded control set", endsAt: "2026-11-20T18:00:00Z" }];

  it("is nothing while no plan holds the control", () => {
    expect(assessmentWait(null, campaigns, [])).toBeNull();
  });

  it("waits on the lead assessor, who publishes the results", () => {
    const wait = assessmentWait({ id: id(1) }, campaigns, [
      line("lead_assessor", [holder(1, "D. Okafor")]),
      line("assessor", [holder(2, "Nadia Fournier")]),
    ]);
    expect(wait).toMatchObject({
      campaign: { title: "Expanded control set", endsAt: "2026-11-20T18:00:00Z" },
      role: "lead_assessor",
    });
    expect(wait?.waitingOn.map((person) => person.name)).toEqual(["D. Okafor"]);
  });

  it("waits on the assessors where nobody leads, and names nobody where none is recorded", () => {
    expect(
      assessmentWait({ id: id(1) }, campaigns, [
        line("lead_assessor", []),
        line("assessor", [holder(2, "Nadia Fournier")]),
      ])?.waitingOn.map((person) => person.name),
    ).toEqual(["Nadia Fournier"]);
    expect(assessmentWait({ id: id(1) }, campaigns, [])).toMatchObject({
      waitingOn: [],
      role: null,
    });
  });
});
