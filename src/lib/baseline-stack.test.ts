import { describe, expect, it } from "vitest";
import {
  controlStanding,
  deriveSavedBaseline,
  deriveStack,
  layerChange,
  stackAt,
  stackReversals,
  stackWithout,
  whatIfChange,
  withParameters,
  idleLayer,
} from "./baseline-stack";

const decision = (controlId: string, action: "include" | "exclude", rationale = "why") => ({
  controlId,
  action,
  rationale,
});

describe("deriveStack", () => {
  const stack = deriveStack(
    ["ac-1", "ac-2", "pe-18"],
    [
      {
        key: "allocation",
        kind: "overlay",
        title: "Allocation",
        overlayId: "allocation",
        decisions: [
          decision("ac-3", "include"),
          decision("ac-1", "include"),
          decision("pe-18", "exclude", "Not fielded"),
          decision("zz-9", "exclude"),
        ],
      },
      {
        key: "deployed",
        kind: "overlay",
        title: "Deployed",
        overlayId: "deployed",
        decisions: [decision("pe-18", "include", "Fielded after all")],
      },
      {
        key: "program",
        kind: "tailoring",
        title: "Program tailoring",
        decisions: [decision("ac-2", "exclude", "Inherited")],
      },
    ],
  );

  it("counts what each layer added, removed, reaffirmed and found not applicable", () => {
    expect(stack.baselineCount).toBe(3);
    expect(
      stack.layers.map((layer) => [
        layer.added,
        layer.removed,
        layer.reaffirmed,
        layer.notApplicable,
        layer.total,
      ]),
    ).toEqual([
      [1, 1, 1, 1, 3],
      [1, 0, 0, 0, 4],
      [0, 1, 0, 0, 3],
    ]);
    expect([...stack.selected].sort()).toEqual(["ac-1", "ac-3", "pe-18"]);
  });

  it("names the layer each final control came from", () => {
    expect(stack.origins.get("ac-1")).toMatchObject({
      layerKey: null,
      reaffirmedBy: ["allocation"],
    });
    expect(stack.origins.get("ac-3")).toMatchObject({ layerKey: "allocation" });
    // Removed by one layer and added again by a later one: the later layer is its origin.
    expect(stack.origins.get("pe-18")).toMatchObject({
      layerKey: "deployed",
      rationale: "Fielded after all",
    });
  });

  it("lists only the controls the final baseline leaves out, with the layer that removed them", () => {
    expect(stack.removed).toEqual([
      { controlId: "ac-2", layerKey: "program", rationale: "Inherited" },
    ]);
  });

  it("reports a later layer that undoes an earlier one", () => {
    expect(stackReversals(stack)).toEqual([
      { controlId: "pe-18", firstKey: "allocation", laterKey: "deployed", outcome: "added" },
    ]);
  });

  it("reads one decision per control in a layer", () => {
    const repeated = deriveStack(
      ["a"],
      [
        {
          key: "x",
          kind: "overlay",
          title: "X",
          decisions: [decision("b", "include"), decision("b", "include")],
        },
      ],
    );
    expect(repeated.layers[0]).toMatchObject({ added: 1, reaffirmed: 0, total: 2 });
  });
});

describe("stackAt", () => {
  const stack = deriveStack(
    ["ac-1", "ac-2", "pe-18"],
    [
      {
        key: "allocation",
        kind: "overlay",
        title: "Allocation",
        decisions: [decision("ac-3", "include"), decision("pe-18", "exclude")],
      },
      {
        key: "deployed",
        kind: "overlay",
        title: "Deployed",
        decisions: [decision("pe-18", "include")],
      },
      {
        key: "program",
        kind: "tailoring",
        title: "Program",
        decisions: [decision("ac-2", "exclude")],
      },
    ],
  );
  const at = (upto: number) => {
    const step = stackAt(stack, upto);
    return { selected: [...step.selected].sort(), changed: Object.fromEntries(step.changed) };
  };

  it("starts from the reference baseline, with nothing changed", () => {
    expect(at(0)).toEqual({ selected: ["ac-1", "ac-2", "pe-18"], changed: {} });
  });

  it("applies one layer at a time and names the last layer that changed each control", () => {
    expect(at(1)).toEqual({
      selected: ["ac-1", "ac-2", "ac-3"],
      changed: {
        "ac-3": { effect: "added", layerKey: "allocation" },
        "pe-18": { effect: "removed", layerKey: "allocation" },
      },
    });
    expect(at(2).changed["pe-18"]).toEqual({ effect: "added", layerKey: "deployed" });
    expect(at(2).selected).toEqual(["ac-1", "ac-2", "ac-3", "pe-18"]);
  });

  it("says where a control stands at a step", () => {
    const step = stackAt(stack, 1);
    expect(controlStanding(step, "ac-1")).toEqual({ status: "in_baseline", layerKey: null });
    expect(controlStanding(step, "ac-3")).toEqual({ status: "added", layerKey: "allocation" });
    expect(controlStanding(step, "pe-18")).toEqual({ status: "removed", layerKey: "allocation" });
    expect(controlStanding(step, "zz-9")).toEqual({ status: "not_selected", layerKey: null });
  });

  it("ends on the derivation's own result, however far it is asked to go", () => {
    expect(at(3).selected).toEqual([...stack.selected].sort());
    expect(at(9)).toEqual(at(3));
    expect(stack.layers.map((_, index) => stackAt(stack, index + 1).selected.size)).toEqual(
      stack.layers.map((layer) => layer.total),
    );
  });
});

