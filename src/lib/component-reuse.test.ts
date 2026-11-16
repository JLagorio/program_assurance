import { describe, expect, it } from "vitest";
import { args, fakeClient, uuid } from "./testing/fake-client";

const {
  COMPONENT_CONTROL_STATUS_ORDER,
  COMPONENT_OWNER_CHANGED,
  COMPONENT_OWNER_NEEDS_COMPONENT,
  COMPONENT_OWNER_NOT_A_COMPONENT,
  COMPONENT_OWNER_NOT_ALLOWED,
  COMPONENT_OWNER_NOT_A_PARTY,
  COMPONENT_REGISTER_COLUMNS,
  CONSUMER_CHANGES,
  NO_BUSINESS_LINE,
  atLeastOne,
  componentRegisterRead,
  controlsDetermined,
  readComponentConsumers,
  readComponentControlStatus,
  readSystemUpstream,
  setComponentOwner,
} = await import("./component-reuse");
const { NO_OWNER } = await import("./owner-assign");
const { readServerPage, serverQuestion } = await import("./server-table");
const { determinations } = await import("./status");

const context = { tenantId: uuid(1), token: "token" };

// The seeded scenario: the X800 Missile component set's Mission Computer, owned by Priya Raghavan
// in Air Defense, pinned by the X800's GS-MC element and built into WS-X90's CN-109101.
const component = {
  id: uuid(10),
  name: "Mission Computer",
  component_type: "hardware",
  definition_id: uuid(11),
  definition_code: "x800-components",
  definition_name: "X800 Missile component set",
  revision_id: uuid(12),
  version: 1,
  state: "published",
  owner_party_id: uuid(2),
  definition_owner_party_id: uuid(2),
  business_line_id: uuid(3),
};
const control = (
  id: number,
  code: string,
  status: string,
  extra: Record<string, unknown> = {},
) => ({
  id: uuid(id),
  code,
  title: `${code} title`,
  parent_id: null,
  family: code.slice(0, 2),
  family_title: null,
  status,
  claimed: true,
  assessment_id: status === "not_assessed" ? null : uuid(20),
  rationale: null,
  carried: false,
  carried_from: null,
  to_review: false,
  review: null,
  ...extra,
});

