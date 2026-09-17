import { useMemo } from "react";
import { useRows } from "@/lib/models";
import { buildSystemAssuranceRows } from "@/lib/system-assurance";
import type { SystemElement } from "@/lib/system-tree";

/** The one projection every system surface reads: the tree, the preview and the record. */
export function useSystemAssurance(programId: string) {
  const systems = useRows("systems", { program_id: programId });
  const scopes = useRows("scopes");
  const baselines = useRows("system_effective_baselines");
  const selections = useRows("selected_controls");
  const scopeBaselines = useRows("scope_baselines");
  const allocations = useRows("requirement_allocations");
  const resolutions = useRows("profile_resolutions");
  const profiles = useRows("profile_revisions");
  const profileRecords = useRows("profiles");
  const queries = [
    systems,
    scopes,
    baselines,
    selections,
    scopeBaselines,
    allocations,
    resolutions,
    profiles,
    profileRecords,
  ];
  const elements = useMemo(() => (systems.data ?? []) as SystemElement[], [systems.data]);
  const rows = useMemo(
    () =>
      buildSystemAssuranceRows({
        systems: elements,
        scopes: scopes.data ?? [],
        baselines: baselines.data ?? [],
        selections: selections.data ?? [],
        scopeBaselines: scopeBaselines.data ?? [],
        allocations: allocations.data ?? [],
        resolutions: resolutions.data ?? [],
        profiles: profiles.data ?? [],
        profileRecords: profileRecords.data ?? [],
      }),
    [
      elements,
      scopes.data,
      baselines.data,
      selections.data,
      scopeBaselines.data,
      allocations.data,
      resolutions.data,
      profiles.data,
      profileRecords.data,
    ],
  );
  return {
    rows,
    elements,
    error: queries.find((query) => query.error)?.error,
    pending: queries.some((query) => query.isPending),
  };
}
