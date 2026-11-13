import type { Json } from "./database.types";
import type { Row } from "./models";
import type { ChainHop } from "./profile-chain";

/**
 * How a control baseline is formed: a reference baseline, then layers in order. A layer is an
 * overlay from the library or a program's (or system's) own tailoring. One walker serves the
 * program setup's draft stack and a saved profile chain, so both count the same way.
 */
export type StackDecision = {
  controlId: string;
  action: "include" | "exclude";
  rationale: string | null;
};
/** What one decision did where it was applied. */
export type LayerEffectKind = "added" | "removed" | "reaffirmed" | "not-applicable";
export type LayerEffect = { controlId: string; effect: LayerEffectKind; rationale: string | null };
export type StackLayerInput = {
  /** The saved layer's resolution id, or the overlay's id in a draft stack. */
  key: string;
  kind: "overlay" | "tailoring";
  title: string;
  overlayId?: string | null | undefined;
  /** The layered profile's record, once the layer is saved. */
  profileId?: string | null | undefined;
  decisions: readonly StackDecision[];
  /** How many parameters the layer sets values for: an overlay's values, a tailoring's overrides. */
  parameters?: number | undefined;
};
export type BaselineLayer = {
  key: string;
  kind: "overlay" | "tailoring";
  title: string;
  overlayId: string | null;
  profileId: string | null;
  effects: LayerEffect[];
  added: number;
  removed: number;
  /** Adds the baseline beneath already selected. */
  reaffirmed: number;
  /** Removals of controls the baseline beneath did not select. */
  notApplicable: number;
  /** Controls selected once this layer is applied. */
  total: number;
  /** How many parameters the layer sets values for. */
  parameters: number;
};
/** Where a control in the final baseline came from. */
export type ControlOrigin = {
  controlId: string;
  /** The layer that added it, or `null` for the reference baseline. */
  layerKey: string | null;
  rationale: string | null;
  /** Layers that added it again when it was already selected. */
  reaffirmedBy: string[];
};
/** A control the reference baseline or a layer selected that the final baseline leaves out. */
export type RemovedControl = { controlId: string; layerKey: string; rationale: string | null };
export type BaselineDerivation = {
  baselineCount: number;
  layers: BaselineLayer[];
  /** The final baseline's controls. */
  selected: Set<string>;
  origins: Map<string, ControlOrigin>;
  removed: RemovedControl[];
};

/** Apply layers to a reference baseline in order, recording what each decision did. */
export function deriveStack(
  baselineControlIds: Iterable<string>,
  layers: readonly StackLayerInput[],
): BaselineDerivation {
  const selected = new Set(baselineControlIds);
  const baselineCount = selected.size;
  const origins = new Map<string, ControlOrigin>();
  for (const controlId of selected)
    origins.set(controlId, { controlId, layerKey: null, rationale: null, reaffirmedBy: [] });
  const removed = new Map<string, RemovedControl>();
  const result = layers.map((layer): BaselineLayer => {
    const effects: LayerEffect[] = [];
    const seen = new Set<string>();
    for (const decision of layer.decisions) {
      // One decision per control and layer: a repeat is the same decision said twice.
      if (seen.has(decision.controlId)) continue;
      seen.add(decision.controlId);
      const { controlId, rationale } = decision;
      if (decision.action === "include") {
        if (selected.has(controlId)) {
          effects.push({ controlId, effect: "reaffirmed", rationale });
          origins.get(controlId)?.reaffirmedBy.push(layer.key);
        } else {
          selected.add(controlId);
          removed.delete(controlId);
          origins.set(controlId, { controlId, layerKey: layer.key, rationale, reaffirmedBy: [] });
          effects.push({ controlId, effect: "added", rationale });
        }
      } else if (selected.has(controlId)) {
        selected.delete(controlId);
        origins.delete(controlId);
        removed.set(controlId, { controlId, layerKey: layer.key, rationale });
        effects.push({ controlId, effect: "removed", rationale });
      } else effects.push({ controlId, effect: "not-applicable", rationale });
    }
    const count = (kind: LayerEffectKind) => effects.filter((row) => row.effect === kind).length;
    return {
      key: layer.key,
      kind: layer.kind,
      title: layer.title,
      overlayId: layer.overlayId ?? null,
      profileId: layer.profileId ?? null,
      effects,
      added: count("added"),
      removed: count("removed"),
      reaffirmed: count("reaffirmed"),
      notApplicable: count("not-applicable"),
      total: selected.size,
      parameters: layer.parameters ?? 0,
    };
  });
  return { baselineCount, layers: result, selected, origins, removed: [...removed.values()] };
}

/** Where the stack stands after some of its layers: the controls selected, and what changed them. */
export type StackStep = {
  /** How many layers are applied: 0 is the reference baseline alone. */
  upto: number;
  selected: Set<string>;
  /** The last layer that added or removed each control, among the layers applied. */
  changed: Map<string, { effect: "added" | "removed"; layerKey: string }>;
};

