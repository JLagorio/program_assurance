import { useMemo } from "react";
import { useSelectedControls } from "@/lib/control-reads";
import { idSet, useRows } from "@/lib/models";
import {
  assuranceResolutionIds,
  buildSystemAssuranceRows,
  systemAssuranceColumns,
} from "@/lib/system-assurance";
import type { SystemElement } from "@/lib/system-tree";

/**
 * The one projection every system surface reads: the tree, the preview and the record. Every read
 * is scoped to the program on the server: its systems, then the scopes, baselines and allocations
 * of those systems, the scopes' adoptions, and only the selections of the resolutions they name.
 * The profile names are small reference collections, read with the few columns they need.
 */
export function useSystemAssurance(programId: string) {
  const systems = useRows("systems", { program_id: programId });
  const systemIds = useMemo(() => idSet(systems.data?.map((row) => row.id)), [systems.data]);
  // A scope records its boundary system; the program's boundaries are among its systems.
  const boundaryIds = useMemo(
    () => idSet(systems.data?.map((row) => row.boundary_system_id)),
    [systems.data],
  );
  const scopes = useRows("scopes", { system_id: boundaryIds }, { enabled: systems.isSuccess });
  const baselines = useRows(
    "system_effective_baselines",
    { system_id: systemIds },
    { enabled: systems.isSuccess },
  );
  const allocations = useRows(
    "requirement_allocations",
    { system_id: systemIds },
    { columns: systemAssuranceColumns.allocations, enabled: systems.isSuccess },
  );
  const scopeIds = useMemo(() => idSet(scopes.data?.map((row) => row.id)), [scopes.data]);
  const scopeBaselines = useRows(
    "scope_baselines",
    { scope_id: scopeIds },
    { columns: systemAssuranceColumns.scopeBaselines, enabled: scopes.isSuccess },
  );
  // The resolutions whose controls the rows count: each baseline's and each scope adoption's.
  const resolutionIds = useMemo(
    () =>
      baselines.isSuccess && scopeBaselines.isSuccess
        ? assuranceResolutionIds(baselines.data, scopeBaselines.data)
        : undefined,
    [baselines.isSuccess, baselines.data, scopeBaselines.isSuccess, scopeBaselines.data],
  );
  const selections = useSelectedControls(resolutionIds, {
    columns: systemAssuranceColumns.selections,
  });
  const resolutions = useRows(
    "profile_resolutions",
    {},
    {
      columns: systemAssuranceColumns.resolutions,
    },
  );
  const profiles = useRows("profile_revisions", {}, { columns: systemAssuranceColumns.profiles });
  const profileRecords = useRows(
    "profiles",
    {},
    {
      columns: systemAssuranceColumns.profileRecords,
    },
  );
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
    queries,
    error: queries.find((query) => query.error)?.error,
    pending: queries.some((query) => query.isPending),
  };
}
