import { describe, expect, it } from "vitest";
import { args, fakeClient, uuid, type FakeCall } from "./testing/fake-client";

const {
  TAKE_ANSWER_UNREADABLE,
  TAKE_NEEDS_VERSION,
  TAKE_REVISION_MISSING,
  VERSION_BLOCKS,
  readComponentVersionReview,
  takeComponentVersion,
  versionToTake,
} = await import("./component-versions");

const context = { tenantId: uuid(1), token: "token" };
const rpc = (data: unknown, error: { code?: string; message: string } | null = null) =>
  fakeClient(() => ({ data, error }));
const sent = (call: FakeCall | undefined) => args(call, "rpc")[0]?.[0];

// WS-X90's LRU-001 is built from version 1 of the X800 component set's Mission Computer. Version 2
// rebuilds its maintenance image with OpenSSH server 9.8p1: its change affects RA-5 and SI-2, and
// it fixes CVE-2024-6387.
const head = {
  system_component_id: uuid(10),
  system_component: {
    id: uuid(10),
    code: "LRU-001",
    name: "Mission Computer",
    version: null,
    revision: 4,
    assignment_id: null,
    applied_at: "2026-11-15T17:52:07.704878+00:00",
  },
  program: { id: uuid(20), code: "PRG-1090", name: "WS-X90 Sentinel Mission System" },
  system: { id: uuid(21), code: "SYS-WSX90", name: "WS-X90 Sentinel Mission System" },
  element: {
    id: uuid(22),
    code: "CN-109101",
    name: "Mission Computer",
    product_element_id: null,
    modified: false,
  },
};
const component = {
  name: "Mission Computer",
  component_type: "hardware",
  definition_id: uuid(30),
  definition_code: "x800-components",
  definition_name: "X800 Missile component set",
  owner_party_id: uuid(2),
};
const taken = {
  defined_component_id: uuid(31),
  revision_id: uuid(32),
  version: 1,
  state: "published",
  published_at: "2026-11-13T05:20:05.971103+00:00",
};
const change = {
  id: uuid(40),
  kinds: ["software"],
  summary: "The maintenance image carries OpenSSH server 9.8p1 in place of 9.6p1.",
  controls: [
    { id: uuid(50), code: "RA-5", title: "Vulnerability Monitoring and Scanning" },
    { id: uuid(51), code: "SI-2", title: "Flaw Remediation" },
  ],
};
const behind = {
  ...head,
  component,
  taken,
  latest: {
    defined_component_id: uuid(33),
    revision_id: uuid(34),
    version: 2,
    published_at: "2026-11-16T09:00:00+00:00",
  },
  behind: 1,
  newer_drafts: 0,
  versions: [
    {
      revision_id: uuid(34),
      version: 2,
      published_at: "2026-11-16T09:00:00+00:00",
      defined_component_id: uuid(33),
      change,
    },
  ],
  affected_controls: [
    {
      id: uuid(50),
      code: "RA-5",
      title: "Vulnerability Monitoring and Scanning",
      versions: [2],
      taken_status: "other_than_satisfied",
      latest_status: "not_assessed",
      to_review: true,
      control_status: "other_than_satisfied",
      determined_by: "program",
      inherited: true,
    },
    {
      id: uuid(51),
      code: "SI-2",
      title: "Flaw Remediation",
      versions: [2],
      taken_status: null,
      latest_status: null,
      to_review: false,
      control_status: null,
      determined_by: null,
      inherited: false,
    },
  ],
  determinations: { taken: 54, carried: 53, judged: 0, to_review: 1 },
  vulnerabilities_fixed: [
    {
      id: uuid(60),
      cve_id: "CVE-2024-6387",
      title: "Signal handler race in OpenSSH's sshd (regreSSHion)",
      severity: "high",
      fixed_in: "OpenSSH 9.8p1",
      latest_state: "fixed",
      issue: {
        id: uuid(61),
        title: "CVE-2024-6387 in the OpenSSH server (regreSSHion)",
        status: "open",
        severity: "high",
      },
    },
  ],
  vulnerabilities_open: { taken: 1, latest: 0 },
  blocked: null,
};
/** The review as the seeded workspace answers it today: version 2 is still a draft. */
const latest = {
  ...behind,
  latest: null,
  behind: 0,
  newer_drafts: 1,
  versions: [],
  affected_controls: [],
  determinations: { taken: 54, carried: 0, judged: 0, to_review: 0 },
  vulnerabilities_fixed: [],
  vulnerabilities_open: { taken: 1, latest: null },
  blocked: { code: "latest", message: "This component is built from the latest published version" },
};

