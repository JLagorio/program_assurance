import { useMemo } from "react";
import { idSet, useRows } from "@/lib/models";
import { buildSystemAssuranceRows, systemAssuranceColumns } from "@/lib/system-assurance";
import { useProgramSystemCounts } from "@/lib/system-counts";
import type { SystemElement } from "@/lib/system-tree";

/**
 * The one projection every system surface reads: the tree, the preview and the record. Every read
 * is scoped to the program on the server: its systems, then the scopes and baselines of those
 * systems and the scopes' adoptions. What it counts of each element and of everything inside it
 * (the controls its baseline selects, the requirements allocated to it) is counted on the server
 * in one request, so no allocation and no selection is read. The profile names are small reference
 * collections, read with the few columns they need.
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
  const counts = useProgramSystemCounts(programId);
  const scopeIds = useMemo(() => idSet(scopes.data?.map((row) => row.id)), [scopes.data]);
  const scopeBaselines = useRows(
    "scope_baselines",
    { scope_id: scopeIds },
    { columns: systemAssuranceColumns.scopeBaselines, enabled: scopes.isSuccess },
  );
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
    counts,
    scopeBaselines,
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
        scopeBaselines: scopeBaselines.data ?? [],
        counts: counts.data,
        resolutions: resolutions.data ?? [],
        profiles: profiles.data ?? [],
        profileRecords: profileRecords.data ?? [],
      }),
    [
      elements,
      scopes.data,
      baselines.data,
      scopeBaselines.data,
      counts.data,
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
