import { useMemo } from "react";
import { useSelectedControls } from "@/lib/control-reads";
import { idSet, useRows } from "@/lib/models";

/*
 * Each read names the columns the profile readers use (`WizardReferenceData` in
 * program-wizard-reference), never a record's stored OSCAL properties.
 */
const catalogColumns = ["id", "code", "title"] as const;
const catalogRevisionColumns = [
  "id",
  "catalog_id",
  "document_revision_id",
  "title",
  "version",
  "state",
] as const;
const profileColumns = ["id", "code", "title"] as const;
const catalogGroupColumns = [
  "id",
  "catalog_revision_id",
  "source_id",
  "title",
  "parent_group_id",
] as const;
const profileRevisionColumns = [
  "id",
  "profile_id",
  "document_revision_id",
  "title",
  "version",
  "state",
] as const;
const resolutionColumns = [
  "id",
  "profile_revision_id",
  "state",
  "input_sha256",
  "output_sha256",
  "resolver_name",
  "resolver_version",
  "base_profile_resolution_id",
] as const;
const resolutionInputColumns = [
  "profile_resolution_id",
  "document_revision_id",
  "ordinal",
] as const;
const selectionColumns = ["id", "profile_resolution_id", "control_id", "ordinal"] as const;
const controlColumns = [
  "id",
  "catalog_revision_id",
  "source_id",
  "code",
  "title",
  "status",
  "parent_control_id",
  "group_id",
  "ordinal",
] as const;
const parameterColumns = [
  "id",
  "catalog_revision_id",
  "source_id",
  "control_id",
  "group_id",
  "label",
  "usage",
  "has_selection",
  "selection_count",
  "depends_on",
  "ordinal",
] as const;
const importColumns = [
  "id",
  "profile_revision_id",
  "catalog_revision_id",
  "imported_profile_revision_id",
  "ordinal",
  "include_all",
  "href",
] as const;
const ruleColumns = [
  "id",
  "profile_revision_id",
  "profile_import_id",
  "kind",
  "ordinal",
  "source_pointer",
  "definition",
  "rationale",
] as const;
const settingColumns = [
  "id",
  "profile_revision_id",
  "parameter_id",
  "parameter_source_id",
  "label",
  "usage",
  "rationale",
] as const;

/**
 * The normalized reference records every profile reader needs; source-document JSON is never
 * fetched. Selections are read for the published resolutions only, and controls, parameters and
 * each parameter's values, choices, constraints and guidelines for the published catalog editions
 * only: the readers resolve nothing else. The profile tables are small and read whole, projected.
 */