describe("where a component version stands", () => {
  it("counts in the determinations' words, worst kept apart from not assessed", () => {
    expect(COMPONENT_CONTROL_STATUS_ORDER).toEqual(Object.keys(determinations));
    expect(COMPONENT_CONTROL_STATUS_ORDER).toContain("not_assessed");
  });

  const answer = {
    defined_component_id: uuid(10),
    component,
    change: null,
    assessments: [
      {
        id: uuid(20),
        title: "X800 Missile component set version 1 component assessment",
        published_at: "2026-09-30T16:00:00+00:00",
        completed_on: "2026-09-30",
        assessor_party_id: uuid(4),
        profile_resolution_id: uuid(5),
        determinations: 54,
        version: 1,
      },
    ],
    totals: {
      controls: 61,
      satisfied: 44,
      partially_satisfied: 6,
      other_than_satisfied: 4,
      not_assessed: 7,
      carried: 0,
      to_review: 0,
    },
    controls: [
      control(30, "AC-3", "satisfied"),
      control(31, "SC-13", "other_than_satisfied", {
        claimed: false,
        rationale: "Keys held in the clear.",
      }),
      control(32, "SI-7", "not_assessed"),
    ],
  };

  it("asks for the component version alone and reads its standing", async () => {
    const { client, calls } = fakeClient(() => ({ data: answer, error: null }));
    const read = await readComponentControlStatus(client, context, uuid(10));
    expect(calls).toHaveLength(1);
    expect(calls[0]!.table).toBe("rpc:component_control_status");
    expect(args(calls[0], "rpc")[0]).toEqual([{ p_defined_component_id: uuid(10) }]);
    expect(args(calls[0], "setHeader")).toEqual([["Authorization", "Bearer token"]]);
    expect(read.component).toEqual({
      id: uuid(10),
      name: "Mission Computer",
      componentType: "hardware",
      definitionId: uuid(11),
      definitionCode: "x800-components",
      definitionName: "X800 Missile component set",
      revisionId: uuid(12),
      version: 1,
      state: "published",
      ownerPartyId: uuid(2),
      definitionOwnerPartyId: uuid(2),
      businessLineId: uuid(3),
    });
    // 54 controls judged, 44 of them satisfied, and 7 it claims that nobody judged.
    expect(read.total).toBe(61);
    expect(read.counts).toEqual({
      satisfied: 44,
      partially_satisfied: 6,
      other_than_satisfied: 4,
      not_assessed: 7,
    });
    expect(controlsDetermined(read)).toBe(54);
    expect(read.assessments).toEqual([
      expect.objectContaining({
        id: uuid(20),
        completedOn: "2026-09-30",
        determinations: 54,
        version: 1,
      }),
    ]);
    // A first version changes nothing, carries nothing and leaves nothing to review.
    expect(read.change).toBeNull();
    expect([read.carried, read.toReview]).toEqual([0, 0]);
    expect(read.controls[0]).toMatchObject({
      carried: false,
      carriedFrom: null,
      toReview: false,
      review: null,
    });
    expect(read.controls.map((line) => [line.code, line.status, line.claimed])).toEqual([
      ["AC-3", "satisfied", true],
      ["SC-13", "other_than_satisfied", false],
      ["SI-7", "not_assessed", true],
    ]);
    expect(read.controls[1]).toMatchObject({
      assessmentId: uuid(20),
      rationale: "Keys held in the clear.",
    });
    expect(read.controls[2]?.assessmentId).toBeNull();
  });

  it("reads a component nobody assessed as its claims alone", async () => {
    const { client } = fakeClient(() => ({
      data: {
        ...answer,
        assessments: [],
        totals: {
          ...answer.totals,
          satisfied: 0,
          partially_satisfied: 0,
          other_than_satisfied: 0,
          not_assessed: 61,
        },
        controls: [control(32, "SI-7", "not_assessed")],
      },
      error: null,
    }));
    const read = await readComponentControlStatus(client, context, uuid(10));
    expect(read.assessments).toEqual([]);
    expect(controlsDetermined(read)).toBe(0);
  });

  it("reads what a newer version carries forward, what its change left to review and its own owner", async () => {
    // Version 2 of the Mission Computer: its change affects RA-5 and SI-2, which version 1 was
    // judged on, so they are left to review; everything else version 1 was judged on carries.
    const change = {
      id: uuid(80),
      kinds: ["software"],
      summary: "The maintenance image carries OpenSSH server 9.8p1 in place of 9.6p1.",
      controls: [
        { id: uuid(33), code: "RA-5", title: "Vulnerability Monitoring and Scanning" },
        { id: uuid(34), code: "SI-2", title: "Flaw Remediation" },
      ],
    };
    const { client } = fakeClient(() => ({
      data: {
        ...answer,
        defined_component_id: uuid(14),
        component: {
          ...component,
          id: uuid(14),
          revision_id: uuid(13),
          version: 2,
          state: "draft",
          owner_party_id: uuid(6),
        },
        change,
        totals: {
          controls: 61,
          satisfied: 43,
          partially_satisfied: 6,
          other_than_satisfied: 3,
          not_assessed: 9,
          carried: 52,
          to_review: 2,
        },
        controls: [
          control(30, "AC-3", "satisfied", {
            carried: true,
            carried_from: { defined_component_id: uuid(10), version: 1 },
          }),
          control(33, "RA-5", "not_assessed", {
            to_review: true,
            review: {
              affected_in_version: 2,
              earlier_version: 1,
              earlier_determination: "other_than_satisfied",
            },
          }),
        ],
      },
      error: null,
    }));
    const read = await readComponentControlStatus(client, context, uuid(14));
    // Its own owner over its set's, which stays readable beside it.
    expect(read.component).toMatchObject({
      version: 2,
      state: "draft",
      ownerPartyId: uuid(6),
      definitionOwnerPartyId: uuid(2),
    });
    expect(read.change).toEqual(change);
    expect([read.carried, read.toReview]).toEqual([52, 2]);
    // What carried still counts as determined; what is to review does not.
    expect(controlsDetermined(read)).toBe(52);
    expect(read.assessments[0]?.version).toBe(1);
    expect(read.controls[0]).toMatchObject({
      status: "satisfied",
      assessmentId: uuid(20),
      carried: true,
      carriedFrom: { definedComponentId: uuid(10), version: 1 },
      toReview: false,
      review: null,
    });
    expect(read.controls[1]).toMatchObject({
      status: "not_assessed",
      assessmentId: null,
      carried: false,
      carriedFrom: null,
      toReview: true,
      review: {
        affectedInVersion: 2,
        earlierVersion: 1,
        earlierDetermination: "other_than_satisfied",
      },
    });
  });

  it("refuses a control to review that names no determination, and a change of a kind it has no word for", async () => {
    for (const data of [
      {
        ...answer,
        controls: [
          control(33, "RA-5", "not_assessed", {
            to_review: true,
            review: {
              affected_in_version: 2,
              earlier_version: 1,
              earlier_determination: "not_assessed",
            },
          }),
        ],
      },
      { ...answer, change: { id: uuid(80), kinds: ["wiring"], summary: "Rewired.", controls: [] } },
    ]) {
      const { client } = fakeClient(() => ({ data, error: null }));
      await expect(readComponentControlStatus(client, context, uuid(10))).rejects.toThrow();
    }
  });

  it("refuses a status it has no word for, and passes a refusal on as it is", async () => {
    const unknown = fakeClient(() => ({
      data: { ...answer, controls: [control(30, "AC-3", "not_covered")] },
      error: null,
    }));
    await expect(readComponentControlStatus(unknown.client, context, uuid(10))).rejects.toThrow();
    const refused = fakeClient(() => ({
      data: null,
      error: { code: "42501", message: "Component access is required" },
    }));
    await expect(readComponentControlStatus(refused.client, context, uuid(10))).rejects.toThrow(
      "Component access is required",
    );
  });
});

