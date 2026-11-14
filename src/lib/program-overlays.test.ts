import { describe, expect, it } from "vitest";
import { deriveStack, type StackDecision } from "./baseline-stack";

const {
  ProgramOverlaysError,
  newerVersion,
  newestVersions,
  restackPreview,
  setProgramBaselineOverlays,
  stackShape,
  tailoringDecisions,
} = await import("./program-overlays");

const add = (controlId: string, rationale = `Adds ${controlId}.`): StackDecision => ({
  controlId,
  action: "include",
  rationale,
});
const remove = (controlId: string, rationale = `Removes ${controlId}.`): StackDecision => ({
  controlId,
  action: "exclude",
  rationale,
});
const overlay = (id: string, decisions: StackDecision[]) => ({
  id,
  title: `Overlay ${id}`,
  decisions,
});

const reference = ["ac-1", "ac-2", "au-2", "pe-3"];
const A = overlay("A", [add("sc-7"), remove("pe-3")]);
const B = overlay("B", [add("si-4")]);
const C = overlay("C", [add("sa-24")]);
/** A saved stack, as the Control baseline view reads one: the overlays, then the tailoring. */
function saved(overlays: ReturnType<typeof overlay>[], tailoring: StackDecision[] | null) {
  return deriveStack(reference, [
    ...overlays.map((item) => ({
      key: `${item.id}-layer`,
      kind: "overlay" as const,
      title: item.title,
      overlayId: item.id,
      decisions: item.decisions,
    })),
    ...(tailoring
      ? [
          {
            key: "tailoring-layer",
            kind: "tailoring" as const,
            title: "Program tailoring",
            decisions: tailoring,
          },
        ]
      : []),
  ]);
}
const programTailoring = [add("sa-24", "The program designs for resiliency."), remove("au-2")];

describe("the stack a program profile holds", () => {
  it("reads its overlays bottom up and its tailoring last", () => {
    expect(stackShape(saved([A, B], programTailoring))).toEqual({
      overlayIds: ["A", "B"],
      tailoring: true,
      supported: true,
    });
    expect(stackShape(saved([], null))).toEqual({
      overlayIds: [],
      tailoring: false,
      supported: true,
    });
  });

  it("is not one the command keeps in order when a tailoring sits beneath an overlay", () => {
    const layered = deriveStack(reference, [
      { key: "t", kind: "tailoring", title: "Program tailoring", decisions: [remove("ac-1")] },
      { key: "a", kind: "overlay", title: "Overlay A", overlayId: "A", decisions: A.decisions },
    ]);
    expect(stackShape(layered).supported).toBe(false);
  });

  it("reads the tailoring's decisions from its saved layer, with their rationales", () => {
    expect(tailoringDecisions(saved([A], programTailoring))).toEqual(programTailoring);
    expect(tailoringDecisions(saved([A], null))).toBeNull();
  });
});

