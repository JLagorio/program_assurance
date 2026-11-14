import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import type { Json } from "./database.types";
import type { ReadContext, Row, TableName } from "./models";
import { objectiveWords } from "./product-records";
import { isMappingTarget, objectiveLabel } from "./requirement-control-mappings";
import { useStaleOnWrite } from "./server-table";

/*
 * The program's Controls tab: one authorization boundary's SSP revision, every control its stored
 * baseline selects. The register is one read, `ssp_control_rows`: each control in the baseline's
 * order with its recorded implementation and how many contributions, requirements and evidence
 * versions stand behind it, and the SSP's totals, derived on the server. A control's preview reads
 * what stands behind that one control as it opens, `ssp_control_detail`, and `assembleSsp` puts it
 * together here, under the same rules the server counts by: a requirement stands behind a control
 * when it is linked to its narrative or a contribution, or maps the control (or a part of it) inside
 * the boundary; evidence when it is linked to the narrative, a statement, a contribution or such a
 * requirement.
 */

const conjunction = new Intl.ListFormat("en", { type: "conjunction" });
const byLabel = new Intl.Collator("en", { numeric: true }).compare;

/**
 * What a requirement's objective mappings of a control say in the SSP: the objectives by label, in
 * the catalog's order ("Mapped to objectives SA-24a.01, SA-24a.02, and SA-24a.03").
 */
export function mappedObjectives(labels: readonly string[]): string {
  const sorted = [...new Set(labels)].sort(byLabel);
  return `Mapped to ${sorted.length === 1 ? "objective" : "objectives"} ${conjunction.format(sorted)}`;
}

/** The columns an edit form leaves alone: the lifecycle stamps. */
type Stamps = "created_at" | "updated_at" | "created_by" | "updated_by";
/**
 * A record the preview edits: every column its form edits, with its id, its revision and its
 * workspace, which the form checks before it offers an edit.
 */
type Edited<T extends TableName> = Omit<Row<T>, Stamps>;

/** The SSP revision a register shows: what the assembly scopes and checks by. */
export type SspPlan = Pick<Row<"ssp_revisions">, "id" | "system_id" | "profile_resolution_id">;
/** A system of the program, for the boundary checks and an element's path. */
export type SspSystem = Pick<
  Row<"systems">,
  "id" | "name" | "boundary_system_id" | "parent_system_id"
>;
type Selection = Pick<
  Row<"selected_controls">,
  "id" | "control_id" | "profile_resolution_id" | "ordinal"
>;
type Control = Pick<Row<"controls">, "id" | "code" | "title">;
type Part = Pick<
  Row<"control_parts">,
  "id" | "control_id" | "parent_part_id" | "name" | "prose" | "props" | "source_id" | "title"
>;
export type SspImplementation = Edited<"implemented_requirements">;
export type SspStatement = Edited<"implementation_statements">;
export type SspContribution = Edited<"component_contributions">;
/** A provider's contribution behind an offering the SSP accepted. */
type OfferedContribution = Pick<
  Row<"component_contributions">,
  "id" | "implemented_requirement_id" | "system_component_id" | "description"
>;
type Component = Pick<Row<"system_components">, "id" | "name">;
type ComponentElement = Pick<
  Row<"system_component_element_links">,
  "id" | "system_element_id" | "link_source"
>;
type Requirement = Pick<Row<"engineering_requirements">, "id" | "code" | "program_id">;
type Revision = Pick<
  Row<"requirement_revisions">,
  "id" | "engineering_requirement_id" | "title" | "statement" | "acceptance_criteria" | "state"
>;
type RequirementLink = Pick<
  Row<"requirement_implementations">,
  | "id"
  | "requirement_revision_id"
  | "implemented_requirement_id"
  | "component_contribution_id"
  | "rationale"
>;
type Mapping = Pick<
  Row<"requirement_control_links">,
  | "id"
  | "requirement_revision_id"
  | "control_id"
  | "control_part_id"
  | "system_id"
  | "selected_control_id"
  | "rationale"
>;
type Allocation = Pick<
  Row<"requirement_allocations">,
  "requirement_revision_id" | "system_id" | "composition_node_id"
>;
type RequirementEvidence = Pick<
  Row<"requirement_evidence">,
  "id" | "requirement_revision_id" | "evidence_version_id" | "claim" | "applicability_rationale"