describe("where a component is used", () => {
  const system = (extra: Record<string, unknown>) => ({
    program_id: uuid(40),
    program_code: "PRG-2101",
    program_name: "Customer A",
    business_line_id: uuid(3),
    system_id: uuid(41),
    system_code: "X800-A-CUSA",
    system_name: "X800 Missile · Lug & Rail Launch",
    element_id: uuid(42),
    element_code: "X800-A-CUSA-GS-MC",
    element_name: "Mission Computer",
    system_component_id: uuid(43),
    component_code: "LIB-MC",
    component_name: "Mission Computer",
    component_version: "1",
    product_element_id: uuid(51),
    defined_component_id: uuid(10),
    version: 1,
    behind: 1,
    pin: {
      configuration_baseline_id: uuid(44),
      name: "Block 1",
      baseline_version: 1,
      state: "published",
      version: "MC-HW 2.1",
    },
    change: "modified",
    change_kinds: ["firmware", "software"],
    change_rationale: "Customer keys and mission data are built in.",
    findings: [],
    findings_open: 0,
    vulnerabilities_open: 1,
    controls_judged: 54,
    controls_inherited: 0,
    ...extra,
  });
  const finding = {
    offer_id: uuid(90),
    issue_id: uuid(91),
    title: "CVE-2024-6387 in the Mission Computer's OpenSSH server",
    severity: "high",
    status: "open",
    opened_at: "2026-11-15T09:00:00+00:00",
    source: false,
  };
  const answer = {
    defined_component_id: uuid(10),
    component,
    latest: { revision_id: uuid(13), version: 2, defined_component_id: uuid(14) },
    products: [
      {
        product_id: uuid(50),
        product_code: "X800",
        product_name: "X800 Missile",
        business_line_id: uuid(3),
        product_revision_id: uuid(52),
        product_version: 2,
        product_state: "published",
        current: true,
        element_id: uuid(53),
        element_code: "GS-MC",
        element_name: "Mission Computer",
        configurations: [
          { id: uuid(54), code: "A", name: "Lug & Rail Launch" },
          { id: uuid(55), code: "B", name: "Eject Launch" },
        ],
        defined_component_id: uuid(10),
        version: 1,
        behind: 1,
        vulnerabilities_open: 1,
      },
    ],
    systems: [
      system({}),
      // A variant that left the element out holds no component and no element for it.
      system({
        program_code: "PRG-2102",
        system_id: uuid(61),
        system_code: "X800-C-CUSB",
        element_id: null,
        element_code: "GS-MC",
        system_component_id: null,
        component_code: null,
        component_name: null,
        component_version: null,
        pin: null,
        change: "removed",
        change_kinds: [],
        change_rationale: null,
        vulnerabilities_open: 0,
      }),
      // A program that applied the component itself, on an element with no product lineage: it
      // inherits what its baseline selects, and holds its own issue for the finding that stands.
      system({
        program_code: "PRG-1090",
        system_id: uuid(71),
        system_code: "SYS-WSX90",
        element_code: "CN-109101",
        system_component_id: uuid(73),
        product_element_id: null,
        defined_component_id: uuid(14),
        version: 2,
        behind: 0,
        pin: null,
        change: null,
        change_kinds: [],
        change_rationale: null,
        findings: [finding],
        findings_open: 1,
        controls_inherited: 50,
      }),
    ],
    findings: [
      {
        offer_id: uuid(90),
        item_id: uuid(92),
        title: finding.title,
        severity: "high",
        defined_component_id: uuid(10),
        version: 1,
        accepted_at: "2026-11-15T09:00:00+00:00",
        source_program_id: uuid(40),
        source_issue_id: uuid(93),
        programs: 3,
        programs_open: 2,
      },
    ],
    totals: {
      products: 1,
      product_elements: 1,
      programs: 2,
      systems: 2,
      system_components: 2,
      behind: 2,
      modified: 1,
      removed: 1,
    },
    findings_open: 1,
    offers_open: 1,
    vulnerabilities_open: 1,
  };

  it("names what a consumer's element became in the delta's words", () => {
    expect([...CONSUMER_CHANGES]).toEqual(["inherited", "modified", "removed"]);
  });

  it("asks for the component alone and reads each consumer with the version it took", async () => {
    const { client, calls } = fakeClient(() => ({ data: answer, error: null }));
    const read = await readComponentConsumers(client, context, uuid(10));
    expect(calls[0]!.table).toBe("rpc:component_consumers");
    expect(args(calls[0], "rpc")[0]).toEqual([{ p_defined_component_id: uuid(10) }]);
    expect(read.latest).toEqual({ revisionId: uuid(13), version: 2, definedComponentId: uuid(14) });
    expect(read.products).toEqual([
      expect.objectContaining({
        productCode: "X800",
        productVersion: 2,
        current: true,
        elementCode: "GS-MC",
        version: 1,
        behind: 1,
      }),
    ]);
    expect(read.products[0]?.configurations.map((configuration) => configuration.code)).toEqual([
      "A",
      "B",
    ]);
    const [modified, removed, own] = read.systems;
    expect(modified).toMatchObject({
      key: uuid(43),
      programCode: "PRG-2101",
      change: "modified",
      changeKinds: ["firmware", "software"],
      changeRationale: "Customer keys and mission data are built in.",
      version: 1,
      behind: 1,
      pin: {
        configurationBaselineId: uuid(44),
        name: "Block 1",
        baselineVersion: 1,
        state: "published",
        version: "MC-HW 2.1",
      },
    });
    // A row with no system component is keyed by the variant and the element it left out.
    expect(removed).toMatchObject({
      key: `${uuid(61)}:${uuid(51)}`,
      change: "removed",
      systemComponentId: null,
      elementId: null,
      pin: null,
    });
    expect(own).toMatchObject({ programCode: "PRG-1090", change: null, version: 2, behind: 0 });
    // How much of what the version is judged on each consumer's element inherits: none on an
    // element the program declared modified or left out.
    expect(read.systems.map((row) => [row.controlsJudged, row.controlsInherited])).toEqual([
      [54, 0],
      [54, 0],
      [54, 50],
    ]);
    expect(read.systems.map((row) => row.vulnerabilitiesOpen)).toEqual([1, 0, 1]);
    expect(read.products[0]?.vulnerabilitiesOpen).toBe(1);
    // The program's own open issue for the finding that stands on the version it took.
    expect(own).toMatchObject({
      findingsOpen: 1,
      findings: [
        {
          offerId: uuid(90),
          issueId: uuid(91),
          title: finding.title,
          severity: "high",
          status: "open",
          openedAt: "2026-11-15T09:00:00+00:00",
          source: false,
        },
      ],
    });
    expect(modified?.findings).toEqual([]);
    // The finding itself, with how many programs still hold their own issue open.
    expect(read.findings).toEqual([
      {
        offerId: uuid(90),
        itemId: uuid(92),
        title: finding.title,
        severity: "high",
        definedComponentId: uuid(10),
        version: 1,
        acceptedAt: "2026-11-15T09:00:00+00:00",
        sourceProgramId: uuid(40),
        sourceIssueId: uuid(93),
        programs: 3,
        programsOpen: 2,
      },
    ]);
    expect([read.findingsOpen, read.offersOpen, read.vulnerabilitiesOpen]).toEqual([1, 1, 1]);
    expect(read.totals).toEqual({
      products: 1,
      productElements: 1,
      programs: 2,
      systems: 2,
      systemComponents: 2,
      behind: 2,
      modified: 1,
      removed: 1,
    });
  });

  it("reads a component nothing is published of and nobody uses", async () => {
    const { client } = fakeClient(() => ({
      data: {
        ...answer,
        latest: null,
        products: [],
        systems: [],
        findings: [],
        totals: Object.fromEntries(Object.keys(answer.totals).map((key) => [key, 0])),
        findings_open: 0,
        offers_open: 0,
        vulnerabilities_open: 0,
      },
      error: null,
    }));
    const read = await readComponentConsumers(client, context, uuid(10));
    expect(read.latest).toBeNull();
    expect(read.products).toEqual([]);
    expect(read.systems).toEqual([]);
    expect(read.findings).toEqual([]);
    expect(read.totals.behind).toBe(0);
    expect([read.findingsOpen, read.offersOpen, read.vulnerabilitiesOpen]).toEqual([0, 0, 0]);
  });

  it("refuses a change it has no word for", async () => {
    const { client } = fakeClient(() => ({
      data: { ...answer, systems: [system({ change: "replaced" })] },
      error: null,
    }));
    await expect(readComponentConsumers(client, context, uuid(10))).rejects.toThrow();
  });
});

