/** OSCAL projections of the existing program scope, requirement, evidence and control-work stores. */
import { oscalControlId, sha256Hex, stableUuid, type JsonObject } from "@/lib/oscal";
import { platformSeed, type PlatformEvidence, type PlatformSeed } from "@/lib/platform-seed";
import { platformProgramId, platformRootScopeId } from "@/lib/platform-ids";
import { ancestorsOf, nodesForProgram } from "@/lib/composition";
import { workForProgram } from "@/lib/control-work";
import { controlSetFor, rollupControlSet, scopeById, scopesForProgram } from "@/lib/scopes";
import { closestProgramScope } from "@/lib/program-scope";
import { revisionsForProgram } from "@/lib/control-set";
import { evidenceForProgram } from "@/lib/evidence-catalog";
import {
  requirementsForProgram,
  allocationsFor,
  controlDerivationsForRequirement,
} from "@/lib/requirements";

type ImplementationContribution = {
  id: string;
  componentId: string;
  controlId: string;
  narrative: string;
  status: string;
  responsibleRole: string;
  requirementIds: string[];
  evidenceIds: string[];
};
type ExportElement = {
  id: string;
  uuid: string;
  nodeId: string;
  parentNodeId: string | null;
  name: string;
  kind: string;
  type: string;
  description: string;
  version: string;
  supplier: string;
  status: string;
  subsystemId: string | null;
  scopeId: string | null;
};
export type PlatformExportSnapshot = {
  programId: string;
  dataset: PlatformSeed;
  composition: ExportElement[];
  contributions: ImplementationContribution[];
  selectedControlIds: string[];
  selections: Record<string, string[]>;
  revisions: ReturnType<typeof revisionsForProgram>;
};

