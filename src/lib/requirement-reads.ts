import type { Filters, TableName } from "./models";

/** The requirement records a program owns, each read through the requirement it belongs to. */
type ProgramRequirementTable =
  | "engineering_requirements"
  | "requirement_revisions"
  | "requirement_allocations"
  | "requirement_control_links"
  | "requirement_evidence"
  | "requirement_implementations";

/**
 * The server-side filter that reads one program's requirement records: its requirements, their
 * revisions, and the allocations, control mappings, evidence links and implementations recorded
 * against those revisions. Postgres joins through the revision's requirement; the rows come back
 * without it. Pass it to useRows in place of reading the whole table and filtering on screen:
 * `useRows("requirement_allocations", programRequirementScope(programId, "requirement_allocations"))`.
 */
export function programRequirementScope(
  programId: string,
  table: ProgramRequirementTable,
): Filters {
  switch (table) {
    case "engineering_requirements":
      return { program_id: programId };
    case "requirement_revisions":
      return { "engineering_requirements.program_id": programId };
    default:
      return { "requirement_revisions.engineering_requirements.program_id": programId };
  }
}

/** The tables `programRequirementScope` reads, for a caller that loops over them. */
export const programRequirementTables = [
  "engineering_requirements",
  "requirement_revisions",
  "requirement_allocations",
  "requirement_control_links",
  "requirement_evidence",
  "requirement_implementations",
] as const satisfies readonly (ProgramRequirementTable & TableName)[];
