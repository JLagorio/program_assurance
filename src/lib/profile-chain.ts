import type { Row } from "./models";

export type ChainHop = {
  resolutionId: string;
  profileRevisionId: string;
  profileId: string;
  /** The profile's short name; the document's own title is `documentTitle`. */
  title: string;
  documentTitle: string;
  version: string;
  state: string;
};
export type ResolutionChain = {
  /** A reference profile imports its catalog directly; an overlay imports a base profile. */
  kind: "reference" | "overlay";
  catalogRevisionId: string | null;
  /** This resolution first, then its base, down to the reference resolution on the catalog. */
  hops: ChainHop[];
  errors: string[];
};
export type ChainData = {
  resolutions: readonly Pick<
    Row<"profile_resolutions">,
    "id" | "profile_revision_id" | "state" | "base_profile_resolution_id"
  >[];
  profiles: readonly Pick<
    Row<"profile_revisions">,
    "id" | "profile_id" | "title" | "version" | "state"
  >[];
  /** The stable profile records, whose `title` is the short name shown for every revision. */
  profileRecords: readonly Pick<Row<"profiles">, "id" | "title">[];
  imports: readonly Pick<
    Row<"profile_imports">,
    | "profile_revision_id"
    | "catalog_revision_id"
    | "imported_profile_revision_id"
    | "ordinal"
    | "include_all"
  >[];
  catalogs: readonly Pick<Row<"catalog_revisions">, "id" | "state">[];
};

/** Walk a resolution's imports to the catalog it selects from: one walker for every reader. */
export function resolutionChain(
  resolutionId: string,
  data: ChainData,
  maxDepth = 3,
): ResolutionChain {
  const hops: ChainHop[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  let cursor: string | null = resolutionId;
  let catalogRevisionId: string | null = null;
  let kind: ResolutionChain["kind"] = "reference";
  while (cursor) {
    if (seen.has(cursor)) {
      errors.push("The profile chain contains a cycle.");
      break;
    }
    seen.add(cursor);
    const resolution = data.resolutions.find((row) => row.id === cursor);
    const profile = data.profiles.find((row) => row.id === resolution?.profile_revision_id);
    if (!resolution || !profile) {
      errors.push("A resolution in the profile chain is unavailable.");
      break;
    }
    const title =
      data.profileRecords.find((row) => row.id === profile.profile_id)?.title ?? profile.title;
    if (resolution.state !== "published") errors.push(`${title} is not a published resolution.`);
    if (profile.state !== "published") errors.push(`${title} is not a published profile revision.`);
    hops.push({
      resolutionId: resolution.id,
      profileRevisionId: profile.id,
      profileId: profile.profile_id,
      title,
      documentTitle: profile.title,
      version: profile.version,
      state: resolution.state,
    });
    const imports = data.imports
      .filter((row) => row.profile_revision_id === profile.id)
      .sort((a, b) => a.ordinal - b.ordinal);
    const first = imports[0];
    if (
      imports.length === 1 &&
      first?.catalog_revision_id &&
      !resolution.base_profile_resolution_id
    ) {
      catalogRevisionId = first.catalog_revision_id;
      break;
    }
    if (first?.imported_profile_revision_id && resolution.base_profile_resolution_id) {
      if (hops.length === 1) kind = "overlay";
      if (!first.include_all)
        errors.push(`${title} must import its base profile with include-all.`);
      if (imports.length > 2 || (imports[1] && !imports[1].catalog_revision_id))
        errors.push(`${title} may add controls only through one catalog import.`);
      const base = data.resolutions.find((row) => row.id === resolution.base_profile_resolution_id);
      if (base?.profile_revision_id !== first.imported_profile_revision_id)
        errors.push(`${title} records a base resolution that does not match its import.`);
      if (hops.length > maxDepth) {
        errors.push("Profile layering deeper than three levels is not supported.");
        break;
      }
      cursor = resolution.base_profile_resolution_id;
      continue;
    }
    errors.push(`${title} does not import one catalog or one base profile.`);
    break;
  }
  if (catalogRevisionId) {
    const catalog = data.catalogs.find((row) => row.id === catalogRevisionId);
    if (!catalog || catalog.state !== "published")
      errors.push("The imported catalog revision must be available and published.");
    for (const hop of hops) {
      const second = data.imports.find(
        (row) => row.profile_revision_id === hop.profileRevisionId && row.ordinal === 1,
      );
      if (second && second.catalog_revision_id !== catalogRevisionId)
        errors.push(`${hop.title} adds controls from a different catalog.`);
    }
  }
  return { kind, catalogRevisionId, hops, errors: [...new Set(errors)] };
}