/** Read the same live records used by the original program tabs; this is not a separate store. */
export function platformExportSnapshot(programId = platformProgramId): PlatformExportSnapshot {
  if (programId !== platformProgramId)
    throw new Error("This program does not use the imported platform profile.");
  const dataset = structuredClone(platformSeed);
  const work = workForProgram(programId);
  const scopes = scopesForProgram(programId);
  const composition: ExportElement[] = nodesForProgram(programId).map((node) => {
    const original = platformSeed.components.find(
      (component) => component.id === node.sourceRecord?.id,
    );
    const subsystem = ancestorsOf(node.id).find(
      (ancestor) => ancestor.kind === "Subsystem" || ancestor.kind === "Enclave",
    );
    return {
      id: node.sourceRecord?.id ?? node.id,
      // Match the component identity used by assessment/inventory exports in oscal.ts.
      uuid: node.sourceRecord?.uuid ?? stableUuid(`component|${node.id}`),
      nodeId: node.id,
      parentNodeId: node.parent,
      name: node.name,
      kind: node.kind,
      type: original?.type ?? node.class.toLowerCase(),
      description: node.note,
      version: node.version,
      supplier: node.supplier,
      status: original?.status ?? "not-recorded",
      subsystemId: subsystem ? (subsystem.sourceRecord?.id ?? subsystem.id) : null,
      scopeId:
        scopes.find((scope) => scope.element === node.id)?.id ??
        closestProgramScope(programId, node.id)?.id ??
        null,
    };
  });
  const root = composition.find((element) => element.parentNodeId === null);
  if (root) {
    dataset.systems[0]!.name = root.name;
    dataset.systems[0]!.description = root.description;
  }
  const isSubsystem = (element: ExportElement) =>
    element.kind === "Subsystem" || element.kind === "Enclave";
  dataset.subsystems = composition.filter(isSubsystem).map((element) => ({
    ...platformSeed.subsystems.find((record) => record.id === element.id),
    id: element.id,
    name: element.name,
    description: element.description,
  }));
  dataset.components = composition
    .filter((element) => element.parentNodeId !== null && !isSubsystem(element))
    .map((element) => ({
      ...platformSeed.components.find((record) => record.id === element.id),
      id: element.id,
      uuid: element.uuid,
      name: element.name,
      type: element.type,
      description: element.description,
      status: element.status,
      subsystem_id: element.subsystemId ?? "",
    }));
  const componentsByNode = new Map(
    composition
      .filter((element) => element.parentNodeId !== null)
      .map((element) => [element.nodeId, element]),
  );
  for (const implementation of dataset.control_implementations) {
    const aggregate = work.find(
      (item) => item.scope === platformRootScopeId && item.control === implementation.control_id,
    );
    if (aggregate) {
      implementation.narrative = aggregate.narrative;
      implementation.status = aggregate.implementation
        .toLowerCase()
        .replaceAll(" ", "-") as typeof implementation.status;
    }
  }
  dataset.requirements = requirementsForProgram(programId).map((record) => {
    const original = platformSeed.requirements.find((item) => item.id === record.id);
    const allocated = allocationsFor(record.id).flatMap(
      (allocation) => componentsByNode.get(allocation.target) ?? [],
    );
    const componentIds = allocated
      .filter((element) => !isSubsystem(element))
      .map((element) => element.id);
    return {
      ...(original ?? {}),
      id: record.id,
      uuid: original?.uuid ?? stableUuid(`requirement|${programId}|${record.id}`),
      title: original?.title ?? record.text,
      description: record.text,
      owner_role: record.owner,
      source:
        original?.source ??
        (record.derivations.map((item) => item.sourceLabel).join(", ") || "Engineering"),
      priority: original?.priority ?? "P2",
      tags: original?.tags ?? [],
      verification_method:
        (record.assessmentMethod?.toLowerCase() as "examine" | "interview" | "test") ??
        (record.method === "Test" ? "test" : "examine"),
      implementation_status:
        original?.implementation_status ??
        (record.state === "Implemented" || record.state === "Verified" ? "implemented" : "planned"),
      acceptance_criteria: record.successCriteria ? [record.successCriteria] : [],
      control_ids: controlDerivationsForRequirement(record.id).map((item) => item.sourceId),
      component_ids: componentIds,
      subsystem_ids: [
        ...new Set(
          allocated.flatMap((element) => {
            return isSubsystem(element)
              ? [element.id]
              : element.subsystemId
                ? [element.subsystemId]
                : [];
          }),
        ),
      ],
    };
  });
  dataset.evidence = evidenceForProgram(programId).map((artifact) => {
    const original = dataset.evidence.find(
      (item) => item.id === artifact.sourceId || item.id === artifact.id,
    );
    return {
      id: artifact.id,
      uuid: artifact.sourceUuid ?? stableUuid(`evidence|${programId}|${artifact.id}`),
      title: artifact.label,
      type: original?.type ?? artifact.kind,
      description: artifact.provenance,
      uri:
        artifact.url ??
        artifact.referenceUri ??
        `urn:uuid:${artifact.sourceUuid ?? stableUuid(artifact.id)}`,
      sha256: artifact.sha256 ?? "",
      collected_at: artifact.collected,
      valid_through: artifact.validThrough ?? "",
      requirement_ids: [
        ...new Set(
          artifact.links.filter((link) => link.kind === "requirement").map((link) => link.id),
        ),
      ],
      control_ids: [
        ...new Set(artifact.links.filter((link) => link.kind === "control").map((link) => link.id)),
      ],
      component_ids: [
        ...new Set([
          ...(artifact.componentIds ?? []),
          ...[
            ...artifact.scopeIds,
            ...artifact.links.flatMap((link) => link.scopeId ?? []),
          ].flatMap(
            (scopeId) => componentsByNode.get(scopeById.get(scopeId)?.element ?? "")?.id ?? [],
          ),
        ]),
      ],
      assessment_reuse: artifact.assessmentReuse ?? "",
    };
  });
  return {
    programId,
    dataset,
    composition,
    selectedControlIds: rollupControlSet(programId).controls.map((row) => row.control.id),
    selections: Object.fromEntries(
      composition.map((element) => [
        element.id,
        element.scopeId
          ? (controlSetFor(element.scopeId)?.controls.map((row) => row.control.id) ?? [])
          : [],
      ]),
    ),
    revisions: structuredClone(revisionsForProgram(programId)),
    contributions: work.flatMap((item) => {
      const component = componentsByNode.get(scopeById.get(item.scope)?.element ?? "");
      if (
        !component ||
        (!item.componentId && !item.narrativeRevision && !item.owner && !item.evidence.length)
      )
        return [];
      return [
        {
          id: item.id,
          componentId: component.id,
          controlId: item.control,
          narrative: item.narrative,
          status:
            item.implementationRecorded === false
              ? "not-recorded"
              : item.implementation.toLowerCase().replaceAll(" ", "-"),
          responsibleRole: item.owner ?? "Unassigned",
          requirementIds: dataset.requirements
            .filter(
              (requirement) =>
                requirement.control_ids.includes(item.control) &&
                (requirement.component_ids.includes(component.id) ||
                  requirement.subsystem_ids.includes(component.id)),
            )
            .map((requirement) => requirement.id),
          evidenceIds: [...item.evidence],
        },
      ];
    }),
  };
}

