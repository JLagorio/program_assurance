import { describe, expect, it } from "vitest";
import type {
  ComponentConsumers,
  ComponentControlStatusAnswer,
  SystemConsumer,
} from "./component-reuse";
import type { ComponentVulnerabilities } from "./component-vulnerabilities";
import { uuid } from "./testing/fake-client";

const {
  affectedControlLines,
  changeOutcome,
  componentVersionLines,
  cveAnswers,
  fixedCves,
  offerReach,
  sbomCvesByComponent,
  unansweredCves,
  versionsHolding,
} = await import("./component-work");

/*
 * The seeded scenario: the Mission Computer of the X800 Missile component set, version 1 and
 * version 2. WS-X90 (PRG-1090) and Customer A and B (PRG-2101, PRG-2102) are built from version 1;
 * WS-X90 found CVE-2024-6387 in its OpenSSH server and offered it. Version 2 carries OpenSSH 9.8p1,
 * which fixes it, and lists four controls as affected.
 */

const V1 = uuid(101);
const V2 = uuid(102);

const system = (
  program: number,
  code: string,
  name: string,
  definedComponentId: string,
  systemComponentId: string | null = uuid(500 + program),
): SystemConsumer =>
  ({
    key: systemComponentId ?? `${uuid(600 + program)}:x`,
    programId: uuid(program),
    programCode: code,
    programName: name,
    systemComponentId,
    definedComponentId,
  }) as SystemConsumer;

describe("which programs accepting an offer reaches", () => {
  const systems = [
    system(1, "PRG-1090", "WS-X90 Sentinel Mission System", V1),
    system(3, "PRG-2102", "Customer B", V1),
    system(2, "PRG-2101", "Customer A", V1),
    // A second component of Customer A built from the same version: the program once.
    system(2, "PRG-2101", "Customer A", V1, uuid(700)),
    // A program on version 2 is not built from the version offered.
    system(4, "PRG-3000", "Another program", V2),
    // A variant that left the element out holds no component.
    system(5, "PRG-2201", "Customer C", V1, null),
  ];

  it("lists each program built from the version once, the offering program last", () => {
    const reach = offerReach({ programId: uuid(1), definedComponentId: V1 }, systems);
    expect(reach.map((program) => [program.programCode, program.offering])).toEqual([
      ["PRG-2101", false],
      ["PRG-2102", false],
      ["PRG-1090", true],
    ]);
    expect(reach[0]?.systemComponents).toBe(2);
  });

  it("reaches nobody where no program is built from the version", () => {
    expect(offerReach({ programId: uuid(1), definedComponentId: uuid(999) }, systems)).toEqual([]);
  });
});

describe("an SBOM's CVEs in VEX's words", () => {
  const link = (id: number, component: string, cve: string, state: string) => ({
    id: uuid(id),
    sbom_component_id: component,
    vulnerability_id: cve,
    state,
    note: null,
  });
  const cve = (id: string, code: string) => ({
    id,
    cve_id: code,
    title: code,
    severity: "high",
    cvss_score: 8.1,
    fixed_in: "OpenSSH 9.8p1",
    known_exploited: false,
  });
  const ssh = uuid(11);
  const glibc = uuid(12);
  const regreSSHion = uuid(21);
  const older = uuid(22);
  const notRead = uuid(23);

  const byComponent = sbomCvesByComponent(
    [
      link(31, ssh, older, "not_affected"),
      link(32, ssh, regreSSHion, "affected"),
      link(33, glibc, older, "fixed"),
      link(34, glibc, notRead, "affected"),
    ],
    [cve(regreSSHion, "CVE-2024-6387"), cve(older, "CVE-2023-38408")],
  );

  it("lists each component's CVEs affected first, then by identifier", () => {
    expect(byComponent.get(ssh)?.map((found) => [found.cveId, found.state])).toEqual([
      ["CVE-2024-6387", "affected"],
      ["CVE-2023-38408", "not_affected"],
    ]);
  });

  it("leaves out a link whose CVE could not be read", () => {
    expect(byComponent.get(glibc)?.map((found) => found.cveId)).toEqual(["CVE-2023-38408"]);
  });

  it("names the CVEs the SBOM records as fixed, each once", () => {
    expect(fixedCves(byComponent).map((found) => found.cveId)).toEqual(["CVE-2023-38408"]);
    expect(fixedCves(new Map())).toEqual([]);
  });
});

describe("who has answered a CVE", () => {
  const consumer = (program: number, code: string, name: string, answered: boolean) => ({
    programId: uuid(program),
    programCode: code,
    programName: name,
    businessLineId: null,
    systemComponents: [],
    answered,
    issues: answered ? 1 : 0,
    issue: answered
      ? {
          issueId: uuid(80 + program),
          title: "CVE-2024-6387 in the OpenSSH server",
          severity: "high",
          status: "open",
          open: true,
          openedAt: "2026-10-10T15:00:00Z",
          ownerPartyId: null,
          poamItems: 0,
        }
      : null,
  });
  const answer = {
    vulnerabilities: [
      {
        vulnerabilityId: uuid(21),
        cveId: "CVE-2024-6387",
        consumers: [
          consumer(1, "PRG-1090", "WS-X90 Sentinel Mission System", true),
          consumer(3, "PRG-2102", "Customer B", false),
          consumer(2, "PRG-2101", "Customer A", false),
        ],
      },
      {
        vulnerabilityId: uuid(22),
        cveId: "CVE-2023-38408",
        consumers: [consumer(1, "PRG-1090", "WS-X90 Sentinel Mission System", true)],
      },
    ],
  } as unknown as ComponentVulnerabilities;

  it("lists every program under each CVE, those that owe an answer first", () => {
    expect(cveAnswers(answer).map((row) => [row.cveId, row.programCode, row.answered])).toEqual([
      ["CVE-2024-6387", "PRG-2101", false],
      ["CVE-2024-6387", "PRG-2102", false],
      ["CVE-2024-6387", "PRG-1090", true],
      ["CVE-2023-38408", "PRG-1090", true],
    ]);
    expect(new Set(cveAnswers(answer).map((row) => row.id)).size).toBe(4);
  });

  it("names the CVEs still owed an answer and who owes it", () => {
    expect(unansweredCves(answer)).toEqual([
      { vulnerabilityId: uuid(21), cveId: "CVE-2024-6387", programs: ["Customer A", "Customer B"] },
    ]);
  });
});

