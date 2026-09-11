/**
 * Profiles — the OSCAL construct for a tailored control selection.
 *
 * A profile answers one question the rest of the product assumes an answer to:
 * *why is this control in my set?* The seed already carries the whole answer —
 * an ordered derivation, a per-control selection trail, and every tailoring
 * event in sequence — and until this module existed none of it reached a screen.
 *
 * This is a read layer over `platformSeed.profiles`. It computes nothing and
 * decides nothing: the resolution was done by the generator against the real
 * corpus, and re-deriving it here would just be a second opinion nobody asked
 * for. What it adds is shape — a stage list a reader can follow top to bottom,
 * and a per-control trail keyed the way the rest of the app spells control ids.
 *
 * The word "overlay" means exactly one thing in this product and it lives here:
 * a named delta on a control selection. The library's policy entries used to
 * share the word and never tailored anything; they are components now.
 */
import { currentRevision, triadLabel } from "@/lib/control-set";
import {
  nistBaselineCatalogVersion,
  nistBaselineOrder,
  nistBaselineProvenance,
  nistBaselines,
  type NistBaselineId,
} from "@/lib/nist-baselines";
import { platformProgramId } from "@/lib/platform-ids";
import { platformSeed, type PlatformProfile } from "@/lib/platform-seed";
import {
  assessmentScopes,
  controlSetFor,
  liveScopeSelectionSource,
  type AssessmentScope,
} from "@/lib/scopes";

export type Profile = PlatformProfile;
export type ProfileOverlay = Profile["overlays"][number];
export type ProfileEvent = Profile["tailoring_events"][number];

/**
 * `derivation` and `control_derivations` are optional in the seed schema: a
 * profile imported from elsewhere carries a selection without the trail that
 * produced it. Every reader here treats that as "no trail to show", never as
 * an error and never as an empty selection.
 */
export type ProfileDerivation = NonNullable<Profile["derivation"]>;
export type ProfileStage = ProfileDerivation["stages"][number];
export type ControlDerivation = NonNullable<Profile["control_derivations"]>[string];

export const profiles: Profile[] = platformSeed.profiles;

export function profileById(id: string): Profile | null {
  return profiles.find((profile) => profile.id === id) ?? null;
}

/** The profile a program's control set was resolved from, when it has one. */
export function profileForProgram(programId: string): Profile | null {
  return programId === platformProgramId ? (profiles[0] ?? null) : null;
}

/** The derivation stages in the order the generator ran them. Empty when imported. */
export function stagesOf(profile: Profile): ProfileStage[] {
  return [...(profile.derivation?.stages ?? [])].sort((a, b) => a.sequence - b.sequence);
}

/** Whether this profile can say how it was resolved, or only what it selected. */
export function hasDerivation(profile: Profile): boolean {
  return (profile.derivation?.stages ?? []).length > 0;
}

/**
 * The events one overlay contributed, in sequence.
 *
 * An overlay's `adds`/`removes` say what it did; the events say in what order
 * and on what stated basis. A reader chasing one control wants the second.
 */
export function eventsForOverlay(profile: Profile, overlayId: string): ProfileEvent[] {
  return profile.tailoring_events.filter((event) => event.overlay_id === overlayId);
}

/** Every event naming one control, in sequence. The control's own history. */
export function eventsForControl(profile: Profile, controlId: string): ProfileEvent[] {
  return profile.tailoring_events.filter((event) => event.control_id === controlId);
}

export function derivationFor(profile: Profile, controlId: string): ControlDerivation | null {
  return profile.control_derivations?.[controlId] ?? null;
}

/** Effective controls as a set, for membership tests that run per row. */
export function effectiveControlIds(profile: Profile): ReadonlySet<string> {
  return new Set(profile.effective_control_ids);
}

export type ProfileCounts = {
  catalog: number;
  startingBaseline: number;
  effective: number;
  events: number;
  overlays: number;
  withOdp: number;
};

export function countsOf(profile: Profile): ProfileCounts {
  // The stage rows are `passthrough` in the schema, so per-stage fields arrive
  // through an index signature rather than as declared properties.
  const catalogStage = stagesOf(profile).find((stage) => stage.stage === "catalog");
  const available = catalogStage?.["controls_available"];
  return {
    catalog: typeof available === "number" ? available : 0,
    startingBaseline: profile.starting_selection.length,
    effective: profile.effective_control_ids.length,
    events: profile.tailoring_events.length,
    overlays: profile.overlays.length,
    withOdp: profile.odp_starting_values?.length ?? 0,
  };
}

/**
 * Controls the profile carries that no overlay or baseline explains.
 *
 * Empty against this seed, and asserted rather than assumed: a control in the
 * effective set with no selection trail is a control nobody can defend in an
 * assessment, which is the exact failure this whole layer exists to prevent.
 */
