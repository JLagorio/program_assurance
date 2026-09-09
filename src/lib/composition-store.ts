import { z } from "zod";
import {
  applyCompositionChanges,
  descendantsOf,
  nodeById,
  nodesForProgram,
  type CompositionNode,
  type NewCompositionNode,
  type NodePatch,
} from "@/lib/composition";
import {
  prepareInitialControlSetRevision,
  restoreInitialControlSetRevision,
  revisionById,
  revisionsForScope,
  eventsForScope,
  type ControlSetRevision,
  type RevisionEvent,
} from "@/lib/control-set";
import { closestProgramScope } from "@/lib/program-scope";
import {
  addScopes,
  controlSetFor,
  nextScopeId,
  scopeById,
  synchronizeCompositionScopes,
  type AssessmentScope,
} from "@/lib/scopes";

export const compositionStorageKey = "equinox.composition.v1";
let restored = false;

const nodeFields = {
  name: z.string().trim().min(1, "Enter a name."),
  version: z.string(),
  supplier: z.string(),
  origin: z.enum(["Internal", "Domestic", "Allied", "Foreign", "Unknown"]),
  criticality: z.enum([
    "Mission critical",
    "Mission essential",
    "Mission support",
    "Non-critical",
    "Unspecified",
  ]),
  zone: z.enum(["Public", "DMZ", "Enclave", "Management", "Isolated", "Unspecified"]),
  attested: z.boolean(),
  note: z.string(),
};
const patchSchema = z.object(nodeFields).partial().strict();
const nodeSchema = z.object({
  ...nodeFields,
  id: z.string().regex(/^CN-\d+$/),
  program: z.string().min(1),
  parent: z.string().min(1),
  kind: z.enum([
    "Subsystem",
    "Enclave",
    "Chassis",
    "Board",
    "Chip",
    "Peripheral",
    "Bootloader",
    "Firmware image",
    "Operating system",
    "Hypervisor",
    "Container image",
    "Runtime",
    "Application",
    "Service",
    "Package",
    "Library",
  ]),
  class: z.enum(["System", "Hardware", "Firmware", "Software"]),
  bomSource: z.enum([
    "CycloneDX",
    "SPDX",
    "Hardware part list",
    "Firmware manifest",
    "Declared",
    "Discovery scan",
  ]),
  bom: z.string().nullable(),
  partKey: z.string().min(1),
  asset: z.string().nullable(),
  digest: z.string().optional(),
  partNumber: z.string().optional(),
  eol: z.string().optional(),
});
const impact = z.enum(["Low", "Moderate", "High"]);
const parameters = z.object({
  confidentiality: impact,
  integrity: impact,
  availability: impact,
  systemClass: z.enum([
    "Tactical / deployed",
    "Enterprise IT",
    "Space platform",
    "Embedded weapon system",
  ]),
  hosting: z.enum([
    "Hardware / platform",
    "Cloud (IL4)",
    "Cloud (IL5)",
    "SaaS component",
    "Hybrid",
  ]),
  classification: z.enum(["Unclassified", "CUI", "Secret", "TS/SCI"]),
  connectivity: z.enum(["Continuous", "Intermittent (DDIL)", "Standalone"]),
  handlesPii: z.boolean(),
  crossDomain: z.boolean(),
  safetyCritical: z.boolean(),
});
const selectionSource = z.object({
  profileId: z.string(),
  profileUuid: z.string(),
  catalogId: z.string(),
  label: z.string(),
  startingControlIds: z.array(z.string()),
  parentScope: z.string(),
});
const scopeSchema = z.object({
  id: z.string().regex(/^SYS-\d+$/),
  program: z.string(),
  element: z.string(),
  name: z.string(),
  owner: z.string(),
  mission: z.string(),
  independentlyAuthorized: z.literal(false),
  parameters,
  separationBasis: z.string(),
  selectionSource,
});
const revisionSchema = z.object({
  id: z.string().regex(/^SCS-\d+$/),
  program: z.string(),
  scope: z.string(),
  number: z.literal(1),
  state: z.literal("Draft"),
  framework: z.enum(["nist-800-53-r5", "nist-800-53-r4", "nist-800-171-r2", "iso-27001"]),
  parameters,
  overlays: z.array(z.never()),
  tailoring: z.array(z.never()),
  separationBasis: z.string(),
  reason: z.string(),
  supersedes: z.null(),
  author: z.string(),
  created: z.string(),
  submitted: z.null(),
  decidedBy: z.null(),
  decided: z.null(),
  note: z.string(),
  selectionSource,
});
const eventSchema = z.object({
  id: z.string().regex(/^SCE-\d+$/),
  revision: z.string(),
  scope: z.string(),
  at: z.string(),
  actor: z.string(),
  role: z.enum([
    "Systems security engineer",
    "Component engineer",
    "Verification engineer",
    "Assessor",
    "Authorizing official",
    "Program manager",
  ]),
  kind: z.literal("created"),
  summary: z.string(),
});
const snapshotSchema = z.object({
  created: z.array(
    z.object({
      node: nodeSchema,
      assessment: z
        .object({
          scope: scopeSchema,
          revision: revisionSchema,
          history: z.array(eventSchema).length(1),
        })
        .optional(),
    }),
  ),
  updates: z.array(
    z.object({
      id: z.string(),
      program: z.string(),
      patch: patchSchema.extend({ parent: z.string().optional() }),
    }),
  ),
});
type CreatedNode = {
  node: CompositionNode;
  assessment?: { scope: AssessmentScope; revision: ControlSetRevision; history: RevisionEvent[] };
};
type Snapshot = {
  created: CreatedNode[];
  updates: { id: string; program: string; patch: NodePatch & { parent?: string } }[];
};
let snapshot: Snapshot = { created: [], updates: [] };

