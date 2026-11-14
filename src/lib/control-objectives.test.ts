import { describe, expect, it } from "vitest";

const {
  coveredSomewhere,
  objectivesShortOn,
  readControlObjectiveCounts,
  readProgramControlObjectives,
  uncoveredObjectives,
} = await import("./control-objectives");

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

const context = { tenantId: "tenant", token: "token" };
const program = "00000000-0000-4000-8000-000000000001";
const control = "00000000-0000-4000-8000-000000000002";

const one = "00000000-0000-4000-8000-000000000011";
const two = "00000000-0000-4000-8000-000000000012";

/** An objective as the server answers it: covered on the systems named, of the two that select it. */
const objective = (id: string, label: string, on: string[], evidenced = false) => ({
  id,
  label,
  prose: `${label} is determined;`,
  ancestors: ["root", "a"],
  mapped: on.length === 2,
  evidenced,
  mapped_on: on,
});

/** A system that selects the control, as the server answers it. */
const system = (id: string, code: string, mapped: number, allocated: number) => ({
  id,
  code,
  name: `${code} system`,
  mapped: mapped === 3,
  evidenced: false,
  objectives_mapped: mapped,
  objectives_evidenced: 0,
  allocated,
});

describe("readProgramControlObjectives", () => {
  it("asks for one control in the program as the reader and keeps the reading order", async () => {
    const server = client({
      data: {
        program_id: program,
        control_id: control,
        objectives: [
          objective("a.1", "AC-02a.[01]", [one, two], true),
          objective("a.2", "AC-02a.[02]", []),
          objective("b", "AC-02b.", [one]),
        ],
        systems: [system(one, "SYS-A", 2, 4), system(two, "SYS-B", 1, 0)],
        requirements: [
          { id: "r1", code: "REQ-001", evidenced: true, owes: false },
          { id: "r2", code: "REQ-002", evidenced: false, owes: true },
        ],
      },
      error: null,
    });
    const answer = await readProgramControlObjectives(server.client, context, program, control);
    expect(server.calls).toEqual([
      {
        name: "program_control_objectives",
        args: { p_program_id: program, p_control_id: control },
        headers: { Authorization: "Bearer token" },
      },
    ]);
    expect(answer.objectives.map((each) => each.label)).toEqual([
      "AC-02a.[01]",
      "AC-02a.[02]",
      "AC-02b.",
    ]);
    expect(answer.objectives[0]).toMatchObject({
      mapped: true,
      evidenced: true,
      mappedOn: [one, two],
    });
    // Covered on one of the two systems that select the control: not mapped, but somewhere.
    expect(answer.objectives[2]).toMatchObject({ mapped: false, mappedOn: [one] });
    expect(coveredSomewhere(answer.objectives[2]!)).toBe(true);
    // What Map N more objectives opens on: the objectives no system covers yet.
    expect(uncoveredObjectives(answer.objectives).map((each) => each.id)).toEqual(["a.2"]);
    // What Map on SYS-B opens on: the objectives that system does not cover.
    expect(objectivesShortOn(answer.objectives, two).map((each) => each.id)).toEqual(["a.2", "b"]);
    expect(answer.systems).toEqual([
      {
        id: one,
        code: "SYS-A",
        name: "SYS-A system",
        mapped: false,
        evidenced: false,
        objectivesMapped: 2,
        objectivesEvidenced: 0,
        allocated: 4,
      },
      {
        id: two,
        code: "SYS-B",
        name: "SYS-B system",
        mapped: false,
        evidenced: false,
        objectivesMapped: 1,
        objectivesEvidenced: 0,
        allocated: 0,
      },
    ]);
    expect(answer.requirements.find((each) => each.owes)?.code).toBe("REQ-002");
  });

  it("covers an objective by any mapping where no system selects the control", () => {
    // Mapped, and on no system: no system selects the control, so any mapping covers it.
    const pooled = { mapped: true, mappedOn: [] };
    expect(coveredSomewhere(pooled)).toBe(true);
    expect(uncoveredObjectives([pooled])).toEqual([]);
  });

  it("says the server's refusal, and refuses an answer it cannot read", async () => {
    await expect(
      readProgramControlObjectives(
        client({ data: null, error: { message: "Program access is required" } }).client,
        context,
        program,
        control,
      ),
    ).rejects.toThrow("Program access is required");
    await expect(
      readProgramControlObjectives(
        client({
          data: {
            program_id: program,
            control_id: control,
            objectives: [{ id: "a.1" }],
            systems: [],
            requirements: [],
          },
          error: null,
        }).client,
        context,
        program,
        control,
      ),
    ).rejects.toThrow();
  });
});

describe("readControlObjectiveCounts", () => {
  const second = "00000000-0000-4000-8000-000000000003";
  it("counts one control in every program asked for, in one request, as the reader", async () => {
    const server = client({
      data: {
        control_id: control,
        programs: [
          { program_id: program, objectives: 9, objectives_mapped: 3, objectives_evidenced: 1 },
          { program_id: second, objectives: 9, objectives_mapped: 0, objectives_evidenced: 0 },
        ],
      },
      error: null,
    });
    const answer = await readControlObjectiveCounts(server.client, context, control, [
      program,
      second,
    ]);
    expect(server.calls).toEqual([
      {
        name: "control_objective_counts",
        args: { p_control_id: control, p_program_ids: [program, second] },
        headers: { Authorization: "Bearer token" },
      },
    ]);
    expect(answer.programs.get(program)).toEqual({
      programId: program,
      objectives: 9,
      mapped: 3,
      evidenced: 1,
    });
    expect(answer.programs.get(second)?.mapped).toBe(0);
  });

  it("asks nothing for no program, and says the server's refusal", async () => {
    const none = client({ data: null, error: null });
    const answer = await readControlObjectiveCounts(none.client, context, control, []);
    expect(none.calls).toEqual([]);
    expect(answer.programs.size).toBe(0);
    await expect(
      readControlObjectiveCounts(
        client({ data: null, error: { message: "Program access is required" } }).client,
        context,
        control,
        [program],
      ),
    ).rejects.toThrow("Program access is required");
  });
});
