import { useMemo } from "react";
import { useRows } from "./models";

/*
 * The requirements behind each control of a program, by code: the program's requirements whose
 * latest revision maps the control, wherever the mapping counts, as the control status counts its
 * `requirements` (program_control_coverage reads the same revision, the highest version). Three
 * reads scoped to the program, two or three columns each: the requirements, their revisions and the
 * revisions' control mappings, put together here. The Controls part's Status register names them in
 * its Requirement column.
 */

const byCode = new Intl.Collator("en", { numeric: true }).compare;

/**
 * Each control's requirements, by code in their natural order (REQ-9 before REQ-10): a mapping on a
 * revision that is not its requirement's latest names nothing, and a requirement that maps a
 * control twice (on two systems, or two of its objectives) is named once.
 */
export function requirementsByControl(
  requirements: readonly { id: string; code: string }[],
  revisions: readonly { id: string; engineering_requirement_id: string; version_number: number }[],
  links: readonly { control_id: string; requirement_revision_id: string }[],
): Map<string, string[]> {
  const codeOf = new Map(requirements.map((requirement) => [requirement.id, requirement.code]));
  const latest = new Map<string, { id: string; version_number: number }>();
  for (const revision of revisions) {
    const held = latest.get(revision.engineering_requirement_id);
    if (!held || revision.version_number > held.version_number)
      latest.set(revision.engineering_requirement_id, revision);
  }
  // The code each latest revision speaks for.
  const current = new Map<string, string>();
  for (const [requirementId, revision] of latest) {
    const code = codeOf.get(requirementId);
    if (code) current.set(revision.id, code);
  }
  const byControl = new Map<string, string[]>();
  for (const link of links) {
    const code = current.get(link.requirement_revision_id);
    if (!code) continue;
    const codes = byControl.get(link.control_id) ?? [];
    if (!codes.includes(code)) codes.push(code);
    byControl.set(link.control_id, codes);
  }
  for (const codes of byControl.values()) codes.sort(byCode);
  return byControl;
}

/**
 * The codes of the requirements behind each control of a program (`requirementsByControl`), once
 * the three reads have answered; `queries` are the reads to wait on and say the failure of.
 */
export function useProgramControlRequirements(programId: string | null | undefined) {
  const enabled = !!programId;
  const scope = programId ?? "";
  const requirements = useRows(
    "engineering_requirements",
    { program_id: scope },
    { columns: ["id", "code"], enabled },
  );
  const revisions = useRows(
    "requirement_revisions",
    { "engineering_requirements.program_id": scope },
    { columns: ["id", "engineering_requirement_id", "version_number"], enabled },
  );
  const links = useRows(
    "requirement_control_links",
    { "requirement_revisions.engineering_requirements.program_id": scope },
    { columns: ["control_id", "requirement_revision_id"], enabled },
  );
  const byControl = useMemo(
    () =>
      requirements.data && revisions.data && links.data
        ? requirementsByControl(requirements.data, revisions.data, links.data)
        : undefined,
    [requirements.data, revisions.data, links.data],
  );
  const queries = useMemo(() => [requirements, revisions, links], [requirements, revisions, links]);
  return { byControl, queries };
}