export const platformOscalVersion = "1.2.3";
export const platformCatalogHref =
  "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json";
const ns = "https://equinox.local/ns/program-assurance";
const prop = (name: string, value: string) => ({ name, ns, value });
const unique = <T>(values: T[]) => [...new Set(values)];
const identity = (value: PlatformExportSnapshot, name: string) =>
  stableUuid(`${value.dataset.dataset_metadata.dataset_id}|${name}`);

/** A changed document receives a new UUID; identities of its source records remain stable. */
function documentIdentity(value: PlatformExportSnapshot, model: string) {
  return identity(value, `${model}|${sha256Hex(JSON.stringify(value))}`);
}

export function platformOscalFilenames(value: PlatformExportSnapshot) {
  const prefix = value.dataset.systems[0]!.short_name.replace(/[^A-Za-z0-9_-]/g, "-");
  return { profile: `${prefix}-profile.json`, ssp: `${prefix}-ssp.json` };
}
function metadata(value: PlatformExportSnapshot, title: string) {
  const source = value.dataset.dataset_metadata;
  // There is no export-time clock: output is stable for the same program records.
  const stamps = [
    source.generated_at,
    ...value.revisions.map((item) => item.created),
    ...value.dataset.evidence.map((item) => item.collected_at),
    ...value.dataset.assessment_results.map((item) => item.assessed_on),
  ];
  const modified = stamps
    .filter((stamp) => Number.isFinite(Date.parse(stamp)))
    .sort((a, b) => Date.parse(a) - Date.parse(b))
    .at(-1)!;
  return {
    title,
    "last-modified": new Date(modified).toISOString(),
    version: "1.0.0",
    "oscal-version": platformOscalVersion,
    props: [
      prop("source-dataset", source.dataset_id),
      prop("program-id", value.programId),
      prop("classification", source.classification),
      prop("assembly-source", "Current program records"),
    ],
    remarks: source.disclaimer,
  };
}

/** The system profile includes controls required anywhere in its hierarchy. Node exclusions stay local. */
export function platformExportControlIds(value: PlatformExportSnapshot): string[] {
  return unique(value.selectedControlIds).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
}
function tailoringResource(value: PlatformExportSnapshot) {
  return {
    uuid: identity(value, "tailoring-provenance"),
    title: "Control selection and tailoring provenance",
    description: JSON.stringify(
      {
        source_profiles: value.dataset.profiles,
        current_scope_revisions: value.revisions,
        current_element_control_ids: value.selections,
        export_control_ids: platformExportControlIds(value),
      },
      null,
      2,
    ),
    props: [prop("type", "tailoring-provenance")],
  };
}

function compositionResource(value: PlatformExportSnapshot): JsonObject {
  return {
    uuid: identity(value, "system-composition"),
    title: "Current system composition",
    description: JSON.stringify(value.composition, null, 2),
    props: [prop("type", "system-composition")],
  };
}
export function buildSnapshotProfile(value: PlatformExportSnapshot): JsonObject {
  const system = value.dataset.systems[0]!;
  const profile = value.dataset.profiles.find((item) => item.id === system.profile_id)!;
  const ids = platformExportControlIds(value).map(oscalControlId);
  if (!ids.length)
    throw new Error("Select at least one control before exporting the OSCAL profile.");
  return {
    profile: {
      uuid: documentIdentity(value, "profile"),
      metadata: {
        ...metadata(value, `${system.short_name} tailored control profile`),
        props: [
          ...metadata(value, `${system.short_name} tailored control profile`).props,
          prop("source-profile-uuid", profile.uuid),
        ],
        links: [{ href: `#${identity(value, "tailoring-provenance")}`, rel: "related" }],
      },
      imports: [{ href: platformCatalogHref, "include-controls": [{ "with-ids": ids }] }],
      merge: { "as-is": true },
      "back-matter": { resources: [tailoringResource(value)] },
    },
  };
}