export function useReferenceData() {
  const catalogs = useRows("catalogs", undefined, { columns: catalogColumns });
  const catalogRevisions = useRows(
    "catalog_revisions",
    { state: "published" },
    { columns: catalogRevisionColumns },
  );
  const profiles = useRows("profiles", undefined, { columns: profileColumns });
  const editions = useMemo(
    () => (catalogRevisions.data ? idSet(catalogRevisions.data.map((row) => row.id)) : undefined),
    [catalogRevisions.data],
  );
  const catalogGroups = useRows(
    "catalog_groups",
    { catalog_revision_id: editions ?? [] },
    { columns: catalogGroupColumns, enabled: editions !== undefined },
  );
  const profileRevisions = useRows(
    "profile_revisions",
    { state: "published" },
    { columns: profileRevisionColumns },
  );
  const profileResolutions = useRows(
    "profile_resolutions",
    { state: "published" },
    { columns: resolutionColumns },
  );
  const resolutionInputs = useRows("profile_resolution_inputs", undefined, {
    columns: resolutionInputColumns,
  });
  const resolutionIds = useMemo(
    () => profileResolutions.data?.map((row) => row.id),
    [profileResolutions.data],
  );
  const selectedControls = useSelectedControls(resolutionIds, { columns: selectionColumns });
  const controls = useRows(
    "controls",
    { catalog_revision_id: editions ?? [] },
    { columns: controlColumns, enabled: editions !== undefined },
  );
  const parameters = useRows(
    "parameters",
    { catalog_revision_id: editions ?? [] },
    { columns: parameterColumns, enabled: editions !== undefined },
  );
  const profileImports = useRows("profile_imports", undefined, { columns: importColumns });
  const profileRules = useRows("profile_rules", undefined, { columns: ruleColumns });
  const profileParameterSettings = useRows("profile_parameter_settings", undefined, {
    columns: settingColumns,
  });
  const profileParameterValues = useRows("profile_parameter_values", undefined, {
    columns: ["setting_id", "ordinal", "value"],
  });
  // A parameter's values, choices, constraints and guidelines for the published editions only,
  // joined through the parameter on the server: the same scope as `parameters` above.
  const ofEditions = { "parameters.catalog_revision_id": editions ?? [] };
  const parameterValues = useRows("parameter_values", ofEditions, {
    columns: ["parameter_id", "ordinal", "value"],
    enabled: editions !== undefined,
  });
  const parameterChoices = useRows("parameter_choices", ofEditions, {
    columns: ["parameter_id", "ordinal", "value"],
    enabled: editions !== undefined,
  });
  const parameterConstraints = useRows("parameter_constraints", ofEditions, {
    columns: ["parameter_id", "description", "tests", "ordinal"],
    enabled: editions !== undefined,
  });
  const parameterGuidelines = useRows("parameter_guidelines", ofEditions, {
    columns: ["parameter_id", "prose", "ordinal"],
    enabled: editions !== undefined,
  });
  const queries = [
    catalogs,
    catalogRevisions,
    profiles,
    catalogGroups,
    profileRevisions,
    profileResolutions,
    resolutionInputs,
    selectedControls,
    controls,
    parameters,
    profileImports,
    profileRules,
    profileParameterSettings,
    profileParameterValues,
    parameterValues,
    parameterChoices,
    parameterConstraints,
    parameterGuidelines,
  ];
  const data = useMemo(
    () => ({
      catalogs: catalogs.data ?? [],
      catalogRevisions: catalogRevisions.data ?? [],
      profiles: profiles.data ?? [],
      catalogGroups: catalogGroups.data ?? [],
      profileRevisions: profileRevisions.data ?? [],
      resolutions: profileResolutions.data ?? [],
      resolutionInputs: resolutionInputs.data ?? [],
      selectedControls: selectedControls.data ?? [],
      controls: controls.data ?? [],
      parameters: parameters.data ?? [],
      profileImports: profileImports.data ?? [],
      profileRules: profileRules.data ?? [],
      profileParameterSettings: profileParameterSettings.data ?? [],
      profileParameterValues: profileParameterValues.data ?? [],
      parameterValues: parameterValues.data ?? [],
      parameterChoices: parameterChoices.data ?? [],
      parameterConstraints: parameterConstraints.data ?? [],
      parameterGuidelines: parameterGuidelines.data ?? [],
    }),
    [
      catalogs.data,
      catalogRevisions.data,
      profiles.data,
      catalogGroups.data,
      profileRevisions.data,
      profileResolutions.data,
      resolutionInputs.data,
      selectedControls.data,
      controls.data,
      parameters.data,
      profileImports.data,
      profileRules.data,
      profileParameterSettings.data,
      profileParameterValues.data,
      parameterValues.data,
      parameterChoices.data,
      parameterConstraints.data,
      parameterGuidelines.data,
    ],
  );
  return {
    queries,
    pending: queries.some((query) => query.isPending),
    error: queries.find((query) => query.error)?.error,
    ready: queries.every((query) => query.data !== undefined),
    retry: () =>
      Promise.all(queries.filter((query) => query.error).map((query) => query.refetch())),
    data,
  };
}
export type ReferenceData = ReturnType<typeof useReferenceData>["data"];
