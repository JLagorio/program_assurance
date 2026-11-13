import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { parameterReadings, readProgramControlParameters, readingText, readingTitle } =
  await import("./control-parameters");
type ProgramControlParameters = import("./control-parameters").ProgramControlParameters;

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
const tailoring = {
  kind: "tailoring",
  title: "Program tailoring",
  resolutionId: "top-a",
} as const;

describe("readProgramControlParameters", () => {
  it("asks for the program and the control as the reader and names each fact as the product does", async () => {
    const server = client({
      data: {
        selected: true,
        stacks: [
          {
            choice_id: "choice-a",
            resolution_id: "top-a",
            title: "Program tailoring",
            parameters: [
              {
                parameter_id: "goals",
                values: ["Anticipate", "Withstand"],
                source: {
                  kind: "tailoring",
                  title: "Program tailoring",
                  resolution_id: "top-a",
                },
                rationale: "From the mission threat assessment.",
              },
              {
                parameter_id: "frequency",
                values: ["annually"],
                source: { kind: "catalog" },
                rationale: null,
              },
              { parameter_id: "events", values: [], source: null, rationale: null },
            ],
          },
        ],
      },
      error: null,
    });
    await expect(
      readProgramControlParameters(server.client, context, program, control),
    ).resolves.toEqual({
      selected: true,
      stacks: [
        {
          choiceId: "choice-a",
          resolutionId: "top-a",
          title: "Program tailoring",
          parameters: [
            {
              parameterId: "goals",
              values: ["Anticipate", "Withstand"],
              source: tailoring,
              rationale: "From the mission threat assessment.",
            },
            {
              parameterId: "frequency",
              values: ["annually"],
              source: { kind: "catalog" },
              rationale: null,
            },
            { parameterId: "events", values: [], source: null, rationale: null },
          ],
        },
      ],
    });
    expect(server.calls).toEqual([
      {
        name: "program_control_parameters",
        args: { p_program_id: program, p_control_id: control },
        headers: { Authorization: "Bearer token" },
      },
    ]);
  });

  it("says a refusal and an answer it cannot read", async () => {
    await expect(
      readProgramControlParameters(
        client({ data: null, error: { message: "Program access is required" } }).client,
        context,
        program,
        control,
      ),
    ).rejects.toThrow("Program access is required");
    await expect(
      readProgramControlParameters(
        client({ data: { selected: true }, error: null }).client,
        context,
        program,
        control,
      ),
    ).rejects.toThrow();
  });
});

/** A stack with the parameters given, each `[id, values, source]`. */
const stack = (
  title: string,
  resolutionId: string,
  parameters: [string, string[], "tailoring" | "catalog" | null][],
) => ({
  choiceId: `choice-${resolutionId}`,
  resolutionId,
  title,
  parameters: parameters.map(([parameterId, values, source]) => ({
    parameterId,
    values,
    source:
      source === "tailoring"
        ? { kind: "tailoring" as const, title: `${title} tailoring`, resolutionId }
        : source === "catalog"
          ? { kind: "catalog" as const }
          : null,
    rationale: source === "tailoring" ? `Set in ${title}.` : null,
  })),
});

describe("parameterReadings", () => {
  it("reads nothing where no stack selects the control", () => {
    expect(parameterReadings({ selected: false, stacks: [] })).toBeNull();
  });

  it("reads each parameter one way in one stack, a parameter with nothing set included", () => {
    const readings = parameterReadings({
      selected: true,
      stacks: [
        stack("Baseline A", "a", [
          ["frequency", ["monthly"], "tailoring"],
          ["events", [], null],
        ]),
      ],
    });
    expect(readings?.get("frequency")).toEqual([
      {
        values: ["monthly"],
        sources: [{ kind: "tailoring", title: "Baseline A tailoring", resolutionId: "a" }],
        stacks: ["Baseline A"],
        rationales: ["Set in Baseline A."],
      },
    ]);
    expect(readings?.get("events")).toEqual([
      { values: [], sources: [], stacks: ["Baseline A"], rationales: [] },
    ]);
  });

  it("reads stacks that agree as one, and stacks that disagree one way a set of values", () => {
    const answer: ProgramControlParameters = {
      selected: true,
      stacks: [
        stack("Baseline A", "a", [
          ["frequency", ["monthly"], "tailoring"],
          ["review", ["annually"], "catalog"],
          ["events", [], null],
        ]),
        stack("Baseline B", "b", [
          ["frequency", ["weekly"], "tailoring"],
          ["review", ["annually"], "catalog"],
          ["events", ["a breach"], "tailoring"],
        ]),
        stack("Baseline C", "c", [
          ["frequency", ["monthly"], "tailoring"],
          ["review", ["annually"], "catalog"],
          ["events", [], null],
        ]),
      ],
    };
    const readings = parameterReadings(answer);
    // Two stacks say monthly, through their own tailorings; one says weekly.
    expect(readings?.get("frequency")).toEqual([
      {
        values: ["monthly"],
        sources: [
          { kind: "tailoring", title: "Baseline A tailoring", resolutionId: "a" },
          { kind: "tailoring", title: "Baseline C tailoring", resolutionId: "c" },
        ],
        stacks: ["Baseline A", "Baseline C"],
        rationales: ["Set in Baseline A.", "Set in Baseline C."],
      },
      {
        values: ["weekly"],
        sources: [{ kind: "tailoring", title: "Baseline B tailoring", resolutionId: "b" }],
        stacks: ["Baseline B"],
        rationales: ["Set in Baseline B."],
      },
    ]);
    // The catalog's value, once, for every stack.
    expect(readings?.get("review")).toEqual([
      {
        values: ["annually"],
        sources: [{ kind: "catalog" }],
        stacks: ["Baseline A", "Baseline B", "Baseline C"],
        rationales: [],
      },
    ]);
    // A stack that sets nothing reads as nothing set, in its place.
    expect(readings?.get("events")?.map((reading) => reading.values)).toEqual([[], ["a breach"]]);
  });
});

describe("the words a reading is printed in", () => {
  it("joins the values and says where they come from", () => {
    const reading = {
      values: ["Anticipate", "Withstand", "Recover"],
      sources: [tailoring],
      stacks: ["Program tailoring"],
    };
    expect(readingText(reading)).toBe("Anticipate, Withstand, Recover");
    expect(readingTitle("cyber resiliency goals", reading, false)).toBe(
      "cyber resiliency goals, set by Program tailoring",
    );
    expect(
      readingTitle("frequency", { sources: [{ kind: "catalog" }], stacks: ["A"] }, false),
    ).toBe("frequency, set by the catalog");
    expect(
      readingTitle(
        "frequency",
        { sources: [{ ...tailoring, title: "B tailoring" }], stacks: ["Baseline B"] },
        true,
      ),
    ).toBe("frequency in Baseline B, set by B tailoring");
    expect(readingTitle("events", { sources: [], stacks: ["Baseline A"] }, true)).toBe(
      "events in Baseline A",
    );
  });
});