describe("a changed stack, before it is sent", () => {
  const current = saved([A], programTailoring);
  const tailoring = {
    decisions: programTailoring,
    parameters: [{ sourceId: "sa-24_odp.01", controlId: "sa-24" }],
  };

  it("adds an overlay beneath the tailoring and counts what changes against the baseline now", () => {
    const preview = restackPreview(current, [A, B], tailoring);
    expect(preview.derivation.layers.map((layer) => layer.key)).toEqual(["A", "B", "tailoring"]);
    expect(preview.added).toEqual(["si-4"]);
    expect(preview.removed).toEqual([]);
    expect(preview.idle).toEqual([]);
    expect(preview.tailoring).toEqual({
      authored: true,
      decisions: 2,
      parameters: 1,
      alreadySelected: [],
      notInBaseline: [],
      parametersDropped: [],
    });
  });

  it("removes an overlay, and what it decided goes with it", () => {
    const preview = restackPreview(current, [], tailoring);
    expect(preview.derivation.layers.map((layer) => layer.key)).toEqual(["tailoring"]);
    expect(preview.added.sort()).toEqual(["pe-3"]);
    expect(preview.removed.sort()).toEqual(["sc-7"]);
  });

  it("leaves out of the tailoring what the new stack already makes true, and says so", () => {
    // C adds what the tailoring adds; an overlay that removes au-2 makes its removal moot too.
    const D = overlay("D", [remove("au-2")]);
    const preview = restackPreview(current, [A, C, D], tailoring);
    expect(preview.tailoring).toMatchObject({
      authored: true,
      decisions: 0,
      parameters: 1,
      alreadySelected: ["sa-24"],
      notInBaseline: ["au-2"],
    });
    // Nothing the program decided is lost from the result: it is decided beneath it now.
    expect(preview.added).toEqual([]);
    expect(preview.removed).toEqual([]);
  });

  it("drops a parameter value whose control the new stack leaves out", () => {
    const E = overlay("E", [remove("ac-2")]);
    const preview = restackPreview(current, [A, E], {
      decisions: programTailoring,
      parameters: [{ sourceId: "ac-2_prm_1", controlId: "ac-2" }],
    });
    expect(preview.tailoring?.parametersDropped).toEqual(["ac-2_prm_1"]);
    expect(preview.tailoring?.parameters).toBe(0);
  });

  it("authors no tailoring that has nothing left to change", () => {
    const only = saved([], [add("si-4")]);
    const preview = restackPreview(only, [B], { decisions: [add("si-4")], parameters: [] });
    expect(preview.tailoring).toMatchObject({ authored: false, alreadySelected: ["si-4"] });
    expect(preview.derivation.layers.map((layer) => layer.key)).toEqual(["B"]);
  });

  it("names an overlay that changes nothing where it sits", () => {
    const again = overlay("again", [add("sc-7")]);
    expect(restackPreview(current, [A, again], tailoring).idle).toEqual(["again"]);
    // Moved beneath A it adds sc-7, and A's add is the one already true.
    expect(restackPreview(current, [again, A], tailoring).idle).toEqual([]);
  });

  it("reads a reordered stack as the order it applies in", () => {
    const undo = overlay("undo", [add("pe-3")]);
    const first = restackPreview(current, [A, undo], tailoring);
    const second = restackPreview(current, [undo, A], tailoring);
    expect(first.derivation.selected.has("pe-3")).toBe(true);
    expect(second.derivation.selected.has("pe-3")).toBe(false);
    expect(second.idle).toEqual(["undo"]);
  });
});

/** A client whose `rpc` calls are recorded and answer with `answer`. */
function client(answer: { data: unknown; error: { code?: string; message: string } | null }) {
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
          then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
            Promise.resolve(answer).then(resolve, reject),
        };
        return builder;
      },
    } as never,
  };
}

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const answer = {
  choiceId: id(1),
  programId: id(2),
  changed: true,
  profileResolutionId: id(3),
  previousProfileResolutionId: id(4),
  revision: 3,
  overlayIds: [id(5), id(6)],
  controls: { before: 554, after: 560, added: 8, removed: 2 },
  tailoring: {
    authored: true,
    decisions: 14,
    parameters: 5,
    alreadySelected: [],
    notInBaseline: [],
    parametersDropped: [],
  },
  systems: [{ id: id(7), code: "SYS-1" }],
  ssps: [{ id: id(8), systemId: id(7), systemCode: "SYS-1", version: 1, state: "published" }],
};

describe("a stack that starts from two baselines", () => {
  const combined = deriveStack(reference, [
    {
      key: "privacy",
      kind: "baseline",
      title: "Privacy baseline",
      decisions: [add("pt-2", "Selected by the Privacy baseline.")],
    },
    { key: "a", kind: "overlay", title: "Overlay a", overlayId: "a", decisions: [remove("pe-3")] },
  ]);

  it("is a stack the command keeps in order, with the second baseline as part of its root", () => {
    expect(stackShape(combined)).toEqual({ overlayIds: ["a"], tailoring: false, supported: true });
    const misplaced = deriveStack(reference, [
      { key: "a", kind: "overlay", title: "Overlay a", overlayId: "a", decisions: [add("ac-3")] },
      { key: "privacy", kind: "baseline", title: "Privacy baseline", decisions: [add("pt-2")] },
    ]);
    expect(stackShape(misplaced).supported).toBe(false);
  });

  it("keeps the second baseline first when the overlays change", () => {
    const preview = restackPreview(combined, [overlay("b", [add("au-3")])], null);
    expect(preview.derivation.layers.map((layer) => [layer.key, layer.kind, layer.total])).toEqual([
      ["privacy", "baseline", 5],
      ["b", "overlay", 6],
    ]);
    expect(preview.added.sort()).toEqual(["au-3", "pe-3"]);
    expect(preview.removed).toEqual([]);
    expect(preview.idle).toEqual([]);
  });
});

