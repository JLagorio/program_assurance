import { z } from "zod";
import { addCompositionNodes, nodeById, type NewCompositionNode } from "@/lib/composition";
import {
  eventsForProgram,
  restoreInitialControlSetRevision,
  revisionById,
  revisionsForProgram,
  type ControlSetRevision,
  type RevisionEvent,
} from "@/lib/control-set";
import { programs } from "@/lib/grc-data";
import { restorePrograms } from "@/lib/program-store";
import { addScopes, scopeById, type AssessmentScope } from "@/lib/scopes";

const key = "equinox.program-setups.v1";
let restored = false;
type Setup = {
  program: string;
  nodes: NewCompositionNode[];
  scopes: AssessmentScope[];
  revisions: ControlSetRevision[];
  events: RevisionEvent[];
};
let snapshots: Setup[] = [];
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
const nodeSchema = z.object({
  id: z.string().regex(/^CN-\d+$/),
  program: z.string(),
  name: z.string(),
  kind: z.enum(["System", "Subsystem"]),
  class: z.literal("System"),
  parent: z.string().nullable(),
  note: z.string().default(""),
});
const scopeSchema = z.object({
  id: z.string().regex(/^SYS-\d+$/),
  program: z.string(),
  element: z.string(),
  name: z.string(),
  owner: z.string(),
  mission: z.string(),
  independentlyAuthorized: z.boolean(),
  parameters,
  separationBasis: z.string(),
});
const revisionSchema = z.object({
  id: z.string().regex(/^SCS-\d+$/),
  program: z.string(),
  scope: z.string(),
  number: z.literal(1),
  state: z.enum(["Draft", "Pending approval"]),
  // A snapshot saved before the unimported editions were dropped can still name
  // one. Coerce rather than reject: a stale edition id must not cost the reader
  // the whole restored workspace.
  framework: z.enum(["nist-800-53-r5"]).catch("nist-800-53-r5"),
  parameters,
  overlays: z.array(
    z.object({
      overlay: z.string(),
      recommended: z.boolean(),
      applied: z.boolean(),
      rationale: z.string(),
      explicit: z.boolean().optional(),
    }),
  ),
  tailoring: z.array(
    z.object({
      control: z.string(),
      decision: z.enum(["excluded", "included"]),
      source: z.enum(["system-tailoring", "risk-response", "org-policy"]),
      rationale: z.string(),
      authority: z.string(),
      at: z.string(),
    }),
  ),
  separationBasis: z.string(),
  reason: z.string(),
  supersedes: z.null(),
  author: z.string(),
  created: z.string(),
  submitted: z.string().nullable(),
  decidedBy: z.null(),
  decided: z.null(),
  note: z.string(),
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
  kind: z.enum(["created", "submitted"]),
  summary: z.string(),
  note: z.string().optional(),
});
const setupSchema = z.object({
  program: z.string().regex(/^PRG-\d+$/),
  nodes: z.array(nodeSchema),
  scopes: z.array(scopeSchema),
  revisions: z.array(revisionSchema),
  events: z.array(eventSchema),
});

function parseSetup(value: unknown): Setup {
  const parsed = setupSchema.parse(value);
  // Optional source fields are omitted rather than assigned undefined.
  return {
    ...parsed,
    revisions: parsed.revisions.map((revision) => ({
      ...revision,
      overlays: revision.overlays.map(({ explicit, ...overlay }) => ({
        ...overlay,
        ...(explicit === undefined ? {} : { explicit }),
      })),
    })),
    events: parsed.events.map(({ note, ...event }) => ({
      ...event,
      ...(note === undefined ? {} : { note }),
    })),
  };
}

/** Initial system boundaries load before requirements and evidence reference them. */
export function restoreProgramSetups() {
  if (restored || typeof window === "undefined") return;
  restorePrograms();
  const raw = window.localStorage.getItem(key);
  const next = raw ? z.array(z.unknown()).parse(JSON.parse(raw)).map(parseSetup) : [];
  const allIds = new Set<string>();
  const programIds = new Set<string>();
  const existingEvents = new Set(
    programs.flatMap((program) => eventsForProgram(program.id).map((event) => event.id)),
  );
  for (const setup of next) {
    if (programIds.has(setup.program) || !programs.some((program) => program.id === setup.program))
      throw new Error("Saved setup does not identify a unique program.");
    programIds.add(setup.program);
    const parents = new Set<string>();
    for (const node of setup.nodes) {
      if (
        node.program !== setup.program ||
        allIds.has(node.id) ||
        nodeById.has(node.id) ||
        (node.parent && !parents.has(node.parent))
      )
        throw new Error("Saved system nodes have conflicting IDs or parents.");
      parents.add(node.id);
      allIds.add(node.id);
    }
    const scopeIds = new Set<string>();
    for (const scope of setup.scopes) {
      if (
        scope.program !== setup.program ||
        allIds.has(scope.id) ||
        scopeById.has(scope.id) ||
        !parents.has(scope.element)
      )
        throw new Error("Saved assessment scope does not belong to this system.");
      scopeIds.add(scope.id);
      allIds.add(scope.id);
    }
    const revisionIds = new Map<string, string>();
    const revisedScopes = new Set<string>();
    for (const revision of setup.revisions) {
      if (
        revision.program !== setup.program ||
        !scopeIds.has(revision.scope) ||
        revisedScopes.has(revision.scope) ||
        allIds.has(revision.id) ||
        revisionById(revision.id)
      )
        throw new Error("Saved control-set revision does not belong to this scope.");
      revisionIds.set(revision.id, revision.scope);
      revisedScopes.add(revision.scope);
      allIds.add(revision.id);
    }
    for (const event of setup.events) {
      if (
        revisionIds.get(event.revision) !== event.scope ||
        allIds.has(event.id) ||
        existingEvents.has(event.id)
      )
        throw new Error("Saved control-set history does not match this revision.");
      allIds.add(event.id);
    }
    if (!setup.nodes.length || setup.scopes.length !== setup.revisions.length)
      throw new Error("Saved program setup is incomplete.");
  }
  for (const setup of next) {
    addCompositionNodes(setup.nodes);
    addScopes(setup.scopes);
    for (const revision of setup.revisions)
      restoreInitialControlSetRevision(
        revision,
        setup.events.filter((event) => event.revision === revision.id),
      );
  }
  snapshots = next;
  restored = true;
}

export function saveInitialProgramSetup(
  program: string,
  nodes: NewCompositionNode[],
  scopes: AssessmentScope[],
) {
  restoreProgramSetups();
  const snapshot = parseSetup({
    program,
    nodes,
    scopes,
    revisions: revisionsForProgram(program),
    events: eventsForProgram(program).reverse(),
  });
  const next = [...snapshots.filter((setup) => setup.program !== program), snapshot];
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(next));
  snapshots = next;
}