>;
type ImplementationEvidence = Pick<
  Row<"implementation_evidence">,
  | "id"
  | "implemented_requirement_id"
  | "implementation_statement_id"
  | "component_contribution_id"
  | "evidence_version_id"
  | "claim"
  | "applicability_rationale"
>;
/** An evidence version as the preview draws it, its file included (EvidenceVersionDetails). */
export type SspEvidenceVersion = Pick<
  Row<"evidence_versions">,
  | "id"
  | "artifact_id"
  | "version_number"
  | "state"
  | "collected_at"
  | "published_at"
  | "expires_at"
  | "external_uri"
  | "media_type"
  | "byte_size"
  | "sha256"
  | "provenance"
  | "storage_object_name"
  | "storage_object_id"
>;
export type SspEvidenceArtifact = Pick<
  Row<"evidence_artifacts">,
  "id" | "title" | "description" | "artifact_kind" | "owner_party_id"
>;
type Acceptance = Pick<
  Row<"inheritance_acceptances">,
  | "id"
  | "implemented_requirement_id"
  | "offered_implementation_id"
  | "accepted_at"
  | "rationale"
  | "consumer_responsibility"
>;
type Offering = Pick<Row<"offered_implementations">, "id" | "name" | "component_contribution_id">;
type EffectiveBaseline = Pick<
  Row<"system_effective_baselines">,
  "system_id" | "profile_resolution_id"
>;

export type SspAssemblyInput = {
  plan: SspPlan;
  selections: Selection[];
  controls: Control[];
  parts: Part[];
  systems: SspSystem[];
  implementations: SspImplementation[];
  statements: SspStatement[];
  contributions: SspContribution[];
  /** The providers' contributions behind the offerings the SSP accepted. */
  offeredContributions: OfferedContribution[];
  components: Component[];
  componentElements: ComponentElement[];
  requirements: Requirement[];
  contents: Revision[];
  requirementLinks: RequirementLink[];
  controlMappings: Mapping[];
  allocations: Allocation[];
  requirementEvidence: RequirementEvidence[];
  implementationEvidence: ImplementationEvidence[];
  artifacts: SspEvidenceArtifact[];
  versions: SspEvidenceVersion[];
  acceptances: Acceptance[];
  offerings: Offering[];
  effectiveBaselines: EffectiveBaseline[];
};
export type SspRequirementSupport = {
  requirement: Requirement;
  content: Revision;
  explicit: boolean;
  descriptions: string[];
  rationale: string[];
};
export type SspEvidenceSupport = {
  id: string;
  artifact: SspEvidenceArtifact | undefined;
  version: SspEvidenceVersion | undefined;
  origins: { id: string; label: string; claim: string | null; rationale: string | null }[];
};
export type SspControlAssembly = {
  id: string;
  selection: Selection;
  control: Control | undefined;
  code: string;
  title: string;
  implementation: SspImplementation | undefined;
  status: string;
  narrative: "Recorded" | "Not recorded";
  statements: SspStatement[];
  contributions: {
    record: SspContribution;
    component: Component | undefined;
    element: SspSystem | undefined;
    path: string;
    binding: string;
  }[];
  requirements: SspRequirementSupport[];
  evidence: SspEvidenceSupport[];
  inherited: {
    acceptance: Acceptance;
    offering: Offering | undefined;
    contribution: OfferedContribution | undefined;
  }[];
  gaps: string[];
  requirementCount: number;
  evidenceCount: number;
  contributionCount: number;
};

export function systemPath(element: SspSystem, systems: readonly SspSystem[]): string {
  const byId = new Map(systems.map((system) => [system.id, system]));
  const path: string[] = [];
  const visited = new Set<string>();
  let current: SspSystem | undefined = element;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current.name);
    if (current.id === element.boundary_system_id) break;
    current = current.parent_system_id ? byId.get(current.parent_system_id) : undefined;
  }
  return path.join(" / ");
}

/** The selected baseline drives every row. Missing implementation records remain
 * visible; mapped requirements and their evidence never become implementation claims. */
