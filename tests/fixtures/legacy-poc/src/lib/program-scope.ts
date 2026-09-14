import {
  ancestorsOf,
  descendantsOf,
  nodeById,
  nodesForProgram,
  type CompositionNode,
} from "@/lib/composition";
import { scopesForProgram, type AssessmentScope } from "@/lib/scopes";

/** Element links use composition IDs; assessment scope IDs remain local to implementation records. */
export function resolveProgramElement(
  programId: string,
  elementId?: string,
): CompositionNode | undefined {
  return elementId ? nodesForProgram(programId).find((node) => node.id === elementId) : undefined;
}

/** A selected subsystem includes its parts, always bounded to the current program. */
export function programElementIds(programId: string, elementId?: string): Set<string> {
  const element = resolveProgramElement(programId, elementId);
  const nodes = element ? [element, ...descendantsOf(element.id)] : nodesForProgram(programId);
  return new Set(nodes.filter((node) => node.program === programId).map((node) => node.id));
}

/** Components without local tailoring use the nearest ancestor's control set. */
export function closestProgramScope(
  programId: string,
  elementId?: string,
): AssessmentScope | undefined {
  const scopes = scopesForProgram(programId);
  const element = resolveProgramElement(programId, elementId);
  if (!element) {
    return scopes.find((scope) => nodeById.get(scope.element)?.parent === null) ?? scopes[0];
  }
  for (const node of [element, ...ancestorsOf(element.id)]) {
    if (node.program !== programId) continue;
    const scope = scopes.find((item) => item.element === node.id);
    if (scope) return scope;
  }
  return undefined;
}
