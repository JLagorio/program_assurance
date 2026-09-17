import type { Row } from "./models";
import type { Json } from "./database.types";
import { resolutionChain, type ChainHop } from "./profile-chain";

/** The layered resolver the database authors with: a base profile imported with include-all. */
export const LAYERED_RESOLVER = {
  name: "program-assurance-layered-profile",
  version: "1",
} as const;

export type WizardControl = Pick<
  Row<"controls">,
  | "id"
  | "catalog_revision_id"
  | "source_id"
  | "code"
  | "title"
  | "status"
  | "parent_control_id"
  | "group_id"
  | "ordinal"
>;
export type WizardParameter = Pick<
  Row<"parameters">,
  | "id"
  | "catalog_revision_id"
  | "source_id"
  | "control_id"
  | "group_id"
  | "label"
  | "usage"
  | "has_selection"
  | "selection_count"
  | "depends_on"
  | "ordinal"
>;
export type WizardReferenceData = {
  catalogRevisions: readonly Pick<
    Row<"catalog_revisions">,
    "id" | "catalog_id" | "document_revision_id" | "title" | "version" | "state"
  >[];
  catalogGroups: readonly Pick<
    Row<"catalog_groups">,
    "id" | "catalog_revision_id" | "source_id" | "title" | "parent_group_id"
  >[];
  profileRevisions: readonly Pick<
    Row<"profile_revisions">,
    "id" | "profile_id" | "document_revision_id" | "title" | "version" | "state"
  >[];
  /** The stable records: their `title` is the short name the product shows for every revision. */
  catalogs: readonly Pick<Row<"catalogs">, "id" | "code" | "title">[];
  profiles: readonly Pick<Row<"profiles">, "id" | "code" | "title">[];
  resolutions: readonly Pick<
    Row<"profile_resolutions">,
    | "id"
    | "profile_revision_id"
    | "state"
    | "input_sha256"
    | "output_sha256"
    | "resolver_name"
    | "resolver_version"
    | "base_profile_resolution_id"
  >[];
  resolutionInputs: readonly Pick<
    Row<"profile_resolution_inputs">,
    "profile_resolution_id" | "document_revision_id" | "ordinal"
  >[];
  selectedControls: readonly Pick<
    Row<"selected_controls">,
    "id" | "profile_resolution_id" | "control_id" | "ordinal"
  >[];
  profileImports: readonly Pick<
    Row<"profile_imports">,
    | "id"
    | "profile_revision_id"
    | "catalog_revision_id"
    | "imported_profile_revision_id"
    | "ordinal"
    | "include_all"
    | "href"
  >[];
  profileRules: readonly Pick<
    Row<"profile_rules">,
    | "id"
    | "profile_revision_id"
    | "profile_import_id"
    | "kind"
    | "ordinal"
    | "source_pointer"
    | "definition"
    | "rationale"
  >[];
  controls: readonly WizardControl[];
  parameters: readonly WizardParameter[];
  parameterValues: readonly Pick<Row<"parameter_values">, "parameter_id" | "ordinal" | "value">[];
  parameterChoices: readonly Pick<Row<"parameter_choices">, "parameter_id" | "ordinal" | "value">[];
  parameterConstraints: readonly Pick<
    Row<"parameter_constraints">,
    "parameter_id" | "description" | "tests" | "ordinal"
  >[];
  parameterGuidelines: readonly Pick<
    Row<"parameter_guidelines">,
    "parameter_id" | "prose" | "ordinal"
  >[];
  profileParameterSettings: readonly Pick<
    Row<"profile_parameter_settings">,
    | "id"
    | "profile_revision_id"
    | "parameter_id"
    | "parameter_source_id"
    | "label"
    | "usage"
    | "rationale"
  >[];
  profileParameterValues: readonly Pick<
    Row<"profile_parameter_values">,
    "setting_id" | "ordinal" | "value"
  >[];
};
export type ProgramTailoringInput = {
  catalogRevisionId: string;
  baseResolutionId: string;
  tailoring: readonly { controlId: string; action: "include" | "exclude"; rationale: string }[];
  parameters: readonly { parameterId: string; values: readonly string[]; rationale: string }[];
};
export type WizardCatalogOption = {
  id: string;
  catalogId: string;
  /** The catalog's short name, for example NIST SP 800-53 Rev 5. */
  title: string;
  /** The OSCAL document's own title for this edition. */
  documentTitle: string;
  version: string;
  controlCount: number;
};
export type WizardProfileOption = {
  id: string;
  profileRevisionId: string;
  profileId: string | null;
  catalogRevisionId: string | null;
  /** The profile's short name, for example NIST SP 800-53 Rev 5 Low baseline. */
  title: string;
  /** The OSCAL document's own title for this revision. */
  documentTitle: string;
  version: string;
  controlCount: number;
  catalogControlCount: number;
  supported: boolean;
  errors: string[];
  kind: "reference" | "overlay";
  baseResolutionId: string | null;
  baseTitle: string | null;
  outCount: number;
  inCount: number;
  /** This profile first, then what it layers on, down to the reference profile. */
  chain: ChainHop[];
};
export type WizardParameterPreview = {
  parameter: WizardParameter;
  values: string[];
  origin: "catalog" | "profile" | "override" | "unset";
  rationale: string | null;
  choices: string[];
  constraints: string[];
  guidelines: string[];
};
export type WizardSelectionProvenance = {
  controlId: string;
  sourceId: string;
  origin: "base" | "include";
  baseSelectedControlId: string | null;
  rationale: string | null;
  sourcePointer: string;
};
export type WizardFamilyPreview = {
  groupId: string | null;
  sourceId: string;
  title: string;
  base: number;
  out: number;
  in: number;
  effective: number;
};
export type ProgramTailoringPreview = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  selectedControls: WizardControl[];
  baseControlIds: string[];
  addedControlIds: string[];
  excludedControlIds: string[];
  counts: {
    base: number;
    added: number;
    excluded: number;
    selected: number;
    parameters: number;
    unsetParameters: number;
  };
  parameters: WizardParameterPreview[];
  families: WizardFamilyPreview[];
  provenance: WizardSelectionProvenance[];
  inputDocumentRevisionIds: string[];
};