function evidenceResource(evidence: PlatformEvidence): JsonObject {
  return {
    uuid: evidence.uuid,
    title: evidence.title,
    description:
      evidence.description ||
      "Evidence reference; artifact bytes are managed at its recorded location.",
    props: [
      prop("evidence-id", evidence.id),
      prop("evidence-type", evidence.type),
      prop("collected-at", evidence.collected_at),
      ...(evidence.valid_through ? [prop("valid-through", evidence.valid_through)] : []),
      ...evidence.requirement_ids.map((id) => prop("requirement-id", id)),
      ...evidence.component_ids.map((id) => prop("component-id", id)),
      ...evidence.control_ids.map((id) => prop("control-id", id)),
    ],
    rlinks: [
      {
        href: evidence.uri,
        ...(evidence.sha256 ? { hashes: [{ algorithm: "SHA-256", value: evidence.sha256 }] } : {}),
      },
    ],
    remarks: evidence.assessment_reuse,
  };
}
function contributionLinks(value: PlatformExportSnapshot, item: ImplementationContribution) {
  return [
    ...item.requirementIds
      .map((id) => value.dataset.requirements.find((record) => record.id === id))
      .filter((record) => record !== undefined)
      .map((record) => ({ href: `#${record.uuid}`, rel: "related" })),
    ...item.evidenceIds
      .map((id) => value.dataset.evidence.find((record) => record.id === id))
      .filter((record) => record !== undefined)
      .map((record) => ({ href: `#${record.uuid}`, rel: "evidence" })),
  ];
}
function requirementResources(value: PlatformExportSnapshot): JsonObject[] {
  return value.dataset.requirements.map((requirement) => ({
    uuid: requirement.uuid,
    title: `${requirement.id} — ${requirement.title}`,
    description: [
      requirement.description,
      ...requirement.acceptance_criteria.map((criterion) => `Acceptance criterion: ${criterion}`),
      ...value.contributions
        .filter((item) => item.requirementIds.includes(requirement.id))
        .map(
          (item) =>
            `${item.componentId}${item.controlId ? ` / ${item.controlId}` : ""}: ${item.narrative || "Implementation narrative not recorded."} [${item.status}]`,
        ),
    ].join("\n\n"),
    props: [
      prop("type", "engineering-requirement"),
      prop("requirement-id", requirement.id),
      prop("source", requirement.source),
      prop("verification-method", requirement.verification_method),
      prop("owner-role", requirement.owner_role),
      ...requirement.component_ids.map((id) => prop("allocated-component-id", id)),
      ...requirement.subsystem_ids.map((id) => prop("allocated-subsystem-id", id)),
      ...requirement.control_ids.map((id) => prop("control-id", id)),
    ],
  }));
}

