import { useMemo } from "react";
import type { FilterOption } from "@ledger/design-system";
import { useRows } from "@/lib/models";

/** The Program filter's value for a record that names no program. */
export const NO_PROGRAM = "No program";

/**
 * The Program filter's values on a register that holds the records of several programs: every
 * program by name, since one page's rows are not every program there is, then No program where a
 * record may name none (`none`). The register's read filters by the program's name, which its view
 * carries (`program_name`).
 */
export function useProgramOptions({ none = false }: { none?: boolean } = {}): FilterOption[] {
  const programs = useRows("programs", {}, { columns: ["id", "name"] });
  return useMemo(
    () => [
      ...[...new Set((programs.data ?? []).map((program) => program.name))]
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value })),
      ...(none ? [{ value: NO_PROGRAM }] : []),
    ],
    [programs.data, none],
  );
}

/**
 * The programs by name, read once, for a client register's Program column, whose `value` is the
 * name so that it sorts, searches and filters by it: none where the reader cannot see the program.
 */
export function useProgramNames() {
  const programs = useRows("programs", {}, { columns: ["id", "name"] });
  const names = useMemo(
    () => new Map((programs.data ?? []).map((program) => [program.id, program.name])),
    [programs.data],
  );
  return { query: programs, names };
}