describe("what a system takes from above", () => {
  const standing = {
    controls: 61,
    satisfied: 44,
    partially_satisfied: 6,
    other_than_satisfied: 4,
    not_assessed: 7,
    carried: 0,
    to_review: 0,
  };
  const used = {
    system_component_id: uuid(73),
    code: "LRU-001",
    name: "Mission Computer",
    component_version: null,
    element_id: uuid(72),
    element_code: "CN-109101",
    element_name: "Mission Computer",
    product_element_id: null,
    change: null,
    change_kinds: [],
    defined_component_id: uuid(10),
    component_name: "Mission Computer",
    component_type: "hardware",
    definition_id: uuid(11),
    definition_code: "x800-components",
    definition_name: "X800 Missile component set",
    owner_party_id: uuid(2),
    definition_owner_party_id: uuid(2),
    business_line_id: uuid(3),
    revision_id: uuid(12),
    version: 1,
    latest_revision_id: uuid(12),
    latest_version: 1,
    behind: 0,
    pin: null,
    standing,
    controls_judged: 54,
    controls_inherited: 50,
    findings: [],
    findings_open: 0,
    offers_open: 1,
    vulnerabilities_open: 1,
  };
  const totals = {
    components: 1,
    behind: 0,
    modified: 0,
    assessed: 1,
    controls_judged: 54,
    controls_inherited: 50,
  };
  const answer = {
    system_id: uuid(71),
    boundary_system_id: uuid(71),
    program_id: uuid(70),
    product: null,
    components: [used],
    totals,
    findings_open: 0,
    offers_open: 1,
    vulnerabilities_open: 1,
  };

  it("asks for the system alone; a system not created from a product names none", async () => {
    const { client, calls } = fakeClient(() => ({ data: answer, error: null }));
    const read = await readSystemUpstream(client, context, uuid(71));
    expect(calls[0]!.table).toBe("rpc:system_upstream");
    expect(args(calls[0], "rpc")[0]).toEqual([{ p_system_id: uuid(71) }]);
    expect(read.product).toBeNull();
    expect(read.components).toHaveLength(1);
    expect(read.components[0]).toMatchObject({
      code: "LRU-001",
      elementCode: "CN-109101",
      definitionCode: "x800-components",
      ownerPartyId: uuid(2),
      version: 1,
      latestVersion: 1,
      behind: 0,
      change: null,
      pin: null,
      standing: {
        total: 61,
        counts: {
          satisfied: 44,
          partially_satisfied: 6,
          other_than_satisfied: 4,
          not_assessed: 7,
        },
        carried: 0,
        toReview: 0,
      },
      // What the system inherits of the version it took, and what waits on it.
      controlsJudged: 54,
      controlsInherited: 50,
      findings: [],
      findingsOpen: 0,
      offersOpen: 1,
      vulnerabilitiesOpen: 1,
    });
    expect(controlsDetermined(read.components[0]!.standing)).toBe(54);
    expect(read.totals).toEqual({
      components: 1,
      behind: 0,
      modified: 0,
      assessed: 1,
      controlsJudged: 54,
      controlsInherited: 50,
    });
    expect([read.findingsOpen, read.offersOpen, read.vulnerabilitiesOpen]).toEqual([0, 1, 1]);
  });

  it("reads what a component taken carries from an earlier version, its own owner and the program's issues for it", async () => {
    const { client } = fakeClient(() => ({
      data: {
        ...answer,
        components: [
          {
            ...used,
            owner_party_id: uuid(6),
            standing: {
              ...standing,
              satisfied: 43,
              other_than_satisfied: 3,
              not_assessed: 9,
              carried: 52,
              to_review: 2,
            },
            controls_judged: 52,
            controls_inherited: 48,
            findings: [
              {
                offer_id: uuid(90),
                issue_id: uuid(91),
                title: "CVE-2024-6387 in the Mission Computer's OpenSSH server",
                severity: null,
                status: "triaged",
                opened_at: null,
                source: true,
              },
            ],
            findings_open: 1,
            offers_open: 0,
            vulnerabilities_open: 0,
          },
        ],
        totals: { ...totals, controls_judged: 52, controls_inherited: 48 },
        findings_open: 1,
        offers_open: 0,
        vulnerabilities_open: 0,
      },
      error: null,
    }));
    const read = await readSystemUpstream(client, context, uuid(71));
    expect(read.components[0]).toMatchObject({
      ownerPartyId: uuid(6),
      definitionOwnerPartyId: uuid(2),
      standing: { total: 61, carried: 52, toReview: 2 },
      controlsJudged: 52,
      controlsInherited: 48,
      findingsOpen: 1,
      findings: [{ issueId: uuid(91), severity: null, status: "triaged", source: true }],
    });
    // What carried counts among the determinations; what is to review among the not assessed.
    expect(controlsDetermined(read.components[0]!.standing)).toBe(52);
    expect(read.findingsOpen).toBe(1);
  });

  it("names a variant's product with how far behind it is, and a modified element behind a version", async () => {
    const { client } = fakeClient(() => ({
      data: {
        ...answer,
        product: {
          id: uuid(50),
          code: "X800",
          name: "X800 Missile",
          business_line_id: uuid(3),
          revision_id: uuid(56),
          version: 1,
          configuration_id: uuid(54),
          configuration_code: "A",
          configuration: "Lug & Rail Launch",
          latest_revision_id: uuid(52),
          latest_version: 2,
          behind: 1,
        },
        components: [
          {
            ...used,
            product_element_id: uuid(51),
            change: "modified",
            change_kinds: ["firmware"],
            latest_revision_id: uuid(13),
            latest_version: 2,
            behind: 1,
            pin: {
              configuration_baseline_id: uuid(44),
              name: "Block 1",
              baseline_version: 1,
              state: "draft",
              version: null,
            },
          },
        ],
        totals: { ...totals, behind: 1, modified: 1, controls_inherited: 0 },
      },
      error: null,
    }));
    const read = await readSystemUpstream(client, context, uuid(41));
    expect(read.product).toEqual({
      id: uuid(50),
      code: "X800",
      name: "X800 Missile",
      businessLineId: uuid(3),
      revisionId: uuid(56),
      version: 1,
      configurationId: uuid(54),
      configurationCode: "A",
      configuration: "Lug & Rail Launch",
      latestRevisionId: uuid(52),
      latestVersion: 2,
      behind: 1,
    });
    expect(read.components[0]).toMatchObject({
      change: "modified",
      changeKinds: ["firmware"],
      latestVersion: 2,
      behind: 1,
      pin: { name: "Block 1", state: "draft", version: null },
    });
  });

  it("passes a refusal on as it is", async () => {
    const { client } = fakeClient(() => ({
      data: null,
      error: { code: "42501", message: "System access is required" },
    }));
    await expect(readSystemUpstream(client, context, uuid(71))).rejects.toThrow(
      "System access is required",
    );
  });
});

