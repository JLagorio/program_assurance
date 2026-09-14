/** Scoped projections of the existing control sets and implementation records. */
import { nodeById } from "@/lib/composition";
import { controlMatrix, type ControlRow, type ControlStatus } from "@/lib/control-matrix";
import {
  workForProgram,
  type AssessmentState,
  type ControlWork,
  type ImplementationState,
} from "@/lib/control-work";
import {
  evidenceForProgram,
  evidenceForTarget,
  type EvidenceArtifact,
} from "@/lib/evidence-catalog";
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

/** Coverage uses the matrix status, which includes Partial and accepted risk. */
export function filterControlCoverage(
  rows: ProgramControlRow[],
  filter: { family?: string | undefined; status?: ControlStatus | undefined },
) {
  return rows.filter(
    (row) =>
      (!filter.family || row.family === filter.family) &&
      (!filter.status || row.record.status === filter.status),
  );
}

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

export type ControlImplementationRow = {
  scopeId: string;
  elementId: string;
  name: string;
  implementation: ImplementationState | "Unrecorded";
  assessment: AssessmentState;
  owner: string;
  requirements: number;
  evidence: number;
};

/** Each row reports only the implementation recorded for that named element. */
export function programControlImplementations(
  programId: string,
  controlId: string,
  elementId?: string,
): ControlImplementationRow[] {
  const work = workForProgram(programId);
  return programControlScopes(programId, elementId).flatMap((scope) => {
    if (!controlSetFor(scope.id)?.controls.some((item) => item.control.id === controlId)) return [];
    const recorded = work.find((item) => item.scope === scope.id && item.control === controlId);
    return [
      {
        scopeId: scope.id,
        elementId: scope.element,
        name: resolveProgramElement(programId, scope.element)?.name ?? scope.name,
        implementation:
          recorded && touched(recorded) && recorded.implementationRecorded !== false
            ? recorded.implementation
            : "Unrecorded",
        assessment: recorded?.assessment ?? "Not assessed",
        owner: recorded?.owner || "Unassigned",
        requirements: controlRequirementsInElement(programId, controlId, scope.element).length,
        evidence: evidenceForTarget(programId, "control", controlId, scope.id).length,
      },
    ];
  });
}
function implementationOf(
  work: ControlWork[],
  completeScopeCoverage: boolean,
): ProgramControlRow["implementation"] {
  if (!work.length) return "Unrecorded";
  const states = new Set(
    work.map((item) =>
      item.implementationRecorded === false ? "Unrecorded" : item.implementation,
    ),
  );
  if (!completeScopeCoverage) states.add("Unrecorded");
  return states.size === 1 ? [...states][0]! : "Mixed";
}

export function programControlRows(programId: string, elementId?: string): ProgramControlRow[] {
  const element = resolveProgramElement(programId, elementId);
  const ids = programElementIds(programId, element?.id);
  const scopes = programControlScopes(programId, element?.id);
  const closest = closestProgramScope(programId, element?.id);
  const sets = scopes.map((scope) => controlSetFor(scope.id)).filter((set) => set !== null);
  // Membership is asked once per control per scope; a resolved set is hundreds of
  // controls long, so index it rather than rescanning the array each time.
  const setControlIds = sets.map((set) => new Set(set.controls.map((row) => row.control.id)));
  // evidenceForTarget rebuilds the merged catalog on every call, and this loop would
  // ask it once per control per scope. Index the control links once instead: same
  // answer, one pass over the catalog rather than hundreds.
  const evidenceByControlScope = new Map<string, EvidenceArtifact[]>();
  for (const artifact of evidenceForProgram(programId))
    for (const link of artifact.links) {
      if (link.kind !== "control" || !link.scopeId) continue;
      const key = `${link.id}\u0000${link.scopeId}`;
      const bucket = evidenceByControlScope.get(key);
      if (bucket) {
        if (!bucket.includes(artifact)) bucket.push(artifact);
      } else evidenceByControlScope.set(key, [artifact]);
    }
  const base = new Map(controlMatrix(programId).map((row) => [row.id, row]));
  const controlIds = [...new Set(sets.flatMap((set) => set.controls.map((row) => row.control.id)))];
  // Programs not modeled with assessment scopes retain their existing native matrix.
  if (!scopes.length && !element) controlIds.push(...base.keys());
  const work = workForProgram(programId);
  return controlIds.flatMap((id): ProgramControlRow[] => {
    const record = base.get(id);
    if (!record) return [];
    const applicable = sets
      .filter((_, index) => setControlIds[index]!.has(id))
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
    const completeScopeCoverage = applicable.every((scope) =>
      scopedWork.some((item) => item.scope === scope.id),
    );
    const findingRows = controlFindingsInElement(programId, id, element?.id);
    const assessment: AssessmentState =
      findingRows.some(isDeficiency) ||
      scopedWork.some((item) => item.assessment === "Other than satisfied")
        ? "Other than satisfied"
        : completeScopeCoverage &&
            scopedWork.length > 0 &&
            scopedWork.every((item) => item.assessment === "Satisfied")
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
        (evidenceByControlScope.get(`${id}\u0000${scope.id}`) ?? [])
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
        implementation: implementationOf(scopedWork, completeScopeCoverage),
        assessment,
        owner:
          [...new Set(scopedWork.flatMap((item) => item.owner ?? []))].join(", ") || "Unassigned",
        evidence: evidenceIds.size,
        findings: findingRows,
        record,
      },
    ];
  });
}
