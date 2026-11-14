import { describe, expect, it } from "vitest";

const {
  RESILIENCY_KINDS,
  RESILIENCY_PARAMETERS,
  readProgramResiliencyChoice,
  resiliencyParameter,
  resiliencyVocabulary,
  vocabularyValues,
} = await import("./resiliency-choice");
type FrameworkItem = import("./frameworks").FrameworkItem;

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

describe("readProgramResiliencyChoice", () => {
  it("asks for the program as the reader and names each list as the product does", async () => {
    const server = client({
      data: {
        selected: true,
        goals: ["goal.anticipate", "goal.withstand"],
        objectives: ["objective.constrain"],
        techniques: ["technique.segmentation"],
        approaches: ["approach.predefined-segmentation"],
        design_principles: [
          "strategic-principle.reduce-attack-surfaces",
          "structural-principle.limit-the-need-for-trust",
        ],
        unmatched: ["Zero trust"],
      },
      error: null,
    });
    await expect(readProgramResiliencyChoice(server.client, context, program)).resolves.toEqual({
      selected: true,
      goals: ["goal.anticipate", "goal.withstand"],
      objectives: ["objective.constrain"],
      techniques: ["technique.segmentation"],
      approaches: ["approach.predefined-segmentation"],
      designPrinciples: [
        "strategic-principle.reduce-attack-surfaces",
        "structural-principle.limit-the-need-for-trust",
      ],
      unmatched: ["Zero trust"],
    });
    expect(server.calls).toEqual([
      {
        name: "program_resiliency_choice",
        args: { p_program_id: program },
        headers: { Authorization: "Bearer token" },
      },
    ]);
  });

  it("answers a program without SA-24 as not selected, with empty lists", async () => {
    const server = client({
      data: {
        selected: false,
        goals: [],
        objectives: [],
        techniques: [],
        approaches: [],
        design_principles: [],
        unmatched: [],
      },
      error: null,
    });
    await expect(readProgramResiliencyChoice(server.client, context, program)).resolves.toEqual({
      selected: false,
      goals: [],
      objectives: [],
      techniques: [],
      approaches: [],
      designPrinciples: [],
      unmatched: [],
    });
  });

  it("fails with the server's words, and refuses an answer of another shape", async () => {
    const refused = client({ data: null, error: { message: "Program access is required" } });
    await expect(readProgramResiliencyChoice(refused.client, context, program)).rejects.toThrow(
      "Program access is required",
    );
    // A missing list is not an empty one: the choice is never read as nothing chosen.
    const partial = client({ data: { selected: true, goals: [] }, error: null });
    await expect(readProgramResiliencyChoice(partial.client, context, program)).rejects.toThrow();
  });
});

/** A framework item as `framework_item_rows` answers, with what the vocabulary reads. */
function item(
  kind: string,
  code: string,
  title: string,
  ordinal: number,
  parent?: { code: string; title: string },
  printedIn = "Table D-4",
): FrameworkItem {
  return {
    id: code,
    framework_code: "nist-sp800-160v2r1-cref",
    framework_revision_id: "revision",
    kind,
    code,
    code_order: code,
    title,
    prose: null,
    ordinal,
    props: {},
    printed_in: printedIn,
    parent_item_id: parent?.code ?? null,
    parent_code: parent?.code ?? null,
    parent_kind: parent ? "technique" : null,
    parent_title: parent?.title ?? null,
  };
}

const deception = { code: "technique.deception", title: "Deception" };
const segmentation = { code: "technique.segmentation", title: "Segmentation" };
// In the order of their codes, as the read answers: not the publication's.
const items = [
  item("approach", "approach.disinformation", "Disinformation", 2, deception),
  item(
    "approach",
    "approach.dynamic-segmentation-and-isolation",
    "Dynamic Segmentation and Isolation",
    2,
    segmentation,
  ),
  item("approach", "approach.obfuscation", "Obfuscation", 1, deception),
  item("approach", "approach.predefined-segmentation", "Predefined Segmentation", 1, segmentation),
  item("goal", "goal.adapt", "Adapt", 4, undefined, "Table 2"),
  item("goal", "goal.anticipate", "Anticipate", 1, undefined, "Table 2"),
  item("goal", "goal.recover", "Recover", 3, undefined, "Table 2"),
  item("goal", "goal.withstand", "Withstand", 2, undefined, "Table 2"),
  item(
    "strategic-design-principle",
    "strategic-principle.reduce-attack-surfaces",
    "Reduce Attack Surfaces",
    3,
    undefined,
    "Table D-6",
  ),
  item(
    "structural-design-principle",
    "structural-principle.limit-the-need-for-trust",
    "Limit the Need for Trust",
    1,
    undefined,
    "Table D-9",
  ),
  item(
    "structural-design-principle",
    "structural-principle.maintain-redundancy",
    "Maintain Redundancy",
    6,
    undefined,
    "Table D-9",
  ),
  item("technique", "technique.deception", "Deception", 5),
  item("technique", "technique.segmentation", "Segmentation", 12),
];
const titles = (options: readonly { title: string }[]) => options.map((option) => option.title);

