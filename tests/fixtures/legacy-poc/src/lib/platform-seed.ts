/** Canonical snapshot of the WS-X90 dataset.
 *
 * The program records — systems, subsystems, components, requirements,
 * implementations, evidence, assessments, findings, risks, POA&M — are the
 * supplied fiction, carried through unchanged; projections are rebuilt from
 * them. The control layer is not supplied: scripts/gen-wsx90-seed.mjs resolves
 * it from the real NIST, DISA and CNSSI reference corpus and writes the trail
 * back onto the profile, which is what the derivation schemas below describe. */
import { z } from "zod";
import seedJson from "../data/wsx90-platform-seed.json?raw";

const text = z.string().min(1);
const id = text;
const uuid = z.string().uuid();
const ids = z.array(id);
const stamp = z.string().datetime({ offset: true });
const date = z
  .string()
  .refine(
    (value) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
    "Use a valid calendar date.",
  );
const method = z.enum(["examine", "interview", "test"]);
const implementationStatus = z.enum([
  "implemented",
  "partially-implemented",
  "planned",
  "not-implemented",
]);
const impact = z.enum(["low", "moderate", "high"]);
const overlaySchema = z
  .object({ overlay_id: id, name: text, type: text, adds: ids, removes: ids, reason: text })
  .passthrough();
const tailoringEventSchema = z
  .object({
    sequence: z.number().int().positive(),
    overlay_id: id,
    action: z.enum(["include", "exclude"]),
    control_id: id,
    rationale: text,
  })
  .passthrough();

/* ------------------------------------------------ resolved control derivation
 * scripts/gen-wsx90-seed.mjs runs the documented pipeline — catalog, SP 800-53B
 * starting baseline, CNSSI 1253 C/I/A allocation, named overlays, program
 * tailoring, parameter values — and writes the trail it produced back onto the
 * profile. These records are generated rather than authored, so their shape is
 * pinned tightly here; checkDerivation then checks the trail against the set it
 * claims to explain.
 */
const baselineLevel = z.enum(["Low", "Moderate", "High", "Privacy"]);
const objective = z.enum(["confidentiality", "integrity", "availability"]);
const pipelineStage = z.enum([
  "catalog",
  "starting_baseline",
  "cnssi_cia_allocations",
  "named_overlays",
  "program_tailoring",
  "parameter_values",
  "effective_control_set",
]);
const count = z.number().int().nonnegative();
/** Points into profile.reference_sources, where authority, release and authoritative live. */
const sourceRef = id;
const selectionTrailSchema = z
  .object({
    stage: pipelineStage,
    source_id: sourceRef,
    action: z.enum(["selected", "added", "confirmed", "reaffirmed", "withdrawn"]),
    basis: text,
    overlay_id: id.optional(),
  })
  .passthrough();
export const platformReferenceSourceSchema = z
  .object({
    id,
    name: text,
    authority: text,
    release: text,
    /** False for the CNSSI 1253 text extraction; true for the NIST and DISA releases. */
    authoritative: z.boolean(),
    rights: text,
  })
  .passthrough();
export const platformControlDerivationSchema = z
  .object({
    control_id: id,
    family: text,
    title: text,
    /** The stage or overlay that put the control in the set and left it there. */
    selection_origin: id.nullable(),
    sp800_53b_baselines: z.array(baselineLevel),
    cnssi_1253: z
      .object({
        selected: z.boolean(),
        /** Objectives that selected it; the impact per objective is the system categorization. */
        drivers: z.array(objective),
        parameter_value: z.string().nullable(),
        justification: z.string().nullable(),
        source_id: sourceRef,
        authoritative: z.boolean(),
      })
      .passthrough()
      .nullable(),
    selection_trail: z.array(selectionTrailSchema).min(1),
    /** SP 800-53A Rev 5 OSCAL part ids, verbatim. */
    assessment_objective_ids: z.array(text),
    /** Real DISA CCI identifiers. Synthetic CCI-DEMO-* ids are not permitted. */
    cci_ids: z.array(z.string().regex(/^CCI-\d{6}$/)),
    implementation_id: id.nullable(),
    implementation_status: implementationStatus,
    requirement_ids: ids,
    /** "unauthored" means the resolution added it and no narrative has been written yet. */
    authoring_status: z.enum(["authored", "unauthored"]),
  })
  .passthrough();
