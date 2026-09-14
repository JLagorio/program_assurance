import type { Row } from "./models";
import { isControlStatement } from "./requirement-control-mappings";

type RequirementLink = Omit<Row<"requirement_implementations">, "component_contribution_id"> & {
  component_contribution_id: string | null;
  implemented_requirement_id?: string | null;
};
type EvidenceLink = Omit<Row<"implementation_evidence">, "implementation_statement_id"> & {
  implementation_statement_id: string | null;
  implemented_requirement_id?: string | null;
  component_contribution_id?: string | null;
};
type Mapping = Omit<Row<"requirement_control_links">, "control_part_id"> & {
  control_part_id: string | null;
  control_id?: string | null;
  system_id?: string | null;
  selected_control_id?: string | null;
};
export type SspAssemblyInput = {
  plan: Row<"ssp_revisions">;
  selections: Row<"selected_controls">[];
  controls: Row<"controls">[];
  parts: Row<"control_parts">[];
  systems: Row<"systems">[];
  implementations: Row<"implemented_requirements">[];
  statements: Row<"implementation_statements">[];
  contributions: Row<"component_contributions">[];
  components: Row<"system_components">[];
  componentElements: Row<"system_component_element_links">[];
  requirements: Row<"engineering_requirements">[];
  contents: Row<"requirement_revisions">[];
  requirementLinks: RequirementLink[];
  controlMappings: Mapping[];
  allocations: Row<"requirement_allocations">[];
  requirementEvidence: Row<"requirement_evidence">[];
  implementationEvidence: EvidenceLink[];
  artifacts: Row<"evidence_artifacts">[];
  versions: Row<"evidence_versions">[];
  acceptances: Row<"inheritance_acceptances">[];
  offerings: Row<"offered_implementations">[];
  effectiveBaselines: Row<"system_effective_baselines">[];
};
export type SspRequirementSupport = {
  requirement: Row<"engineering_requirements">;
  content: Row<"requirement_revisions">;
  explicit: boolean;
  descriptions: string[];
  rationale: string[];
};
export type SspEvidenceSupport = {
  id: string;
  artifact: Row<"evidence_artifacts"> | undefined;
  version: Row<"evidence_versions"> | undefined;
  origins: { id: string; label: string; claim: string | null; rationale: string | null }[];
};
export type SspControlAssembly = {
  id: string;
  selection: Row<"selected_controls">;
  control: Row<"controls"> | undefined;
  code: string;
  title: string;
  implementation: Row<"implemented_requirements"> | undefined;
  status: string;
  narrative: "Recorded" | "Not recorded";
  statements: Row<"implementation_statements">[];
  contributions: {
    record: Row<"component_contributions">;
    component: Row<"system_components"> | undefined;
    element: Row<"systems"> | undefined;
    path: string;
    binding: string;
  }[];
  requirements: SspRequirementSupport[];
  evidence: SspEvidenceSupport[];
  inherited: {
    acceptance: Row<"inheritance_acceptances">;
    offering: Row<"offered_implementations"> | undefined;
    contribution: Row<"component_contributions"> | undefined;
  }[];
  gaps: string[];
  requirementCount: number;
  evidenceCount: number;
  contributionCount: number;
};

export function systemPath(element: Row<"systems">, systems: Row<"systems">[]): string {
  const byId = new Map(systems.map((system) => [system.id, system]));
  const path: string[] = [];
  const visited = new Set<string>();
  let current: Row<"systems"> | undefined = element;
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
  const contributionById = byId(input.contributions);
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
      for (const mapping of input.controlMappings) {
        const part = mapping.control_part_id ? partById.get(mapping.control_part_id) : undefined;
        const mappedControlId = mapping.control_id ?? part?.control_id;
        if (mappedControlId !== selection.control_id) continue;
        const inBoundary = mapping.system_id
          ? systemById.get(mapping.system_id)?.boundary_system_id === input.plan.system_id
          : allocationInBoundary.has(mapping.requirement_revision_id);
        if (!inBoundary) continue;
        const review = mapping.control_part_id && (!part || !isControlStatement(part, input.parts));
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
        addRequirement(
          mapping.requirement_revision_id,
          false,
          `${review ? "Control reference needs review" : "Mapped to control; no implementation claim implied"}${sourceContext}`,
          mapping.rationale,
        );
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
                  ? contributionById.get(offering.component_contribution_id)
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

/** Child additions remain visible without inserting them into an earlier SSP. */
export function sspSelectionGaps(
  input: Pick<
    SspAssemblyInput,
    "plan" | "selections" | "controls" | "systems" | "effectiveBaselines"
  >,
) {
  const selected = new Set(
    input.selections
      .filter((row) => row.profile_resolution_id === input.plan.profile_resolution_id)
      .map((row) => row.control_id),
  );
  const controls = new Map(input.controls.map((row) => [row.id, row]));
  return input.effectiveBaselines.flatMap((baseline) => {
    const system = input.systems.find(
      (row) => row.id === baseline.system_id && row.boundary_system_id === input.plan.system_id,
    );
    if (
      !system ||
      !baseline.profile_resolution_id ||
      baseline.profile_resolution_id === input.plan.profile_resolution_id
    )
      return [];
    const extra = input.selections
      .filter(
        (row) =>
          row.profile_resolution_id === baseline.profile_resolution_id &&
          !selected.has(row.control_id),
      )
      .map((row) => controls.get(row.control_id))
      .filter((row): row is Row<"controls"> => !!row);
    return extra.length ? [{ system, baseline, controls: extra }] : [];
  });
}