const object = (value: Json): Record<string, Json | undefined> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
const compareControls = (a: WizardControl, b: WizardControl) =>
  a.source_id.localeCompare(b.source_id, "en", { numeric: true });
const sameSet = (a: ReadonlySet<string>, b: ReadonlySet<string>) =>
  a.size === b.size && [...a].every((id) => b.has(id));
const orderedValues = <T extends { ordinal: number; value: string }>(rows: readonly T[]) =>
  [...rows].sort((a, b) => a.ordinal - b.ordinal).map((row) => row.value);
const withIds = (definition: Record<string, Json | undefined> | null): string[] | null => {
  const ids = definition?.["with-ids"];
  return definition &&
    Array.isArray(ids) &&
    ids.length &&
    ids.every((id) => typeof id === "string") &&
    Object.keys(definition).every((key) => ["with-ids", "with-child-controls"].includes(key)) &&
    (definition["with-child-controls"] === undefined || definition["with-child-controls"] === "no")
    ? (ids as string[])
    : null;
};

export type BaseInspection = {
  kind: "reference" | "overlay";
  resolution: WizardReferenceData["resolutions"][number] | undefined;
  profile: WizardReferenceData["profileRevisions"][number] | undefined;
  catalog: WizardReferenceData["catalogRevisions"][number] | undefined;
  inputs: WizardReferenceData["resolutionInputs"][number][];
  selected: WizardReferenceData["selectedControls"][number][];
  /** Effective parameter settings: the chain's, nearest layer winning. */
  settings: WizardReferenceData["profileParameterSettings"][number][];
  /** The resolution this one layers on, when it is an overlay. */
  base: BaseInspection | null;
  chain: ChainHop[];
  excludedIds: string[];
  includedIds: string[];
  errors: string[];
};