export const platformOdpStartingValueSchema = z
  .object({
    control_id: id,
    value: text,
    source_id: sourceRef,
    authoritative: z.boolean(),
    status: text,
  })
  .passthrough();
export const platformDerivationSchema = z
  .object({
    generator: text,
    order: z.array(pipelineStage).min(1),
    categorization: z
      .object({ confidentiality: impact, integrity: impact, availability: impact, overall: impact })
      .passthrough(),
    high_water_mark: z.enum(["Low", "Moderate", "High"]),
    /** How the system record and the stale configuration example were reconciled. */
    categorization_resolution: z
      .object({
        chosen: text,
        chosen_value: text,
        rejected: text,
        rejected_value: text,
        basis: text,
      })
      .passthrough(),
    reference_joins: z.record(
      z.object({ source_id: sourceRef, authoritative: z.boolean(), basis: text }).passthrough(),
    ),
    stages: z
      .array(
        z.object({ sequence: z.number().int().positive(), stage: pipelineStage }).passthrough(),
      )
      .min(1),
    program_tailoring: z.object({ includes: ids, excludes: ids }).passthrough(),
    withdrawn: z.array(
      z
        .object({ control_id: id, title: text, trail: z.array(selectionTrailSchema).min(1) })
        .passthrough(),
    ),
    reinstated: ids,
    counts: z.record(count),
    authoring_gap: z
      .object({
        controls_without_authored_content: count,
        status_applied: implementationStatus,
        note: text,
      })
      .passthrough(),
  })
  .passthrough();
export const platformProfileSchema = z
  .object({
    id,
    uuid,
    name: text,
    source_catalog_id: id,
    starting_selection: ids,
    overlays: z.array(overlaySchema),
    effective_control_ids: ids,
    tailoring_rationale: z.string(),
    tailoring_events: z.array(tailoringEventSchema),
    /* Present on a profile the generator resolved; an imported profile may carry none. */
    reference_sources: z.array(platformReferenceSourceSchema).min(1).optional(),
    derivation: platformDerivationSchema.optional(),
    odp_starting_values: z.array(platformOdpStartingValueSchema).optional(),
    control_derivations: z.record(platformControlDerivationSchema).optional(),
  })
  .passthrough();
export const platformSystemSchema = z
  .object({
    id,
    uuid,
    name: text,
    short_name: text,
    system_type: text,
    description: text,
    profile_id: id,
    security_categorization: z
      .object({ confidentiality: impact, integrity: impact, availability: impact, overall: impact })
      .passthrough(),
    authorization_state: text,
  })
  .passthrough();
export const platformSubsystemSchema = z
  .object({ id, name: text, description: z.string() })
  .passthrough();
export const platformComponentSchema = z
  .object({
    id,
    uuid,
    name: text,
    subsystem_id: id,
    type: text,
    description: z.string(),
    status: text,
  })
  .passthrough();
export const platformRequirementSchema = z
  .object({
    id,
    uuid,
    title: text,
    description: text,
    source: text,
    source_profile_id: id.optional(),
    priority: z.enum(["P1", "P2", "P3"]),
    verification_method: method,
    control_ids: ids,
    component_ids: ids,
    subsystem_ids: ids,
    implementation_status: implementationStatus,
    owner_role: text,
    acceptance_criteria: z.array(z.string()),
    tags: z.array(z.string()),
  })
  .passthrough();
export const platformImplementationSchema = z
  .object({
    id,
    uuid,
    control_id: id,
    status: implementationStatus,
    narrative: z.string(),
    responsible_roles: ids,
    requirement_ids: ids,
    by_component: z.array(
      z.object({ component_id: id, component_uuid: uuid, description: z.string() }).passthrough(),
    ),
  })
  .passthrough();
export const platformEvidenceSchema = z
  .object({
    id,
    uuid,
    title: text,
    type: text,
    description: z.string(),
    uri: text,
    sha256: z
      .string()
      .regex(/^[a-fA-F0-9]{64}$/)
      .or(z.literal("")),
    collected_at: stamp,
    valid_through: stamp.or(z.literal("")),
    requirement_ids: ids,
    control_ids: ids,
    component_ids: ids,
    assessment_reuse: text,
  })
  .passthrough();