describe("stackWithout", () => {
  const stack = deriveStack(
    ["ac-1", "ac-2", "pe-18"],
    [
      {
        key: "allocation",
        kind: "overlay",
        title: "Allocation",
        overlayId: "allocation",
        decisions: [
          decision("ac-3", "include"),
          decision("pe-18", "exclude"),
          decision("ac-1", "include"),
        ],
      },
      {
        key: "deployed",
        kind: "overlay",
        title: "Deployed",
        overlayId: "deployed",
        decisions: [decision("pe-18", "include"), decision("ac-3", "include")],
      },
      {
        key: "program",
        kind: "tailoring",
        title: "Program",
        decisions: [decision("ac-2", "exclude"), decision("ac-3", "exclude")],
      },
    ],
  );

  it("reads the saved stack itself when nothing is switched off", () => {
    const same = stackWithout(stack, new Set());
    expect([...same.selected].sort()).toEqual([...stack.selected].sort());
    expect(same.layers.map((layer) => layer.total)).toEqual(stack.layers.map((l) => l.total));
    expect(whatIfChange(stack.selected, same.selected)).toEqual({ more: 0, fewer: 0 });
  });

  it("keeps a layer switched off in its place, changing nothing, and applies the later ones again", () => {
    const without = stackWithout(stack, new Set(["allocation"]));
    expect(without.baselineCount).toBe(3);
    expect(
      without.layers.map((layer) => [layer.key, layer.added, layer.removed, layer.total]),
    ).toEqual([
      ["allocation", 0, 0, 3],
      // pe-18 is still in the baseline, so Deployed reaffirms it, and ac-3 is now Deployed's own add.
      ["deployed", 1, 0, 4],
      ["program", 0, 2, 2],
    ]);
    expect(without.layers[1]).toMatchObject({ reaffirmed: 1 });
    expect([...without.selected].sort()).toEqual(["ac-1", "pe-18"]);
    expect(without.origins.get("pe-18")?.layerKey).toBeNull();
  });

  it("switches off the tailoring and counts what the what-if has more and fewer than the saved result", () => {
    const without = stackWithout(stack, new Set(["program"]));
    expect([...without.selected].sort()).toEqual(["ac-1", "ac-2", "ac-3", "pe-18"]);
    expect([...stack.selected].sort()).toEqual(["ac-1", "pe-18"]);
    expect(whatIfChange(stack.selected, without.selected)).toEqual({ more: 2, fewer: 0 });
    const both = stackWithout(stack, new Set(["deployed", "program"]));
    expect([...both.selected].sort()).toEqual(["ac-1", "ac-2", "ac-3"]);
    expect(whatIfChange(stack.selected, both.selected)).toEqual({ more: 2, fewer: 1 });
  });
});

