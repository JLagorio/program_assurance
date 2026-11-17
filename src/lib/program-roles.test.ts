import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const { PROGRAM_ROLE_ORDER, RMF_ROLES, actStanding, readProgramRoles, readReaderRoles, roleActs } =
  await import("./program-roles");
const { programRoles } = await import("./status");
type ProgramRoleLine = import("./program-roles").ProgramRoleLine;
type ReaderRole = import("./program-roles").ReaderRole;

type Answer = { data: unknown; error: { message: string } | null };

/** A client whose `rpc` calls are recorded and answer with `answer`. */
function client(answer: Answer) {
  const calls: { name: string; args: Record<string, unknown>; headers: Record<string, string> }[] =
    [];
  return {
    calls,
    client: {
      rpc(name: string, args: Record<string, unknown>) {
        const call = { name, args, headers: {} as Record<string, string> };
        calls.push(call);
        const builder = {
          setHeader(key: string, value: string) {
            call.headers[key] = value;
            return builder;
          },
          abortSignal: () => builder,
          then: (resolve: (value: Answer) => unknown, reject: (reason: unknown) => unknown) =>
            Promise.resolve(answer).then(resolve, reject),
        };
        return builder;
      },
    } as never,
  };
}

const context = { token: "token" };
const program = "00000000-0000-4000-8000-000000000001";

/** One row of `program_roles`, every role in the vocabulary's order unless rows are given. */
const line = (role: string, more: Record<string, unknown> = {}) => ({
  role,
  role_rank: PROGRAM_ROLE_ORDER.indexOf(role as never) + 1,
  one_holder: role === "authorizing_official" || role === "lead_assessor",
  recorded: false,
  holders: [],
  ...more,
});
const holder = (name: string, more: Record<string, unknown> = {}) => ({
  assignment_id: `assignment-${name}`,
  party_id: `party-${name}`,
  name,
  party_type: "person",
  starts_on: null,
  ends_on: null,
  revision: 1,
  ...more,
});

/** The roles program_role_assignments.role allows, as the last migration that constrains it says. */
function constrainedRoles() {
  const migrations = fileURLToPath(new URL("../../supabase/migrations", import.meta.url));
  let roles: string[] = [];
  for (const file of readdirSync(migrations)
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    const sql = readFileSync(`${migrations}/${file}`, "utf8").replace(/--[^\n]*/g, "");
    for (const match of sql.matchAll(
      /(?:create table public\.program_role_assignments[\s\S]*?|add constraint program_role_assignments_role_check\s+)check\s*\(\s*role\s+in\s*\(([^)]*)\)/gi,
    ))
      roles = [...match[1]!.matchAll(/'([^']*)'/g)].map((value) => value[1]!);
  }
  return roles;
}

describe("program role vocabulary", () => {
  it("words every role the schema allows, and no other", () => {
    expect(constrainedRoles().sort()).toEqual(Object.keys(programRoles).sort());
  });

  it("orders RMF's roles first, the authorizing official and the lead assessor at the head", () => {
    expect(PROGRAM_ROLE_ORDER.slice(0, RMF_ROLES.length)).toEqual([...RMF_ROLES]);
    expect(programRoles.security_manager.label).toBe("ISSM");
    expect(programRoles.security_officer.label).toBe("ISSO");
    expect(Object.values(roleActs)).toEqual(["authorizing_official", "lead_assessor"]);
    for (const entry of Object.values(programRoles)) expect(entry.tone).toBe("neutral");
  });
});

describe("a program's roles", () => {
  it("asks program_roles for the program, as the reader", async () => {
    const { client: rpc, calls } = client({
      data: PROGRAM_ROLE_ORDER.map((role) => line(role)),
      error: null,
    });
    const roles = await readProgramRoles(rpc, context, program);
    expect(calls).toEqual([
      {
        name: "program_roles",
        args: { p_program_id: program },
        headers: { Authorization: "Bearer token" },
      },
    ]);
    expect(roles.map((item) => item.role)).toEqual(PROGRAM_ROLE_ORDER);
    expect(roles.every((item) => !item.recorded && item.holders.length === 0)).toBe(true);
  });

  it("reads each role's holders today in RMF's order, whatever order the answer gives", async () => {
    const { client: rpc } = client({
      data: [
        line("assessor", {
          recorded: true,
          holders: [holder("Elena Vasquez"), holder("Nadia Fournier")],
        }),
        line("authorizing_official", {
          recorded: true,
          holders: [holder("R. Calloway", { ends_on: "2027-09-30", revision: 2 })],
        }),
        line("lead_assessor", {
          recorded: true,
          holders: [holder("NAVWAR SCA", { party_type: "organization" })],
        }),
      ],
      error: null,
    });
    const roles = await readProgramRoles(rpc, context, program);
    expect(roles.map((item) => item.role)).toEqual([
      "authorizing_official",
      "lead_assessor",
      "assessor",
    ]);
    expect(roles[0]).toEqual({
      role: "authorizing_official",
      oneHolder: true,
      recorded: true,
      holders: [
        {
          assignmentId: "assignment-R. Calloway",
          partyId: "party-R. Calloway",
          name: "R. Calloway",
          partyType: "person",
          startsOn: null,
          endsOn: "2027-09-30",
          revision: 2,
        },
      ],
    });
    expect(roles[1]!.holders[0]!.partyType).toBe("organization");
    expect(roles[2]!.oneHolder).toBe(false);
    expect(roles[2]!.holders.map((item) => item.name)).toEqual(["Elena Vasquez", "Nadia Fournier"]);
  });

  it("says a refusal, and refuses an answer in another shape", async () => {
    await expect(
      readProgramRoles(
        client({ data: null, error: { message: "Program access is required" } }).client,
        context,
        program,
      ),
    ).rejects.toThrow("Program access is required");
    await expect(
      readProgramRoles(
        client({ data: [line("chief_of_staff")], error: null }).client,
        context,
        program,
      ),
    ).rejects.toThrow();
  });
});