export const platformAssessmentSchema = z
  .object({
    id,
    uuid,
    name: text,
    type: text,
    scope: z
      .object({
        system_id: id,
        subsystem_ids: ids,
        component_ids: ids,
        control_ids: ids,
        requirement_ids: ids,
      })
      .passthrough(),
    methods: z.array(method),
    status: text,
    planned_start: stamp,
    planned_end: stamp,
    assessor_role: text,
  })
  .passthrough();
export const platformAssessmentResultSchema = z
  .object({
    id: id.optional(),
    assessment_id: id.optional(),
    requirement_id: id,
    control_ids: ids,
    component_ids: ids,
    method,
    outcome: z.enum(["pass", "fail", "not-assessed", "inconclusive"]),
    evidence_ids: ids,
    assessed_on: stamp,
    notes: z.string(),
  })
  .passthrough();
export const platformFindingSchema = z
  .object({
    id,
    uuid,
    title: text,
    description: text,
    assessment_id: id.optional(),
    requirement_ids: ids,
    control_ids: ids,
    component_ids: ids,
    status: text,
    severity: z.enum(["low", "moderate", "high", "critical"]),
    evidence_ids: ids,
    risk_id: id.optional(),
  })
  .passthrough();
export const platformRiskSchema = z
  .object({
    id,
    uuid,
    title: text,
    statement: text,
    likelihood: impact,
    impact,
    overall: z.enum(["low", "moderate", "high", "critical"]),
    finding_ids: ids,
    status: text,
  })
  .passthrough();
export const platformMilestoneSchema = z
  .object({
    id,
    title: text,
    status: text,
    target_date: date.optional(),
    planned_completion: date.optional(),
    completed_at: stamp.optional(),
  })
  .passthrough();
export const platformPoamSchema = z
  .object({
    id,
    uuid,
    title: text,
    description: text,
    risk_ids: ids,
    finding_ids: ids,
    control_ids: ids,
    requirement_ids: ids,
    component_ids: ids,
    owner_role: text,
    status: text,
    planned_completion: date,
    milestones: z.array(platformMilestoneSchema),
  })
  .passthrough();
