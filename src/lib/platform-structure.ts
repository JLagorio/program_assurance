/** Maps the supplied platform into the program's existing System and Requirements records. */
import { addCompositionNodes, nodeById, type NewCompositionNode } from "@/lib/composition";
import { assets, assetById, type Asset } from "@/lib/findings";
import { registerRequirementSeed, type Allocation, type Requirement } from "@/lib/requirements";
import { platformSeed, type PlatformRequirement } from "@/lib/platform-seed";
import {
  platformAssetId,
  platformNodeId,
  platformProgramId,
  platformRootNodeId,
  platformSourceRecord,
} from "@/lib/platform-ids";

export function platformCompositionRecords(): NewCompositionNode[] {
  const system = platformSeed.systems[0]!;
  const shared = {
    program: platformProgramId,
    supplier: "—",
    origin: "Unknown" as const,
    criticality: "Unspecified" as const,
    zone: "Unspecified" as const,
    attested: false,
    bomSource: "Declared" as const,
  };
  return [
    {
      ...shared,
      id: platformRootNodeId,
      name: system.name,
      kind: "System",
      class: "System",
      parent: null,
      note: system.description,
      sourceRecord: platformSourceRecord(system),
    },
    ...platformSeed.subsystems.map((subsystem): NewCompositionNode => ({
      ...shared,
      id: platformNodeId(subsystem.id),
      name: subsystem.name,
      kind: "Subsystem",
      class: "System",
      parent: platformRootNodeId,
      note: subsystem.description,
      sourceRecord: platformSourceRecord(subsystem),
    })),
    ...platformSeed.components.map((component): NewCompositionNode => ({
      ...shared,
      id: platformNodeId(component.id),
      name: component.name,
      kind: component.type === "software" ? "Application" : "Chassis",
      class: component.type === "software" ? "Software" : "Hardware",
      parent: platformNodeId(component.subsystem_id),
      asset: platformAssetId(component.id),
      note: component.description,
      sourceRecord: platformSourceRecord(component),
    })),
  ];
}

export function platformAssetRecords(): Asset[] {
  return platformSeed.components.map((component) => ({
    id: platformAssetId(component.id),
    name: component.name,
    kind: component.type === "software" ? "Application" : "Host",
    technology: "Unspecified",
    program: platformProgramId,
    environment: "Unspecified",
    owner: "Unassigned",
    lastScan: "Not supplied",
    ccisCovered: 0,
    openCatI: 0,
    openCatII: 0,
    openCatIII: 0,
    scanAvailable: false,
    node: platformNodeId(component.id),
    sourceRecord: platformSourceRecord(component),
  }));
}

function requirementState(item: PlatformRequirement): Requirement["state"] {
  // Implementation is a source claim; a passing assessment does not silently approve it.
  return item.implementation_status === "implemented" ? "Implemented" : "Allocated";
}

export function platformRequirementRecords(): {
  requirements: Requirement[];
  allocations: Allocation[];
} {
  const requirements = platformSeed.requirements.map((item): Requirement => ({
    id: item.id,
    program: platformProgramId,
    parent: null,
    type: item.source === "derived" ? "Derived" : "System security",
    text: item.description,
    revision: 1,
    state: requirementState(item),
    owner: item.owner_role,
    derivations: item.control_ids.length
      ? item.control_ids.map((controlId) => ({
          relation: item.source === "derived" ? "derived" : "mapped",
          sourceType: "Control statement",
          sourceId: controlId,
          sourceLabel: controlId,
          rationale:
            item.source === "derived"
              ? `Derived from ${controlId} in ${item.source_profile_id ?? "the platform requirements"}.`
              : `Mapped to ${controlId} by the platform requirements.`,
        }))
      : [
          {
            relation: "derived",
            sourceType: "Policy",
            sourceId: item.source_profile_id ?? platformSeed.dataset_metadata.dataset_id,
            sourceLabel: item.source,
            rationale: `Authored from ${item.source}; no control mapping was supplied.`,
          },
        ],
    // The existing engineering method is retained alongside the exact OSCAL assessment method.
    method:
      item.verification_method === "test"
        ? "Test"
        : item.verification_method === "examine"
          ? "Inspection"
          : "Analysis",
    assessmentMethod:
      item.verification_method === "test"
        ? "Test"
        : item.verification_method === "examine"
          ? "Examine"
          : "Interview",
    successCriteria: item.acceptance_criteria.join("\n"),
    workstream: null,
    note: item.title,
    sourceRecord: platformSourceRecord(item),
  }));
  const allocations = platformSeed.requirements.flatMap((item, requirementIndex) =>
    item.component_ids.map((componentId, componentIndex): Allocation => ({
      id: `ALC-${109000 + requirementIndex * 100 + componentIndex + 1}`,
      requirement: item.id,
      target: platformNodeId(componentId),
      targetKind: "node",
      responsibility: "Primary",
      coverage: item.component_ids.length === 1 ? "Full" : "Shared",
      scope: item.description,
      owner: item.owner_role,
      state: item.implementation_status === "implemented" ? "Implemented" : "Accepted",
      rationale: `Allocated to ${componentId} by the supplied platform requirements.`,
      sourceRecord: platformSourceRecord({
        id: `${item.id}:${componentId}`,
        requirement_id: item.id,
        requirement_uuid: item.uuid,
        component_id: componentId,
        subsystem_ids: item.subsystem_ids,
      }),
    })),
  );
  return { requirements, allocations };
}

export function registerPlatformStructure(): void {
  const nodes = platformCompositionRecords();
  const importedAssets = platformAssetRecords();
  for (const node of nodes) {
    const existing = nodeById.get(node.id);
    if (
      existing &&
      (existing.program !== node.program || existing.sourceRecord?.id !== node.sourceRecord?.id)
    )
      throw new Error(`Platform element identifier is already in use: ${node.id}`);
  }
  for (const asset of importedAssets) {
    const existing = assetById.get(asset.id);
    if (
      existing &&
      (existing.program !== asset.program || existing.sourceRecord?.id !== asset.sourceRecord?.id)
    )
      throw new Error(`Platform asset identifier is already in use: ${asset.id}`);
  }
  const additions = nodes.filter((node) => !nodeById.has(node.id));
  if (additions.length) addCompositionNodes(additions);
  for (const asset of importedAssets) {
    if (!assetById.has(asset.id)) {
      assets.push(asset);
      assetById.set(asset.id, asset);
    }
  }
  registerRequirementSeed(platformRequirementRecords());
}
