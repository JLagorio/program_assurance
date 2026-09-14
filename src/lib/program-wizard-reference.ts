import type { Row } from "./models";
import type { Json } from "./database.types";

/** Deliberately bounded OSCAL subset: one pinned catalog, exact IDs, as-is merge, values only. */
export const WIZARD_RESOLVER = {
  name: "program-assurance-explicit-profile",
  version: "1",
} as const;
export const OSCAL_PROFILE_REFERENCES = [
  "https://pages.nist.gov/OSCAL/learn/tutorials/control/basic-profile/",
  "https://pages.nist.gov/OSCAL-Reference/models/v1.2.0/profile/json-definitions/",
] as const;

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
  profileRevisions: readonly Pick<
    Row<"profile_revisions">,
    "id" | "profile_id" | "document_revision_id" | "title" | "version" | "state"
  >[];
  resolutions: readonly Pick<
    Row<"profile_resolutions">,
    | "id"
    | "profile_revision_id"
    | "state"
    | "input_sha256"
    | "output_sha256"
    | "resolver_name"
    | "resolver_version"
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
  profileResolutionId: string;
  tailoring: readonly { controlId: string; action: "include" | "exclude"; rationale: string }[];
  parameters: readonly { parameterId: string; values: readonly string[]; rationale: string }[];
};
export type WizardCatalogOption = { id: string; title: string; version: string };
export type WizardProfileOption = {
  id: string;
  profileRevisionId: string;
  catalogRevisionId: string | null;
  title: string;
  version: string;
  controlCount: number;
  supported: boolean;
  errors: string[];
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
  provenance: WizardSelectionProvenance[];
  inputDocumentRevisionIds: string[];
};

