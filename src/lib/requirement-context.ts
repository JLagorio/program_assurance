import {
  allocationsFor,
  getRequirement,
  requirementsForProgram,
  type Allocation,
  type Requirement,
} from "@/lib/requirements";
import { programElementIds, resolveProgramElement } from "@/lib/program-scope";

/** Whole-system context includes unallocated requirements; a selected element includes its subtree. */
export function requirementsForProgramElement(
  programId: string,
  elementId?: string,
): Requirement[] {
  const requirements = requirementsForProgram(programId);
  const element = resolveProgramElement(programId, elementId);
  if (!element) return requirements;
  const targets = programElementIds(programId, element.id);
  return requirements.filter((requirement) =>
    allocationsFor(requirement.id).some(
      (allocation) => allocation.targetKind === "node" && targets.has(allocation.target),
    ),
  );
}

export function allocationsForProgramElement(
  requirementId: string,
  programId: string,
  elementId?: string,
): Allocation[] {
  if (getRequirement(requirementId)?.program !== programId) return [];
  const allocations = allocationsFor(requirementId);
  const element = resolveProgramElement(programId, elementId);
  if (!element) return allocations;
  const targets = programElementIds(programId, element.id);
  return allocations.filter(
    (allocation) => allocation.targetKind === "node" && targets.has(allocation.target),
  );
}