describe("an overlay's versions", () => {
  const versions = [
    { id: "ma-1", code: "MA", version: 1 },
    { id: "ma-3", code: "MA", version: 3 },
    { id: "ma-2", code: "MA", version: 2 },
    { id: "dp-1", code: "DP", version: 1 },
  ];

  it("offers each overlay once, at its newest published version", () => {
    expect(newestVersions(versions).map((row) => row.id)).toEqual(["ma-3", "dp-1"]);
  });

  it("names the newer version of the one a stack applies, and none for the newest", () => {
    expect(newerVersion(versions, { id: "ma-1" })?.id).toBe("ma-3");
    expect(newerVersion(versions, { id: "ma-3" })).toBeUndefined();
    expect(newerVersion(versions, { id: "dp-1" })).toBeUndefined();
    expect(newerVersion(versions, { id: "gone" })).toBeUndefined();
  });

  it("counts an overlay's values where its layer selects their controls", () => {
    const preview = restackPreview(
      deriveStack(reference, []),
      [
        {
          ...overlay("a", [add("ac-3")]),
          parameters: [{ controlId: "ac-3" }, { controlId: "zz-9" }],
        },
        { ...overlay("values", []), parameters: [{ controlId: "ac-1" }] },
        { ...overlay("moot", []), parameters: [{ controlId: "zz-9" }] },
      ],
      null,
    );
    expect(preview.derivation.layers.map((layer) => layer.parameters)).toEqual([1, 1, 0]);
    expect(preview.idle).toEqual(["moot"]);
  });
});

describe("the command", () => {
  it("sends the overlays in order at the revision the reader saw, with the request's id", async () => {
    const { client: rpc, calls } = client({ data: answer, error: null });
    const result = await setProgramBaselineOverlays(
      rpc,
      { tenantId: "tenant", token: "token" },
      {
        choiceId: id(1),
        expectedRevision: 2,
        requestId: id(9),
        overlayIds: [id(5), id(6)],
      },
    );
    expect(result).toEqual(answer);
    expect(calls[0]).toEqual({
      name: "set_program_baseline_overlays",
      headers: { Authorization: "Bearer token" },
      args: {
        p_tenant_id: "tenant",
        p_choice_id: id(1),
        p_expected_revision: 2,
        p_request_id: id(9),
        p_overlay_ids: [id(5), id(6)],
      },
    });
  });

  it("says another session's change apart from a refusal", async () => {
    const stale = client({
      data: null,
      error: { code: "PT409", message: "This control baseline changed in another session." },
    });
    const conflict = await setProgramBaselineOverlays(
      stale.client,
      { tenantId: "t", token: "k" },
      {
        choiceId: id(1),
        expectedRevision: 1,
        requestId: id(9),
        overlayIds: [],
      },
    ).catch((cause: unknown) => cause);
    expect(conflict).toBeInstanceOf(ProgramOverlaysError);
    expect(conflict).toMatchObject({
      conflict: true,
      message: "This control baseline changed in another session.",
    });
    const refused = client({
      data: null,
      error: { code: "23514", message: "Overlay X is a draft." },
    });
    await expect(
      setProgramBaselineOverlays(
        refused.client,
        { tenantId: "t", token: "k" },
        {
          choiceId: id(1),
          expectedRevision: 1,
          requestId: id(9),
          overlayIds: [id(5)],
        },
      ),
    ).rejects.toMatchObject({ conflict: false, message: "Overlay X is a draft." });
  });
});