describe("deriveSavedBaseline", () => {
  const hop = (resolutionId: string) => ({
    resolutionId,
    profileRevisionId: `${resolutionId}-revision`,
    profileId: `${resolutionId}-profile`,
    title: resolutionId,
    documentTitle: resolutionId,
    version: "1",
    state: "published",
  });
  const saved = deriveSavedBaseline({
    hops: [hop("tailored"), hop("overlaid"), hop("high")],
    rules: [
      {
        profile_revision_id: "overlaid-revision",
        kind: "include",
        definition: { "with-ids": ["ac-3"], "with-child-controls": "no" },
        rationale: "Allocated",
      },
      {
        profile_revision_id: "tailored-revision",
        kind: "exclude",
        definition: { "with-ids": ["ac-2"] },
        rationale: "Inherited from the provider",
      },
      {
        profile_revision_id: "tailored-revision",
        kind: "merge",
        definition: { "as-is": true },
        rationale: null,
      },
      // The reference profile's own rules are not a layer.
      {
        profile_revision_id: "high-revision",
        kind: "include",
        definition: { "with-ids": ["ac-1"] },
        rationale: null,
      },
    ],
    controls: [
      { id: "c1", source_id: "ac-1" },
      { id: "c2", source_id: "ac-2" },
      { id: "c3", source_id: "ac-3" },
    ],
    baselineControlIds: ["c1", "c2"],
    applications: [
      {
        profile_resolution_id: "overlaid",
        overlay_id: "overlay-1",
        reaffirmed_control_ids: ["c1"],
        not_applicable_control_ids: [],
      },
    ],
    overlays: [{ id: "overlay-1", title: "Mission assurance" }],
    tailoringTitle: "Program tailoring",
  });

  it("reads a layer that combines a second baseline as a baseline, named for the second", () => {
    const combined = deriveSavedBaseline({
      hops: [hop("overlaid"), hop("union"), hop("high")],
      rules: [
        {
          profile_revision_id: "union-revision",
          kind: "include",
          definition: { "with-ids": ["ac-3"] },
          rationale: "Selected by the Privacy baseline.",
        },
      ],
      controls: [
        { id: "c1", source_id: "ac-1" },
        { id: "c3", source_id: "ac-3" },
      ],
      baselineControlIds: ["c1"],
      applications: [
        {
          profile_resolution_id: "overlaid",
          overlay_id: "overlay-1",
          reaffirmed_control_ids: ["c3"],
          not_applicable_control_ids: [],
        },
      ],
      overlays: [{ id: "overlay-1", title: "Mission assurance" }],
      tailoringTitle: "Program tailoring",
      combinations: [{ resolutionId: "union", title: "Privacy baseline", profileId: "privacy" }],
    });
    expect(combined.layers.map((layer) => [layer.kind, layer.title, layer.profileId])).toEqual([
      ["baseline", "Privacy baseline", "privacy"],
      ["overlay", "Mission assurance", "overlaid-profile"],
    ]);
    expect(combined.layers[0]).toMatchObject({ added: 1, total: 2 });
    expect(combined.layers[1]).toMatchObject({ added: 0, reaffirmed: 1, total: 2 });
  });

  it("reads each hop above the reference profile as a layer, bottom up", () => {
    expect(saved.layers.map((layer) => [layer.kind, layer.title, layer.profileId])).toEqual([
      ["overlay", "Mission assurance", "overlaid-profile"],
      ["tailoring", "Program tailoring", "tailored-profile"],
    ]);
    expect(saved.layers[0]).toMatchObject({
      added: 1,
      reaffirmed: 1,
      total: 3,
      overlayId: "overlay-1",
    });
    expect(saved.layers[1]).toMatchObject({ removed: 1, total: 2 });
    expect([...saved.selected].sort()).toEqual(["c1", "c3"]);
    expect(saved.removed).toEqual([
      { controlId: "c2", layerKey: "tailored", rationale: "Inherited from the provider" },
    ]);
  });
});

describe("layerChange", () => {
  it("says what a layer changed", () => {
    expect(layerChange({ added: 201, removed: 17 })).toBe("+201 −17");
    expect(layerChange({ added: 0, removed: 4 })).toBe("−4");
    expect(layerChange({ added: 0, removed: 0 })).toBe("No change");
    expect(layerChange({ added: 3, removed: 8, parameters: 2 })).toBe("+3 −8 · 2 parameters");
    expect(layerChange({ added: 0, removed: 0, parameters: 1 })).toBe("1 parameter");
  });
});

describe("withParameters", () => {
  it("counts a layer's values for the controls its result selects, and no others", () => {
    const stack = deriveStack(
      ["ac-1", "ac-2"],
      [
        {
          key: "allocation",
          kind: "overlay",
          title: "Allocation",
          decisions: [decision("ac-3", "include"), decision("ac-2", "exclude")],
        },
        { key: "values", kind: "overlay", title: "Values only", decisions: [] },
      ],
    );
    const counted = withParameters(stack, (key) =>
      key === "allocation"
        ? [{ controlId: "ac-3" }, { controlId: "ac-2" }, { controlId: null }]
        : key === "values"
          ? [{ controlId: "ac-1" }]
          : undefined,
    );
    expect(counted.layers.map((layer) => layer.parameters)).toEqual([1, 1]);
    expect(counted.layers.map(idleLayer)).toEqual([false, false]);
    expect(idleLayer(stack.layers[1]!)).toBe(true);
  });
});