describe("the versions of a component", () => {
  const revisions = [
    { id: uuid(41), version_number: 1, state: "published", published_at: "2026-06-15T12:00:00Z" },
    { id: uuid(42), version_number: 2, state: "published", published_at: "2026-11-12T17:00:00Z" },
    // A draft version 3 that dropped the component.
    { id: uuid(43), version_number: 3, state: "draft", published_at: null },
  ];
  const components = [
    { id: V1, component_definition_revision_id: uuid(41) },
    { id: V2, component_definition_revision_id: uuid(42) },
  ];

  it("lists the versions that hold the component, the newest first", () => {
    expect(
      versionsHolding(revisions, components).map((version) => [
        version.version,
        version.definedComponentId,
      ]),
    ).toEqual([
      [2, V2],
      [1, V1],
    ]);
  });

  const standing = (
    satisfied: number,
    notAssessed: number,
    toReview: number,
    carried: number,
    assessments: { version: number; publishedAt: string; completedOn: string | null }[],
  ) => ({
    total: 61,
    counts: {
      satisfied,
      partially_satisfied: 6,
      other_than_satisfied: 4,
      not_assessed: notAssessed,
    },
    carried,
    toReview,
    assessments: assessments.map((assessment, index) => ({
      id: uuid(90 + index),
      title: `Assessment ${index + 1}`,
      assessorPartyId: uuid(7),
      profileResolutionId: uuid(8),
      determinations: 0,
      ...assessment,
    })),
  });
  const standings = new Map([
    [
      V1,
      standing(44, 7, 0, 0, [
        { version: 1, publishedAt: "2026-09-01T00:00:00Z", completedOn: "2026-08-30" },
        { version: 1, publishedAt: "2026-09-30T00:00:00Z", completedOn: null },
      ]),
    ],
    // Version 2 carries version 1's determinations and was not judged itself.
    [
      V2,
      standing(42, 9, 2, 52, [
        { version: 1, publishedAt: "2026-09-30T00:00:00Z", completedOn: null },
      ]),
    ],
  ]);
  const consumers = {
    products: [
      { current: true, definedComponentId: V1 },
      // An older product version pinned to it is not a consumer now.
      { current: false, definedComponentId: V1 },
    ],
    systems: [
      system(1, "PRG-1090", "WS-X90", V1),
      system(2, "PRG-2101", "Customer A", V1),
      system(3, "PRG-2102", "Customer B", V1),
      system(5, "PRG-2201", "Customer C", V1, null),
    ],
  } as unknown as Pick<ComponentConsumers, "products" | "systems">;

  it("says each version's own assessment, standing and consumers", () => {
    const lines = componentVersionLines(
      versionsHolding(revisions, components),
      standings,
      consumers,
    );
    expect(
      lines.map((line) => ({
        version: line.version,
        assessed: line.assessment?.on ?? null,
        satisfied: line.satisfied,
        controls: line.controls,
        toReview: line.toReview,
        consumers: line.consumers,
      })),
    ).toEqual([
      { version: 2, assessed: null, satisfied: 42, controls: 61, toReview: 2, consumers: 0 },
      // The latest of its own assessments, by the day it was completed where it says one.
      {
        version: 1,
        assessed: "2026-09-30T00:00:00Z",
        satisfied: 44,
        controls: 61,
        toReview: 0,
        consumers: 4,
      },
    ]);
  });

  it("counts what a change carries forward, leaves to review and leaves unassessed", () => {
    expect(changeOutcome(standings.get(V2)!)).toEqual({
      controls: 61,
      carried: 52,
      judged: 0,
      toReview: 2,
      notAssessed: 7,
    });
  });

  it("says where the version before and this one stand on each affected control", () => {
    const control = (id: number, code: string) => ({ id: uuid(id), code, title: code });
    const line = (id: number, status: string, toReview = false) =>
      ({ id: uuid(id), status, toReview }) as ComponentControlStatusAnswer["controls"][number];
    const change = {
      controls: [
        control(1, "SI-2"),
        control(2, "AC-17(2)"),
        control(3, "SC-23"),
        control(4, "RA-5"),
      ],
    };
    const lines = affectedControlLines(
      change,
      { controls: [line(2, "not_assessed", true), line(3, "not_assessed", true)] },
      { controls: [line(2, "satisfied"), line(3, "satisfied")] },
    );
    expect(
      lines.map((affected) => [affected.code, affected.before, affected.after, affected.toReview]),
    ).toEqual([
      ["AC-17(2)", "satisfied", "not_assessed", true],
      ["RA-5", null, null, false],
      ["SC-23", "satisfied", "not_assessed", true],
      ["SI-2", null, null, false],
    ]);
    // The first version has no version before.
    expect(
      affectedControlLines(change, { controls: [] }, null).every(
        (affected) => affected.before === null,
      ),
    ).toBe(true);
  });
});