export function assembleSsp(input: SspAssemblyInput): SspControlAssembly[] {
  const byId = <T extends { id: string }>(rows: T[]) => new Map(rows.map((row) => [row.id, row]));
  const controlById = byId(input.controls);
  const partById = byId(input.parts);
  const systemById = byId(input.systems);
  const componentById = byId(input.components);
  const elementLinks = byId(input.componentElements);
  const requirementById = byId(input.requirements);
  const contentById = byId(input.contents);
  const versionById = byId(input.versions);
  const artifactById = byId(input.artifacts);
  const offeringById = byId(input.offerings);
  const offeredById = byId(input.offeredContributions);
  const selectionById = byId(input.selections);
  const effectiveBySystem = new Map(input.effectiveBaselines.map((row) => [row.system_id, row]));
  const implementations = new Map(
    input.implementations
      .filter((row) => row.ssp_revision_id === input.plan.id)
      .map((row) => [row.selected_control_id, row]),
  );
  const allocationInBoundary = new Set(
    input.allocations
      .filter((allocation) => {
        const target = allocation.system_id ?? allocation.composition_node_id;
        return target && systemById.get(target)?.boundary_system_id === input.plan.system_id;
      })
      .map((allocation) => allocation.requirement_revision_id),
  );

  return input.selections
    .filter((selection) => selection.profile_resolution_id === input.plan.profile_resolution_id)
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((selection) => {
      const control = controlById.get(selection.control_id);
      const implementation = implementations.get(selection.id);
      const statements = implementation
        ? input.statements.filter((row) => row.implemented_requirement_id === implementation.id)
        : [];
      const statementIds = new Set(statements.map((row) => row.id));
      const contributions = implementation
        ? input.contributions
            .filter((row) => row.implemented_requirement_id === implementation.id)
            .map((record) => {
              const component = componentById.get(record.system_component_id);
              const binding = elementLinks.get(record.system_component_id);
              const candidate = binding?.system_element_id
                ? systemById.get(binding.system_element_id)
                : undefined;
              const element =
                candidate?.boundary_system_id === input.plan.system_id ? candidate : undefined;
              return {
                record,
                component,
                element,
                path: element ? systemPath(element, input.systems) : "System element unresolved",
                binding: binding?.link_source ?? "unbound",
              };
            })
        : [];
      const contributionIds = new Set(contributions.map((row) => row.record.id));
      const supports = new Map<string, SspRequirementSupport>();
      const addRequirement = (
        contentId: string,
        explicit: boolean,
        description: string,
        rationale: string | null,
      ) => {
        const content = contentById.get(contentId);
        const requirement = content && requirementById.get(content.engineering_requirement_id);
        if (!content || !requirement) return;
        const current = supports.get(contentId) ?? {
          requirement,
          content,
          explicit: false,
          descriptions: [],
          rationale: [],
        };
        current.explicit ||= explicit;
        if (!current.descriptions.includes(description)) current.descriptions.push(description);
        if (rationale && !current.rationale.includes(rationale)) current.rationale.push(rationale);
        supports.set(contentId, current);
      };
      if (implementation)
        for (const link of input.requirementLinks) {
          if (link.implemented_requirement_id === implementation.id)
            addRequirement(
              link.requirement_revision_id,
              true,
              "Linked to control narrative",
              link.rationale,
            );
          else if (
            link.component_contribution_id &&
            contributionIds.has(link.component_contribution_id)
          ) {
            const contribution = contributions.find(
              (row) => row.record.id === link.component_contribution_id,
            );
            addRequirement(
              link.requirement_revision_id,
              true,
              `Linked to ${contribution?.component?.name ?? "component contribution"}`,
              link.rationale,
            );
          }
        }
      // The objectives a requirement's mappings name, said together once the mappings are read:
      // by requirement and by what the mappings' baselines say of them.
      const objectiveMappings = new Map<
        string,
        { contentId: string; context: string; labels: Set<string>; rationale: string[] }
      >();
      for (const mapping of input.controlMappings) {
        const part = mapping.control_part_id ? partById.get(mapping.control_part_id) : undefined;
        const mappedControlId = mapping.control_id ?? part?.control_id;
        if (mappedControlId !== selection.control_id) continue;
        const inBoundary = mapping.system_id
          ? systemById.get(mapping.system_id)?.boundary_system_id === input.plan.system_id
          : allocationInBoundary.has(mapping.requirement_revision_id);
        if (!inBoundary) continue;
        // A mapping names the whole control, a statement of its text or one of its objectives.
        const review =
          mapping.control_part_id &&
          (!part || !isMappingTarget(part, input.parts, mappedControlId));
        const objective = !review && part?.name === "assessment-objective" ? part : undefined;
        const sourceSelection = mapping.selected_control_id
          ? selectionById.get(mapping.selected_control_id)
          : undefined;
        const effective = mapping.system_id ? effectiveBySystem.get(mapping.system_id) : undefined;
        const differentBaseline =
          sourceSelection &&
          sourceSelection.profile_resolution_id !== input.plan.profile_resolution_id;
        const stale =
          sourceSelection &&
          effective?.profile_resolution_id &&
          sourceSelection.profile_resolution_id !== effective.profile_resolution_id;
        const sourceContext = stale
          ? " · Earlier system baseline; review mapping"
          : differentBaseline
            ? " · Child or separate system baseline"
            : mapping.selected_control_id && !sourceSelection
              ? " · Source selection unavailable; review mapping"
              : "";
        if (objective) {
          const key = `${mapping.requirement_revision_id}\u0000${sourceContext}`;
          const held = objectiveMappings.get(key) ?? {
            contentId: mapping.requirement_revision_id,
            context: sourceContext,
            labels: new Set<string>(),
            rationale: [],
          };
          held.labels.add(objectiveLabel(objective) ?? objectiveWords.unlabelled);
          if (mapping.rationale && !held.rationale.includes(mapping.rationale))
            held.rationale.push(mapping.rationale);
          objectiveMappings.set(key, held);
          continue;
        }
        addRequirement(
          mapping.requirement_revision_id,
          false,
          `${review ? "Control reference needs review" : "Mapped to control; no implementation claim implied"}${sourceContext}`,
          mapping.rationale,
        );
      }
      for (const held of objectiveMappings.values()) {
        const description = `${mappedObjectives([...held.labels])}; no implementation claim implied${held.context}`;
        if (!held.rationale.length) addRequirement(held.contentId, false, description, null);
        for (const rationale of held.rationale)
          addRequirement(held.contentId, false, description, rationale);
      }
      const evidence = new Map<string, SspEvidenceSupport>();
      const addEvidence = (id: string, origin: SspEvidenceSupport["origins"][number]) => {
        const version = versionById.get(id);
        const current = evidence.get(id) ?? {
          id,
          version,
          artifact: version ? artifactById.get(version.artifact_id) : undefined,
          origins: [],
        };
        current.origins.push(origin);
        evidence.set(id, current);
      };
      if (implementation)
        for (const link of input.implementationEvidence) {
          const label =
            link.implemented_requirement_id === implementation.id
              ? "Control narrative"
              : link.implementation_statement_id &&
                  statementIds.has(link.implementation_statement_id)
                ? "Statement narrative"
                : link.component_contribution_id &&
                    contributionIds.has(link.component_contribution_id)
                  ? "Component contribution"
                  : null;
          if (label)
            addEvidence(link.evidence_version_id, {
              id: link.id,
              label,
              claim: link.claim,
              rationale: link.applicability_rationale,
            });
        }
      for (const link of input.requirementEvidence) {
        const support = supports.get(link.requirement_revision_id);
        if (support)
          addEvidence(link.evidence_version_id, {
            id: link.id,
            label: `${support.requirement.code} · ${support.explicit ? "linked requirement" : "mapped requirement"}`,
            claim: link.claim,
            rationale: link.applicability_rationale,
          });
      }
      const inherited = implementation
        ? input.acceptances
            .filter((row) => row.implemented_requirement_id === implementation.id)
            .map((acceptance) => {
              const offering = offeringById.get(acceptance.offered_implementation_id);
              return {
                acceptance,
                offering,
                contribution: offering
                  ? offeredById.get(offering.component_contribution_id)
                  : undefined,
              };
            })
        : [];
      const gaps: string[] = [];
      if (!implementation) gaps.push("No implementation record");
      else if (!implementation.description?.trim()) gaps.push("Control narrative not recorded");
      if (contributions.some((row) => !row.element)) gaps.push("Contributing system needs review");
      if (!supports.size) gaps.push("No linked or mapped requirements");
      if (!evidence.size) gaps.push("No linked evidence");
      if ([...evidence.values()].some((row) => !row.version || !row.artifact))
        gaps.push("Evidence reference unavailable");
      return {
        id: selection.id,
        selection,
        control,
        code: control?.code ?? "Reference unavailable",
        title: control?.title ?? "Control unavailable",
        implementation,
        status: implementation?.implementation_status ?? "unrecorded",
        narrative: implementation?.description?.trim() ? "Recorded" : "Not recorded",
        statements,
        contributions,
        requirements: [...supports.values()],
        evidence: [...evidence.values()],
        inherited,
        gaps,
        requirementCount: new Set([...supports.values()].map((row) => row.requirement.id)).size,
        evidenceCount: evidence.size,
        contributionCount: contributions.length,
      };
    });
}

