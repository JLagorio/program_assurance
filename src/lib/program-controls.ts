/** Scoped projections of the existing control sets and implementation records. */
import { nodeById } from "@/lib/composition";
import { controlMatrix, type ControlRow } from "@/lib/control-matrix";
import {
  workForProgram,
  type AssessmentState,
  type ControlWork,
  type ImplementationState,
} from "@/lib/control-work";
import { evidenceForTarget } from "@/lib/evidence-catalog";
import { assetById, findingProgram, findings, isDeficiency, type Finding } from "@/lib/findings";
import { closestProgramScope, programElementIds, resolveProgramElement } from "@/lib/program-scope";
import { allocationsFor, requirementsForControl } from "@/lib/requirements";
import { controlSetFor, scopeById, scopesForProgram, type AssessmentScope } from "@/lib/scopes";

export type ProgramControlRow = {
  id: string;
  title: string;
  family: string;
  appliesTo: string;
  scopeIds: string[];
  scopeId: string;
  implementation: ImplementationState | "Unrecorded" | "Mixed";
  assessment: AssessmentState;
  owner: string;
  evidence: number;
  findings: Finding[];
  record: ControlRow;
};

export function programControlScopes(programId: string, elementId?: string): AssessmentScope[] {
  const element = resolveProgramElement(programId, elementId);
  const ids = programElementIds(programId, element?.id);
  const selected = scopesForProgram(programId).filter((scope) => ids.has(scope.element));
  const closest = closestProgramScope(programId, element?.id);
  if (element && closest && !selected.some((scope) => scope.id === closest.id))
    selected.unshift(closest);
  return selected;
}

export function controlRequirementsInElement(
  programId: string,
  controlId: string,
  elementId?: string,
) {
  const element = resolveProgramElement(programId, elementId);
  const candidates = requirementsForControl(controlId, programId);
  if (!element || nodeById.get(element.id)?.parent === null) return candidates;
  const ids = programElementIds(programId, element.id);
  return candidates.filter((requirement) =>
    allocationsFor(requirement.id).some(
      (allocation) => allocation.targetKind === "node" && ids.has(allocation.target),
    ),
  );
}

export function controlAllocationCount(
  programId: string,
  requirementId: string,
  elementId?: string,
) {
  const element = resolveProgramElement(programId, elementId);
  const allocations = allocationsFor(requirementId);
  if (!element || element.parent === null) return allocations.length;
  const ids = programElementIds(programId, element.id);
  return allocations.filter(
    (allocation) => allocation.targetKind === "node" && ids.has(allocation.target),
  ).length;
}

export function controlFindingsInElement(
  programId: string,
  controlId: string,
  elementId?: string,
): Finding[] {
  const element = resolveProgramElement(programId, elementId);
  const ids = programElementIds(programId, element?.id);
  return findings.filter((finding) => {
    if (
      findingProgram(finding) !== programId ||
      !(finding.controls ?? [finding.control]).includes(controlId)
    )
      return false;
    if (!element || element.parent === null) return true;
    const nodes = finding.nodes ?? [finding.node ?? assetById.get(finding.asset)?.node ?? ""];
    if (nodes.some((node) => ids.has(node))) return true;
    return (
      nodes.every((node) => !node) &&
      !!finding.scope &&
      ids.has(scopeById.get(finding.scope)?.element ?? "")
    );
  });
}

const touched = (work: ControlWork) =>
  !!work.owner || work.narrativeRevision > 0 || work.assessment !== "Not assessed";
function implementationOf(work: ControlWork[]): ProgramControlRow["implementation"] {
  if (!work.length) return "Unrecorded";
  const states = new Set(
    work.map((item) =>
      item.implementationRecorded === false ? "Unrecorded" : item.implementation,
    ),
  );
  return states.size === 1 ? [...states][0]! : "Mixed";
}

export function programControlRows(programId: string, elementId?: string): ProgramControlRow[] {
  const element = resolveProgramElement(programId, elementId);
  const ids = programElementIds(programId, element?.id);
  const scopes = programControlScopes(programId, element?.id);
  const closest = closestProgramScope(programId, element?.id);
  const sets = scopes.map((scope) => controlSetFor(scope.id)).filter((set) => set !== null);
  const base = new Map(controlMatrix(programId).map((row) => [row.id, row]));
  const controlIds = [...new Set(sets.flatMap((set) => set.controls.map((row) => row.control.id)))];
  // Programs not modeled with assessment scopes retain their existing native matrix.
  if (!scopes.length && !element) controlIds.push(...base.keys());
  const work = workForProgram(programId);
  return controlIds.flatMap((id): ProgramControlRow[] => {
    const record = base.get(id);
    if (!record) return [];
    const applicable = sets
      .filter((set) => set.controls.some((row) => row.control.id === id))
      .map((set) => set.scope);
    const scopedWork = work.filter(
      (item) =>
        item.control === id &&
        applicable.some((scope) => scope.id === item.scope) &&
        touched(item) &&
        (!element ||
          ids.has(scopeById.get(item.scope)?.element ?? "") ||
          (!!item.componentId && ids.has(item.componentId))),
    );
    const aggregateScope =
      closest &&
      (element?.id === closest.element ||
        (!element && nodeById.get(closest.element)?.parent === null))
        ? closest
        : undefined;
    const direct = aggregateScope
      ? scopedWork.find((item) => item.scope === aggregateScope.id)
      : undefined;
    const contributors = direct ? [direct] : scopedWork;
    const completeScopeCoverage = applicable.every((scope) =>
      scopedWork.some((item) => item.scope === scope.id),
    );
    const findingRows = controlFindingsInElement(programId, id, element?.id);
    const assessment: AssessmentState =
      findingRows.some(isDeficiency) ||
      scopedWork.some((item) => item.assessment === "Other than satisfied")
        ? "Other than satisfied"
        : direct?.assessment === "Satisfied" ||
            (completeScopeCoverage &&
              scopedWork.length &&
              scopedWork.every((item) => item.assessment === "Satisfied"))
          ? "Satisfied"
          : "Not assessed";
    const scopeId =
      applicable.find((scope) => scope.id === closest?.id)?.id ?? applicable[0]?.id ?? "";
    const names = applicable.map((scope) => scope.name);
    const inheritedScope = element && closest && !ids.has(closest.element) ? closest : undefined;
    const requirementIds = new Set(
      controlRequirementsInElement(programId, id, element?.id).map((requirement) => requirement.id),
    );
    const evidenceIds = new Set(
      applicable.flatMap((scope) =>
        evidenceForTarget(programId, "control", id, scope.id)
          .filter(
            (artifact) =>
              !inheritedScope ||
              artifact.links.some(
                (link) => link.kind === "requirement" && requirementIds.has(link.id),
              ),
          )
          .map((artifact) => artifact.id),
      ),
    );
    return [
      {
        id,
        title: record.fullTitle,
        family: record.family,
        scopeIds: applicable.map((scope) => scope.id),
        scopeId,
        appliesTo: inheritedScope
          ? `${element!.name} · via ${inheritedScope.name}`
          : element && applicable.some((scope) => scope.element === element.id)
            ? element.name
            : names.length > 1
              ? `${names[0]} +${names.length - 1}`
              : (names[0] ?? "Program"),
        implementation:
          !direct && !completeScopeCoverage && contributors.length
            ? "Mixed"
            : implementationOf(contributors),
        assessment,
        owner:
          [...new Set(contributors.flatMap((item) => item.owner ?? []))].join(", ") || "Unassigned",
        evidence: evidenceIds.size,
        findings: findingRows,
        record,
      },
    ];
  });
}
