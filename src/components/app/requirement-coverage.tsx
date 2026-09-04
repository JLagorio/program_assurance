/**
 * The Requirements tab as a coverage view: every requirement in the program,
 * which elements carry it (the union across allocations), which controls it
 * traces to, and how far its verification has run. The filters are the
 * questions a reader asks of the list; the bar is the one status per row.
 *
 * A DataTable: the saved questions are presets over projected columns, the
 * headers sort, search covers the id and the statement, and the one bar per
 * row reads how far the tests that name the requirement have run.
 */

import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { ControlHover, RequirementHover } from "@/components/app/glances";
import { AllocateElementsSheet } from "@/components/app/allocate-picker";
import { TargetLink } from "@/components/app/requirements";
import {
  DataTable,
  Id,
  Indicator,
  Inline,
  Progress,
  Stack,
  Text,
  TextLink,
  defineColumns,
  useDataTable,
  type Preset,
  type StackedSegment,
} from "@ledger/design-system";
import { suspectLinksFor, useLinkCurrencyVersion } from "@/lib/link-currency";
import {
  coverageOf,
  coverageWord,
  notCoveredRequirements,
  useVerificationVersion,
  type RequirementCoverage,
} from "@/lib/requirement-verification";
import {
  allocationsFor,
  requirementSummary,
  requirementStateTone,
  requirementsForProgram,
  unallocatedRequirements,
  useRequirementsVersion,
  type Allocation,
  type Derivation,
  type Requirement,
  type RequirementState,
} from "@/lib/requirements";

/** Who carries a requirement, as one value a preset can ask for. */
type CarriedBy = "Allocated" | "Nobody responsible" | "Not yet allocatable";

/** Where a requirement came from: the catalog, or the program's own engineering. */
type Origin = "From a control" | "No control";

/** Whether any test objective names the requirement (or one of its children). */
type Verification = "Covered" | "Not covered";

/** Whether every link under the requirement is current, or one has gone Suspect. */
type Currency = "Current" | "Suspect";

/** One requirement projected onto the columns the table sorts and filters by. */
type CoverageRow = {
  id: string;
  text: string;
  state: RequirementState;
  carriedBy: CarriedBy;
  origin: Origin;
  verification: Verification;
  currency: Currency;
  suspect: number;
  coverage: RequirementCoverage;
  requirement: Requirement;
  allocations: Allocation[];
  controls: Derivation[];
  overlays: Derivation[];
};

function fromControl(r: Requirement): boolean {
  return r.derivations.some(
    (d) => d.sourceType === "Control statement" || d.sourceType === "Overlay",
  );
}

// The saved questions, as the column filters each one applies. Counts come from the table.
const presets: Preset[] = [
  { id: "all", label: "All" },
  {
    id: "unallocated",
    label: "Unallocated",
    filters: [{ id: "carriedBy", value: "Nobody responsible" }],
  },
  { id: "no-control", label: "No control", filters: [{ id: "origin", value: "No control" }] },
  {
    id: "from-control",
    label: "From a control",
    filters: [{ id: "origin", value: "From a control" }],
  },
  {
    id: "not-covered",
    label: "Not covered",
    filters: [{ id: "verification", value: "Not covered" }],
  },
  { id: "suspect", label: "Suspect", filters: [{ id: "currency", value: "Suspect" }] },
];

/** The bar's segments: one per result, and a hatched hole for what no test names. */
export function coverageSegments(c: RequirementCoverage): StackedSegment[] {
  return [
    { key: "met", value: c.met, tone: "success", title: `${c.met} met` },
    { key: "partial", value: c.partial, tone: "warning", title: `${c.partial} partially met` },
    { key: "notMet", value: c.notMet, tone: "danger", title: `${c.notMet} not met` },
    { key: "notRun", value: c.notRun, tone: "information", title: `${c.notRun} not run` },
    {
      key: "notCovered",
      value: c.notCovered,
      tone: "neutral",
      appearance: "hatched",
      title: `${c.notCovered} not covered`,
    },
  ];
}

export function CoverageBar({ coverage }: { coverage: RequirementCoverage }) {
  return (
    <Inline as="span" space="space.100" alignBlock="center">
      <span className="shrink-0" style={{ width: 56 }}>
        <Progress.Stacked height={6} segments={coverageSegments(coverage)} />
      </span>
      <Text size="xsmall" color="color.text.subtle" maxLines={1}>
        {coverageWord(coverage)}
      </Text>
    </Inline>
  );
}

/** The share of a requirement's objectives that are met: what the Verification column sorts by. */
function metShare(c: RequirementCoverage): number {
  const total = c.met + c.partial + c.notMet + c.notRun + c.notCovered;
  return total ? c.met / total : -1;
}