// ---------------------------------------------------------------------------------------------
// The register: `ssp_control_rows`.
// ---------------------------------------------------------------------------------------------

type Client = Pick<SupabaseClient, "rpc">;

const id = z.string();
const text = z.string().nullable();

const controlRowSchema = z.object({
  id,
  control_id: id,
  code: text,
  title: text,
  implementation_id: text,
  implementation_status: text,
  narrative: z.boolean(),
  contributions: z.number(),
  requirements: z.number(),
  evidence: z.number(),
});

const controlRowsSchema = z.object({
  ssp_revision_id: id,
  rows: z.array(controlRowSchema),
  requirements: z.number(),
  evidence: z.number(),
  boundary_differs: z.boolean(),
  gaps: z.array(z.object({ system_id: id, name: z.string(), codes: z.array(z.string()) })),
  baseline_title: text,
  imported_demo: z.boolean(),
});

/** A control of an SSP revision as its register reads it, under the same rules as `assembleSsp`. */
export type SspControlRow = {
  /** The baseline's selection of the control: the row's identity. */
  id: string;
  controlId: string;
  /** The control's code and title; none where the reader cannot read the control. */
  code: string | null;
  title: string | null;
  /** The control's recorded implementation in this SSP, if any, and its status. */
  implementationId: string | null;
  implementationStatus: string | null;
  /** Whether the implementation's narrative is written. */
  narrative: boolean;
  contributions: number;
  requirements: number;
  evidence: number;
};