export function unexplainedControlIds(profile: Profile): string[] {
  if (!profile.control_derivations) return [];
  return profile.effective_control_ids.filter(
    (id) => (profile.control_derivations?.[id]?.selection_trail ?? []).length === 0,
  );
}

/* ---------------------------------------------------------------- registry */

/**
 * Every profile in the product, as one list.
 *
 * There is more than one, which the nav hid: the four SP 800-53B baselines are
 * NIST's own OSCAL *profile* documents, not a separate kind of thing, and each
 * assessment scope resolves a selection of its own from its CNSSI 1253
 * categorization. Listing them together is what makes the tailored profile
 * legible — "starting baseline 370" stops being a number and becomes a row you
 * can open.
 *
 * The three kinds differ in where they come from and in whether they can be
 * edited, and the register says which is which rather than flattening them:
 *
 *   Baseline  published upstream, read-only, authoritative
 *   Tailored  resolved by the generator against the real corpus, with a trail
 *   Scope     resolved live from the scope's categorization, approved by revision
 */
export type ProfileKind = "Baseline" | "Tailored" | "Scope";

/** Route ids for the published baselines. Stable — they appear in URLs. */
export const baselineProfileIds: Record<NistBaselineId, string> = {
  low: "NIST-800-53B-LOW",
  moderate: "NIST-800-53B-MODERATE",
  high: "NIST-800-53B-HIGH",
  privacy: "NIST-800-53B-PRIVACY",
};

const baselineByProfileId = new Map<string, NistBaselineId>(
  nistBaselineOrder.map((id) => [baselineProfileIds[id], id]),
);

export function baselineIdFromProfileId(profileId: string): NistBaselineId | null {
  return baselineByProfileId.get(profileId) ?? null;
}

export type ProfileSummary = {
  /** Row key, and the `$profileId` param for profiles that have their own record. */
  id: string;
  name: string;
  kind: ProfileKind;
  /** The catalog or profile this one resolves from. */
  importsFrom: string;
  /** Controls in force. */
  controls: number;
  /** A release version for a published profile; the revision state for a scope. */
  status: string;
  /** True only for a machine-readable release from the body that owns the document. */
  authoritative: boolean;
  /**
   * Where the record lives. A scope's control set already has a home on its
   * element record — the register links there rather than building a second one.
   */
  record: { on: "profile" } | { on: "element"; programId: string; componentId: string };
};

function baselineSummary(id: NistBaselineId): ProfileSummary {
  const baseline = nistBaselines[id];
  return {
    id: baselineProfileIds[id],
    name: `SP 800-53B ${baseline.name} baseline`,
    kind: "Baseline",
    importsFrom: "SP 800-53 Rev. 5 catalog",
    controls: baseline.controlIds.length,
    status: baseline.version ?? nistBaselineCatalogVersion,
    authoritative: nistBaselineProvenance[id].authoritative,
    record: { on: "profile" },
  };
}

function tailoredSummary(profile: Profile): ProfileSummary {
  const counts = countsOf(profile);
  return {
    id: profile.id,
    name: profile.name,
    kind: "Tailored",
    importsFrom: `SP 800-53B High baseline (${counts.startingBaseline})`,
    controls: counts.effective,
    status: `${counts.events} tailoring events`,
    // Resolved locally against the corpus. The sources behind it are named on
    // the record; the resolution itself is ours, so it is not a publication.
    authoritative: false,
    record: { on: "profile" },
  };
}

function scopeSummary(scope: AssessmentScope): ProfileSummary {
  const set = controlSetFor(scope.id);
  const revision = currentRevision(scope.id);
  return {
    id: scope.id,
    name: scope.name,
    kind: "Scope",
    importsFrom:
      liveScopeSelectionSource(scope)?.label ??
      `CNSSI 1253 · C-I-A ${triadLabel(scope.parameters)}`,
    controls: set?.total ?? 0,
    status: revision ? `${revision.state} · rev ${revision.number}` : "No revision",
    authoritative: false,
    record: { on: "element", programId: scope.program, componentId: scope.element },
  };
}

/**
 * The register, in resolution order: what the catalog publishes, then what the
 * program derived from it, then what each scope holds in force. A function
 * rather than a constant because the scope rows move when a revision is
 * approved — callers subscribe through `useScopesVersion` / `useControlSetVersion`.
 */
export function profileSummaries(): ProfileSummary[] {
  return [
    ...nistBaselineOrder.map(baselineSummary),
    ...profiles.map(tailoredSummary),
    ...assessmentScopes.map(scopeSummary),
  ];
}