function inspectSettings(
  profileId: string | undefined,
  catalogId: string | undefined,
  selectedIds: ReadonlySet<string>,
  rules: WizardReferenceData["profileRules"][number][],
  data: WizardReferenceData,
  errors: string[],
) {
  const settings = data.profileParameterSettings.filter(
    (row) => row.profile_revision_id === profileId,
  );
  for (const setting of settings) {
    const parameter = data.parameters.find(
      (row) => row.id === setting.parameter_id && row.catalog_revision_id === catalogId,
    );
    const values = orderedValues(
      data.profileParameterValues.filter((row) => row.setting_id === setting.id),
    );
    const matching = rules.filter(
      (row) =>
        row.kind === "set-parameter" &&
        object(row.definition)?.["param-id"] === setting.parameter_source_id,
    );
    if (
      !parameter ||
      parameter.source_id !== setting.parameter_source_id ||
      !values.length ||
      setting.label !== null ||
      setting.usage !== null ||
      matching.length !== 1 ||
      JSON.stringify(object(matching[0]!.definition)?.["values"]) !== JSON.stringify(values)
    )
      errors.push(
        `Base parameter ${setting.parameter_source_id} is unresolved or modifies more than values.`,
      );
    if (parameter && (!parameter.control_id || !selectedIds.has(parameter.control_id)))
      errors.push(
        `Base parameter ${setting.parameter_source_id} is scoped outside a selected control. Preserving that setting requires a full OSCAL resolver.`,
      );
  }
  for (const rule of rules.filter((row) => row.kind === "set-parameter"))
    if (!settings.some((row) => row.parameter_source_id === object(rule.definition)?.["param-id"]))
      errors.push(`The parameter setting at ${rule.source_pointer} is missing normalized values.`);
  return settings;
}

