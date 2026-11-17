import { describe, expect, it } from "vitest";

const { programSlot, programWait } = await import("./program-slot");
const { PROGRAM_ROLE_ORDER } = await import("./program-roles");
type ProgramRoleLine = import("./program-roles").ProgramRoleLine;
type ReaderRole = import("./program-roles").ReaderRole;
type RoleHolder = import("./program-roles").RoleHolder;
type ProgramWait = import("./program-slot").ProgramWait;

const person = (name: string): RoleHolder => ({
  assignmentId: `assignment-${name}`,
  partyId: `party-${name}`,
  name,
  partyType: "person",
  startsOn: null,
  endsOn: null,
  revision: 1,
});
const calloway = person("R. Calloway");
const okafor = person("D. Okafor");

/** Every role of a program, each recorded with today's holders where given. */
const roles = (held: Partial<Record<string, RoleHolder[]>> = {}): ProgramRoleLine[] =>
  PROGRAM_ROLE_ORDER.map((role) => ({
    role,
    oneHolder: role === "authorizing_official" || role === "lead_assessor",
    recorded: role in held,
    holders: held[role] ?? [],
  }));
/** WS-X90's: an authorizing official and a lead assessor, and the reader an assessor. */
const wsx90 = roles({
  authorizing_official: [calloway],
  lead_assessor: [okafor],
  assessor: [person("Nadia Fournier"), person("Local developer")],
});
const as = (...held: ReaderRole["role"][]): ReaderRole[] =>
  held.map((role) => ({
    role,
    partyId: "party-me",
    holderPartyId: "party-me",
    assignmentId: `mine-${role}`,
    startsOn: null,
    endsOn: null,
  }));

const decision = (since: string, versionId = `version-${since}`): ProgramWait => ({
  kind: "package",
  versionId,
  packageId: "package",
  packageTitle: "Customer B security plan approval package",
  version: 1,
  since,
});
const results = (since: string, resultsId = `results-${since}`): ProgramWait => ({
  kind: "assessment_results",
  resultsId,
  resultsTitle: "Interim results — expanded control set, increment 2",
  campaignId: "campaign",
  campaignTitle: "WS-X90 Expanded Control Set Assessment",
  version: 3,
  findings: 20,
  since,
});
const none = {};