describe("what Take version shows before it writes", () => {
  it("asks for the system component alone, and reads the version taken, the latest and what lies between", async () => {
    const { client, calls } = rpc(behind);
    const review = await readComponentVersionReview(client, context, uuid(10));
    expect(calls).toHaveLength(1);
    expect(calls[0]?.table).toBe("rpc:component_version_review");
    expect(sent(calls[0])).toEqual({ p_system_component_id: uuid(10) });
    expect(args(calls[0], "setHeader")).toEqual([["Authorization", "Bearer token"]]);
    // The component, at the revision the command is sent with, and where it sits.
    expect(review.systemComponent).toEqual({
      id: uuid(10),
      code: "LRU-001",
      name: "Mission Computer",
      version: null,
      revision: 4,
      assignmentId: null,
      appliedAt: "2026-11-15T17:52:07.704878+00:00",
    });
    expect(review.program.code).toBe("PRG-1090");
    expect(review.system.code).toBe("SYS-WSX90");
    expect(review.element).toEqual({
      id: uuid(22),
      code: "CN-109101",
      name: "Mission Computer",
      productElementId: null,
      modified: false,
    });
    expect(review.component).toEqual({
      name: "Mission Computer",
      componentType: "hardware",
      definitionId: uuid(30),
      definitionCode: "x800-components",
      definitionName: "X800 Missile component set",
      ownerPartyId: uuid(2),
    });
    expect(review.taken).toMatchObject({ definedComponentId: uuid(31), version: 1 });
    expect(review.latest).toEqual({
      definedComponentId: uuid(33),
      revisionId: uuid(34),
      version: 2,
      publishedAt: "2026-11-16T09:00:00+00:00",
    });
    expect([review.behind, review.newerDrafts]).toEqual([1, 0]);
    // Each published version after the one taken, with what it changes.
    expect(review.versions).toEqual([
      {
        revisionId: uuid(34),
        version: 2,
        publishedAt: "2026-11-16T09:00:00+00:00",
        definedComponentId: uuid(33),
        change,
      },
    ]);
    // A control the change affects: what each version reads on it, where the program stands on
    // it, and whether the element inherits it today.
    expect(review.affectedControls).toEqual([
      {
        id: uuid(50),
        code: "RA-5",
        title: "Vulnerability Monitoring and Scanning",
        versions: [2],
        takenStatus: "other_than_satisfied",
        latestStatus: "not_assessed",
        toReview: true,
        controlStatus: "other_than_satisfied",
        determinedBy: "program",
        inherited: true,
      },
      // One neither version claims, outside the program's control baseline.
      {
        id: uuid(51),
        code: "SI-2",
        title: "Flaw Remediation",
        versions: [2],
        takenStatus: null,
        latestStatus: null,
        toReview: false,
        controlStatus: null,
        determinedBy: null,
        inherited: false,
      },
    ]);
    expect(review.determinations).toEqual({ taken: 54, carried: 53, judged: 0, toReview: 1 });
    expect(review.vulnerabilitiesFixed).toEqual([
      {
        id: uuid(60),
        cveId: "CVE-2024-6387",
        title: "Signal handler race in OpenSSH's sshd (regreSSHion)",
        severity: "high",
        fixedIn: "OpenSSH 9.8p1",
        latestState: "fixed",
        issue: {
          id: uuid(61),
          title: "CVE-2024-6387 in the OpenSSH server (regreSSHion)",
          status: "open",
          severity: "high",
        },
      },
    ]);
    expect(review.vulnerabilitiesOpen).toEqual({ taken: 1, latest: 0 });
    expect(review.blocked).toBeNull();
  });

  it("says why a component on the latest version takes none, as a sentence", async () => {
    const { client } = rpc(latest);
    const review = await readComponentVersionReview(client, context, uuid(10));
    expect(review.latest).toBeNull();
    expect(review.newerDrafts).toBe(1);
    expect(review.versions).toEqual([]);
    // No SBOM of a newer version is recorded: not known, which is not none.
    expect(review.vulnerabilitiesOpen).toEqual({ taken: 1, latest: null });
    expect(review.blocked).toEqual({
      code: "latest",
      message: "This component is built from the latest published version.",
    });
  });

  it("reads a component built from no library component as nothing to review", async () => {
    const { client } = rpc({
      ...head,
      component: null,
      taken: null,
      latest: null,
      behind: 0,
      newer_drafts: 0,
      versions: [],
      affected_controls: [],
      determinations: null,
      vulnerabilities_fixed: [],
      vulnerabilities_open: null,
      blocked: {
        code: "not_library",
        message: "This component is built from no library component, so it has no version to take",
      },
    });
    const review = await readComponentVersionReview(client, context, uuid(10));
    expect(review).toMatchObject({
      component: null,
      taken: null,
      latest: null,
      determinations: null,
      vulnerabilitiesOpen: null,
      blocked: { code: "not_library" },
    });
  });

  it("knows each reason a version cannot be taken, and refuses one it does not", async () => {
    expect([...VERSION_BLOCKS]).toEqual(["not_library", "latest", "assignment", "product"]);
    for (const code of ["assignment", "product"]) {
      const { client } = rpc({
        ...behind,
        blocked: {
          code,
          message: "A variant takes a newer component version through its product.",
        },
      });
      await expect(readComponentVersionReview(client, context, uuid(10))).resolves.toMatchObject({
        blocked: {
          code,
          message: "A variant takes a newer component version through its product.",
        },
      });
    }
    for (const data of [
      { ...behind, blocked: { code: "retired", message: "This component is retired" } },
      // A status, a determiner or a CVE state the product has no word for.
      {
        ...behind,
        affected_controls: [{ ...behind.affected_controls[0], latest_status: "not_covered" }],
      },
      {
        ...behind,
        affected_controls: [{ ...behind.affected_controls[0], determined_by: "supplier" }],
      },
      {
        ...behind,
        vulnerabilities_fixed: [{ ...behind.vulnerabilities_fixed[0], latest_state: "patched" }],
      },
    ]) {
      const { client } = rpc(data);
      await expect(readComponentVersionReview(client, context, uuid(10))).rejects.toThrow();
    }
  });

  it("passes a refusal on as it is", async () => {
    const { client } = rpc(null, { code: "42501", message: "Component access is required" });
    await expect(readComponentVersionReview(client, context, uuid(10))).rejects.toThrow(
      "Component access is required",
    );
  });
});

