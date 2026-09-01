/**
 * The program record's control surface.
 *
 * This replaced three stacked sections: a paragraph pointing at the SCTM route,
 * a coverage-by-family table, and a control matrix. They were one artifact cut
 * into three — the coverage table was a rollup of the matrix, and the matrix was
 * a coarser grain of the SCTM. So there is now one table: the SCTM, grouped by
 * control family, with the rollup on the group header.
 *
 * Collapsed, it reads as the coverage table it replaced. Expanded, it is the
 * traceability matrix. Nothing here is a link to the real thing.
 *
 * Filtering and expansion live here; the rows and the rollup arrive already
 * derived from `@/lib/sctm`.
 */

import { useMemo, useState } from "react";

import { SctmFamilyTable } from "@/components/app/sctm";
import { Button, EmptyState, Section, Select, Toolbar } from "@/components/app/ui";
import { controlStatuses, type ControlStatus } from "@/lib/control-matrix";
import { groupByFamily, useControlText, useSctm, type Determination } from "@/lib/sctm";

/**
 * The program's four-value control vocabulary against the SCTM's.
 *
 * `Partial` has no SCTM spelling and must not gain one: SP 800-53A knows only
 * Satisfied and Other than satisfied, and `buildSctm` already folds a partial
 * implementation into the deficiency set. Filtering by Partial therefore shows
 * the deficient rows rather than nothing at all.
 */
const determinationOf: Record<ControlStatus, Determination> = {
  Satisfied: "Satisfied",
  Partial: "Other than satisfied",
  "Other than satisfied": "Other than satisfied",
  "Not assessed": "Not assessed",
};

export function SctmMatrixSection({
  programId,
  family,
  onFamily,
  status,
  onStatus,
}: {
  programId: string;
  family: string;
  onFamily: (v: string) => void;
  status: ControlStatus | "All";
  onStatus: (v: ControlStatus | "All") => void;
}) {
  // Both hooks are deliberately owned here rather than by the program record:
  // this section only mounts on the Controls tab, so the catalog import and the
  // matrix build are never paid for by the nine tabs that read neither.
  const controlText = useControlText();
  const sctm = useSctm(programId, controlText);

  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  /** Every family in the set, so the filter does not hide its own options. */
  const families = useMemo(
    () =>
      [...new Map(sctm.rows.map((r) => [r.family, r.familyName])).entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    [sctm.rows],
  );

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const want = status === "All" ? null : determinationOf[status];
    const rows = sctm.rows.filter(
      (r) =>
        (family === "All" || r.family === family) &&
        (want === null || r.determination === want) &&
        (!q ||
          r.control.toLowerCase().includes(q) ||
          r.requirement.toLowerCase().includes(q) ||
          r.controlTitle.toLowerCase().includes(q) ||
          r.statement.toLowerCase().includes(q)),
    );
    return groupByFamily(rows);
  }, [sctm.rows, family, status, query]);

  const shown = groups.reduce((n, g) => n + g.rows.length, 0);
  const filtering = family !== "All" || status !== "All" || query.trim().length > 0;

  /**
   * A filtered matrix opens itself. Collapsed groups are the right default for
   * the whole set — that is the rollup — but a reader who has already narrowed
   * to nine rows has said what they want to look at, and making them click each
   * family open again is the click-to-see-what-you-asked-for loop this replaced.
   */
  const openGroups = useMemo(
    () => (filtering ? new Set(groups.map((g) => g.id)) : expanded),
    [filtering, groups, expanded],
  );

  const allOpen = groups.length > 0 && groups.every((g) => openGroups.has(g.id));

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      // While filtering, groups render open off `openGroups` rather than off
      // `expanded`, so a first click has to close one that was never in the set.
      if (next.has(id) || (filtering && openGroups.has(id))) next.delete(id);
      else next.add(id);
      return next;
    });

  /**
   * Nothing is shown until the catalog lands, and that is deliberate.
   *
   * Without it every control decomposes to a single `Control`-unit row, which
   * trips the gap ladder at "No CCI or 800-53A objective published" — so the
   * provisional matrix reads as a wall of red that silently corrects itself a
   * moment later. Row counts, coverage and determinations are all provisional
   * in that window. A number that is wrong and then changes is worse than a
   * number that has not arrived, so the section says so and waits.
   */
  if (controlText === null) {
    return (
      <Section
        title="Traceability matrix"
        action={<span className="text-12 text-muted-foreground">Loading the 800-53A catalog</span>}
      >
        <div className="py-10 text-center text-[12.5px] text-muted-foreground">
          Decomposing the control set into CCIs and assessment objectives.
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Traceability matrix"
      action={
        <span className="tnum text-12 text-muted-foreground">
          {shown === sctm.counts.total ? shown : `${shown} of ${sctm.counts.total}`} requirement
          rows
        </span>
      }
    >
      <Toolbar
        search={query}
        onSearch={setQuery}
        placeholder="Search controls or requirements"
        actions={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(allOpen ? new Set() : new Set(groups.map((g) => g.id)))}
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </Button>
        }
      >
        <Select value={family} onChange={(e) => onFamily(e.target.value)} className="h-7 w-[188px]">
          <option value="All">All families</option>
          {families.map((f) => (
            <option key={f.id} value={f.id}>
              {f.id} — {f.name}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => onStatus(e.target.value as ControlStatus | "All")}
          className="h-7 w-[176px]"
        >
          <option value="All">All determinations</option>
          {controlStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Toolbar>

      {groups.length === 0 ? (
        <EmptyState
          title="No requirement rows match this filter"
          description="Clear the search or pick another family."
          action={
            <Button
              size="sm"
              onClick={() => {
                setQuery("");
                onFamily("All");
                onStatus("All");
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <SctmFamilyTable
          groups={groups}
          programId={programId}
          expanded={openGroups}
          onToggle={toggle}
        />
      )}
    </Section>
  );
}