describe("the program's action slot", () => {
  it("keeps today's header where the program records nobody in any role", () => {
    expect(
      programSlot({
        roles: roles(),
        reader: [],
        canWrite: true,
        waits: [decision("2026-11-03")],
        unowned: { risks: 4 },
      }),
    ).toEqual({ form: "unrecorded" });
  });

  it("gives the authorizing official the decision to sign, and everyone else the wait on them", () => {
    const waits = [results("2026-11-13"), decision("2026-11-03")];
    expect(
      programSlot({
        roles: wsx90,
        reader: as("authorizing_official"),
        canWrite: true,
        waits,
        unowned: none,
      }),
    ).toEqual({
      form: "sign",
      wait: waits[1],
      role: "authorizing_official",
    });
    // A decision waits before results, whoever else is waited on.
    expect(
      programSlot({ roles: wsx90, reader: as("assessor"), canWrite: true, waits, unowned: none }),
    ).toEqual({
      form: "waiting",
      wait: waits[1],
      role: "authorizing_official",
      holder: calloway,
    });
  });

  it("gives the lead assessor the results to publish, and everyone else the wait on them", () => {
    const waits = [results("2026-11-13")];
    expect(
      programSlot({
        roles: wsx90,
        reader: as("lead_assessor"),
        canWrite: true,
        waits,
        unowned: none,
      }),
    ).toEqual({
      form: "advance",
      step: { kind: "publish", wait: waits[0] },
    });
    expect(
      programSlot({ roles: wsx90, reader: as("assessor"), canWrite: true, waits, unowned: none }),
    ).toEqual({
      form: "waiting",
      wait: waits[0],
      role: "lead_assessor",
      holder: okafor,
    });
    // The authorizing official waits on the lead assessor too.
    expect(
      programSlot({
        roles: wsx90,
        reader: as("authorizing_official"),
        canWrite: true,
        waits,
        unowned: none,
      }),
    ).toMatchObject({ form: "waiting", holder: okafor });
  });

  it("puts the reader's own act before a wait on somebody else", () => {
    const waits = [decision("2026-11-03"), results("2026-11-13")];
    expect(
      programSlot({
        roles: wsx90,
        reader: as("lead_assessor"),
        canWrite: true,
        waits,
        unowned: none,
      }),
    ).toEqual({
      form: "advance",
      step: { kind: "publish", wait: waits[1] },
    });
  });

  it("takes the oldest of each kind first", () => {
    const waits = [decision("2026-11-10", "newer"), decision("2026-11-03", "older")];
    expect(
      programSlot({
        roles: wsx90,
        reader: as("authorizing_official"),
        canWrite: true,
        waits,
        unowned: none,
      }),
    ).toMatchObject({ form: "sign", wait: { versionId: "older" } });
  });

  it("offers a viewer no act, even one their role holds: they see the wait or nothing", () => {
    const waits = [results("2026-11-13")];
    expect(
      programSlot({
        roles: wsx90,
        reader: as("lead_assessor"),
        canWrite: false,
        waits,
        unowned: { risks: 3 },
      }),
    ).toEqual({
      form: "none",
    });
    expect(
      programSlot({ roles: wsx90, reader: [], canWrite: false, waits, unowned: { risks: 3 } }),
    ).toMatchObject({
      form: "waiting",
      holder: okafor,
    });
  });

  it("names nobody where the act is not held to a role, or nobody holds the role today", () => {
    // Customer B records a lead assessor and no authorizing official: its submitted version waits on nobody named.
    const customerB = roles({ lead_assessor: [person("Ray Colston")] });
    expect(
      programSlot({
        roles: customerB,
        reader: [],
        canWrite: true,
        waits: [decision("2026-11-03")],
        unowned: none,
      }),
    ).toEqual({ form: "none" });
    const lapsed = roles({ authorizing_official: [] });
    expect(
      programSlot({
        roles: lapsed,
        reader: [],
        canWrite: true,
        waits: [decision("2026-11-03")],
        unowned: none,
      }),
    ).toEqual({ form: "none" });
  });

  it("falls to the program's own step: open risks nobody owns, else open operational issues", () => {
    expect(
      programSlot({
        roles: wsx90,
        reader: as("assessor"),
        canWrite: true,
        waits: [],
        unowned: { risks: 12, issues: 3 },
      }),
    ).toEqual({
      form: "advance",
      step: { kind: "assign_owner", collection: "risks", count: 12 },
    });
    expect(
      programSlot({
        roles: wsx90,
        reader: as("assessor"),
        canWrite: true,
        waits: [],
        unowned: { risks: 0, issues: 3 },
      }),
    ).toEqual({
      form: "advance",
      step: { kind: "assign_owner", collection: "operational_issues", count: 3 },
    });
    // A count that could not be read is no step, never a zero.
    expect(
      programSlot({ roles: wsx90, reader: as("assessor"), canWrite: true, waits: [], unowned: {} }),
    ).toEqual({
      form: "none",
    });
  });

  it("waits on the holder before offering the program's own step", () => {
    expect(
      programSlot({
        roles: wsx90,
        reader: as("assessor"),
        canWrite: true,
        waits: [results("2026-11-13")],
        unowned: { risks: 12 },
      }),
    ).toMatchObject({ form: "waiting", holder: okafor });
  });
});

describe("a Review queue row as a wait", () => {
  const row = {
    id: "row",
    parent_id: "parent",
    parent_name: "Parent",
    name: "Name",
    version_number: 2,
    waiting_since: "2026-11-13T20:22:31Z",
    determination_count: 20,
  };
  it("reads a submitted version and draft results", () => {
    expect(programWait({ ...row, kind: "package" })).toEqual({
      kind: "package",
      versionId: "row",
      packageId: "parent",
      packageTitle: "Name",
      version: 2,
      since: "2026-11-13T20:22:31Z",
    });
    expect(programWait({ ...row, kind: "assessment_results" })).toEqual({
      kind: "assessment_results",
      resultsId: "row",
      resultsTitle: "Name",
      campaignId: "parent",
      campaignTitle: "Parent",
      version: 2,
      findings: 20,
      since: "2026-11-13T20:22:31Z",
    });
  });
  it("leaves out another kind, and a row with no moment", () => {
    expect(programWait({ ...row, kind: "gate" })).toBeNull();
    expect(programWait({ ...row, kind: "package", waiting_since: null })).toBeNull();
  });
});
