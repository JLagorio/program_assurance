// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// A value the record's own links hold is the same: an operational issue's Program, while the issue
// names requirements, is `readOnly` in its edit form with a description that names them and says to
// unlink them first, since the links keep both ends in one program and the database refuses the
// move (`useHeldFields` in held-fields, which the generic record form asks); a move refused all the
// same says so in the save's failure.

import { useMemo } from "react";
import { issueProgramHeldReason, useIssueProgramHold } from "./issue-requirements";
import type { DataRecord } from "./records";

/*
 * A field a record's own links hold. The generic record form shows such a field where it stands,
 * read-only, with the words that say why and what frees it, rather than offer a change the database
 * refuses. One rule so far: an operational issue that names requirements stays in their program,
 * since the links' keys keep both ends in one program, so its Program is held until they are
 * unlinked.
 */

/** The fields a record's links hold, by column, each with the words that say why. */
export type HeldFields = ReadonlyMap<string, string>;

const NONE: HeldFields = new Map();

/**
 * The fields of a record its own links hold, for its edit form; none on a create. While the links
 * are read, and if they cannot be, nothing is held: a change they refuse fails its save with the
 * same words.
 */
export function useHeldFields(collection: string, record: DataRecord | undefined): HeldFields {
  const issueId = collection === "operational_issues" && record ? record.id : null;
  const hold = useIssueProgramHold(issueId);
  return useMemo(
    () =>
      hold.codes?.length ? new Map([["program_id", issueProgramHeldReason(hold.codes)]]) : NONE,
    [hold.codes],
  );
}