export const platformSeedSchema = z
  .object({
    dataset_metadata: z
      .object({
        dataset_id: id,
        title: text,
        generated_at: stamp,
        oscal_target_version: text,
        classification: text,
        disclaimer: text,
        /** Carried from the newer upstream revision. */
        last_enriched: date.optional(),
        derivation: text.optional(),
        reference_layer: z.enum(["authoritative", "synthetic"]).optional(),
        /** Placeholder datasets the authoritative reference layer replaced. */
        superseded_reference_datasets: z
          .array(
            z
              .object({
                path: text,
                type: text,
                superseded_by: id.nullable(),
                reason: text,
              })
              .passthrough(),
          )
          .optional(),
      })
      .passthrough(),
    organization: z.object({ id, name: text }).passthrough(),
    control_sources: z.array(
      z.object({ id, framework: text, type: text, uri: text }).passthrough(),
    ),
    profiles: z.array(platformProfileSchema).min(1),
    systems: z.array(platformSystemSchema).min(1),
    subsystems: z.array(platformSubsystemSchema),
    components: z.array(platformComponentSchema),
    requirements: z.array(platformRequirementSchema),
    control_implementations: z.array(platformImplementationSchema),
    evidence: z.array(platformEvidenceSchema),
    assessments: z.array(platformAssessmentSchema),
    assessment_results: z.array(platformAssessmentResultSchema),
    findings: z.array(platformFindingSchema),
    risks: z.array(platformRiskSchema),
    poam_items: z.array(platformPoamSchema),
    traceability_views: z
      .object({
        control_to_requirements: z.record(ids),
        component_to_requirements: z.record(ids),
        requirement_to_evidence: z.record(ids),
        requirement_to_findings: z.record(ids),
      })
      .passthrough(),
    /** The reference corpus the control layer was resolved from. */
    reference_datasets: z
      .array(
        z
          .object({
            id,
            path: text,
            type: text,
            authority: text,
            release: text,
            authoritative: z.boolean(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

export type PlatformSeed = z.infer<typeof platformSeedSchema>;
export type PlatformProfile = z.infer<typeof platformProfileSchema>;
export type PlatformSystem = z.infer<typeof platformSystemSchema>;
export type PlatformSubsystem = z.infer<typeof platformSubsystemSchema>;
export type PlatformComponent = z.infer<typeof platformComponentSchema>;
export type PlatformRequirement = z.infer<typeof platformRequirementSchema>;
export type PlatformImplementation = z.infer<typeof platformImplementationSchema>;
export type PlatformEvidence = z.infer<typeof platformEvidenceSchema>;
export type PlatformAssessment = z.infer<typeof platformAssessmentSchema>;
export type PlatformAssessmentResult = z.infer<typeof platformAssessmentResultSchema>;
export type PlatformFinding = z.infer<typeof platformFindingSchema>;
export type PlatformRisk = z.infer<typeof platformRiskSchema>;
export type PlatformPoam = z.infer<typeof platformPoamSchema>;
export type PlatformPoamMilestone = z.infer<typeof platformMilestoneSchema>;
export type PlatformReferenceSource = z.infer<typeof platformReferenceSourceSchema>;
export type PlatformControlDerivation = z.infer<typeof platformControlDerivationSchema>;
export type PlatformOdpStartingValue = z.infer<typeof platformOdpStartingValueSchema>;
export type PlatformDerivation = z.infer<typeof platformDerivationSchema>;
export type PlatformMilestone = z.infer<typeof platformMilestoneSchema>;
export type PlatformSeedIssue = {
  code: string;
  path: string;
  message: string;
  recordId?: string | undefined;
};
export type PlatformSeedValidation = {
  valid: boolean;
  data?: PlatformSeed | undefined;
  errors: PlatformSeedIssue[];
  warnings: PlatformSeedIssue[];
};

/**
 * The resolved control set is generated, not authored, so the trail is checked
 * against the set it claims to explain: every effective control needs a
 * derivation record, every provenance pointer has to resolve, and the summary
 * counts have to agree with the arrays they summarize.
 *
 * The severity split follows the rest of this file. A pointer that resolves
 * nowhere is a broken reference and an error. A record whose claims have merely
 * drifted from the set is a review issue and a warning: the loader reports it
 * rather than rewriting or refusing the data, and scripts/gen-wsx90-seed.mjs
 * refuses to emit a seed with any of them in the first place. A warning here
 * means the JSON and its generator have drifted — regenerate, do not patch.
 */
function checkDerivation(
  profile: PlatformProfile,
  data: PlatformSeed,
  errors: PlatformSeedIssue[],
  warn: (code: string, recordId: string, message: string) => void,
): void {
  const { derivation, control_derivations: derivations, odp_starting_values: odp } = profile;
  if (!derivation && !derivations && !odp) return;
  /** A pointer into nothing: the record cannot be read at all. */
  const fault = (code: string, path: string, message: string) =>
    errors.push({ code, path: `${profile.id}.${path}`, message, recordId: profile.id });
  /** A claim that no longer matches the set it describes: reported, never rewritten. */
  const drift = (code: string, path: string, message: string) =>
    warn(code, `${profile.id}.${path}`, message);

  const sources = new Set((profile.reference_sources ?? []).map((source) => source.id));
  const overlays = new Set(profile.overlays.map((overlay) => overlay.overlay_id));
  const effective = new Set(profile.effective_control_ids);
  const implementationById = new Map(data.control_implementations.map((row) => [row.id, row]));
  const requirementIds = new Set(data.requirements.map((row) => row.id));
  const source = (value: string, path: string) => {
    if (!sources.has(value))
      fault("broken-reference", path, `${value} does not resolve to a reference source.`);
  };

  if (derivation) {
    if (!profile.reference_sources?.length)
      fault(
        "missing-provenance",
        "reference_sources",
        "A resolved profile must name its reference sources.",
      );
    for (const [name, join] of Object.entries(derivation.reference_joins))
      source(join.source_id, `derivation.reference_joins.${name}.source_id`);
    derivation.stages.forEach((stage, index) => {
      const stageSource = (stage as { source_id?: unknown }).source_id;
      if (typeof stageSource === "string")
        source(stageSource, `derivation.stages.${index}.source_id`);
    });
    for (const [index, row] of derivation.withdrawn.entries())
      if (effective.has(row.control_id))
        drift(
          "derivation-inconsistent",
          `derivation.withdrawn.${index}`,
          `${row.control_id} is listed as withdrawn but is still in the effective set.`,
        );
    for (const controlId of derivation.reinstated)
      if (!effective.has(controlId))
        drift(
          "derivation-inconsistent",
          "derivation.reinstated",
          `${controlId} is listed as reinstated but is not in the effective set.`,
        );
  }

  if (derivations) {
    const keys = Object.keys(derivations);
    for (const controlId of profile.effective_control_ids)
      if (!derivations[controlId])
        drift(
          "derivation-missing",
          `control_derivations.${controlId}`,
          "An effective control has no derivation record; it cannot say why it is in the set.",
        );
    for (const [key, row] of Object.entries(derivations)) {
      if (!effective.has(key))
        drift(
          "derivation-orphan",
          `control_derivations.${key}`,
          "A derivation record names a control that is not in the effective set.",
        );
      if (row.control_id !== key)
        drift(
          "derivation-inconsistent",
          `control_derivations.${key}.control_id`,
          `The record is filed under ${key} but names ${row.control_id}.`,
        );
      if (
        row.selection_origin &&
        !sources.has(row.selection_origin) &&
        !overlays.has(row.selection_origin)
      )
        fault(
          "broken-reference",
          `control_derivations.${key}.selection_origin`,
          `${row.selection_origin} is neither a reference source nor an overlay.`,
        );
      row.selection_trail.forEach((step, index) => {
        source(step.source_id, `control_derivations.${key}.selection_trail.${index}.source_id`);
        if (step.overlay_id && !overlays.has(step.overlay_id))
          fault(
            "broken-reference",
            `control_derivations.${key}.selection_trail.${index}.overlay_id`,
            `Unknown overlay ${step.overlay_id}.`,
          );
      });
      if (row.cnssi_1253)
        source(row.cnssi_1253.source_id, `control_derivations.${key}.cnssi_1253.source_id`);
      const implementation = row.implementation_id
        ? implementationById.get(row.implementation_id)
        : undefined;
      if (row.implementation_id && !implementation)
        fault(
          "broken-reference",
          `control_derivations.${key}.implementation_id`,
          `${row.implementation_id} does not resolve to control_implementations.`,
        );
      if (implementation && implementation.control_id !== key)
        drift(
          "derivation-inconsistent",
          `control_derivations.${key}.implementation_id`,
          `${implementation.id} implements ${implementation.control_id}, not ${key}.`,
        );
      if (implementation && implementation.status !== row.implementation_status)
        drift(
          "derivation-inconsistent",
          `control_derivations.${key}.implementation_status`,
          `The record says ${row.implementation_status}; ${implementation.id} says ${implementation.status}.`,
        );
      if ((row.authoring_status === "authored") !== Boolean(row.implementation_id))
        drift(
          "derivation-inconsistent",
          `control_derivations.${key}.authoring_status`,
          "authoring_status and implementation_id disagree about whether narrative has been written.",
        );
      for (const requirement of row.requirement_ids)
        if (!requirementIds.has(requirement))
          fault(
            "broken-reference",
            `control_derivations.${key}.requirement_ids`,
            `${requirement} does not resolve to requirements.`,
          );
      // The resolution deliberately outruns the authoring pass; say so rather than hide it.
      if (row.authoring_status === "unauthored" && row.implementation_status !== "not-implemented")
        warn(
          "unauthored-with-implementation-status",
          key,
          `${key} has no implementation record but claims ${row.implementation_status}.`,
        );
    }

    if (derivation) {
      const authored = keys.filter((key) => derivations[key]!.implementation_id).length;
      const expected: Record<string, number> = {
        effective: profile.effective_control_ids.length,
        starting_baseline: profile.starting_selection.length,
        tailoring_events: profile.tailoring_events.length,
        withdrawn: derivation.withdrawn.length,
        reinstated: derivation.reinstated.length,
        with_implementation: authored,
        without_implementation: keys.length - authored,
        assessment_objectives: keys.reduce(
          (total, key) => total + derivations[key]!.assessment_objective_ids.length,
          0,
        ),
        with_assessment_objectives: keys.filter(
          (key) => derivations[key]!.assessment_objective_ids.length > 0,
        ).length,
        cci_links: keys.reduce((total, key) => total + derivations[key]!.cci_ids.length, 0),
        with_ccis: keys.filter((key) => derivations[key]!.cci_ids.length > 0).length,
        odp_starting_values: odp?.length ?? 0,
      };
      for (const [name, value] of Object.entries(expected))
        if (derivation.counts[name] !== undefined && derivation.counts[name] !== value)
          drift(
            "derivation-count-mismatch",
            `derivation.counts.${name}`,
            `The seed reports ${derivation.counts[name]} but the records hold ${value}.`,
          );
      if (derivation.authoring_gap.controls_without_authored_content !== keys.length - authored)
        drift(
          "derivation-count-mismatch",
          "derivation.authoring_gap.controls_without_authored_content",
          `The seed reports ${derivation.authoring_gap.controls_without_authored_content} unauthored controls but the records hold ${keys.length - authored}.`,
        );
    }
  }

  for (const [index, row] of (odp ?? []).entries()) {
    source(row.source_id, `odp_starting_values.${index}.source_id`);
    if (!effective.has(row.control_id))
      drift(
        "derivation-orphan",
        `odp_starting_values.${index}.control_id`,
        `${row.control_id} carries a parameter starting value but is not in the effective set.`,
      );
  }
}

/** Structure and foreign keys are required. Inconsistent source claims are retained as review issues. */
export function validatePlatformSeed(
  input: unknown,
  extraControlIds: readonly string[] = [],
): PlatformSeedValidation {
  const parsed = platformSeedSchema.safeParse(input);
  if (!parsed.success)
    return {
      valid: false,
      errors: parsed.error.issues.map((issue) => ({
        code: "invalid-structure",
        path: issue.path.join("."),
        message: issue.message,
      })),
      warnings: [],
    };
  const data = parsed.data;
  const errors: PlatformSeedIssue[] = [];
  const warnings: PlatformSeedIssue[] = [];
  const warn = (code: string, recordId: string, message: string) =>
    warnings.push({ code, path: recordId, recordId, message });
  const collections = {
    profiles: data.profiles,
    systems: data.systems,
    subsystems: data.subsystems,
    components: data.components,
    requirements: data.requirements,
    control_implementations: data.control_implementations,
    evidence: data.evidence,
    assessments: data.assessments,
    findings: data.findings,
    risks: data.risks,
    poam_items: data.poam_items,
    control_sources: data.control_sources,
  };
  const sets: Record<string, Set<string>> = {};
  const allIds = new Map<string, string>();
  const allUuids = new Map<string, string>();
  for (const [name, rows] of Object.entries(collections)) {
    sets[name] = new Set();
    for (const row of rows) {
      if (allIds.has(row.id))
        errors.push({
          code: "duplicate-id",
          path: name,
          recordId: row.id,
          message: `${row.id} is repeated in ${name} (already in ${allIds.get(row.id)}).`,
        });
      allIds.set(row.id, name);
      sets[name]!.add(row.id);
      const value = "uuid" in row ? row.uuid : undefined;
      if (typeof value === "string") {
        if (allUuids.has(value))
          errors.push({
            code: "duplicate-uuid",
            path: name,
            recordId: row.id,
            message: `UUID ${value} is already assigned to ${allUuids.get(value)}.`,
          });
        allUuids.set(value, row.id);
      }
    }
  }
  // Controls may be referenced outside the current effective profile: tailoring must not destroy historical links.
  sets["controls"] = new Set([
    ...extraControlIds,
    ...data.profiles.flatMap((profile) => [
      ...profile.starting_selection,
      ...profile.effective_control_ids,
      ...profile.overlays.flatMap((overlay) => [...overlay.adds, ...overlay.removes]),
    ]),
  ]);
  const fields: Record<string, string> = {
    source_catalog_id: "control_sources",
    profile_id: "profiles",
    source_profile_id: "profiles",
    system_id: "systems",
    subsystem_id: "subsystems",
    subsystem_ids: "subsystems",
    component_id: "components",
    component_ids: "components",
    requirement_id: "requirements",
    requirement_ids: "requirements",
    evidence_ids: "evidence",
    control_id: "controls",
    control_ids: "controls",
    assessment_id: "assessments",
    risk_id: "risks",
    risk_ids: "risks",
    finding_ids: "findings",
  };
  const check = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => check(item, `${path}.${index}`));
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [field, item] of Object.entries(value)) {
      const target = fields[field];
      if (target && item !== undefined)
        for (const reference of Array.isArray(item) ? item : [item])
          if (typeof reference !== "string" || !sets[target]?.has(reference))
            errors.push({
              code: "broken-reference",
              path: `${path}.${field}`,
              message: `${String(reference)} does not resolve to ${target}.`,
            });
      check(item, `${path}.${field}`);
    }
  };
  Object.entries(collections)
    .filter(([name]) => name !== "profiles")
    .forEach(([name, rows]) => check(rows, name));
  check(data.assessment_results, "assessment_results");
  for (const profile of data.profiles) {
    if (!sets["control_sources"]?.has(profile.source_catalog_id))
      errors.push({
        code: "broken-reference",
        path: `${profile.id}.source_catalog_id`,
        message: "The source catalog does not exist.",
      });
    const overlays = new Set(profile.overlays.map((overlay) => overlay.overlay_id));
    const effective = new Set(profile.starting_selection);
    profile.overlays.forEach((overlay) => {
      overlay.adds.forEach((control) => effective.add(control));
      overlay.removes.forEach((control) => effective.delete(control));
    });
    if (
      effective.size !== new Set(profile.effective_control_ids).size ||
      profile.effective_control_ids.some((control) => !effective.has(control))
    )
      warn(
        "profile-selection-mismatch",
        profile.id,
        "Effective controls differ from the ordered overlays; both source claims are retained.",
      );
    const eventEffective = new Set(profile.starting_selection);
    profile.tailoring_events.forEach((event, index) => {
      if (event.sequence !== index + 1)
        warn(
          "tailoring-order",
          profile.id,
          `Tailoring event ${event.sequence} is out of sequence at position ${index + 1}.`,
        );
      if (!overlays.has(event.overlay_id))
        errors.push({
          code: "broken-reference",
          path: `${profile.id}.tailoring_events.${index}.overlay_id`,
          message: `Unknown overlay ${event.overlay_id}.`,
        });
      if (event.action === "include") eventEffective.add(event.control_id);
      else eventEffective.delete(event.control_id);
    });
    if (
      profile.effective_control_ids.some((control) => !eventEffective.has(control)) ||
      eventEffective.size !== new Set(profile.effective_control_ids).size
    )
      warn(
        "tailoring-event-mismatch",
        profile.id,
        "The tailoring event history does not reproduce the effective control set.",
      );
    if (new Set(profile.effective_control_ids).size !== profile.effective_control_ids.length)
      errors.push({
        code: "duplicate-control",
        path: `${profile.id}.effective_control_ids`,
        message: "The profile repeats an effective control.",
      });
    checkDerivation(profile, data, errors, warn);
  }
  const componentById = new Map(data.components.map((component) => [component.id, component]));
  const reqById = new Map(data.requirements.map((requirement) => [requirement.id, requirement]));
  const evidenceById = new Map(data.evidence.map((artifact) => [artifact.id, artifact]));
  for (const implementation of data.control_implementations)
    for (const component of implementation.by_component)
      if (componentById.get(component.component_id)?.uuid !== component.component_uuid)
        errors.push({
          code: "component-uuid-mismatch",
          path: implementation.id,
          recordId: component.component_id,
          message: "Component id and UUID identify different records.",
        });
  for (const requirement of data.requirements) {
    const subsystemIds = new Set(
      requirement.component_ids.flatMap(
        (component) => componentById.get(component)?.subsystem_id ?? [],
      ),
    );
    if (
      requirement.subsystem_ids.some((subsystem) => !subsystemIds.has(subsystem)) ||
      subsystemIds.size !== new Set(requirement.subsystem_ids).size
    )
      warn(
        "subsystem-allocation-mismatch",
        requirement.id,
        "Subsystem references do not match the allocated components.",
      );
    if (!data.evidence.some((artifact) => artifact.requirement_ids.includes(requirement.id)))
      warn(
        "requirement-without-evidence",
        requirement.id,
        "No evidence artifact supports this requirement.",
      );
  }
  for (const [index, result] of data.assessment_results.entries()) {
    if (result.outcome !== "not-assessed" && result.evidence_ids.length === 0)
      warn(
        `${result.outcome}-without-evidence`,
        result.requirement_id,
        `${result.outcome} is recorded without supporting evidence (assessment result ${index + 1}).`,
      );
    if (
      result.outcome === "pass" &&
      reqById.get(result.requirement_id)?.implementation_status !== "implemented"
    )
      warn(
        "pass-with-incomplete-implementation",
        result.requirement_id,
        "A passing result coexists with a planned or partial implementation; review scope and currency.",
      );
    for (const evidenceId of result.evidence_ids)
      if (
        evidenceById.has(evidenceId) &&
        !evidenceById.get(evidenceId)!.requirement_ids.includes(result.requirement_id)
      )
        warn(
          "evidence-scope-mismatch",
          result.requirement_id,
          `${evidenceId} is not linked to this requirement.`,
        );
  }
  for (const finding of data.findings) {
    if (!finding.risk_id)
      warn("finding-without-risk", finding.id, "Finding has not been linked to a risk.");
    if (!finding.assessment_id)
      warn("finding-without-assessment", finding.id, "Finding has no named assessment reference.");
    if (!finding.evidence_ids.length)
      warn("finding-without-evidence", finding.id, "The finding contains no evidence references.");
    if (
      finding.status === "closed" &&
      finding.requirement_ids.some(
        (requirement) =>
          data.assessment_results
            .filter((result) => result.requirement_id === requirement)
            .sort((a, b) => Date.parse(b.assessed_on) - Date.parse(a.assessed_on))[0]?.outcome ===
          "fail",
      )
    )
      warn(
        "closure-without-passing-retest",
        finding.id,
        "The finding is closed but its latest assessment result is still a failure.",
      );
  }
  for (const item of data.poam_items)
    for (const milestone of item.milestones)
      if (!milestone.target_date && !milestone.planned_completion)
        warn(
          "undated-milestone",
          milestone.id,
          "This milestone has no target date; the POA&M completion date is not an individual milestone date.",
        );
  for (const artifact of data.evidence)
    if (artifact.uri.startsWith("urn:"))
      warn(
        "evidence-reference-only",
        artifact.id,
        "This artifact has a reference identifier; no downloadable file location is supplied.",
      );
  // Imported denormalized views are diagnostics, never an alternate relationship store.
  const expected: Record<string, Record<string, string[]>> = {
    control_to_requirements: {},
    component_to_requirements: {},
    requirement_to_evidence: {},
    requirement_to_findings: {},
  };
  const add = (view: string, key: string, value: string) => {
    (expected[view]![key] ??= []).push(value);
  };
  data.requirements.forEach((requirement) => {
    requirement.control_ids.forEach((control) =>
      add("control_to_requirements", control, requirement.id),
    );
    requirement.component_ids.forEach((component) =>
      add("component_to_requirements", component, requirement.id),
    );
  });
  data.evidence.forEach((artifact) =>
    artifact.requirement_ids.forEach((requirement) =>
      add("requirement_to_evidence", requirement, artifact.id),
    ),
  );
  data.findings.forEach((finding) =>
    finding.requirement_ids.forEach((requirement) =>
      add("requirement_to_findings", requirement, finding.id),
    ),
  );
  for (const [view, projection] of Object.entries(expected)) {
    const supplied = data.traceability_views[view] as Record<string, string[]>;
    for (const key of new Set([...Object.keys(projection), ...Object.keys(supplied)]))
      if (
        [...new Set(projection[key] ?? [])].sort().join("|") !==
        [...new Set(supplied[key] ?? [])].sort().join("|")
      )
        warn(
          "stale-traceability-view",
          key,
          `Stored ${view} differs from the current relationships; live views must derive it.`,
        );
  }
  return { valid: errors.length === 0, data, errors, warnings };
}

export function parsePlatformSeed(
  input: unknown,
  extraControlIds: readonly string[] = [],
): PlatformSeed {
  const result = validatePlatformSeed(input, extraControlIds);
  if (!result.valid || !result.data)
    throw new Error(
      `Invalid platform seed: ${result.errors.map((issue) => `${issue.path}: ${issue.message}`).join(" ")}`,
    );
  return result.data;
}
const imported = validatePlatformSeed(JSON.parse(seedJson) as unknown);
if (!imported.valid || !imported.data)
  throw new Error(
    `The platform seed contains invalid records: ${imported.errors.map((issue) => issue.message).join(" ")}`,
  );
export const platformSeed: PlatformSeed = imported.data;
export const platformSeedIssues: PlatformSeedIssue[] = imported.warnings;