export function RequirementCoverage({ programId }: { programId: string }) {
  const version = useRequirementsVersion();
  const verificationVersion = useVerificationVersion();
  const currencyVersion = useLinkCurrencyVersion();
  const [allocating, setAllocating] = useState<Requirement | null>(null);

  const all = useMemo(() => requirementsForProgram(programId), [programId, version]);
  const summary = useMemo(() => requirementSummary(programId), [programId, version]);

  // The projection. Every store it reads is subscribed through a version above.
  const rows = useMemo<CoverageRow[]>(() => {
    const unallocated = new Set(unallocatedRequirements(programId).map((r) => r.id));
    const notCovered = new Set(notCoveredRequirements(programId).map((r) => r.id));
    return all.map((r) => {
      const allocations = allocationsFor(r.id);
      const suspect = suspectLinksFor(r).length;
      return {
        id: r.id,
        text: r.text,
        state: r.state,
        carriedBy: allocations.length
          ? "Allocated"
          : unallocated.has(r.id)
            ? "Nobody responsible"
            : "Not yet allocatable",
        origin: fromControl(r) ? "From a control" : "No control",
        verification: notCovered.has(r.id) ? "Not covered" : "Covered",
        currency: suspect ? "Suspect" : "Current",
        suspect,
        coverage: coverageOf(r),
        requirement: r,
        allocations,
        controls: r.derivations.filter((d) => d.sourceType === "Control statement"),
        overlays: r.derivations.filter((d) => d.sourceType === "Overlay"),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, programId, version, verificationVersion, currencyVersion]);

  // The cells link into the program, so the columns close over its id.
  const columns = useMemo(
    () =>
      defineColumns<CoverageRow>((c) => [
        c.id("id", {
          header: "Requirement",
          width: 104,
          hideable: false,
          cell: (r) => (
            <RequirementHover requirementId={r.id}>
              <TextLink>
                <Link
                  to="/programs/$programId/requirements/$requirementId"
                  params={{ programId, requirementId: r.id }}
                >
                  <Id>{r.id}</Id>
                </Link>
              </TextLink>
            </RequirementHover>
          ),
        }),
        c.text("text", { header: "Shall statement", minWidth: 240, hideable: false }),
        c.text("carriedBy", {
          header: "Carried by",
          width: 240,
          cell: (r) =>
            r.allocations.length ? (
              <Inline
                className="font-body-small"
                as="span"
                space="space.100"
                rowSpace="space.025"
                shouldWrap
              >
                {r.allocations.slice(0, 3).map((a) => (
                  <TargetLink key={a.id} allocation={a} programId={programId} />
                ))}
                {r.allocations.length > 3 ? (
                  <Text color="color.text.subtle">+{r.allocations.length - 3}</Text>
                ) : null}
                {r.suspect ? <Indicator tone="warning">{r.suspect} suspect</Indicator> : null}
              </Inline>
            ) : (
              <Indicator tone={r.carriedBy === "Nobody responsible" ? "warning" : "neutral"}>
                {r.carriedBy}
              </Indicator>
            ),
        }),
        c.text("origin", {
          header: "Controls",
          width: 170,
          cell: (r) =>
            r.controls.length || r.overlays.length ? (
              <Inline as="span" space="space.100" rowSpace="space.025" shouldWrap>
                {r.controls.map((d) => (
                  <ControlHover key={d.sourceId} controlId={d.sourceId} programId={programId}>
                    <TextLink>
                      <Link
                        to="/programs/$programId/controls/$controlId"
                        params={{ programId, controlId: d.sourceId }}
                        search={{ tab: undefined }}
                      >
                        <Id>{d.sourceId}</Id>
                      </Link>
                    </TextLink>
                  </ControlHover>
                ))}
                {r.overlays.map((d) => (
                  <Text key={d.sourceId} size="small" color="color.text.subtle">
                    {d.sourceLabel || d.sourceId}
                  </Text>
                ))}
              </Inline>
            ) : (
              <Indicator tone="information">
                {r.requirement.derivations[0]?.sourceType ?? "No source"}
              </Indicator>
            ),
        }),
        c.text("verification", {
          header: "Verification",
          width: 168,
          cell: (r) => <CoverageBar coverage={r.coverage} />,
          // the met share; a requirement no test names sorts below everything
          sortBy: (r) => metShare(r.coverage),
        }),
        // Hidden until asked for: the Suspect question reads it, the Carried by cell shows the count.
        c.text("currency", { header: "Currency", width: 104 }),
        c.status("state", {
          header: "State",
          width: 104,
          tone: (r) => requirementStateTone[r.state],
        }),
        c.actions((r) => [{ label: "Allocate", onSelect: () => setAllocating(r.requirement) }]),
      ]),
    [programId],
  );

  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (r) => r.id,
    label: "Requirement coverage",
    view: "requirement-coverage",
    initialState: { columnVisibility: { currency: false } },
  });

  return (
    <Stack space="space.150">
      <Inline space="space.150" alignBlock="center" spread="space-between" shouldWrap>
        <DataTable.Presets table={table} presets={presets} aria-label="Requirement filter" />
        <Text size="small" color="color.text.subtle">
          {summary.allocations} allocations across {summary.elements} elements
        </Text>
      </Inline>

      <DataTable
        table={table}
        toolbar={
          <Inline space="space.100" alignBlock="center" spread="space-between" shouldWrap>
            <DataTable.Search table={table} placeholder="Requirement or statement" />
            <DataTable.Columns table={table} />
          </Inline>
        }
        empty={{
          title: "Nothing matches",
          description: "Choose another question or clear the search.",
        }}
      />

      {allocating ? (
        <AllocateElementsSheet
          open
          onClose={() => setAllocating(null)}
          programId={programId}
          requirement={allocating}
        />
      ) : null}
    </Stack>
  );
}
