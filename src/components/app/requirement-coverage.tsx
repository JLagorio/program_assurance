/**
 * The Requirements tab as a coverage view: every requirement in the program,
 * which elements carry it (the union across allocations), which controls it
 * traces to, and the two lists that matter for the model — requirements no
 * control produced (engineering intent, tracked on purpose) and requirements
 * nothing is yet responsible for.
 *
 * A DataTable: the saved questions are presets over three projected columns,
 * the headers sort, search covers the id and the statement, and the one bar
 * per row reads how far the carrying elements have gotten.
 */

import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AllocateModal } from "@/components/app/requirement-forms";
import { TargetLink } from "@/components/app/requirements";
import {
  Absent,
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
} from "@ledger/design-system";
import {
  allocationsFor,
  requirementStateTone,
  requirementSummary,
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

/** One requirement projected onto the columns the table sorts and filters by. */
type CoverageRow = {
  id: string;
  text: string;
  state: RequirementState;
  carriedBy: CarriedBy;
  origin: Origin;
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
  { id: "verified", label: "Verified", filters: [{ id: "state", value: "Verified" }] },
];

/** Allocation states folded into the bar's four readings. */
function coverageOf(allocations: Allocation[]) {
  const count = (states: Allocation["state"][]) =>
    allocations.filter((a) => states.includes(a.state)).length;
  return {
    verified: count(["Verified"]),
    inWork: count(["Accepted", "Implemented"]),
    proposed: count(["Proposed"]),
    rejected: count(["Rejected", "Superseded"]),
  };
}

// Until test objectives join to requirements, the bar reads the allocations' states: what the
// carrying elements have verified, what is in work, what is only proposed, what fell away.
function CoverageBar({ allocations }: { allocations: Allocation[] }) {
  if (!allocations.length) return <Absent />;
  const c = coverageOf(allocations);
  return (
    <Inline
      title={`${c.verified} verified · ${c.inWork} in work · ${c.proposed} proposed · ${c.rejected} rejected`}
      as="span"
      space="space.100"
      alignBlock="center"
    >
      <span className="min-w-0 flex-1">
        <Progress.Stacked
          height={6}
          segments={[
            {
              key: "verified",
              value: c.verified,
              tone: "success",
              title: `${c.verified} verified`,
            },
            { key: "in-work", value: c.inWork, tone: "information", title: `${c.inWork} in work` },
            {
              key: "proposed",
              value: c.proposed,
              tone: "neutral",
              title: `${c.proposed} proposed`,
            },
            { key: "rejected", value: c.rejected, tone: "danger", title: `${c.rejected} rejected` },
          ]}
        />
      </span>
      <Text as="span" size="small" color="color.text.subtle" className="shrink-0 tabular-nums">
        {c.verified}/{allocations.length}
      </Text>
    </Inline>
  );
}

export function RequirementCoverage({ programId }: { programId: string }) {
  const version = useRequirementsVersion();
  const [allocating, setAllocating] = useState<Requirement | null>(null);

  const all = useMemo(() => requirementsForProgram(programId), [programId, version]);
  const unallocated = useMemo(
    () => new Set(unallocatedRequirements(programId).map((r) => r.id)),
    [programId, version],
  );
  const summary = useMemo(() => requirementSummary(programId), [programId, version]);

  const rows = useMemo<CoverageRow[]>(
    () =>
      all.map((r) => {
        const allocations = allocationsFor(r.id);
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
          requirement: r,
          allocations,
          controls: r.derivations.filter((d) => d.sourceType === "Control statement"),
          overlays: r.derivations.filter((d) => d.sourceType === "Overlay"),
        };
      }),
    [all, unallocated],
  );

  // The cells link into the program, so the columns close over its id.
  const columns = useMemo(
    () =>
      defineColumns<CoverageRow>((c) => [
        c.id("id", {
          header: "Requirement",
          width: 104,
          hideable: false,
          cell: (r) => (
            <TextLink>
              <Link
                to="/programs/$programId/requirements/$requirementId"
                params={{ programId, requirementId: r.id }}
              >
                <Id>{r.id}</Id>
              </Link>
            </TextLink>
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
              </Inline>
            ) : (
              <Indicator tone={r.carriedBy === "Nobody responsible" ? "warning" : "neutral"}>
                {r.carriedBy}
              </Indicator>
            ),
        }),
        c.text("origin", {
          header: "Controls",
          width: 200,
          cell: (r) =>
            r.controls.length || r.overlays.length ? (
              <Inline as="span" space="space.100" rowSpace="space.025" shouldWrap>
                {r.controls.map((d) => (
                  <TextLink key={d.sourceId}>
                    <Link
                      to="/programs/$programId/controls/$controlId"
                      params={{ programId, controlId: d.sourceId }}
                      search={{ tab: undefined }}
                      title={d.rationale}
                    >
                      <Id>{d.sourceId}</Id>
                    </Link>
                  </TextLink>
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
        c.custom("coverage", {
          header: "Coverage",
          width: 150,
          cell: (r) => <CoverageBar allocations={r.allocations} />,
          // verified share; nothing allocated sorts below everything
          sort: (r) =>
            r.allocations.length ? coverageOf(r.allocations).verified / r.allocations.length : -1,
          text: (r) =>
            r.allocations.length
              ? `${coverageOf(r.allocations).verified} of ${r.allocations.length} verified`
              : "",
        }),
        c.status("state", {
          header: "State",
          width: 120,
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
        <AllocateModal
          open
          onClose={() => setAllocating(null)}
          programId={programId}
          requirement={allocating}
        />
      ) : null}
    </Stack>
  );
}
