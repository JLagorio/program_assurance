import type { Row } from "./models";

type Part = Pick<Row<"control_parts">, "id" | "control_id" | "name" | "prose" | "parent_part_id">;

/** Authored statement prose and its nested items: the control's text a mapping may point into. */
export function isControlStatement(part: Part, parts: readonly Part[]): boolean {
  if (!part.control_id || !part.prose?.trim() || !["statement", "item"].includes(part.name))
    return false;
  const byId = new Map(parts.map((item) => [item.id, item]));
  const seen = new Set<string>();
  let current: Part | undefined = part;
  let statement = false;
  while (current) {
    if (
      seen.has(current.id) ||
      current.control_id !== part.control_id ||
      !["statement", "item"].includes(current.name)
    )
      return false;
    seen.add(current.id);
    statement ||= current.name === "statement";
    if (!current.parent_part_id) return statement;
    current = byId.get(current.parent_part_id);
  }
  return false;
}

/**
 * What a control mapping may name besides the whole control: an authored statement or item of the
 * control's text, or one of its assessment objectives, which the mapping covers with every
 * objective under it. Anything else (an assessment method, guidance, a part another control holds)
 * is a recorded target to review.
 */
export function isMappingTarget(
  part: Part,
  parts: readonly Part[],
  controlId?: string | null | undefined,
): boolean {
  if (part.name === "assessment-objective")
    return !!part.control_id && (controlId == null || part.control_id === controlId);
  return isControlStatement(part, parts) && (controlId == null || part.control_id === controlId);
}

type System = Pick<Row<"systems">, "id" | "name" | "code">;
export type MappingBaseline = {
  systemId: string;
  systemName: string;
  resolutionId: string;
  sourceSystemId: string;
  inherited: boolean;
  source: string;
};

/** Use the database's effective profile for each exact allocated system. The
 * canonical resolver owns inheritance and boundary rules; the UI never unions
 * obsolete SSPs, unrelated scopes or sibling systems into a control selection. */
export function requirementMappingBaselines(input: {
  systems: System[];
  allocations: Pick<Row<"requirement_allocations">, "system_id">[];
  baselines: {
    system_id: string | null;
    profile_resolution_id: string | null;
    source_system_id: string | null;
    inherited: boolean | null;
    source_label: string | null;
  }[];
}): { allocated: boolean; systems: System[]; sources: MappingBaseline[] } {
  const allocatedIds = new Set(input.allocations.flatMap((row) => row.system_id ?? []));
  const systems = input.systems.filter((system) => allocatedIds.has(system.id));
  const sources = systems.flatMap<MappingBaseline>((system) => {
    const baseline = input.baselines.find((row) => row.system_id === system.id);
    if (!baseline?.profile_resolution_id || !baseline.source_system_id) return [];
    return [
      {
        systemId: system.id,
        systemName: `${system.code} · ${system.name}`,
        resolutionId: baseline.profile_resolution_id,
        sourceSystemId: baseline.source_system_id,
        inherited: baseline.inherited === true,
        source: baseline.source_label ?? "Recorded profile",
      },
    ];
  });
  return { allocated: allocatedIds.size > 0, systems, sources };
}

/* ——— What mappings cover ———————————————————————————————————————————————————————————————— */

/**
 * An assessment objective a control counts (a leaf, with no objective under it), as coverage reads
 * it: itself and the objectives above it, from the control's root down.
 */
export type ObjectiveNode = { id: string; ancestors: readonly string[] };

/**
 * The key a coverage holds for a mapping of the whole control. A control the catalog gives no
 * objective is covered by any mapping of it, so the whole control is held apart from its objectives.
 */
export const WHOLE_CONTROL = "whole";

/**
 * What one mapping covers, as keys: the whole control where it names no part, or names one that is
 * not among the control's objectives (a statement or item of its text); else every objective at or
 * under the one it names.
 */
export function mappingCoverage(
  objectives: readonly ObjectiveNode[],
  partId: string | null | undefined,
): Set<string> {
  if (!partId) return new Set([WHOLE_CONTROL]);
  const covered = objectives
    .filter((objective) => objective.id === partId || objective.ancestors.includes(partId))
    .map((objective) => objective.id);
  return new Set(covered.length ? covered : [WHOLE_CONTROL]);
}

/** What several mappings cover together. */
export function coverageOf(
  objectives: readonly ObjectiveNode[],
  partIds: Iterable<string | null | undefined>,
): Set<string> {
  const covered = new Set<string>();
  for (const partId of partIds)
    for (const key of mappingCoverage(objectives, partId)) covered.add(key);
  return covered;
}

