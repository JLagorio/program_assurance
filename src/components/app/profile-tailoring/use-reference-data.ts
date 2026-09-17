import { useMemo } from "react";
import { useRows } from "@/lib/models";

/** The normalized reference records every profile reader needs; source-document JSON is never fetched. */
export function useReferenceData() {
  const catalogs = useRows("catalogs");
  const catalogRevisions = useRows("catalog_revisions", { state: "published" });
  const profiles = useRows("profiles");
  const catalogGroups = useRows("catalog_groups");
  const profileRevisions = useRows("profile_revisions", { state: "published" });
  const profileResolutions = useRows("profile_resolutions", { state: "published" });
  const resolutionInputs = useRows("profile_resolution_inputs");
  const selectedControls = useRows("selected_controls");
  const controls = useRows("controls");
  const parameters = useRows("parameters");
  const profileImports = useRows("profile_imports");
  const profileRules = useRows("profile_rules");
  const profileParameterSettings = useRows("profile_parameter_settings");
  const profileParameterValues = useRows("profile_parameter_values");
  const parameterValues = useRows("parameter_values");
  const parameterChoices = useRows("parameter_choices");
  const parameterConstraints = useRows("parameter_constraints");
  const parameterGuidelines = useRows("parameter_guidelines");
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