/**
 * The stack after its first `upto` layers, for reading a derivation one layer at a time. The
 * reference baseline is what undoing every layer leaves; the layers' own effects are replayed
 * from there, so the last step is the derivation's result.
 */
export function stackAt(
  derivation: Pick<BaselineDerivation, "layers" | "selected">,
  upto: number,
): StackStep {
  const selected = new Set(derivation.selected);
  for (const layer of [...derivation.layers].reverse())
    for (const row of [...layer.effects].reverse()) {
      if (row.effect === "added") selected.delete(row.controlId);
      else if (row.effect === "removed") selected.add(row.controlId);
    }
  const changed: StackStep["changed"] = new Map();
  const applied = Math.max(0, Math.min(upto, derivation.layers.length));
  for (const layer of derivation.layers.slice(0, applied))
    for (const row of layer.effects) {
      if (row.effect === "added") selected.add(row.controlId);
      else if (row.effect === "removed") selected.delete(row.controlId);
      else continue;
      changed.set(row.controlId, { effect: row.effect, layerKey: layer.key });
    }
  return { upto: applied, selected, changed };
}

/** Where one control stands at a step, and the layer that put it there. */
export type ControlStanding = {
  status: "in_baseline" | "added" | "removed" | "not_selected";
  /** The layer that added or removed it; none for a control no applied layer changed. */
  layerKey: string | null;
};

/** A control's standing at a step: the map's marks and the list's rows both ask here. */
export function controlStanding(step: StackStep, controlId: string): ControlStanding {
  const change = step.changed.get(controlId);
  if (step.selected.has(controlId))
    return change?.effect === "added"
      ? { status: "added", layerKey: change.layerKey }
      : { status: "in_baseline", layerKey: null };
  return change
    ? { status: "removed", layerKey: change.layerKey }
    : { status: "not_selected", layerKey: null };
}

/** A layer's decisions, read back from what each one did where it was applied. */
const decisionsOf = (layer: Pick<BaselineLayer, "effects">): StackDecision[] =>
  layer.effects.map((row) => ({
    controlId: row.controlId,
    action: row.effect === "added" || row.effect === "reaffirmed" ? "include" : "exclude",
    rationale: row.rationale,
  }));

/**
 * The stack read as if some of its layers were switched off (a what-if): a layer switched off keeps
 * its place and changes nothing, and every layer after it is applied again to what is beneath it,
 * so an add a missing layer made moot adds again, and a removal of a control it added finds
 * nothing to remove. The reference baseline stays. Nothing is saved: it reads the derivation.
 */
export function stackWithout(
  derivation: Pick<BaselineDerivation, "layers" | "selected">,
  off: ReadonlySet<string>,
): BaselineDerivation {
  return deriveStack(
    stackAt(derivation, 0).selected,
    derivation.layers.map((layer): StackLayerInput => ({
      key: layer.key,
      kind: layer.kind,
      title: layer.title,
      overlayId: layer.overlayId,
      profileId: layer.profileId,
      decisions: off.has(layer.key) ? [] : decisionsOf(layer),
      parameters: off.has(layer.key) ? 0 : layer.parameters,
    })),
  );
}

/**
 * How many parameter values each layer sets where it sits, for a stack read before it is saved: a
 * value for a control the layer's result selects is set, any other sets nothing, as
 * `apply_control_overlay` authors and records it. `valuesOf` names a layer's values by its key.
 */
export function withParameters(
  derivation: BaselineDerivation,
  valuesOf: (layerKey: string) => readonly { controlId: string | null }[] | undefined,
): BaselineDerivation {
  return {
    ...derivation,
    layers: derivation.layers.map((layer, index) => {
      const values = valuesOf(layer.key);
      if (!values?.length) return layer;
      const selected = stackAt(derivation, index + 1).selected;
      return {
        ...layer,
        parameters: values.filter((value) => !!value.controlId && selected.has(value.controlId))
          .length,
      };
    }),
  };
}

/** A layer that changes nothing where it sits: no control added or removed, and no value set. */
export const idleLayer = (layer: Pick<BaselineLayer, "added" | "removed" | "parameters">) =>
  !layer.added && !layer.removed && !layer.parameters;

/** A layer switched off, as the address names it: the start of its key, the layer's resolution id. */
export const layerParamKey = (key: string) => key.slice(0, 8).toLowerCase();

/**
 * The layers switched off as the address writes them: their short keys, comma-separated, each
 * once; anything else is no layer switched off. A key of digits alone may arrive as a number.
 */
export function layersOffParam(value: unknown): string | undefined {
  const text = typeof value === "number" && Number.isInteger(value) ? String(value) : value;
  if (typeof text !== "string") return undefined;
  const keys = [
    ...new Set(
      text
        .toLowerCase()
        .split(",")
        .map((key) => key.trim()),
    ),
  ];
  return keys.length <= 16 && keys.every((key) => /^[0-9a-f]{8}$/.test(key))
    ? keys.join(",")
    : undefined;
}