describe("resiliencyVocabulary", () => {
  it("names SA-24's five parameters and no other", () => {
    expect(RESILIENCY_PARAMETERS.map((parameter) => [parameter.sourceId, parameter.list])).toEqual([
      ["sa-24_odp.01", "goals"],
      ["sa-24_odp.02", "objectives"],
      ["sa-24_odp.03", "techniques"],
      ["sa-24_odp.04", "approaches"],
      ["sa-24_odp.05", "designPrinciples"],
    ]);
    expect(RESILIENCY_KINDS).toEqual([
      "goal",
      "objective",
      "technique",
      "approach",
      "strategic-design-principle",
      "structural-design-principle",
    ]);
    expect(resiliencyParameter("sa-24_odp.03")?.list).toBe("techniques");
    expect(resiliencyParameter("ac-02_odp.01")).toBeUndefined();
    expect(resiliencyVocabulary("ac-02_odp.01", items)).toBeNull();
  });

  it("lists a flat vocabulary in the publication's order, with where it is printed", () => {
    const goals = resiliencyVocabulary("sa-24_odp.01", items);
    expect(goals?.list).toBe("goals");
    expect(titles(goals?.options ?? [])).toEqual(["Anticipate", "Withstand", "Recover", "Adapt"]);
    expect(goals?.options[0]).toEqual({ code: "goal.anticipate", title: "Anticipate" });
    expect(goals?.groups).toEqual([]);
    expect(goals?.printedIn).toEqual(["Table 2"]);
    expect(titles(resiliencyVocabulary("sa-24_odp.03", items)?.options ?? [])).toEqual([
      "Deception",
      "Segmentation",
    ]);
  });

  it("puts each approach under its technique, the techniques in their own order", () => {
    const approaches = resiliencyVocabulary("sa-24_odp.04", items);
    expect(approaches?.groups.map((group) => [group.label, titles(group.options)])).toEqual([
      ["Deception", ["Obfuscation", "Disinformation"]],
      ["Segmentation", ["Predefined Segmentation", "Dynamic Segmentation and Isolation"]],
    ]);
    expect(titles(approaches?.options ?? [])).toEqual([
      "Obfuscation",
      "Disinformation",
      "Predefined Segmentation",
      "Dynamic Segmentation and Isolation",
    ]);
    // Read without the techniques, the groups stand in the order of the techniques' codes.
    const alone = resiliencyVocabulary(
      "sa-24_odp.04",
      items.filter((entry) => entry.kind === "approach"),
    );
    expect(alone?.groups.map((group) => group.label)).toEqual(["Deception", "Segmentation"]);
  });

  it("lists the strategic design principles before the structural ones, each under its kind", () => {
    const principles = resiliencyVocabulary("sa-24_odp.05", items);
    expect(principles?.groups.map((group) => [group.label, titles(group.options)])).toEqual([
      ["Strategic design principles", ["Reduce Attack Surfaces"]],
      ["Structural design principles", ["Limit the Need for Trust", "Maintain Redundancy"]],
    ]);
    expect(principles?.printedIn).toEqual(["Table D-6", "Table D-9"]);
  });

  it("answers nothing when the framework's reference data is not loaded", () => {
    expect(resiliencyVocabulary("sa-24_odp.01", [])).toBeNull();
    expect(
      resiliencyVocabulary(
        "sa-24_odp.02",
        items.filter((entry) => entry.kind === "goal"),
      ),
    ).toBeNull();
  });
});

describe("vocabularyValues", () => {
  const goals = resiliencyVocabulary("sa-24_odp.01", items)!;

  it("spells each value as the vocabulary does, in its order, whatever the case or the space around it", () => {
    expect(vocabularyValues(goals, ["  withstand ", "ANTICIPATE"])).toEqual([
      "Anticipate",
      "Withstand",
    ]);
    expect(vocabularyValues(goals, ["Adapt", "adapt"])).toEqual(["Adapt"]);
    expect(vocabularyValues(goals, [])).toEqual([]);
  });

  it("answers nothing when a value names no item, so typed text stays typed", () => {
    expect(vocabularyValues(goals, ["Anticipate", "Zero trust"])).toBeNull();
    expect(vocabularyValues(goals, ["Anticipate, Withstand"])).toBeNull();
    // A technique is not a goal.
    expect(vocabularyValues(goals, ["Segmentation"])).toBeNull();
  });
});