/** One SSP revision's register and what the tab says of the SSP as a whole. */
export type SspControlRows = {
  sspRevisionId: string;
  /** Every control the stored baseline selects, in the baseline's order. */
  rows: SspControlRow[];
  /** The requirements behind any control, and the evidence versions, each counted once. */
  requirements: number;
  evidence: number;
  /** The boundary resolves to another baseline than the one this SSP stored. */
  boundaryDiffers: boolean;
  /** Each system inside the boundary whose own baseline selects controls this SSP does not. */
  gaps: { systemId: string; name: string; codes: string[] }[];
  /** The stored baseline's profile, by title; none where the reader cannot read it. */
  baselineTitle: string | null;
  /** The stored selection is an imported demo selection. */
  importedDemo: boolean;
};

/** An SSP revision's controls, as the server reads them; an SSP the reader cannot read is refused. */
export async function readSspControlRows(
  client: Client,
  context: ReadContext,
  sspRevisionId: string,
  signal?: AbortSignal,
): Promise<SspControlRows> {
  let request = client
    .rpc("ssp_control_rows", { p_ssp_revision_id: sspRevisionId })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const answer = controlRowsSchema.parse(data);
  return {
    sspRevisionId: answer.ssp_revision_id,
    rows: answer.rows.map((row) => ({
      id: row.id,
      controlId: row.control_id,
      code: row.code,
      title: row.title,
      implementationId: row.implementation_id,
      implementationStatus: row.implementation_status,
      narrative: row.narrative,
      contributions: row.contributions,
      requirements: row.requirements,
      evidence: row.evidence,
    })),
    requirements: answer.requirements,
    evidence: answer.evidence,
    boundaryDiffers: answer.boundary_differs,
    gaps: answer.gaps.map((gap) => ({ systemId: gap.system_id, name: gap.name, codes: gap.codes })),
    baselineTitle: answer.baseline_title,
    importedDemo: answer.imported_demo,
  };
}

/**
 * Every model the register and a control's preview are read from: a write to one reads them again.
 * The stored baseline and its selections, the implementations, statements and contributions the
 * SSP records, the systems and components behind them, the program's requirements and what links
 * and maps them, the evidence and what links it, and the accepted provider offerings.
 */
export const SSP_ASSEMBLY_MODELS = [
  "ssp_revisions",
  "profile_resolutions",
  "profiles",
  "selected_controls",
  "implemented_requirements",
  "implementation_statements",
  "component_contributions",
  "systems",
  "system_components",
  "inventory_components",
  "inventory_items",
  "engineering_requirements",
  "requirement_revisions",
  "requirement_implementations",
  "requirement_control_links",
  "requirement_allocations",
  "requirement_evidence",
  "implementation_evidence",
  "evidence_versions",
  "evidence_artifacts",
  "inheritance_acceptances",
  "offered_implementations",
] as const satisfies readonly TableName[];