/** How a what-if's result differs from the saved one: the controls it has more, and fewer. */
export function whatIfChange(
  saved: ReadonlySet<string>,
  whatIf: ReadonlySet<string>,
): { more: number; fewer: number } {
  let more = 0;
  let fewer = 0;
  for (const id of whatIf) if (!saved.has(id)) more += 1;
  for (const id of saved) if (!whatIf.has(id)) fewer += 1;
  return { more, fewer };
}

/** Later layers that undo an earlier one: a control one layer adds and a later one removes, or the reverse. */
export function stackReversals(
  derivation: Pick<BaselineDerivation, "layers">,
): { controlId: string; firstKey: string; laterKey: string; outcome: "added" | "removed" }[] {
  const last = new Map<string, { key: string; effect: "added" | "removed" }>();
  const reversals: ReturnType<typeof stackReversals> = [];
  for (const layer of derivation.layers)
    for (const row of layer.effects) {
      if (row.effect !== "added" && row.effect !== "removed") continue;
      const before = last.get(row.controlId);
      if (before && before.effect !== row.effect)
        reversals.push({
          controlId: row.controlId,
          firstKey: before.key,
          laterKey: layer.key,
          outcome: row.effect,
        });
      last.set(row.controlId, { key: layer.key, effect: row.effect });
    }
  return reversals;
}

const ruleIds = (definition: Json): string[] => {
  if (definition === null || typeof definition !== "object" || Array.isArray(definition)) return [];
  const ids = definition["with-ids"];
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
};

export type SavedChainRows = {
  /** The adopted resolution first, then what it layers on, down to the reference profile. */
  hops: readonly ChainHop[];
  rules: readonly Pick<
    Row<"profile_rules">,
    "profile_revision_id" | "kind" | "definition" | "rationale"
  >[];
  /** The catalog's controls, to read a rule's source ids. */
  controls: readonly Pick<Row<"controls">, "id" | "source_id">[];
  /** The reference baseline's selected controls. */
  baselineControlIds: readonly string[];
  applications: readonly Pick<
    Row<"profile_overlay_applications">,
    "profile_resolution_id" | "overlay_id" | "reaffirmed_control_ids" | "not_applicable_control_ids"
  >[];
  overlays: readonly Pick<Row<"control_overlays">, "id" | "title">[];
  /** What a layer no overlay accounts for is called: the program's or the system's own tailoring. */
  tailoringTitle: string;
  /** The layers' parameter settings, one a parameter a layer sets values for. */
  settings?: readonly Pick<Row<"profile_parameter_settings">, "profile_revision_id">[] | undefined;
};

/** Read a saved profile chain as a stack: the reference baseline, then each layer on it. */
export function deriveSavedBaseline(rows: SavedChainRows): BaselineDerivation {
  const bySource = new Map(rows.controls.map((control) => [control.source_id, control.id]));
  const layers = [...rows.hops]
    .reverse()
    .slice(1)
    .map((hop): StackLayerInput => {
      const application = rows.applications.find(
        (row) => row.profile_resolution_id === hop.resolutionId,
      );
      const decisions: StackDecision[] = rows.rules
        .filter(
          (rule) =>
            rule.profile_revision_id === hop.profileRevisionId &&
            (rule.kind === "include" || rule.kind === "exclude"),
        )
        .flatMap((rule) =>
          ruleIds(rule.definition).flatMap((sourceId) => {
            const controlId = bySource.get(sourceId);
            return controlId
              ? [
                  {
                    controlId,
                    action: rule.kind as "include" | "exclude",
                    rationale: rule.rationale,
                  },
                ]
              : [];
          }),
        );
      // What the overlay decided that was already true is recorded beside the layer, not in it.
      for (const controlId of application?.reaffirmed_control_ids ?? [])
        decisions.push({ controlId, action: "include", rationale: null });
      for (const controlId of application?.not_applicable_control_ids ?? [])
        decisions.push({ controlId, action: "exclude", rationale: null });
      const overlay = rows.overlays.find((row) => row.id === application?.overlay_id);
      return {
        key: hop.resolutionId,
        kind: application ? "overlay" : "tailoring",
        title: application ? (overlay?.title ?? "Overlay") : rows.tailoringTitle,
        overlayId: application?.overlay_id ?? null,
        profileId: hop.profileId,
        decisions,
        parameters: (rows.settings ?? []).filter(
          (setting) => setting.profile_revision_id === hop.profileRevisionId,
        ).length,
      };
    });
  return deriveStack(rows.baselineControlIds, layers);
}

/**
 * A layer's change in the words the stack shows: "+201 −17", with the parameters it sets values
 * for ("+3 −8 · 2 parameters", "1 parameter"), or "No change".
 */
export function layerChange(
  layer: Pick<BaselineLayer, "added" | "removed"> & { parameters?: number | undefined },
): string {
  const controls = [
    ...(layer.added ? [`+${layer.added}`] : []),
    ...(layer.removed ? [`−${layer.removed}`] : []),
  ].join(" ");
  const parameters = layer.parameters
    ? `${layer.parameters} ${layer.parameters === 1 ? "parameter" : "parameters"}`
    : "";
  return [controls, parameters].filter(Boolean).join(" · ") || "No change";
}