function validate(next: Snapshot, restoring = false) {
  const proposed = new Map(nodeById);
  const createdIds = new Set<string>();
  const scopeIds = new Set<string>();
  const revisionIds = new Set<string>();
  const eventIds = new Set<string>();
  const existingEventIds = restoring
    ? new Set([...scopeById.keys()].flatMap((id) => eventsForScope(id).map((event) => event.id)))
    : new Set<string>();
  for (const { node, assessment } of next.created) {
    if (createdIds.has(node.id) || (restoring && nodeById.has(node.id)))
      throw new Error("A saved system element ID is already in use.");
    createdIds.add(node.id);
    proposed.set(node.id, node);
    const expectedClass =
      node.kind === "Subsystem" || node.kind === "Enclave"
        ? "System"
        : ["Chassis", "Board", "Chip", "Peripheral"].includes(node.kind)
          ? "Hardware"
          : ["Bootloader", "Firmware image"].includes(node.kind)
            ? "Firmware"
            : "Software";
    if (node.class !== expectedClass) throw new Error("Element kind and class do not match.");
    if (assessment) {
      const { scope, revision, history } = assessment;
      if (
        scope.element !== node.id ||
        scope.program !== node.program ||
        scopeIds.has(scope.id) ||
        (restoring && scopeById.has(scope.id)) ||
        revision.scope !== scope.id ||
        revision.program !== node.program ||
        revisionIds.has(revision.id) ||
        JSON.stringify(scope.selectionSource) !== JSON.stringify(revision.selectionSource) ||
        JSON.stringify(scope.parameters) !== JSON.stringify(revision.parameters) ||
        (restoring && (revisionById(revision.id) || revisionsForScope(scope.id).length))
      )
        throw new Error("Saved assessment scope or control-set IDs conflict.");
      scopeIds.add(scope.id);
      revisionIds.add(revision.id);
      for (const event of history) {
        if (
          event.scope !== scope.id ||
          event.revision !== revision.id ||
          eventIds.has(event.id) ||
          existingEventIds.has(event.id)
        )
          throw new Error("Saved control-set history does not match this element.");
        eventIds.add(event.id);
      }
    }
  }
  const updatedIds = new Set<string>();
  for (const update of next.updates) {
    const node = proposed.get(update.id);
    if (!node || node.program !== update.program || updatedIds.has(update.id))
      throw new Error("Saved edits do not identify an element in this program.");
    if (update.patch.parent !== undefined && node.parent === null)
      throw new Error("The system root cannot be moved.");
    updatedIds.add(update.id);
    proposed.set(node.id, { ...node, ...update.patch });
  }
  for (const id of new Set([...createdIds, ...updatedIds])) {
    const node = proposed.get(id)!;
    const seen = new Set([id]);
    let cursor = node;
    while (cursor.parent) {
      const parent = proposed.get(cursor.parent);
      if (!parent || parent.program !== node.program)
        throw new Error("Choose a parent in the same program.");
      if (seen.has(parent.id))
        throw new Error("An element cannot be moved into itself or its descendants.");
      seen.add(parent.id);
      cursor = parent;
    }
    if (
      node.asset &&
      [...proposed.values()].some((other) => other.id !== id && other.asset === node.asset)
    )
      throw new Error("This asset already belongs to a system element.");
  }
  const allScopes = new Map(scopeById);
  for (const entry of next.created)
    if (entry.assessment) allScopes.set(entry.assessment.scope.id, entry.assessment.scope);
  for (const entry of next.created) {
    const source = entry.assessment?.scope.selectionSource;
    if (source?.parentScope && allScopes.get(source.parentScope)?.program !== entry.node.program)
      throw new Error("The inherited control set must belong to this program.");
  }
}

function apply(next: Snapshot, created: CreatedNode[], updates: Snapshot["updates"]) {
  applyCompositionChanges(
    created.map((entry) => entry.node),
    updates,
    () => {
      for (const { assessment } of created) {
        if (!assessment) continue;
        addScopes([structuredClone(assessment.scope)]);
        restoreInitialControlSetRevision(assessment.revision, assessment.history);
      }
      const programs = new Set([
        ...created.map((entry) => entry.node.program),
        ...updates.map((update) => update.program),
      ]);
      for (const program of programs) synchronizeCompositionScopes(program);
    },
  );
  snapshot = next;
}