describe("the components register's read", () => {
  it("reads the view a page at a time, by name, and reads again when what it derives from is written", () => {
    expect(componentRegisterRead).toMatchObject({
      source: "component_rows",
      model: "defined_components",
      search: ["name", "definition_code", "definition_name", "owner_name", "business_line_name"],
    });
    expect(componentRegisterRead.columns).toEqual([...COMPONENT_REGISTER_COLUMNS]);
    // What a row says beside its standing: what waits on its owner, what affects it and what a
    // change left to review.
    for (const column of [
      "offers_open",
      "vulnerabilities_open",
      "controls_to_review",
      "controls_partially_satisfied",
      "controls_other_than_satisfied",
    ])
      expect(componentRegisterRead.columns).toContain(column);
    for (const model of [
      "component_definitions",
      "component_definition_revisions",
      "component_owners",
      "component_assessments",
      "component_determinations",
      "component_version_changes",
      "component_version_change_controls",
      "defined_component_implementations",
      "component_offers",
      "sboms",
      "sbom_components",
      "sbom_component_vulnerabilities",
      "system_components",
      "systems",
      "product_elements",
      "product_revisions",
      "parties",
      "business_lines",
    ])
      expect(componentRegisterRead.models).toContain(model);
  });

  it("orders by name and finds its Owner and Business line by name, the empty ones too", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 44 }));
    const page = await readServerPage(client, context, componentRegisterRead, {
      pageIndex: 0,
      pageSize: 25,
    });
    expect(page.count).toBe(44);
    expect(calls[0]?.table).toBe("component_rows");
    expect(args(calls[0], "order")).toEqual([
      ["name", { ascending: true, nullsFirst: false }],
      ["definition_code", { ascending: true, nullsFirst: false }],
      ["id"],
    ]);
    await readServerPage(client, context, componentRegisterRead, {
      pageIndex: 0,
      pageSize: 25,
      sorting: [{ id: "owner_party_id", desc: false }],
      filters: [
        { id: "owner_party_id", value: [NO_OWNER] },
        { id: "business_line_id", value: ["Air Defense"] },
      ],
    });
    expect(args(calls[1], "order")[0]).toEqual([
      "owner_name",
      { ascending: true, nullsFirst: false },
    ]);
    expect(args(calls[1], "is")).toEqual([["owner_name", null]]);
    expect(args(calls[1], "in")).toEqual([["business_line_name", ["Air Defense"]]]);
    expect(NO_BUSINESS_LINE).toBe("No business line");
  });

  it("reads its set and its assessment by name, and finds a version by the word its State reads as", async () => {
    const { client, calls } = fakeClient(() => ({ data: [], error: null, count: 0 }));
    await readServerPage(client, context, componentRegisterRead, {
      pageIndex: 0,
      pageSize: 25,
      search: "draft",
      sorting: [{ id: "component_definition_id", desc: true }],
      filters: [{ id: "assessment_id", value: ["X800 component assessment"] }],
    });
    expect(args(calls[0], "order")[0]).toEqual([
      "definition_name",
      { ascending: false, nullsFirst: true },
    ]);
    expect(args(calls[0], "in")).toEqual([["assessment_title", ["X800 component assessment"]]]);
    expect(String(args(calls[0], "or")[1]?.[0])).toContain('state.in.("draft")');
  });

  it("asks a count for a range, so the components with an offer waiting are a question", () => {
    const asked = serverQuestion(componentRegisterRead, {
      pageIndex: 0,
      pageSize: 25,
      filters: [...atLeastOne("offers_open"), ...atLeastOne("controls_to_review")],
    });
    expect(asked.filters).toEqual([
      { id: "offers_open", value: [1, null] },
      { id: "controls_to_review", value: [1, null] },
    ]);
    for (const column of ["offers_open", "vulnerabilities_open", "controls_to_review", "programs"])
      expect(componentRegisterRead.fields?.[column]).toEqual({ filter: "range" });
  });
});