describe("the request Take version sends", () => {
  it("names the latest version of the same component, at the revision reviewed", async () => {
    const review = await readComponentVersionReview(rpc(behind).client, context, uuid(10));
    expect(versionToTake(review)).toEqual({
      take: { systemComponentId: uuid(10), definedComponentId: uuid(33), expectedRevision: 4 },
    });
  });

  it("waits with the review's reason where the version cannot be taken", async () => {
    const review = await readComponentVersionReview(rpc(latest).client, context, uuid(10));
    expect(versionToTake(review)).toEqual({
      waits: "This component is built from the latest published version.",
    });
    expect(versionToTake({ ...review, blocked: null })).toEqual({ waits: TAKE_NEEDS_VERSION });
  });
});

describe("taking a component version", () => {
  const request = {
    systemComponentId: uuid(10),
    definedComponentId: uuid(33),
    expectedRevision: 4,
    requestId: uuid(99),
  };
  const answered = {
    systemComponentId: uuid(10),
    programId: uuid(20),
    definedComponentId: uuid(33),
    previousDefinedComponentId: uuid(31),
    version: 2,
    previousVersion: 1,
    revision: 5,
    appliedAt: "2026-11-16T10:00:00+00:00",
    carried: 53,
    judged: 0,
    toReview: 1,
    activityEventId: uuid(98),
  };

  it("sends one request at the revision the reader reviewed, and reads what stands on the version taken", async () => {
    const { client, calls } = rpc(answered);
    await expect(takeComponentVersion(client, context, request)).resolves.toEqual(answered);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.table).toBe("rpc:take_component_version");
    expect(sent(calls[0])).toEqual({
      p_tenant_id: uuid(1),
      p_system_component_id: uuid(10),
      p_defined_component_id: uuid(33),
      p_expected_revision: 4,
      p_request_id: uuid(99),
    });
    expect(args(calls[0], "setHeader")).toEqual([["Authorization", "Bearer token"]]);
  });

  it("sends the same request again as it is", async () => {
    const { client, calls } = rpc(answered);
    await takeComponentVersion(client, context, request);
    await takeComponentVersion(client, context, request);
    expect(sent(calls[1])).toEqual(sent(calls[0]));
  });

  it("sends nothing without the version to take or the revision reviewed", async () => {
    const { client, calls } = rpc(answered);
    await expect(
      takeComponentVersion(client, context, { ...request, definedComponentId: "" }),
    ).rejects.toThrow(TAKE_NEEDS_VERSION);
    await expect(
      takeComponentVersion(client, context, { ...request, expectedRevision: Number.NaN }),
    ).rejects.toThrow(TAKE_REVISION_MISSING);
    expect(calls).toEqual([]);
  });

  it("says each refusal in the command's own words, ending a sentence", async () => {
    for (const [message, said] of [
      [
        "This component changed since you reviewed the version. Review it again.",
        "This component changed since you reviewed the version. Review it again.",
      ],
      [
        "This component came through a library assignment. Take the newer version from the program's Library tab, which moves its claims with it.",
        "This component came through a library assignment. Take the newer version from the program's Library tab, which moves its claims with it.",
      ],
      ["Only a published version can be taken", "Only a published version can be taken."],
      ["Choose a newer version than the one in use", "Choose a newer version than the one in use."],
      [
        "An editor, admin, or owner can take a component version",
        "An editor, admin, or owner can take a component version.",
      ],
    ] as const) {
      const { client } = rpc(null, { message });
      await expect(takeComponentVersion(client, context, request)).rejects.toThrow(said);
    }
  });

  it("says when the answer cannot be read, since the version may have been taken", async () => {
    const { client } = rpc({ ...answered, carried: "fifty-three" });
    await expect(takeComponentVersion(client, context, request)).rejects.toThrow(
      TAKE_ANSWER_UNREADABLE,
    );
  });
});