export type WizardDocumentPin = {
  documentRevisionId: string;
  sha256: string;
  /** URI identifying the immutable revision; callers must not supply an unpinned moving URL. */
  href: string;
  resourceUuid: string;
};
export type WizardProfileAuthoring = {
  uuid: string;
  title: string;
  version: string;
  lastModified: string;
  oscalVersion: string;
  catalog: WizardDocumentPin;
  baseProfile: WizardDocumentPin;
};
export type AuthoredWizardProfile = {
  document: Json;
  rules: {
    kind: "include" | "exclude" | "merge" | "set-parameter";
    ordinal: number;
    sourcePointer: string;
    definition: Json;
    rationale: string | null;
  }[];
  parameterSettings: {
    parameterId: string;
    sourceId: string;
    values: string[];
    rationale: string | null;
    sourcePointer: string;
  }[];
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

function inspectBase(resolutionId: string, data: WizardReferenceData) {
  const errors: string[] = [];
  const resolution = data.resolutions.find((row) => row.id === resolutionId);
  const profile = data.profileRevisions.find((row) => row.id === resolution?.profile_revision_id);
  if (!resolution || !profile) errors.push("Choose an available profile resolution.");
  if (resolution && resolution.state !== "published")
    errors.push("The base resolution must be published.");
  if (profile && profile.state !== "published")
    errors.push("The base profile revision must be published.");
  const imports = data.profileImports.filter((row) => row.profile_revision_id === profile?.id);
  const imported = imports[0];
  const catalog = data.catalogRevisions.find((row) => row.id === imported?.catalog_revision_id);
  if (
    imports.length !== 1 ||
    !imported?.catalog_revision_id ||
    imported.imported_profile_revision_id
  )
    errors.push(
      "This wizard supports profiles with one direct, pinned catalog import. Profile imports and multiple catalogs require a full OSCAL resolver.",
    );
  if (!catalog || catalog.state !== "published")
    errors.push("The imported catalog revision must be available and published.");
  const inputs = data.resolutionInputs.filter((row) => row.profile_resolution_id === resolutionId);
  for (const id of [profile?.document_revision_id, catalog?.document_revision_id])
    if (id && !inputs.some((row) => row.document_revision_id === id))
      errors.push(
        "The base resolution does not pin both its profile and catalog document revisions.",
      );
  const controls = data.controls.filter((row) => row.catalog_revision_id === catalog?.id);
  const bySource = new Map(controls.map((row) => [row.source_id, row]));
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
  const included = new Set<string>(imported?.include_all ? controls.map((row) => row.id) : []);
  const excluded = new Set<string>();
  if (imported?.include_all && rules.some((row) => row.kind === "include"))
    errors.push("A profile import cannot combine include-all and include-controls.");
  for (const rule of rules) {
    const definition = object(rule.definition);
    if (rule.kind === "include" || rule.kind === "exclude") {
      const ids = definition?.["with-ids"];
      if (
        !definition ||
        !Array.isArray(ids) ||
        !ids.length ||
        !ids.every((id) => typeof id === "string") ||
        Object.keys(definition).some((key) => !["with-ids", "with-child-controls"].includes(key)) ||
        (definition["with-child-controls"] !== undefined &&
          definition["with-child-controls"] !== "no") ||
        rule.profile_import_id !== imported?.id
      ) {
        errors.push(
          `Unsupported selection rule at ${rule.source_pointer}. Only explicit IDs without child expansion are supported.`,
        );
        continue;
      }
      for (const sourceId of ids) {
        const control = bySource.get(String(sourceId));
        if (!control)
          errors.push(`The base rule references unavailable control ${String(sourceId)}.`);
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
  const selected = data.selectedControls.filter(
    (row) => row.profile_resolution_id === resolutionId,
  );
  const selectedIds = new Set(selected.map((row) => row.control_id));
  if (selectedIds.size !== selected.length)
    errors.push("The base resolution repeats a selected control.");
  if (!selectedIds.size) errors.push("The base profile has no recorded selected controls.");
  if (!sameSet(included, selectedIds))
    errors.push(
      "The recorded base selection does not match its supported OSCAL rules. Reload complete reference records or use a full resolver.",
    );
  const settings = data.profileParameterSettings.filter(
    (row) => row.profile_revision_id === profile?.id,
  );
  for (const setting of settings) {
    const parameter = data.parameters.find(
      (row) => row.id === setting.parameter_id && row.catalog_revision_id === catalog?.id,
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
  return { resolution, profile, catalog, inputs, selected, settings, errors: [...new Set(errors)] };
}

export function catalogProfileOptions(data: WizardReferenceData): {
  catalogs: WizardCatalogOption[];
  profiles: WizardProfileOption[];
} {
  return {
    catalogs: data.catalogRevisions
      .filter((row) => row.state === "published")
      .map((row) => ({ id: row.id, title: row.title, version: row.version })),
    profiles: data.resolutions
      .filter((row) => row.state === "published")
      .map((resolution) => {
        const base = inspectBase(resolution.id, data);
        return {
          id: resolution.id,
          profileRevisionId: resolution.profile_revision_id,
          catalogRevisionId: base.catalog?.id ?? null,
          title: base.profile?.title ?? "Unavailable profile revision",
          version: base.profile?.version ?? "",
          controlCount: base.selected.length,
          supported: base.errors.length === 0,
          errors: base.errors,
        };
      }),
  };
}

export function previewProgramTailoring(
  input: ProgramTailoringInput,
  data: WizardReferenceData,
): ProgramTailoringPreview {
  const base = inspectBase(input.profileResolutionId, data);
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
  if (!selectedControls.length) errors.push("Select at least one control for the system.");
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
  const orderedIncluded = catalogControls
    .filter((row) => baseIds.has(row.id) || added.has(row.id))
    .sort(compareControls);
  const provenance = selectedControls.map((control): WizardSelectionProvenance => ({
    controlId: control.id,
    sourceId: control.source_id,
    origin: added.has(control.id) ? "include" : "base",
    baseSelectedControlId: baseRows.get(control.id)?.id ?? null,
    rationale: decisions.get(control.id)?.rationale.trim() ?? null,
    sourcePointer: `/profile/imports/0/include-controls/0/with-ids/${orderedIncluded.findIndex((row) => row.id === control.id)}`,
  }));
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
    provenance,
    inputDocumentRevisionIds: [
      ...new Set(
        base.inputs.sort((a, b) => a.ordinal - b.ordinal).map((row) => row.document_revision_id),
      ),
    ],
  };
}

/** Author a profile document, not a purported fully resolved OSCAL catalog. */
export function authorProgramProfile(
  input: ProgramTailoringInput,
  data: WizardReferenceData,
  authoring: WizardProfileAuthoring,
): AuthoredWizardProfile {
  const preview = previewProgramTailoring(input, data);
  if (!preview.valid) throw new Error(preview.errors.join(" "));
  const base = inspectBase(input.profileResolutionId, data);
  if (
    authoring.catalog.documentRevisionId !== base.catalog?.document_revision_id ||
    authoring.baseProfile.documentRevisionId !== base.profile?.document_revision_id
  )
    throw new Error(
      "The authoring document pins do not match the selected catalog and base profile revisions.",
    );
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (
    !uuid.test(authoring.uuid) ||
    !authoring.title.trim() ||
    !authoring.version.trim() ||
    !/^\d+\.\d+\.\d+$/.test(authoring.oscalVersion) ||
    !Number.isFinite(Date.parse(authoring.lastModified)) ||
    !/T.*(?:Z|[+-]\d\d:\d\d)$/.test(authoring.lastModified)
  )
    throw new Error(
      "Profile metadata requires a UUID, title, version, OSCAL version, and timestamp with timezone.",
    );
  for (const pin of [authoring.catalog, authoring.baseProfile]) {
    if (
      !uuid.test(pin.resourceUuid) ||
      !/^[a-f0-9]{64}$/.test(pin.sha256) ||
      !/^[a-z][a-z0-9+.-]*:/i.test(pin.href)
    )
      throw new Error(
        "Each source document needs a UUID resource, immutable URI, and SHA-256 pin.",
      );
  }
  if (authoring.catalog.resourceUuid === authoring.baseProfile.resourceUuid)
    throw new Error("Source resource UUIDs must be distinct.");
  const includedIds = new Set([...preview.baseControlIds, ...preview.addedControlIds]);
  const included = data.controls
    .filter((row) => row.catalog_revision_id === input.catalogRevisionId && includedIds.has(row.id))
    .sort(compareControls);
  const include = { "with-child-controls": "no", "with-ids": included.map((row) => row.source_id) };
  const excluded = input.tailoring.filter((row) => row.action === "exclude");
  const excludedRules = excluded.map((decision) => ({
    "with-child-controls": "no",
    "with-ids": [data.controls.find((row) => row.id === decision.controlId)!.source_id],
  }));
  const parameterSettings = preview.parameters
    .filter((row) => row.values.length && row.origin !== "catalog")
    .map((row, index) => ({
      parameterId: row.parameter.id,
      sourceId: row.parameter.source_id,
      values: row.values,
      rationale: row.rationale,
      sourcePointer: `/profile/modify/set-parameters/${index}`,
    }));
  const setParameters = parameterSettings.map((row) => ({
    "param-id": row.sourceId,
    values: row.values,
  }));
  const merge = { "as-is": true };
  const rules: AuthoredWizardProfile["rules"] = [
    {
      kind: "include",
      ordinal: 0,
      sourcePointer: "/profile/imports/0/include-controls/0",
      definition: include,
      rationale: null,
    },
    ...excludedRules.map((definition, ordinal) => ({
      kind: "exclude" as const,
      ordinal,
      sourcePointer: `/profile/imports/0/exclude-controls/${ordinal}`,
      definition,
      rationale: excluded[ordinal]!.rationale.trim(),
    })),
    {
      kind: "merge",
      ordinal: 0,
      sourcePointer: "/profile/merge",
      definition: merge,
      rationale: null,
    },
    ...setParameters.map((definition, ordinal) => ({
      kind: "set-parameter" as const,
      ordinal,
      sourcePointer: `/profile/modify/set-parameters/${ordinal}`,
      definition,
      rationale: parameterSettings[ordinal]!.rationale,
    })),
  ];
  const ns = "urn:program-assurance:profile-authoring";
  const document: Json = {
    profile: {
      uuid: authoring.uuid,
      metadata: {
        title: authoring.title.trim(),
        "last-modified": authoring.lastModified,
        version: authoring.version.trim(),
        "oscal-version": authoring.oscalVersion,
        links: [{ href: `#${authoring.baseProfile.resourceUuid}`, rel: "derived-from" }],
        props: [
          { name: "base-resolution-id", ns, value: input.profileResolutionId },
          ...input.tailoring.map((decision) => ({
            name: `control-${decision.action}-rationale`,
            ns,
            class: data.controls.find((row) => row.id === decision.controlId)!.source_id,
            value: decision.rationale.trim(),
          })),
          ...parameterSettings
            .filter((setting) => setting.rationale)
            .map((setting) => ({
              name: "parameter-rationale",
              ns,
              class: setting.sourceId,
              value: setting.rationale!,
            })),
        ],
      },
      imports: [
        {
          href: `#${authoring.catalog.resourceUuid}`,
          "include-controls": [include],
          ...(excludedRules.length ? { "exclude-controls": excludedRules } : {}),
        },
      ],
      merge,
      ...(setParameters.length ? { modify: { "set-parameters": setParameters } } : {}),
      "back-matter": {
        resources: [authoring.catalog, authoring.baseProfile].map((pin, index) => ({
          uuid: pin.resourceUuid,
          title: index === 0 ? base.catalog!.title : base.profile!.title,
          props: [{ name: "document-revision-id", ns, value: pin.documentRevisionId }],
          rlinks: [
            {
              href: pin.href,
              "media-type":
                index === 0 ? "application/oscal.catalog+json" : "application/oscal.profile+json",
              hashes: [{ algorithm: "SHA-256", value: pin.sha256 }],
            },
          ],
        })),
      },
    },
  };
  return {
    document,
    rules,
    parameterSettings,
    provenance: preview.provenance,
    inputDocumentRevisionIds: preview.inputDocumentRevisionIds,
  };
}
