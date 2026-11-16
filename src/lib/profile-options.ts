import { resolutionChain } from "./profile-chain";
import type { Row } from "./models";

/*
 * The published profiles an element can adopt as its control baseline: the system Controls tab's
 * choices with their controls, and the Change control baseline dialog's and Add from library's
 * with how many controls each selects, counted on the server, whose controls are read once one is
 * chosen.
 */

export type ProfileChoice = {
  id: string;
  /** The option text: the short name, its version, and the base it is tailored from. */
  label: string;
  /** The profile's short name (the stable `profiles.title`); the document's own title is `documentTitle`. */
  title: string;
  documentTitle: string;
  version: string;
  catalogId: string;
  documentId: string;
  catalogDocumentId: string;
  controlIds: string[];
  /** A reference profile on its catalog, or an overlay layered on another profile. */
  kind: "reference" | "overlay";
  baseLabel: string | null;
  depth: number;
};

/**
 * A profile the baseline dialog and Add from library offer, with how many controls it selects:
 * its controls are read once it is chosen.
 */
export type ProfileOption = Omit<ProfileChoice, "controlIds"> & { controlCount: number };

/** The records a profile choice is named and chained from. */
type ProfileSources = {
  resolutions: Row<"profile_resolutions">[];
  profiles: Row<"profile_revisions">[];
  /** The stable profile records, whose `title` is the short name shown for every revision. */
  profileRecords: Row<"profiles">[];
  imports: Row<"profile_imports">[];
  catalogs: Row<"catalog_revisions">[];
};

/** Published, resolved profiles whose import chain ends at one catalog, before their controls. */
function adoptableProfiles(input: ProfileSources): Omit<ProfileChoice, "controlIds">[] {
  return input.resolutions.flatMap((resolution) => {
    if (resolution.state !== "published") return [];
    const profile = input.profiles.find(
      (row) => row.id === resolution.profile_revision_id && row.state === "published",
    );
    const chain = resolutionChain(resolution.id, {
      resolutions: input.resolutions,
      profiles: input.profiles,
      profileRecords: input.profileRecords,
      imports: input.imports,
      catalogs: input.catalogs,
    });
    const catalog = input.catalogs.find(
      (row) => row.id === chain.catalogRevisionId && row.state === "published",
    );
    if (!profile || chain.errors.length || !catalog) return [];
    // The chain's first hop is this resolution; its title is the short name.
    const title = chain.hops[0]?.title ?? profile.title;
    const base = chain.hops[1];
    return [
      {
        id: resolution.id,
        label: `${title} · ${profile.version}${base ? ` · tailored from ${base.title}` : ""}`,
        title,
        documentTitle: profile.title,
        version: profile.version,
        catalogId: catalog.id,
        documentId: profile.document_revision_id,
        catalogDocumentId: catalog.document_revision_id,
        kind: chain.kind,
        baseLabel: base ? `${base.title} · ${base.version}` : null,
        depth: chain.hops.length - 1,
      },
    ];
  });
}

/** Published, resolved profiles whose import chain ends at one catalog: the ones an element can adopt. */
export function profileChoices(
  input: ProfileSources & {
    /** What each resolution selects: only its id and control are read. */
    selections: Pick<Row<"selected_controls">, "profile_resolution_id" | "control_id">[];
  },
): ProfileChoice[] {
  const selected = new Map<string, string[]>();
  for (const row of input.selections) {
    const controls = selected.get(row.profile_resolution_id) ?? [];
    controls.push(row.control_id);
    selected.set(row.profile_resolution_id, controls);
  }
  return adoptableProfiles(input)
    .flatMap((profile) => {
      const controlIds = selected.get(profile.id) ?? [];
      return controlIds.length ? [{ ...profile, controlIds }] : [];
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * The same profiles, each with how many controls it selects, counted on the server: the baseline
 * dialog and Add from library list them without reading every profile's selections, and read a
 * profile's once it is chosen.
 */
export function profileOptions(
  input: ProfileSources & { counts: ReadonlyMap<string, number> },
): ProfileOption[] {
  return adoptableProfiles(input)
    .flatMap((profile) => {
      const controlCount = input.counts.get(profile.id) ?? 0;
      return controlCount ? [{ ...profile, controlCount }] : [];
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
