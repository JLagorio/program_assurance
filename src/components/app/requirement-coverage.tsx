/**
 * The Requirements tab as a coverage view: every requirement in the program,
 * which elements carry it (the union across allocations), which controls it
 * traces to, and how far its verification has run. The filters are the
 * questions a reader asks of the list; the bar is the one status per row.
 *
 * A DataTable in the same shape as the program's task table (task-table.tsx):
 * one toolbar row with search, the saved views as a menu, the filter chips,
 * then Columns, Settings and the primary action at the end; the id pinned,
 * every column resizable and reorderable, the layout kept under a view name.
 * The rows nest as the decomposition does, and the leading chevron is the only
 * one: a parent opens into its parts. Carried by reads on one line, rests into
 * a hover card, and clicking it opens the row into the table of what carries
 * it. The eye on the id opens the requirement beside the list.
 */

import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { ControlHover, RequirementHover } from "@/components/app/glances";
import { AllocateElementsSheet } from "@/components/app/allocate-picker";
import { CoverageBar } from "@/components/app/coverage-bar";
import { NewRequirementModal } from "@/components/app/requirement-forms";
import { RequirementPreviewSheet } from "@/components/app/requirement-preview";
import {
  Button,
  DataTable,
  Empty,
  Id,
  Indicator,
  Inline,
  Text,
  TextLink,
  defineColumns,
  useDataTable,
  type Preset,
} from "@ledger/design-system";
import { AllocationTable } from "@/components/app/requirements";
import { useCompositionGraph } from "@/lib/composition";
import { closestProgramScope, resolveProgramElement } from "@/lib/program-scope";
import {
  requirementsForProgramElement,
  allocationsForProgramElement,
} from "@/lib/requirement-context";
import { suspectLinksFor, useLinkCurrencyVersion } from "@/lib/link-currency";
import {
  coverageOf,
  notCoveredRequirements,
  useVerificationVersion,
  type RequirementCoverage,
} from "@/lib/requirement-verification";
import {
  nestRequirements,
  requirementStateTone,
  requirementControlOrigin,
  resolveTarget,
  unallocatedRequirements,
  useRequirementsVersion,
  type Allocation,
  type Derivation,
  type Nested,
  type Requirement,
  type RequirementState,
} from "@/lib/requirements";

/** Who carries a requirement, as one value a preset can ask for. */
type CarriedBy = "Allocated" | "Nobody responsible" | "Not yet allocatable";

/** Where a requirement came from: the catalog, or the program's own engineering. */
type Origin = "Derived from control" | "Mapped to control" | "Independent";

/** Whether any test objective names the requirement (or one of its children). */
type Verification = "Assessment linked" | "No assessment linked";

/** Whether every link under the requirement is current, or one has gone Suspect. */
type Currency = "Current" | "Suspect";

/** One requirement projected onto the columns the table sorts and filters by. */
type CoverageBase = {
  id: string;
  parent: string | null;
  text: string;
  state: RequirementState;
  allocation: CarriedBy;
  origin: Origin;
  verification: Verification;
  currency: Currency;
  suspect: number;
  /** The allocations whose link has gone suspect, by id. */
  suspectAllocations: Set<string>;
  coverage: RequirementCoverage;
  requirement: Requirement;
  allocations: Allocation[];
  controls: Derivation[];
  overlays: Derivation[];
};

/** A row with its decomposition under it. */
type CoverageRow = Nested<CoverageBase>;

// The saved questions, as the column filters each one applies. Counts come from the table.
// Values are arrays, the shape the filter chips write, so a chip and a view agree on what is active.
const presets: Preset[] = [
  { id: "all", label: "All" },
  {
    id: "unallocated",
    label: "Unallocated",
    filters: [{ id: "allocation", value: ["Nobody responsible"] }],
  },
  { id: "no-control", label: "Independent", filters: [{ id: "origin", value: ["Independent"] }] },
  {
    id: "from-control",
    label: "Control-derived",
    filters: [{ id: "origin", value: ["Derived from control"] }],
  },
  {
    id: "mapped-control",
    label: "Mapped to control",
    filters: [{ id: "origin", value: ["Mapped to control"] }],
  },
  {
    id: "not-covered",
    label: "No assessment linked",
    filters: [{ id: "verification", value: ["No assessment linked"] }],
  },
  { id: "suspect", label: "Suspect", filters: [{ id: "currency", value: ["Suspect"] }] },
];