/** Validate a base resolution: a reference profile on its catalog, or an overlay layered on one. */
export function inspectBase(
  resolutionId: string,
  data: WizardReferenceData,
  depth = 0,
): BaseInspection {
  const errors: string[] = [];
  const resolution = data.resolutions.find((row) => row.id === resolutionId);
  const profile = data.profileRevisions.find((row) => row.id === resolution?.profile_revision_id);
  if (!resolution || !profile) errors.push("Choose an available profile resolution.");
  if (resolution && resolution.state !== "published")
    errors.push("The base resolution must be published.");
  if (profile && profile.state !== "published")
    errors.push("The base profile revision must be published.");
  const chain = resolutionChain(resolutionId, {
    resolutions: data.resolutions,
    profiles: data.profileRevisions,
    profileRecords: data.profiles,
    imports: data.profileImports,
    catalogs: data.catalogRevisions,
  });
  errors.push(...chain.errors);
  const imports = data.profileImports
    .filter((row) => row.profile_revision_id === profile?.id)
    .sort((a, b) => a.ordinal - b.ordinal);
  const rules = data.profileRules.filter((row) => row.profile_revision_id === profile?.id);
  const merges = rules.filter((row) => row.kind === "merge");
  if (
    merges.length !== 1 ||
    !merges.every((rule) => {
      const definition = object(rule.definition);
      return definition && definition["as-is"] === true && Object.keys(definition).length === 1;
    })
  )
    errors.push(
      "Only an explicit as-is merge is supported; flat or custom rearrangement requires a full OSCAL resolver.",
    );
  const inputs = data.resolutionInputs.filter((row) => row.profile_resolution_id === resolutionId);
  const selected = data.selectedControls.filter(
    (row) => row.profile_resolution_id === resolutionId,
  );
  const selectedIds = new Set(selected.map((row) => row.control_id));
  if (selectedIds.size !== selected.length)
    errors.push("The base resolution repeats a selected control.");
  if (!selectedIds.size) errors.push("The base profile has no recorded selected controls.");
  const result: BaseInspection = {
    kind: chain.kind,
    resolution,
    profile,
    catalog: undefined,
    inputs,
    selected,
    settings: [],
    base: null,
    chain: chain.hops,
    excludedIds: [],
    includedIds: [],
    errors,
  };

  if (chain.kind === "overlay" && resolution?.base_profile_resolution_id) {
    if (depth > 3) {
      errors.push("Profile layering deeper than three levels is not supported.");
      return { ...result, errors: [...new Set(errors)] };
    }
    const base = inspectBase(resolution.base_profile_resolution_id, data, depth + 1);
    result.base = base;
    result.catalog = base.catalog;
    for (const message of base.errors) errors.push(`Base profile: ${message}`);
    const controls = data.controls.filter((row) => row.catalog_revision_id === base.catalog?.id);
    const bySource = new Map(controls.map((row) => [row.source_id, row]));
    const baseIds = new Set(base.selected.map((row) => row.control_id));
    const expected = new Set(baseIds);
    for (const rule of rules) {
      const definition = object(rule.definition);
      if (rule.kind === "exclude" || rule.kind === "include") {
        const ids = withIds(definition);
        const importRow = imports.find((row) => row.id === rule.profile_import_id);
        const expectedOrdinal = rule.kind === "exclude" ? 0 : 1;
        if (!ids || importRow?.ordinal !== expectedOrdinal) {
          errors.push(
            `Unsupported selection rule at ${rule.source_pointer}. An overlay excludes from its base and includes from the catalog by explicit IDs.`,
          );
          continue;
        }
        for (const sourceId of ids) {
          const control = bySource.get(sourceId);
          if (!control) errors.push(`The overlay references unavailable control ${sourceId}.`);
          else if (rule.kind === "exclude") {
            if (!baseIds.has(control.id))
              errors.push(`${control.code} is excluded but the base profile does not select it.`);
            expected.delete(control.id);
            result.excludedIds.push(control.id);
          } else {
            if (baseIds.has(control.id))
              errors.push(`${control.code} is included but the base profile already selects it.`);
            expected.add(control.id);
            result.includedIds.push(control.id);
          }
        }
      } else if (rule.kind === "set-parameter") {
        if (
          !definition ||
          typeof definition["param-id"] !== "string" ||
          !Array.isArray(definition["values"]) ||
          !definition["values"].length ||
          !definition["values"].every((value) => typeof value === "string" && value.trim()) ||
          Object.keys(definition).some((key) => !["param-id", "values"].includes(key))
        )
          errors.push(
            `Unsupported parameter modification at ${rule.source_pointer}. Value assignments only.`,
          );
      } else if (rule.kind !== "merge")
        errors.push(
          `Unsupported ${rule.kind} rule at ${rule.source_pointer}. Control amendments require a full OSCAL resolver.`,
        );
    }
    if (!sameSet(expected, selectedIds))
      errors.push(
        "The recorded overlay selection does not match its base, exclusions and inclusions. Reload complete reference records or use a full resolver.",
      );
    for (const id of [
      profile?.document_revision_id,
      base.profile?.document_revision_id,
      base.catalog?.document_revision_id,
    ])
      if (id && !inputs.some((row) => row.document_revision_id === id))
        errors.push("The overlay resolution does not pin its own, base and catalog documents.");
    const own = inspectSettings(profile?.id, base.catalog?.id, selectedIds, rules, data, errors);
    const overridden = new Set(own.map((row) => row.parameter_id));
    result.settings = [...base.settings.filter((row) => !overridden.has(row.parameter_id)), ...own];
    return { ...result, errors: [...new Set(errors)] };
  }

  const imported = imports[0];
  const catalog = data.catalogRevisions.find((row) => row.id === imported?.catalog_revision_id);
  result.catalog = catalog;
  if (
    imports.length !== 1 ||
    !imported?.catalog_revision_id ||
    imported.imported_profile_revision_id
  )
    errors.push(
      "A reference profile imports one pinned catalog directly. Profile imports and multiple catalogs require a full OSCAL resolver.",
    );
  if (!catalog || catalog.state !== "published")
    errors.push("The imported catalog revision must be available and published.");
  for (const id of [profile?.document_revision_id, catalog?.document_revision_id])
    if (id && !inputs.some((row) => row.document_revision_id === id))
      errors.push(
        "The base resolution does not pin both its profile and catalog document revisions.",
      );
  const controls = data.controls.filter((row) => row.catalog_revision_id === catalog?.id);
  const bySource = new Map(controls.map((row) => [row.source_id, row]));
  const included = new Set<string>(imported?.include_all ? controls.map((row) => row.id) : []);
  const excluded = new Set<string>();
  if (imported?.include_all && rules.some((row) => row.kind === "include"))
    errors.push("A profile import cannot combine include-all and include-controls.");
  for (const rule of rules) {
    const definition = object(rule.definition);
    if (rule.kind === "include" || rule.kind === "exclude") {
      const ids = withIds(definition);
      if (!ids || rule.profile_import_id !== imported?.id) {
        errors.push(
          `Unsupported selection rule at ${rule.source_pointer}. Only explicit IDs without child expansion are supported.`,
        );
        continue;
      }
      for (const sourceId of ids) {
        const control = bySource.get(sourceId);
        if (!control) errors.push(`The base rule references unavailable control ${sourceId}.`);
        else (rule.kind === "include" ? included : excluded).add(control.id);
      }
    } else if (rule.kind === "set-parameter") {
      if (
        !definition ||
        typeof definition["param-id"] !== "string" ||
        !Array.isArray(definition["values"]) ||
        !definition["values"].length ||
        !definition["values"].every((value) => typeof value === "string" && value.trim()) ||
        Object.keys(definition).some((key) => !["param-id", "values"].includes(key))
      )
        errors.push(
          `Unsupported parameter modification at ${rule.source_pointer}. This wizard supports value assignments only.`,
        );
    } else if (rule.kind !== "merge")
      errors.push(
        `Unsupported ${rule.kind} rule at ${rule.source_pointer}. Control amendments require a full OSCAL resolver.`,
      );
  }
  for (const id of excluded) {
    if (!included.has(id))
      errors.push("An excluded base control was not explicitly included by its import.");
    included.delete(id);
  }
  if (!sameSet(included, selectedIds))
    errors.push(
      "The recorded base selection does not match its supported OSCAL rules. Reload complete reference records or use a full resolver.",
    );
  result.settings = inspectSettings(profile?.id, catalog?.id, selectedIds, rules, data, errors);
  return { ...result, errors: [...new Set(errors)] };
}