/** Restore after program setup and imported records, before allocations/evidence. */
export function restoreCompositionChanges() {
  if (restored || typeof window === "undefined") return;
  const raw = window.localStorage.getItem(compositionStorageKey);
  const next = raw
    ? (snapshotSchema.parse(JSON.parse(raw)) as Snapshot)
    : { created: [], updates: [] };
  validate(next, true);
  if (next.created.length || next.updates.length) apply(next, next.created, next.updates);
  restored = true;
}

function persist(next: Snapshot) {
  if (typeof window === "undefined") throw new Error("System changes require browser storage.");
  try {
    window.localStorage.setItem(compositionStorageKey, JSON.stringify(next));
  } catch {
    throw new Error("System changes could not be saved. Free browser storage and try again.");
  }
}

function savePatch(nodeId: string, patch: NodePatch & { parent?: string }): CompositionNode {
  restoreCompositionChanges();
  const node = nodeById.get(nodeId);
  if (!node) throw new Error("This system element no longer exists.");
  const prior = snapshot.updates.find((update) => update.id === nodeId);
  const update = { id: nodeId, program: node.program, patch: { ...prior?.patch, ...patch } };
  const next = {
    ...snapshot,
    updates: [...snapshot.updates.filter((item) => item.id !== nodeId), update],
  };
  validate(next);
  persist(next);
  apply(next, [], [update]);
  return nodeById.get(nodeId)!;
}

export function updateCompositionNode(nodeId: string, patch: NodePatch): CompositionNode {
  return savePatch(nodeId, patchSchema.parse(patch) as NodePatch);
}

/** Every valid parent in this program, excluding the selected subtree. */
export function validCompositionParents(nodeId: string): CompositionNode[] {
  const node = nodeById.get(nodeId);
  if (!node || node.parent === null) return [];
  const excluded = new Set([nodeId, ...descendantsOf(nodeId).map((child) => child.id)]);
  return nodesForProgram(node.program).filter((candidate) => !excluded.has(candidate.id));
}

export function moveCompositionNode(nodeId: string, parentId: string): CompositionNode {
  return savePatch(nodeId, { parent: z.string().min(1, "Choose a parent.").parse(parentId) });
}

export function createCompositionNode(
  input: NewCompositionNode,
  options: { basisScopeId?: string; owner?: string } = {},
): CompositionNode {
  restoreCompositionChanges();
  if (nodeById.has(input.id)) throw new Error("This system element ID is already in use.");
  const node = nodeSchema.parse({
    version: "—",
    supplier: "—",
    origin: "Unknown",
    criticality: "Unspecified",
    zone: "Unspecified",
    bomSource: "Declared",
    bom: null,
    partKey: `sys:${input.program.toLowerCase()}/${input.id.toLowerCase()}`,
    asset: null,
    attested: false,
    note: "",
    ...input,
  }) as CompositionNode;
  const created: CreatedNode = { node };
  const parent = node.parent ? nodeById.get(node.parent) : undefined;
  if (!parent || parent.program !== node.program)
    throw new Error("Choose a parent in the same program.");
  const basis = closestProgramScope(node.program, parent.id);
  if (basis) {
    if (options.basisScopeId && options.basisScopeId !== basis.id)
      throw new Error("The element inherits its parent’s control set.");
    const scope: AssessmentScope = {
      id: nextScopeId(),
      program: node.program,
      element: node.id,
      name: node.name,
      owner: options.owner?.trim() || "Unassigned",
      mission: node.note,
      independentlyAuthorized: false,
      parameters: { ...basis.parameters },
      separationBasis: "Inherits the parent control set; no local tailoring has been recorded.",
      selectionSource: {
        profileId: basis.selectionSource?.profileId ?? basis.id,
        profileUuid: basis.selectionSource?.profileUuid ?? "",
        catalogId: basis.selectionSource?.catalogId ?? "nist-800-53-r5",
        label: `Inherited from ${basis.name}`,
        parentScope: basis.id,
        startingControlIds: controlSetFor(basis.id)!.controls.map((row) => row.control.id),
      },
    };
    const initial = prepareInitialControlSetRevision({
      program: node.program,
      scope: scope.id,
      parameters: scope.parameters,
      overlays: [],
      tailoring: [],
      selectionSource: scope.selectionSource!,
      separationBasis: scope.separationBasis,
      reason: `${node.kind} added under ${parent.name}`,
    });
    created.assessment = { scope, ...initial };
  }
  const next = { ...snapshot, created: [...snapshot.created, created] };
  validate(next);
  persist(next);
  apply(next, [created], []);
  return nodeById.get(node.id)!;
}
