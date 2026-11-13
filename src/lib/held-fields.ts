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
