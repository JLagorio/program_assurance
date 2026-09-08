/** Map the supplied profile and component implementation records into the existing program stores. */
import { platformSeed } from "@/lib/platform-seed";
import {
  platformNodeId,
  platformScopeId,
  platformRootScopeId,
  platformProgramId,
  platformSourceRecord,
} from "@/lib/platform-ids";
import {
  addScopes,
  controlSetFor,
  recordTailoring,
  scopeById,
  type AssessmentScope,
} from "@/lib/scopes";
import { createRevision, inForceRevision } from "@/lib/control-set";
import { registerOverlay, type SystemParameters, type Overlay } from "@/lib/tailoring";
import {
  registerControlWork,
  type AssessmentState,
  type ImplementationState,
} from "@/lib/control-work";

const source = platformSeed;
const system = source.systems[0]!;
const profile = source.profiles.find((item) => item.id === system.profile_id)!;
const impact = (value: string): SystemParameters["confidentiality"] =>
  value === "high" ? "High" : value === "moderate" ? "Moderate" : "Low";
const parameters: SystemParameters = {
  confidentiality: impact(system.security_categorization.confidentiality),
  integrity: impact(system.security_categorization.integrity),
  availability: impact(system.security_categorization.availability),
  systemClass: "Tactical / deployed",
  hosting: "Hardware / platform",
  classification: "Unclassified",
  connectivity: "Standalone",
  handlesPii: false,
  crossDomain: false,
  safetyCritical: false,
};
const implementationState: Record<string, ImplementationState> = {
  implemented: "Implemented",
  "partially-implemented": "Partially implemented",
  planned: "Planned",
  "not-implemented": "Not implemented",
};

export function registerPlatformControls() {
  if (scopeById.has(platformRootScopeId)) return;
  const overlays: Overlay[] = profile.overlays.map((overlay) => ({
    id: overlay.overlay_id,
    name: overlay.name,
    authority: overlay.type,
    trigger: overlay.reason,
    controls: [
      ...overlay.adds.map((id) => ({
        id,
        title: overlay.name,
        action: "Added" as const,
        rationale: overlay.reason,
      })),
      ...overlay.removes.map((id) => ({
        id,
        title: overlay.name,
        action: "Tailored out" as const,
        rationale: overlay.reason,
      })),
    ],
  }));
  overlays.forEach(registerOverlay);
  const elements = [
    { id: system.id, name: system.name, description: system.description, parent: null },
    ...source.subsystems.map((item) => ({ ...item, parent: system.id })),
    ...source.components.map((item) => ({ ...item, parent: item.subsystem_id })),
  ];
  for (const element of elements) {
    const parentScope = element.parent ? platformScopeId(element.parent) : undefined;
    const startingControlIds = parentScope
      ? controlSetFor(parentScope)!.controls.map((row) => row.control.id)
      : [...profile.starting_selection];
    const scope: AssessmentScope = {
      id: platformScopeId(element.id),
      program: platformProgramId,
      element: platformNodeId(element.id),
      name: element.name,
      mission: element.description,
      owner: "System Security Engineer",
      independentlyAuthorized: false,
      parameters: { ...parameters },
      separationBasis: parentScope
        ? "Inherits the parent control set; no local tailoring has been recorded."
        : profile.tailoring_rationale,
      selectionSource: {
        profileId: profile.id,
        profileUuid: profile.uuid,
        catalogId: profile.source_catalog_id,
        label: parentScope ? `Inherited from ${element.parent}` : profile.name,
        startingControlIds,
        ...(parentScope ? { parentScope } : {}),
      },
    };
    addScopes([scope]);
    const selectedOverlays = parentScope ? [] : overlays;
    recordTailoring(scope.id, {
      overlays: selectedOverlays,
      excluded: new Map(),
      included: new Map(),
    });
    if (!inForceRevision(scope.id))
      createRevision({
        program: scope.program,
        scope: scope.id,
        parameters: scope.parameters,
        selectionSource: scope.selectionSource!,
        overlays: selectedOverlays.map((overlay) => ({
          overlay: overlay.id,
          applied: true,
          recommended: true,
          explicit: true,
          rationale: overlay.trigger,
        })),
        tailoring: [],
        separationBasis: scope.separationBasis,
        reason: parentScope ? "Inherited source profile" : "Imported tailored profile",
        seed: {
          state: "Approved",
          author: "Imported dataset",
          created: source.dataset_metadata.generated_at,
          decided: source.dataset_metadata.generated_at,
          decidedBy: "Imported source profile",
          note: "Recorded source selection; no application approval is implied.",
        },
      });
  }
  let index = 0;
  for (const implementation of source.control_implementations) {
    const resultsFor = (componentId?: string) =>
      source.assessment_results.filter(
        (result) =>
          result.control_ids.includes(implementation.control_id) &&
          (!componentId || result.component_ids.includes(componentId)),
      );
    const assessmentFor = (componentId?: string): AssessmentState => {
      const results = resultsFor(componentId);
      if (results.some((result) => result.outcome === "fail")) return "Other than satisfied";
      if (
        results.length &&
        results.every((result) => result.outcome === "pass" && result.evidence_ids.length)
      )
        return "Satisfied";
      return "Not assessed";
    };
    const base = {
      program: platformProgramId,
      control: implementation.control_id,
      submitted: false,
      owner: implementation.responsible_roles.join(", ") || "Unassigned",
      narrativeRevision: 1,
      assessedOn:
        resultsFor()
          .map((result) => result.assessed_on)
          .sort()
          .at(-1) ?? "",
      evidence: [],
      riskAcceptance: "",
      source: platformSourceRecord(implementation),
    };
    registerControlWork({
      ...base,
      id: `WRK-${109000 + index++}`,
      scope: platformRootScopeId,
      narrative: implementation.narrative,
      implementation: implementationState[implementation.status]!,
      implementationRecorded: true,
      assessment: assessmentFor(),
      determinationNote: resultsFor()
        .map((result) => result.notes)
        .join("\n\n"),
      requirementIds: implementation.requirement_ids,
    });
    for (const contribution of implementation.by_component) {
      registerControlWork({
        ...base,
        id: `WRK-${109000 + index++}`,
        scope: platformScopeId(contribution.component_id),
        componentId: platformNodeId(contribution.component_id),
        narrative: contribution.description,
        implementation: "Not implemented",
        implementationRecorded: false,
        assessment: assessmentFor(contribution.component_id),
        determinationNote: resultsFor(contribution.component_id)
          .map((result) => result.notes)
          .join("\n\n"),
        requirementIds: source.requirements
          .filter(
            (requirement) =>
              implementation.requirement_ids.includes(requirement.id) &&
              requirement.component_ids.includes(contribution.component_id),
          )
          .map((requirement) => requirement.id),
      });
    }
  }
}