describe("a component's own owner", () => {
  const key = { componentDefinitionId: uuid(11), componentName: "Mission Computer" };
  /** A client that answers the read of the component's row with `own`, then each write with `write`. */
  const owners = (
    own: { id: string; revision: number; owner_party_id: string } | null,
    write: { data: unknown; error: { code?: string; message: string } | null } = {
      data: { id: uuid(100) },
      error: null,
    },
  ) =>
    fakeClient((call) =>
      call.steps.some(([name]) => name === "maybeSingle") ? { data: own, error: null } : write,
    );
  const step = (call: Parameters<typeof args>[0], name: string) => args(call, name)[0];

  it("names an owner for a component that has none of its own, in the reader's workspace", async () => {
    const { client, calls } = owners(null);
    await expect(
      setComponentOwner(client, context, { ...key, ownerPartyId: uuid(6) }),
    ).resolves.toEqual({ outcome: "named", ownerPartyId: uuid(6) });
    expect(calls.map((call) => call.table)).toEqual(["component_owners", "component_owners"]);
    // The component is read by its set and its name, as the reader.
    expect(args(calls[0], "eq")).toEqual([
      ["tenant_id", uuid(1)],
      ["component_definition_id", uuid(11)],
      ["component_name", "Mission Computer"],
    ]);
    expect(args(calls[0], "setHeader")).toEqual([["Authorization", "Bearer token"]]);
    expect(step(calls[1], "insert")).toEqual([
      {
        tenant_id: uuid(1),
        component_definition_id: uuid(11),
        component_name: "Mission Computer",
        owner_party_id: uuid(6),
      },
    ]);
    expect(args(calls[1], "setHeader")).toEqual([["Authorization", "Bearer token"]]);
  });

  it("changes the owner it has at the revision read, and writes nothing for the owner it already has", async () => {
    const own = { id: uuid(100), revision: 3, owner_party_id: uuid(6) };
    const changed = owners(own);
    await expect(
      setComponentOwner(changed.client, context, { ...key, ownerPartyId: uuid(7) }),
    ).resolves.toEqual({ outcome: "changed", ownerPartyId: uuid(7) });
    expect(step(changed.calls[1], "update")).toEqual([{ owner_party_id: uuid(7), revision: 4 }]);
    expect(args(changed.calls[1], "eq")).toEqual([
      ["id", uuid(100)],
      ["revision", 3],
    ]);
    const same = owners(own);
    await expect(
      setComponentOwner(same.client, context, { ...key, ownerPartyId: uuid(6) }),
    ).resolves.toEqual({ outcome: "unchanged", ownerPartyId: uuid(6) });
    expect(same.calls).toHaveLength(1);
  });

  it("removes its own owner, so its set's answers for it again, and removes nothing twice", async () => {
    const own = { id: uuid(100), revision: 3, owner_party_id: uuid(6) };
    const removed = owners(own, { data: [{ id: uuid(100) }], error: null });
    await expect(
      setComponentOwner(removed.client, context, { ...key, ownerPartyId: null }),
    ).resolves.toEqual({ outcome: "removed", ownerPartyId: null });
    expect(args(removed.calls[1], "delete")).toHaveLength(1);
    expect(args(removed.calls[1], "eq")).toEqual([
      ["id", uuid(100)],
      ["revision", 3],
    ]);
    const none = owners(null);
    await expect(
      setComponentOwner(none.client, context, { ...key, ownerPartyId: null }),
    ).resolves.toEqual({ outcome: "unchanged", ownerPartyId: null });
    expect(none.calls).toHaveLength(1);
  });

  it("says when another session wrote the owner first", async () => {
    const own = { id: uuid(100), revision: 3, owner_party_id: uuid(6) };
    for (const [found, change, write] of [
      // Named by another session between the read and the insert.
      [null, uuid(6), { data: null, error: { code: "23505", message: "duplicate key value" } }],
      // Changed since it was read: the update finds no row at that revision.
      [own, uuid(7), { data: null, error: { code: "PGRST116", message: "0 rows" } }],
      [own, uuid(7), { data: null, error: { code: "PT409", message: "Record revision conflict" } }],
      // Removed or changed since it was read: the delete removes nothing.
      [own, null, { data: [], error: null }],
    ] as const) {
      const { client } = owners(found, write);
      await expect(
        setComponentOwner(client, context, { ...key, ownerPartyId: change }),
      ).rejects.toThrow(COMPONENT_OWNER_CHANGED);
    }
  });

  it("says each refusal of the write in the reader's words", async () => {
    for (const [code, message, said] of [
      [
        "23514",
        "Name an owner for a component of a version of this component set",
        COMPONENT_OWNER_NOT_A_COMPONENT,
      ],
      ["42501", "new row violates row-level security policy", COMPONENT_OWNER_NOT_ALLOWED],
      ["23503", "violates foreign key constraint", COMPONENT_OWNER_NOT_A_PARTY],
      // Anything else is passed on, as a sentence.
      ["57014", "canceling statement due to statement timeout", "due to statement timeout."],
    ] as const) {
      const { client } = owners(null, { data: null, error: { code, message } });
      await expect(
        setComponentOwner(client, context, { ...key, ownerPartyId: uuid(6) }),
      ).rejects.toThrow(said);
    }
  });

  it("asks nothing without the component", async () => {
    const { client, calls } = owners(null);
    await expect(
      setComponentOwner(client, context, { ...key, componentName: "", ownerPartyId: uuid(6) }),
    ).rejects.toThrow(COMPONENT_OWNER_NEEDS_COMPONENT);
    expect(calls).toEqual([]);
  });
});