/** The short name shown for a profile revision: its profile record's title, else the document's own. */
export function profileDisplayTitle(
  revision: { profile_id: string; title: string } | undefined | null,
  data: Pick<WizardReferenceData, "profiles">,
): string | null {
  if (!revision) return null;
  return data.profiles.find((row) => row.id === revision.profile_id)?.title ?? revision.title;
}

export function catalogProfileOptions(data: WizardReferenceData): {
  catalogs: WizardCatalogOption[];
  profiles: WizardProfileOption[];
} {
  const controlCounts = new Map<string, number>();
  for (const control of data.controls)
    controlCounts.set(
      control.catalog_revision_id,
      (controlCounts.get(control.catalog_revision_id) ?? 0) + 1,
    );
  return {
    catalogs: data.catalogRevisions
      .filter((row) => row.state === "published")
      .map((row) => ({
        id: row.id,
        catalogId: row.catalog_id,
        title: data.catalogs.find((catalog) => catalog.id === row.catalog_id)?.title ?? row.title,
        documentTitle: row.title,
        version: row.version,
        controlCount: controlCounts.get(row.id) ?? 0,
      })),
    profiles: data.resolutions
      .filter((row) => row.state === "published")
      .map((resolution) => {
        const base = inspectBase(resolution.id, data);
        return {
          id: resolution.id,
          profileRevisionId: resolution.profile_revision_id,
          profileId: base.profile?.profile_id ?? null,
          catalogRevisionId: base.catalog?.id ?? null,
          title: profileDisplayTitle(base.profile, data) ?? "Unavailable profile revision",
          documentTitle: base.profile?.title ?? "",
          version: base.profile?.version ?? "",
          controlCount: base.selected.length,
          catalogControlCount: base.catalog ? (controlCounts.get(base.catalog.id) ?? 0) : 0,
          supported: base.errors.length === 0,
          errors: base.errors,
          kind: base.kind,
          baseResolutionId: base.base?.resolution?.id ?? null,
          baseTitle: profileDisplayTitle(base.base?.profile, data),
          outCount: base.excludedIds.length,
          inCount: base.includedIds.length,
          chain: base.chain,
        };
      }),
  };
}