/** The share of a requirement's objectives that are met: what the Verification column sorts by. */
function metShare(c: RequirementCoverage): number {
  const total = c.met + c.partial + c.notMet + c.notRun + c.notCovered;
  return total ? c.met / total : -1;
}

export function RequirementCoverage({
  programId,
  elementId,
}: {
  programId: string;
  elementId?: string | undefined;
}) {
  const navigate = useNavigate();
  const version = useRequirementsVersion();
  const graph = useCompositionGraph(programId);
  const selectedElementId = resolveProgramElement(programId, elementId)?.id;
  const controlScopeId = closestProgramScope(programId, selectedElementId)?.id;
  const verificationVersion = useVerificationVersion();
  const currencyVersion = useLinkCurrencyVersion();
  const [allocating, setAllocating] = useState<Requirement | null>(null);
  const [adding, setAdding] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  // The columns read the open preview through a ref, so opening one redraws the rows without rebuilding them.
  const previewRef = useRef(previewId);
  previewRef.current = previewId;

  const all = useMemo(
    () => requirementsForProgramElement(programId, selectedElementId),
    [programId, selectedElementId, version, graph],
  );

  // The projection, nested by `parent`. Every store it reads is subscribed through a version above.
  const rows = useMemo<CoverageRow[]>(() => {
    const unallocated = new Set(unallocatedRequirements(programId).map((r) => r.id));
    const notCovered = new Set(notCoveredRequirements(programId).map((r) => r.id));
    const flat: CoverageBase[] = all.map((r) => {
      const allocations = allocationsForProgramElement(r.id, programId, selectedElementId);
      const links = suspectLinksFor(r);
      return {
        id: r.id,
        parent: r.parent,
        text: r.text,
        state: r.state,
        allocation: allocations.length
          ? "Allocated"
          : unallocated.has(r.id)
            ? "Nobody responsible"
            : "Not yet allocatable",
        origin:
          requirementControlOrigin(r) === "No control"
            ? "Independent"
            : requirementControlOrigin(r) === "Mapped to a control"
              ? "Mapped to control"
              : "Derived from control",
        verification: notCovered.has(r.id) ? "No assessment linked" : "Assessment linked",
        currency: links.length ? "Suspect" : "Current",
        suspect: links.length,
        suspectAllocations: new Set(
          links.flatMap((l) => (l.ref.kind === "allocation" ? [l.ref.id] : [])),
        ),
        coverage: coverageOf(r),
        requirement: r,
        allocations,
        controls: r.derivations.filter((d) => d.sourceType === "Control statement"),
        overlays: r.derivations.filter((d) => d.sourceType === "Overlay"),
      };
    });
    return nestRequirements(flat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, programId, selectedElementId, version, verificationVersion, currencyVersion]);

  // The cells link into the program, so the columns close over its id.
  const columns = useMemo(
    () =>
      defineColumns<CoverageRow>((c) => [
        c.id("id", {
          header: "Requirement",
          width: 140,
          pin: "start",
          hideable: false,
          preview: (r) => setPreviewId(r.id),
          active: (r) => r.id === previewRef.current,
          cell: (r) => (
            <RequirementHover requirementId={r.id}>
              <TextLink>
                <Link
                  to="/programs/$programId/requirements/$requirementId"
                  params={{ programId, requirementId: r.id }}
                  search={{ element: selectedElementId }}
                >
                  <Id>{r.id}</Id>
                </Link>
              </TextLink>
            </RequirementHover>
          ),
        }),
        c.text("text", { header: "Shall statement", minWidth: 240, hideable: false }),
        c.list("carriedBy", {
          header: "Allocated to",
          width: 240,
          items: (r) =>
            r.allocations.map((a) => {
              const target = resolveTarget(a);
              return {
                key: a.id,
                label: target.name,
                meta: target.detail,
                status: r.suspectAllocations.has(a.id) ? (
                  <Indicator tone="warning">Suspect</Indicator>
                ) : undefined,
              };
            }),
          empty: (r) => (
            <Indicator tone={r.allocation === "Nobody responsible" ? "warning" : "neutral"}>
              {r.allocation}
            </Indicator>
          ),
          note: (r) => {
            const n = r.suspectAllocations.size;
            return n
              ? `${n} link${n === 1 ? "" : "s"} suspect since the element changed`
              : undefined;
          },
          opens: "detail",
        }),
        // Hidden until asked for: the Unallocated question reads it, the Carried by cell shows it.
        c.text("allocation", { header: "Allocation", width: 150 }),
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
                        search={{
                          tab: undefined,
                          scope: controlScopeId,
                          element: selectedElementId,
                        }}
                      >
                        <span className="text-subtle">
                          {d.relation === "mapped" ? "Mapped to " : "Derived from "}
                        </span>
                        <Id>{d.sourceId}</Id>
                      </Link>
                    </TextLink>
                  </ControlHover>
                ))}
                {r.overlays.map((d) => (
                  <Text key={d.sourceId} size="small" color="color.text.subtle">
                    {d.relation === "mapped" ? "Mapped to " : "Derived from "}
                    {d.sourceLabel || d.sourceId}
                  </Text>
                ))}
              </Inline>
            ) : (
              <Text size="small" color="color.text.subtle">
                Independent
              </Text>
            ),
        }),
        c.text("verification", {
          header: "Assessment result",
          width: 168,
          cell: (r) => <CoverageBar coverage={r.coverage} />,
          // the met share; a requirement no test names sorts below everything
          sortBy: (r) => metShare(r.coverage),
        }),
        // Hidden until asked for: the Suspect question reads it.
        c.text("currency", { header: "Currency", width: 104 }),
        c.status("state", {
          header: "Lifecycle status",
          width: 130,
          tone: (r) => requirementStateTone[r.state],
        }),
        c.actions((r) => [{ label: "Allocate", onSelect: () => setAllocating(r.requirement) }]),
      ]),
    [programId, selectedElementId, controlScopeId],
  );

  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (r) => r.id,
    label: "Requirement coverage",
    view: "requirement-coverage",
    resizable: true,
    reorderable: true,
    tree: {
      children: (r) => r.parts,
      label: (r) => r.id,
      hint: (_, n) => (
        <Text size="xsmall" color="color.text.subtle">
          {n} part{n === 1 ? "" : "s"}
        </Text>
      ),
      initialExpanded: true,
    },
    // The row opens into what carries it, from the Carried by cell rather than a chevron of its
    // own: two chevrons in a row read as twins. The same allocation table the record page shows,
    // named after its requirement so several open rows are not one landmark repeated.
    detailColumn: false,
    detail: (r) =>
      r.allocations.length ? (
        <AllocationTable
          allocations={r.allocations}
          programId={programId}
          label={`${r.id} allocations`}
        />
      ) : (
        <Empty
          title={`${r.id} is not allocated`}
          description="Allocate it to the elements that answer it, each with the scope of its claim."
          action={
            <Button size="small" variant="primary" onClick={() => setAllocating(r.requirement)}>
              Allocate
            </Button>
          }
        />
      ),
    initialState: { columnVisibility: { currency: false, allocation: false } },
  });

  const newRequirement = (
    <Button size="small" variant="primary" iconBefore={<Plus />} onClick={() => setAdding(true)}>
      New requirement
    </Button>
  );

  const toolbar = (
    <Inline space="space.100" alignBlock="center" shouldWrap>
      <DataTable.Search table={table} placeholder="Find a requirement" />
      <DataTable.Presets table={table} presets={presets} variant="menu" aria-label="Saved views" />
      <DataTable.Filter table={table} column="allocation" />
      <DataTable.Filter table={table} column="origin" />
      <DataTable.Filter table={table} column="state" />
      <Inline className="ml-auto" space="space.100" alignBlock="center">
        <DataTable.Columns table={table} />
        <DataTable.Settings table={table} />
        {newRequirement}
      </Inline>
    </Inline>
  );

  // No requirements at all is a different empty from filters that leave none.
  const empty = all.length
    ? { title: "Nothing matches", description: "Choose another view or clear the filters." }
    : selectedElementId
      ? {
          title: "No requirements allocated",
          description: "Choose another system element or allocate a requirement.",
          action: newRequirement,
        }
      : {
          title: "No security requirements",
          description: "Create a requirement for this program.",
          action: newRequirement,
        };

  return (
    <>
      <DataTable table={table} toolbar={toolbar} empty={empty} />

      <RequirementPreviewSheet
        programId={programId}
        elementId={selectedElementId}
        requirementId={previewId}
        onClose={() => setPreviewId(null)}
        onAllocate={(r) => setAllocating(r)}
      />

      <NewRequirementModal
        open={adding}
        onClose={() => setAdding(false)}
        programId={programId}
        onCreated={(requirement) => {
          void navigate({
            to: "/programs/$programId/requirements/$requirementId",
            params: { programId, requirementId: requirement.id },
            search: { element: selectedElementId },
          });
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
    </>
  );
}
