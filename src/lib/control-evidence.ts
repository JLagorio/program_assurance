/** Evidence supporting this implementation or its allocated requirements, without assessing either. */
import type { ControlWork } from "@/lib/control-work";
import { ancestorsOf } from "@/lib/composition";
import {
  evidenceAvailableInScope,
  evidenceForProgram,
  type EvidenceArtifact,
  type EvidenceLink,
} from "@/lib/evidence-catalog";
import { controlRequirementsInElement } from "@/lib/program-controls";
import { scopeById } from "@/lib/scopes";

export type ControlEvidence = { artifact: EvidenceArtifact; supports: EvidenceLink[] };

export function availableControlEvidence(work: ControlWork): EvidenceArtifact[] {
  return evidenceForProgram(work.program).filter((artifact) =>
    evidenceAvailableInScope(artifact, work.program, work.scope),
  );
}

export function controlEvidence(work: ControlWork): ControlEvidence[] {
  const scope = scopeById.get(work.scope);
  if (scope?.program !== work.program) return [];
  const requirementIds = new Set(
    controlRequirementsInElement(work.program, work.control, scope.element).map((item) => item.id),
  );
  const ancestorElements = new Set(ancestorsOf(scope.element).map((node) => node.id));
  return availableControlEvidence(work).flatMap((artifact) => {
    const supports = artifact.links.filter(
      (link) =>
        (link.kind === "control" && link.id === work.control && link.scopeId === work.scope) ||
        (link.kind === "requirement" &&
          requirementIds.has(link.id) &&
          (!link.scopeId ||
            link.scopeId === work.scope ||
            (artifact.scopeIds.includes(work.scope) &&
              ancestorElements.has(scopeById.get(link.scopeId)?.element ?? "")))),
    );
    return supports.length ? [{ artifact, supports }] : [];
  });
}