/** The tailoring an overlay records, in the draft's shape, for reading it back. */
export function overlayDecisions(
  resolutionId: string,
  data: WizardReferenceData,
): {
  baseResolutionId: string;
  catalogRevisionId: string;
  tailoring: { controlId: string; action: "include" | "exclude"; rationale: string }[];
  parameters: { parameterId: string; values: string[]; rationale: string }[];
} | null {
  const base = inspectBase(resolutionId, data);
  if (base.kind !== "overlay" || !base.base?.resolution || !base.catalog) return null;
  const rules = data.profileRules.filter((row) => row.profile_revision_id === base.profile?.id);
  const bySource = new Map(
    data.controls
      .filter((row) => row.catalog_revision_id === base.catalog?.id)
      .map((row) => [row.source_id, row]),
  );
  const tailoring = rules
    .filter((rule) => rule.kind === "exclude" || rule.kind === "include")
    .flatMap((rule) =>
      (withIds(object(rule.definition)) ?? []).flatMap((sourceId) => {
        const control = bySource.get(sourceId);
        return control
          ? [
              {
                controlId: control.id,
                action: rule.kind as "include" | "exclude",
                rationale: rule.rationale ?? "",
              },
            ]
          : [];
      }),
    );
  const own = data.profileParameterSettings.filter(
    (row) => row.profile_revision_id === base.profile?.id,
  );
  const parameters = own.flatMap((setting) =>
    setting.parameter_id
      ? [
          {
            parameterId: setting.parameter_id,
            values: orderedValues(
              data.profileParameterValues.filter((row) => row.setting_id === setting.id),
            ),
            rationale:
              setting.rationale ??
              rules.find(
                (rule) =>
                  rule.kind === "set-parameter" &&
                  object(rule.definition)?.["param-id"] === setting.parameter_source_id,
              )?.rationale ??
              "",
          },
        ]
      : [],
  );
  return {
    baseResolutionId: base.base.resolution.id,
    catalogRevisionId: base.catalog.id,
    tailoring,
    parameters,
  };
}