describe("the reader's roles", () => {
  it("asks program_reader_roles for the program and reads each role the reader holds", async () => {
    const { client: rpc, calls } = client({
      data: [
        {
          role: "assessor",
          role_rank: 3,
          party_id: "party-me",
          holder_party_id: "party-me",
          assignment_id: "assignment-assessor",
          starts_on: "2026-07-01",
          ends_on: null,
        },
        {
          role: "lead_assessor",
          role_rank: 2,
          party_id: "party-me",
          holder_party_id: "party-office",
          assignment_id: "assignment-lead",
          starts_on: null,
          ends_on: null,
        },
      ],
      error: null,
    });
    const roles = await readReaderRoles(rpc, context, program);
    expect(calls).toEqual([
      {
        name: "program_reader_roles",
        args: { p_program_id: program },
        headers: { Authorization: "Bearer token" },
      },
    ]);
    expect(roles).toEqual([
      {
        role: "lead_assessor",
        partyId: "party-me",
        holderPartyId: "party-office",
        assignmentId: "assignment-lead",
        startsOn: null,
        endsOn: null,
      },
      {
        role: "assessor",
        partyId: "party-me",
        holderPartyId: "party-me",
        assignmentId: "assignment-assessor",
        startsOn: "2026-07-01",
        endsOn: null,
      },
    ]);
  });

  it("reads a reader who holds nothing as no role", async () => {
    expect(
      await readReaderRoles(client({ data: [], error: null }).client, context, program),
    ).toEqual([]);
  });
});

describe("where an act stands for the reader", () => {
  const roles = (lines: Partial<Record<string, Partial<ProgramRoleLine>>>): ProgramRoleLine[] =>
    PROGRAM_ROLE_ORDER.map((role) => ({
      role,
      oneHolder: role === "authorizing_official" || role === "lead_assessor",
      recorded: false,
      holders: [],
      ...lines[role],
    }));
  const calloway = {
    assignmentId: "a1",
    partyId: "calloway",
    name: "R. Calloway",
    partyType: "person" as const,
    startsOn: null,
    endsOn: null,
    revision: 1,
  };
  const reader = (role: ReaderRole["role"]): ReaderRole => ({
    role,
    partyId: "me",
    holderPartyId: "me",
    assignmentId: `mine-${role}`,
    startsOn: null,
    endsOn: null,
  });

  it("leaves an act open where the program records nobody in its role", () => {
    expect(actStanding(roles({}), [], "authorization_decision")).toEqual({
      role: "authorizing_official",
      heldToRole: false,
      readerMay: true,
      holders: [],
    });
  });

  it("holds an act to its role once recorded: the holder may, anyone else waits on them", () => {
    const recorded = roles({ authorizing_official: { recorded: true, holders: [calloway] } });
    expect(actStanding(recorded, [reader("assessor")], "authorization_decision")).toEqual({
      role: "authorizing_official",
      heldToRole: true,
      readerMay: false,
      holders: [calloway],
    });
    expect(
      actStanding(recorded, [reader("authorizing_official")], "authorization_decision").readerMay,
    ).toBe(true);
    // Another act is not held by this role.
    expect(actStanding(recorded, [], "publish_assessment_results").readerMay).toBe(true);
  });

  it("lets nobody act on a role recorded with no holder today", () => {
    const lapsed = roles({ lead_assessor: { recorded: true, holders: [] } });
    expect(actStanding(lapsed, [reader("assessor")], "publish_assessment_results")).toEqual({
      role: "lead_assessor",
      heldToRole: true,
      readerMay: false,
      holders: [],
    });
  });
});