/**
 * Whether a coverage holds a target: one objective (by id), or the whole control (`null`), which
 * every objective covered holds as a mapping of the whole control does.
 */
export function coversTarget(
  coverage: ReadonlySet<string>,
  target: string | null,
  objectives: readonly ObjectiveNode[],
): boolean {
  if (coverage.has(WHOLE_CONTROL)) return true;
  if (target !== null) return coverage.has(target);
  return objectives.length > 0 && objectives.every((objective) => coverage.has(objective.id));
}

/** How many of the control's objectives a coverage holds. */
export function coveredObjectives(
  coverage: ReadonlySet<string>,
  objectives: readonly ObjectiveNode[],
): number {
  if (coverage.has(WHOLE_CONTROL)) return objectives.length;
  return objectives.filter((objective) => coverage.has(objective.id)).length;
}

/** A system that can carry a mapping of a control: it and the selection its baseline records. */
export type MappingCarrier = { systemId: string; selectedControlId: string };

/** One mapping a control's Map a requirement records: on a system, of an objective or the whole control. */
export type MappingTarget = MappingCarrier & {
  /** The assessment objective it names; `null` maps the whole control. */
  objectiveId: string | null;
};

/** The whole control, as a choice of what to map: one mapping that covers every objective. */
export const WHOLE_CONTROL_CHOICE: readonly (string | null)[] = [null];

/**
 * Where a control's Map a requirement puts a requirement's mappings, or why it puts none:
 * - `targets`: on each system the requirement is allocated to whose control baseline selects the
 *   control, one mapping for each thing chosen (the whole control, or each chosen objective) that
 *   the requirement's mappings there do not cover yet, so every such system's SSP lists the
 *   requirement under the control; `mapped` of the `eligible` systems cover all of it already.
 * - `mapped`: on every such system its mappings cover all of it already.
 * - `no_details`: the requirement has no revision to record a mapping on.
 * - `unallocated`: it is allocated to no system.
 * - `not_selected`: none of its systems' control baselines selects the control.
 */
export type RequirementMappingStanding =
  | { kind: "targets"; targets: MappingTarget[]; mapped: number; eligible: number }
  | { kind: "mapped"; eligible: number }
  | { kind: "no_details" }
  | { kind: "unallocated" }
  | { kind: "not_selected" };

const NOTHING_COVERED: ReadonlySet<string> = new Set();

/**
 * A requirement's standing for mapping one control. `systemIds` are the systems its latest
 * revision is allocated to, in the order the register lists them; `carriers` the program's systems
 * whose control baseline selects the control, each with that selection; `mappedOn` what its latest
 * revision's mappings of the control cover on each system, in any relationship (control-objectives'
 * `coverageOf`). `chosen` is what the reader maps: the whole control (`null`, unsaid) or objectives
 * by id, of the control's `objectives`. A mapping that names no system (a catalog reference)
 * carries no system, so it leaves every system to map; a system whose mappings cover every
 * objective holds the whole control, as a mapping of the whole control does.
 */
export function requirementMappingStanding(
  requirement: { revisionId: string | null; systemIds: readonly string[] },
  carriers: ReadonlyMap<string, string>,
  mappedOn: ReadonlyMap<string, ReadonlySet<string>>,
  chosen: readonly (string | null)[] = WHOLE_CONTROL_CHOICE,
  objectives: readonly ObjectiveNode[] = [],
): RequirementMappingStanding {
  if (!requirement.revisionId) return { kind: "no_details" };
  if (requirement.systemIds.length === 0) return { kind: "unallocated" };
  const eligible = [...new Set(requirement.systemIds)].filter((id) => carriers.has(id));
  if (eligible.length === 0) return { kind: "not_selected" };
  // Nothing chosen yet reads as the whole control: a requirement that holds it all stays held.
  const wanted = chosen.length ? [...new Set(chosen)] : WHOLE_CONTROL_CHOICE;
  let mapped = 0;
  const targets = eligible.flatMap((systemId) => {
    const coverage = mappedOn.get(systemId) ?? NOTHING_COVERED;
    const missing = wanted.filter((target) => !coversTarget(coverage, target, objectives));
    if (missing.length === 0) mapped += 1;
    return missing.map((objectiveId) => ({
      systemId,
      selectedControlId: carriers.get(systemId)!,
      objectiveId,
    }));
  });
  return targets.length === 0
    ? { kind: "mapped", eligible: eligible.length }
    : { kind: "targets", targets, mapped, eligible: eligible.length };
}