/** One SSP revision's register. Another revision's never stands in for it while it loads. */
export function useSspControlRows(
  sspRevisionId: string | null | undefined,
): UseQueryResult<SspControlRows, Error> {
  const workspace = useWorkspace();
  useStaleOnWrite(workspace.tenantId, SSP_ASSEMBLY_MODELS, [
    "models",
    workspace.tenantId,
    "ssp_control_rows",
  ]);
  return useQuery<SspControlRows, Error>({
    queryKey: ["models", workspace.tenantId, "ssp_control_rows", sspRevisionId ?? null],
    enabled: !!sspRevisionId,
    retry: false,
    queryFn: async ({ signal }) =>
      readSspControlRows(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        sspRevisionId!,
        signal,
      ),
  });
}

// ---------------------------------------------------------------------------------------------
// A control's preview: `ssp_control_detail`.
// ---------------------------------------------------------------------------------------------

const json = z.custom<Json>(() => true);
const count = z.number();

const selectionSchema = z.object({
  id,
  control_id: id,
  profile_resolution_id: id,
  ordinal: count,
});
/** A record the preview edits: what the assembly reads of it checked, every other column kept. */
const implementationSchema = z
  .object({
    id,
    tenant_id: id,
    ssp_revision_id: id,
    selected_control_id: id,
    implementation_status: z.string(),
    description: text,
    not_applicable_rationale: text,
    responsible_party_id: text,
    revision: count,
  })
  .passthrough();
const statementSchema = z
  .object({
    id,
    tenant_id: id,
    ssp_revision_id: id,
    implemented_requirement_id: id,
    control_part_id: id,
    description: z.string(),
    revision: count,
  })
  .passthrough();
const contributionSchema = z
  .object({
    id,
    tenant_id: id,
    ssp_revision_id: id,
    implemented_requirement_id: id,
    implementation_statement_id: text,
    system_component_id: id,
    description: z.string(),
    implementation_status: z.string(),
    responsible_party_id: text,
    library_implementation_id: text,
    revision: count,
  })
  .passthrough();

const detailSchema = z.object({
  ssp_revision_id: id,
  selection: selectionSchema,
  control: z.object({ id, code: z.string(), title: z.string() }).nullable(),
  implementation: implementationSchema.nullable(),
  statements: z.array(statementSchema),
  contributions: z.array(contributionSchema),
  offered_contributions: z.array(
    z.object({
      id,
      implemented_requirement_id: id,
      system_component_id: id,
      description: z.string(),
    }),
  ),
  components: z.array(z.object({ id, name: z.string() })),
  component_elements: z.array(z.object({ id, system_element_id: text, link_source: z.string() })),
  parts: z.array(
    z.object({
      id,
      control_id: text,
      parent_part_id: text,
      name: z.string(),
      prose: text,
      props: json,
      source_id: text,
      title: text,
    }),
  ),
  requirement_links: z.array(
    z.object({
      id,
      requirement_revision_id: id,
      implemented_requirement_id: text,
      component_contribution_id: text,
      rationale: text,
    }),
  ),
  control_mappings: z.array(
    z.object({
      id,
      requirement_revision_id: id,
      control_id: id,
      control_part_id: text,
      system_id: text,
      selected_control_id: text,
      rationale: text,
    }),
  ),
  allocations: z.array(
    z.object({ requirement_revision_id: id, system_id: text, composition_node_id: text }),
  ),
  revisions: z.array(
    z.object({
      id,
      engineering_requirement_id: id,
      title: z.string(),
      statement: z.string(),
      acceptance_criteria: z.string(),
      state: z.string(),
    }),
  ),
  requirements: z.array(z.object({ id, code: z.string(), program_id: id })),
  implementation_evidence: z.array(
    z.object({
      id,
      implemented_requirement_id: text,
      implementation_statement_id: text,
      component_contribution_id: text,
      evidence_version_id: id,
      claim: text,
      applicability_rationale: text,
    }),
  ),
  requirement_evidence: z.array(
    z.object({
      id,
      requirement_revision_id: id,
      evidence_version_id: id,
      claim: text,
      applicability_rationale: text,
    }),
  ),
  versions: z.array(
    z.object({
      id,
      artifact_id: id,
      version_number: count,
      state: z.string(),
      collected_at: text,
      published_at: text,
      expires_at: text,
      external_uri: text,
      media_type: text,
      byte_size: count.nullable(),
      sha256: text,
      provenance: text,
      storage_object_name: text,
      storage_object_id: text,
    }),
  ),
  artifacts: z.array(
    z.object({
      id,
      title: z.string(),
      description: text,
      artifact_kind: z.string(),
      owner_party_id: text,
    }),
  ),
  acceptances: z.array(
    z.object({
      id,
      implemented_requirement_id: id,
      offered_implementation_id: id,
      accepted_at: z.string(),
      rationale: z.string(),
      consumer_responsibility: text,
    }),
  ),
  offerings: z.array(z.object({ id, name: z.string(), component_contribution_id: id })),
  source_selections: z.array(selectionSchema),
  effective_baselines: z.array(z.object({ system_id: id, profile_resolution_id: text })),
});