/** Assembles actual allocated component contributions; independent requirements remain explicit resources. */
export function buildSnapshotSsp(value: PlatformExportSnapshot): JsonObject {
  const dataset = value.dataset;
  const system = dataset.systems[0]!;
  const categorization = system.security_categorization;
  const selected = platformExportControlIds(value);
  if (!selected.length) throw new Error("Select at least one control before exporting the SSP.");
  const components = new Map(value.composition.map((element) => [element.id, element]));
  const elementsByNode = new Map(value.composition.map((element) => [element.nodeId, element]));
  const implemented: JsonObject[] = selected.map((controlId) => {
    const aggregate = dataset.control_implementations.find((item) => item.control_id === controlId);
    const contributions = value.contributions.filter(
      (item) =>
        item.controlId === controlId && value.selections[item.componentId]?.includes(controlId),
    );
    const byComponents: JsonObject[] = contributions.map((item) => {
      const component = components.get(item.componentId);
      if (!component) throw new Error(`Contribution ${item.id} has no component record.`);
      const links = contributionLinks(value, item);
      return {
        uuid: identity(value, `contribution|${item.id}`),
        "component-uuid": component.uuid,
        description: item.narrative || "Implementation narrative not recorded.",
        props: [
          prop("contribution-id", item.id),
          prop("component-id", item.componentId),
          prop("implementation-status", item.status),
          prop("responsible-role", item.responsibleRole),
          ...item.requirementIds.map((id) => prop("requirement-id", id)),
          ...item.evidenceIds.map((id) => prop("evidence-id", id)),
        ],
        ...(item.status !== "not-recorded"
          ? {
              "implementation-status": {
                state: item.status === "partially-implemented" ? "partial" : item.status,
              },
            }
          : {}),
        ...(links.length ? { links } : {}),
      };
    });
    return {
      uuid: aggregate?.uuid ?? identity(value, `implemented-control|${controlId}`),
      "control-id": oscalControlId(controlId),
      props: [
        prop("source-control-id", controlId),
        ...(aggregate ? [prop("source-aggregate-status", aggregate.status)] : []),
      ],
      ...(byComponents.length ? { "by-components": byComponents } : {}),
      remarks: [
        aggregate
          ? `System implementation: ${aggregate.narrative}`
          : "No imported aggregate narrative.",
        byComponents.length
          ? "Current component implementation is recorded in by-components. Implementation status and assessment verdict are separate records."
          : "No component implementation contribution recorded for this selected control.",
      ].join("\n\n"),
    };
  });
  return {
    "system-security-plan": {
      uuid: documentIdentity(value, "system-security-plan"),
      metadata: metadata(value, `${system.short_name} system security plan`),
      "import-profile": { href: `./${platformOscalFilenames(value).profile}` },
      "system-characteristics": {
        "system-ids": [
          { "identifier-type": `${ns}/system-id`, id: system.id },
          { id: system.uuid },
        ],
        "system-name": system.name,
        "system-name-short": system.short_name,
        description: system.description || "System description not recorded.",
        props: [prop("authorization-state", system.authorization_state)],
        "security-sensitivity-level": categorization.overall,
        "system-information": {
          "information-types": [
            {
              uuid: identity(value, "system-information"),
              title: "Modeled system information",
              description:
                "Categorization supplied by the program dataset. Specific information types have not been separately recorded.",
              "confidentiality-impact": { base: `fips-199-${categorization.confidentiality}` },
              "integrity-impact": { base: `fips-199-${categorization.integrity}` },
              "availability-impact": { base: `fips-199-${categorization.availability}` },
            },
          ],
        },
        "security-impact-level": {
          "security-objective-confidentiality": `fips-199-${categorization.confidentiality}`,
          "security-objective-integrity": `fips-199-${categorization.integrity}`,
          "security-objective-availability": `fips-199-${categorization.availability}`,
        },
        status: {
          state: "other",
          remarks: `Source authorization state: ${system.authorization_state}. System operational status is not separately recorded.`,
        },
        "authorization-boundary": {
          description: `Modeled boundary contains ${dataset.subsystems.length} subsystems and ${dataset.components.length} components. ${dataset.subsystems.map((subsystem) => `${subsystem.id}: ${subsystem.name}`).join("; ")}.`,
          links: [{ href: `#${identity(value, "system-composition")}`, rel: "related" }],
        },
      },
      "system-implementation": {
        components: value.composition
          .filter((component) => component.parentNodeId !== null)
          .map((component) => ({
            uuid: component.uuid,
            type: component.type,
            title: component.name,
            description: component.description || "Component description not recorded.",
            status: {
              state: ["operational", "under-development", "disposition", "other"].includes(
                component.status,
              )
                ? component.status
                : "other",
            },
            props: [
              prop("component-id", component.id),
              prop("node-id", component.nodeId),
              prop("node-kind", component.kind),
              ...(component.parentNodeId ? [prop("parent-node-id", component.parentNodeId)] : []),
              ...(component.subsystemId ? [prop("subsystem-id", component.subsystemId)] : []),
              ...(component.scopeId ? [prop("scope-id", component.scopeId)] : []),
              ...(component.version !== "—" && component.version
                ? [prop("version", component.version)]
                : []),
              ...(component.supplier !== "—" && component.supplier
                ? [prop("supplier", component.supplier)]
                : []),
              prop("source-status", component.status),
            ],
            ...(component.parentNodeId && elementsByNode.get(component.parentNodeId)?.parentNodeId
              ? {
                  links: [
                    { href: `#${elementsByNode.get(component.parentNodeId)!.uuid}`, rel: "parent" },
                  ],
                }
              : {}),
          })),
      },
      "control-implementation": {
        description:
          "Assembled from current component allocations, implementation contributions, and evidence references. Imported aggregate claims remain labeled. Engineering requirements are linked resources, including requirements with no control mapping.",
        "implemented-requirements": implemented,
      },
      "back-matter": {
        resources: [
          tailoringResource(value),
          compositionResource(value),
          ...requirementResources(value),
          ...dataset.evidence.map(evidenceResource),
        ],
      },
    },
  };
}
export function buildPlatformProfile(programId: string): JsonObject {
  return buildSnapshotProfile(platformExportSnapshot(programId));
}
export function buildPlatformSsp(programId: string): JsonObject {
  return buildSnapshotSsp(platformExportSnapshot(programId));
}