export function previewProgramTailoring(
  input: ProgramTailoringInput,
  data: WizardReferenceData,
): ProgramTailoringPreview {
  const base = inspectBase(input.baseResolutionId, data);
  const errors = [...base.errors],
    warnings: string[] = [];
  if (base.catalog?.id !== input.catalogRevisionId)
    errors.push("The selected profile belongs to a different catalog revision.");
  const catalogControls = data.controls.filter(
    (row) => row.catalog_revision_id === input.catalogRevisionId,
  );
  const byId = new Map(catalogControls.map((row) => [row.id, row]));
  const baseIds = new Set(base.selected.map((row) => row.control_id));
  const selected = new Set(baseIds),
    added = new Set<string>(),
    excluded = new Set<string>();
  const decisions = new Map<string, ProgramTailoringInput["tailoring"][number]>();
  for (const decision of input.tailoring) {
    const control = byId.get(decision.controlId);
    if (!control) {
      errors.push(
        "A tailoring decision refers to a control outside the selected catalog revision.",
      );
      continue;
    }
    if (decisions.has(control.id)) {
      errors.push(`Record only one tailoring decision for ${control.code}.`);
      continue;
    }
    decisions.set(control.id, decision);
    if (!decision.rationale.trim())
      errors.push(
        `Record a rationale for ${decision.action === "include" ? "including" : "excluding"} ${control.code}.`,
      );
    if (decision.action === "include") {
      if (control.status !== "active")
        errors.push(`${control.code} is withdrawn and cannot be newly included.`);
      if (baseIds.has(control.id))
        errors.push(
          `${control.code} is already selected by the base profile. Remove the redundant inclusion.`,
        );
      else {
        selected.add(control.id);
        added.add(control.id);
      }
    } else if (decision.action === "exclude") {
      if (!baseIds.has(control.id))
        errors.push(`${control.code} is not selected by the base profile and cannot be excluded.`);
      else {
        selected.delete(control.id);
        excluded.add(control.id);
      }
    } else errors.push(`Unsupported tailoring action for ${control.code}.`);
  }
  const selectedControls = catalogControls
    .filter((row) => selected.has(row.id))
    .sort(compareControls);
  if (!selectedControls.length) errors.push("Select at least one control for the profile.");
  for (const control of selectedControls) {
    if (control.status === "withdrawn")
      warnings.push(
        `${control.code} is withdrawn in the pinned catalog; the base selection is preserved until you explicitly exclude it.`,
      );
    let parentId = control.parent_control_id;
    const seen = new Set<string>([control.id]);
    while (parentId && !seen.has(parentId)) {
      seen.add(parentId);
      if (excluded.has(parentId)) {
        warnings.push(
          `Excluding ${byId.get(parentId)?.code ?? parentId} does not exclude its explicitly selected child controls. ${control.code} remains selected.`,
        );
        break;
      }
      parentId = byId.get(parentId)?.parent_control_id ?? null;
    }
  }
  const overrides = new Map<string, ProgramTailoringInput["parameters"][number]>();
  for (const override of input.parameters) {
    if (overrides.has(override.parameterId))
      errors.push("Record only one override for each parameter.");
    overrides.set(override.parameterId, override);
    const parameter = data.parameters.find(
      (row) =>
        row.id === override.parameterId && row.catalog_revision_id === input.catalogRevisionId,
    );
    if (!parameter)
      errors.push(
        "A parameter override refers to another catalog revision or an unavailable parameter.",
      );
    else if (!parameter.control_id || !selected.has(parameter.control_id))
      errors.push(
        `${parameter.source_id} is not owned by a selected control. Parameters inherited from groups or unselected parent controls require a full resolver.`,
      );
    if (!override.rationale.trim())
      errors.push(
        `Record the rationale for parameter ${parameter?.source_id ?? override.parameterId}.`,
      );
    if (!override.values.length || override.values.some((value) => !value.trim()))
      errors.push(
        `Supply nonempty values for parameter ${parameter?.source_id ?? override.parameterId}.`,
      );
  }
  const parameters: WizardParameterPreview[] = data.parameters
    .filter(
      (row) =>
        row.catalog_revision_id === input.catalogRevisionId &&
        row.control_id !== null &&
        selected.has(row.control_id),
    )
    .sort((a, b) => a.source_id.localeCompare(b.source_id, "en", { numeric: true }))
    .map((parameter) => {
      const setting = base.settings.find((row) => row.parameter_id === parameter.id);
      const inherited = setting
        ? orderedValues(data.profileParameterValues.filter((row) => row.setting_id === setting.id))
        : [];
      const defaults = orderedValues(
        data.parameterValues.filter((row) => row.parameter_id === parameter.id),
      );
      const override = overrides.get(parameter.id);
      const values = override
        ? override.values.map((value) => value.trim())
        : setting
          ? inherited
          : defaults;
      const choices = orderedValues(
        data.parameterChoices.filter((row) => row.parameter_id === parameter.id),
      );
      const constraints = data.parameterConstraints.filter(
        (row) => row.parameter_id === parameter.id,
      );
      const dynamicChoices = choices.some((choice) => /\{\{|<[^>]+>/.test(choice));
      if (values.length && parameter.has_selection) {
        if ((parameter.selection_count ?? "one") === "one" && values.length !== 1)
          errors.push(`${parameter.source_id} permits exactly one selected value.`);
        if (choices.length && !dynamicChoices && values.some((value) => !choices.includes(value)))
          errors.push(`${parameter.source_id} must use the catalog's recorded choices.`);
        if (dynamicChoices)
          warnings.push(
            `${parameter.source_id} contains choices with embedded references or markup; choice membership needs review.`,
          );
      }
      if (override && (constraints.length || parameter.depends_on))
        warnings.push(
          `${parameter.source_id} has source constraints or dependencies. This preview does not execute constraint tests; review the source guidance.`,
        );
      return {
        parameter,
        values,
        origin: override ? "override" : setting ? "profile" : defaults.length ? "catalog" : "unset",
        rationale: override?.rationale.trim() ?? setting?.rationale ?? null,
        choices,
        constraints: constraints.map(
          (row) =>
            row.description ?? "A source constraint test is recorded without a prose description.",
        ),
        guidelines: data.parameterGuidelines
          .filter((row) => row.parameter_id === parameter.id)
          .sort((a, b) => a.ordinal - b.ordinal)
          .map((row) => row.prose),
      };
    });
  const baseRows = new Map(base.selected.map((row) => [row.control_id, row]));
  const orderedAdded = catalogControls.filter((row) => added.has(row.id)).sort(compareControls);
  const provenance = selectedControls.map((control): WizardSelectionProvenance => ({
    controlId: control.id,
    sourceId: control.source_id,
    origin: added.has(control.id) ? "include" : "base",
    baseSelectedControlId: baseRows.get(control.id)?.id ?? null,
    rationale: decisions.get(control.id)?.rationale.trim() ?? null,
    sourcePointer: added.has(control.id)
      ? `/profile/imports/1/include-controls/${orderedAdded.findIndex((row) => row.id === control.id)}/with-ids/0`
      : "/profile/imports/0/include-all",
  }));
  // By family: the catalog's top-level groups, in catalog order.
  const groups = data.catalogGroups.filter(
    (row) => row.catalog_revision_id === input.catalogRevisionId,
  );
  const groupById = new Map(groups.map((row) => [row.id, row]));
  const rootOf = (groupId: string | null): string | null => {
    let cursor = groupId;
    const seen = new Set<string>();
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      const group = groupById.get(cursor);
      if (!group?.parent_group_id) return cursor;
      cursor = group.parent_group_id;
    }
    return cursor;
  };
  const familyMap = new Map<string | null, WizardFamilyPreview>();
  const family = (control: WizardControl) => {
    const root = rootOf(control.group_id);
    let entry = familyMap.get(root);
    if (!entry) {
      const group = root ? groupById.get(root) : undefined;
      entry = {
        groupId: root,
        sourceId: group?.source_id ?? "—",
        title: group?.title ?? "Ungrouped",
        base: 0,
        out: 0,
        in: 0,
        effective: 0,
      };
      familyMap.set(root, entry);
    }
    return entry;
  };
  for (const control of catalogControls) {
    const inBase = baseIds.has(control.id);
    const isOut = excluded.has(control.id);
    const isIn = added.has(control.id);
    if (!inBase && !isIn) continue;
    const entry = family(control);
    if (inBase) entry.base += 1;
    if (isOut) entry.out += 1;
    if (isIn) entry.in += 1;
    if (selected.has(control.id)) entry.effective += 1;
  }
  const families = [...familyMap.values()].sort((a, b) =>
    a.sourceId.localeCompare(b.sourceId, "en", { numeric: true }),
  );
  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    selectedControls,
    baseControlIds: [...baseIds],
    addedControlIds: [...added],
    excludedControlIds: [...excluded],
    counts: {
      base: baseIds.size,
      added: added.size,
      excluded: excluded.size,
      selected: selectedControls.length,
      parameters: parameters.length,
      unsetParameters: parameters.filter((row) => !row.values.length).length,
    },
    parameters,
    families,
    provenance,
    inputDocumentRevisionIds: [
      ...new Set(
        base.inputs.sort((a, b) => a.ordinal - b.ordinal).map((row) => row.document_revision_id),
      ),
    ],
  };
}