/** What stands behind one control of an SSP revision: the records its preview is assembled from. */
export type SspControlDetail = Omit<
  SspAssemblyInput,
  "plan" | "systems" | "selections" | "controls"
> & {
  sspRevisionId: string;
  selection: Selection;
  control: Control | null;
  /** The selections the control's mappings recorded, which may be another baseline's. */
  sourceSelections: Selection[];
};

/** One control's records, as the server reads them; a control the SSP does not select is refused. */
export async function readSspControlDetail(
  client: Client,
  context: ReadContext,
  sspRevisionId: string,
  selectionId: string,
  signal?: AbortSignal,
): Promise<SspControlDetail> {
  let request = client
    .rpc("ssp_control_detail", {
      p_ssp_revision_id: sspRevisionId,
      p_selected_control_id: selectionId,
    })
    .setHeader("Authorization", `Bearer ${context.token}`);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const answer = detailSchema.parse(data);
  return {
    sspRevisionId: answer.ssp_revision_id,
    selection: answer.selection,
    control: answer.control,
    // The records the preview edits keep every column the server sent.
    implementations: answer.implementation ? [answer.implementation as SspImplementation] : [],
    statements: answer.statements as SspStatement[],
    contributions: answer.contributions as SspContribution[],
    offeredContributions: answer.offered_contributions,
    components: answer.components,
    componentElements: answer.component_elements,
    parts: answer.parts,
    requirements: answer.requirements,
    contents: answer.revisions,
    requirementLinks: answer.requirement_links,
    controlMappings: answer.control_mappings,
    allocations: answer.allocations,
    requirementEvidence: answer.requirement_evidence,
    implementationEvidence: answer.implementation_evidence,
    versions: answer.versions,
    artifacts: answer.artifacts,
    acceptances: answer.acceptances,
    offerings: answer.offerings,
    sourceSelections: answer.source_selections,
    effectiveBaselines: answer.effective_baselines,
  };
}

/** One control's records, read as its preview opens; another control's never stand in for them. */
export function useSspControlDetail(
  sspRevisionId: string | null | undefined,
  selectionId: string | null | undefined,
): UseQueryResult<SspControlDetail, Error> {
  const workspace = useWorkspace();
  useStaleOnWrite(workspace.tenantId, SSP_ASSEMBLY_MODELS, [
    "models",
    workspace.tenantId,
    "ssp_control_detail",
  ]);
  return useQuery<SspControlDetail, Error>({
    queryKey: [
      "models",
      workspace.tenantId,
      "ssp_control_detail",
      sspRevisionId ?? null,
      selectionId ?? null,
    ],
    enabled: !!sspRevisionId && !!selectionId,
    retry: false,
    queryFn: async ({ signal }) =>
      readSspControlDetail(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        sspRevisionId!,
        selectionId!,
        signal,
      ),
  });
}

/**
 * One control of the SSP, assembled from its records and the program's systems as the register's
 * rules read it: its implementation, statements and contributions, the requirements and evidence
 * behind it with what each says, its accepted provider offerings and its recorded gaps.
 */
export function assembleSspControl(
  detail: SspControlDetail,
  { plan, systems }: { plan: SspPlan; systems: readonly SspSystem[] },
): SspControlAssembly | undefined {
  const { selection, control, sourceSelections } = detail;
  return assembleSsp({
    ...detail,
    plan,
    systems: [...systems],
    selections: [selection, ...sourceSelections.filter((row) => row.id !== selection.id)],
    controls: control ? [control] : [],
  }).find((row) => row.id === selection.id);
}
