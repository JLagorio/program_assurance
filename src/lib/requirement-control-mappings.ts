import type { Row } from "./models";

type Part = Pick<Row<"control_parts">, "id" | "control_id" | "name" | "prose" | "parent_part_id">;

/** Only authored statement prose and its nested items are mapping targets. */
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

/** A system that can carry a mapping of a control: it and the selection its baseline records. */
export type MappingCarrier = { systemId: string; selectedControlId: string };

/**
 * Where a control's Map a requirement puts a requirement's mappings, or why it puts none:
 * - `targets`: one mapping on each system the requirement is allocated to whose control baseline
 *   selects the control and that carries none of the control yet, so every such system's SSP lists
 *   the requirement under it; `mapped` of the `eligible` systems carry one already.
 * - `mapped`: every such system carries one already.
 * - `no_details`: the requirement has no revision to record a mapping on.
 * - `unallocated`: it is allocated to no system.
 * - `not_selected`: none of its systems' control baselines selects the control.
 */
export type RequirementMappingStanding =
  | { kind: "targets"; targets: MappingCarrier[]; mapped: number; eligible: number }
  | { kind: "mapped"; eligible: number }
  | { kind: "no_details" }
  | { kind: "unallocated" }
  | { kind: "not_selected" };

/**
 * A requirement's standing for mapping one control. `systemIds` are the systems its latest
 * revision is allocated to, in the order the register lists them; `carriers` the program's systems
 * whose control baseline selects the control, each with that selection; `mappedOn` the systems on
 * which its latest revision maps the control already, in any relationship. A mapping that names no
 * system (a catalog reference) carries no system, so it leaves every system to map.
 */
export function requirementMappingStanding(
  requirement: { revisionId: string | null; systemIds: readonly string[] },
  carriers: ReadonlyMap<string, string>,
  mappedOn: ReadonlySet<string>,
): RequirementMappingStanding {
  if (!requirement.revisionId) return { kind: "no_details" };
  if (requirement.systemIds.length === 0) return { kind: "unallocated" };
  const eligible = [...new Set(requirement.systemIds)].filter((id) => carriers.has(id));
  if (eligible.length === 0) return { kind: "not_selected" };
  const targets = eligible
    .filter((systemId) => !mappedOn.has(systemId))
    .map((systemId) => ({ systemId, selectedControlId: carriers.get(systemId)! }));
  return targets.length === 0
    ? { kind: "mapped", eligible: eligible.length }
    : {
        kind: "targets",
        targets,
        mapped: eligible.length - targets.length,
        eligible: eligible.length,
      };
}
