/**
 * Presentation for the requirements layer.
 *
 * Read-only, takes resolved data as props. Every block here is a table or a
 * property row, not prose: the reason a requirement exists is informational
 * and belongs on screen, but it belongs in the cell next to the source that
 * produced it, not in a paragraph explaining the model to someone who opened
 * the page to read a shall statement.
 */

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";

import {
  Absent,
  Badge,
  Box,
  DataTable,
  Id,
  Inline,
  Stack,
  Table,
  Text,
  TextLink,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { ControlHover, ElementHover, RequirementHover } from "@/components/app/glances";
import { SuspectFlag } from "@/components/app/link-currency";
import { closestProgramScope } from "@/lib/program-scope";
import {
  allocationStateTone,
  allocationStates,
  coverages,
  responsibilities,
  saveRequirementField,
  setAllocationField,
  coverageTone,
  derivationSourceTone,
  nestRequirements,
  requirementStateTone,
  requirementMethodLabel,
  resolveTarget,
  responsibilityTone,
  type Allocation,
  type AllocationPatch,
  type ControlTraceHop,
  type Derivation,
  type Nested,
  type NodeControlTrace,
  type Requirement,
} from "@/lib/requirements";

/** Cell that wraps instead of truncating — for the one column that is prose. */
const wrap = "max-w-none whitespace-normal align-top py-100";

/* ------------------------------------------------------------ Target link */

export function TargetLink({
  allocation,
  programId,
}: {
  allocation: Allocation;
  programId: string;
}) {
  const target = resolveTarget(allocation);

  if (target.kind === "node") {
    return (
      <ElementHover nodeId={target.id}>
        <TextLink className="min-w-0">
          <Link
            to="/programs/$programId/components/$componentId"
            params={{ programId, componentId: target.id }}
            title={target.detail}
          >
            {target.name}
          </Link>
        </TextLink>
      </ElementHover>
    );
  }

  if (target.kind === "provider") {
    return (
      <TextLink className="min-w-0">
        <Link
          to="/library/components/$componentKey"
          params={{ componentKey: target.id }}
          title={target.detail}
        >
          {target.name}
        </Link>
      </TextLink>
    );
  }

  // A process has no record page in this cut. Plain text beats a dead link.
  return (
    <span className="min-w-0 truncate" title={target.detail}>
      {target.name}
    </span>
  );
}

function targetKindLabel(allocation: Allocation): string {
  return allocation.targetKind === "node"
    ? "Element"
    : allocation.targetKind === "provider"
      ? "Provider"
      : "Process";
}

/* ------------------------------------------------------- Requirement table */

/** Compact provenance for a table cell: the first source, then a count. */
function SourceCell({ derivations }: { derivations: Derivation[] }) {
  const [first, ...rest] = derivations;
  if (!first) return <span className="text-subtle">—</span>;
  return (
    <Inline
      className="min-w-0"
      title={derivations.map((d) => `${d.sourceType}: ${d.sourceId}`).join("\n")}
      as="span"
      space="space.050"
      alignBlock="center"
    >
      <Badge variant="secondary" size="xsmall" tone={derivationSourceTone[first.sourceType]}>
        {first.sourceId}
      </Badge>
      {rest.length ? (
        <span className="shrink-0 font-body-xsmall text-subtle">+{rest.length}</span>
      ) : null}
    </Inline>
  );
}

/** A requirement with its decomposition under it, and what the table shows beside it. */
type RequirementNode = Nested<Requirement & { allocations: number; isSelected: boolean }>;

/**
 * The top-level view, in tree mode: the decomposition is structure the reader
 * needs, so a parent opens into its children rather than the list flattening
 * them with an indent. The id stays the link; the statement carries the chevron.
 */
export function RequirementTable({
  requirements,
  programId,
  allocationCount,
  selected,
  elementId,
}: {
  requirements: Requirement[];
  programId: string;
  allocationCount: (requirementId: string) => number;
  selected?: string;
  elementId?: string | undefined;
}) {
  const rows = useMemo<RequirementNode[]>(
    () =>
      nestRequirements(
        requirements.map((r) => ({
          ...r,
          allocations: allocationCount(r.id),
          isSelected: selected === r.id,
        })),
      ),
    [requirements, allocationCount, selected],
  );

  const columns = useMemo(
    () =>
      defineColumns<RequirementNode>((c) => [
        c.id("id", {
          header: "Requirement",
          width: 112,
          hideable: false,
          active: (r) => r.isSelected,
          cell: (r) => (
            <RequirementHover requirementId={r.id}>
              <TextLink>
                <Link
                  to="/programs/$programId/requirements/$requirementId"
                  params={{ programId, requirementId: r.id }}
                  search={{ element: elementId }}
                >
                  <Id>{r.id}</Id>
                </Link>
              </TextLink>
            </RequirementHover>
          ),
        }),
        c.text("text", { header: "Shall statement", minWidth: 240, hideable: false }),
        c.text("type", { header: "Type", width: 104 }),
        c.custom("derives", {
          header: "Sources",
          width: 104,
          cell: (r) => <SourceCell derivations={r.derivations} />,
          sort: (r) => r.derivations[0]?.sourceId ?? "",
          text: (r) => r.derivations.map((d) => d.sourceId).join(", "),
        }),
        c.number("allocations", {
          header: "Alloc",
          width: 72,
          cell: (r) => (r.allocations === 0 ? <Absent /> : r.allocations),
        }),
        c.custom("method", {
          header: "Method",
          width: 104,
          cell: requirementMethodLabel,
          text: requirementMethodLabel,
          sort: requirementMethodLabel,
        }),
        c.text("owner", { header: "Owner", width: 116 }),
        c.status("state", {
          header: "Lifecycle status",
          width: 120,
          tone: (r) => requirementStateTone[r.state],
        }),
      ]),
    [programId, elementId],
  );

  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (r) => r.id,
    label: "Requirements",
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
  });

  return (
    <Box paddingBlockStart="space.050">
      <DataTable table={table} />
    </Box>
  );
}

/* -------------------------------------------------------------- Provenance */

/**
 * `§7.2`. A table, not a list of paragraphs — the rationale is the one column
 * that is genuinely prose, so it is the only one allowed to wrap.
 */
export function ProvenanceTable({
  derivations,
  programId,
  requirementId,
  elementId,
}: {
  derivations: Derivation[];
  programId: string;
  /** When given, each source row carries its currency flag. */
  requirementId?: string | undefined;
  elementId?: string | undefined;
}) {
  if (derivations.length === 0) {
    return <p className="pt-150 font-body text-danger">No provenance recorded.</p>;
  }

  return (
    <Table className="pt-050">
      <thead>
        <Table.Row>
          <Table.Header width={150}>Source / relationship</Table.Header>
          <Table.Header width={150}>Source</Table.Header>
          <Table.Header width={260}>Name</Table.Header>
          <Table.Header>Rationale</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        {derivations.map((d) => (
          <Table.Row key={`${d.sourceType}-${d.sourceId}`}>
            <Table.Cell className="align-top py-100">
              <Badge variant="secondary" size="xsmall" tone={derivationSourceTone[d.sourceType]}>
                {d.sourceType === "Control statement" || d.sourceType === "Overlay"
                  ? `${d.relation === "mapped" ? "Mapped to" : "Derived from"} ${d.sourceType === "Overlay" ? "overlay" : "control"}`
                  : d.sourceType}
              </Badge>
            </Table.Cell>
            <Table.Cell className="align-top py-100">
              <Stack as="span" space="space.025">
                <SourceLink derivation={d} programId={programId} elementId={elementId} />
                {requirementId ? (
                  <SuspectFlag
                    link={{ kind: "derivation", requirement: requirementId, source: d.sourceId }}
                    name={`${d.sourceId} → ${requirementId}`}
                  />
                ) : null}
              </Stack>
            </Table.Cell>
            <Table.Cell className={wrap}>{d.sourceLabel}</Table.Cell>
            <Table.Cell className={wrap}>{d.rationale}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

function SourceLink({
  derivation,
  programId,
  elementId,
}: {
  derivation: Derivation;
  programId: string;
  elementId?: string | undefined;
}) {
  const { sourceType, sourceId } = derivation;

  if (sourceType === "Control statement" || sourceType === "Overlay") {
    return (
      <ControlHover controlId={sourceId} programId={programId}>
        <TextLink>
          <Link
            to="/programs/$programId/controls/$controlId"
            params={{ programId, controlId: sourceId }}
            search={{
              tab: undefined,
              element: elementId,
              scope: closestProgramScope(programId, elementId)?.id,
            }}
          >
            <Id>{sourceId}</Id>
          </Link>
        </TextLink>
      </ControlHover>
    );
  }

  if (sourceType === "Threat") {
    return (
      <TextLink>
        <Link
          to="/programs/$programId/te-phases"
          params={{ programId }}
          search={{ tab: "Threat scenarios", scenario: sourceId }}
        >
          <Id>{sourceId}</Id>
        </Link>
      </TextLink>
    );
  }

  if (sourceId.startsWith("CMP-") || sourceId.startsWith("WS-")) {
    const to = sourceId.startsWith("CMP-")
      ? "/library/components/$componentKey"
      : "/workstreams/$workstreamId";
    const params = sourceId.startsWith("CMP-")
      ? { componentKey: sourceId }
      : { workstreamId: sourceId };
    return (
      <TextLink>
        <Link to={to} params={params as never}>
          <Id>{sourceId}</Id>
        </Link>
      </TextLink>
    );
  }

  return <Id className="text-subtle">{sourceId}</Id>;
}

/* -------------------------------------------------------------- Allocation */

/**
 * `editable` turns the judgement columns into inline editors. Target and kind
 * are never editable here: moving an allocation to a different element is a
 * different act from revising the claim about this one, and conflating them
 * behind a dropdown would let a misclick silently reassign responsibility.
 */
export function AllocationTable({
  allocations,
  programId,
  editable = false,
  label = "Allocations",
}: {
  allocations: Allocation[];
  programId: string;
  editable?: boolean;
  /** Names the table. Several on one page (a detail row per requirement) need names of their own. */
  label?: string | undefined;
}) {
  const columns = useMemo(() => {
    // One editor contract per field: commit into the store at once, then settle the save.
    const edit = (key: keyof AllocationPatch) =>
      editable
        ? {
            onChange: (a: Allocation, next: string) =>
              setAllocationField(a.id, { [key]: next } as AllocationPatch),
            save: (a: Allocation, next: string) => saveRequirementField(`${a.id} ${key}`, next),
          }
        : undefined;
    const select = (key: keyof AllocationPatch, options: readonly string[]) => {
      const e = edit(key);
      return e ? { ...e, options } : undefined;
    };
    return defineColumns<Allocation>((c) => [
      c.custom("target", {
        header: "Allocated to",
        width: 230,
        cell: (a) => (
          <span title={a.rationale}>
            <TargetLink allocation={a} programId={programId} />
          </span>
        ),
        sort: (a) => resolveTarget(a).name,
        text: (a) => resolveTarget(a).name,
      }),
      c.text("targetKind", { header: "Kind", width: 88, cell: (a) => targetKindLabel(a) }),
      c.status("responsibility", {
        header: "Responsibility",
        width: 124,
        tone: (a) => responsibilityTone[a.responsibility],
        editable: select("responsibility", responsibilities),
      }),
      c.status("coverage", {
        header: "Coverage",
        width: 120,
        tone: (a) => coverageTone[a.coverage],
        editable: select("coverage", coverages),
      }),
      c.text("scope", { header: "Implementation responsibility", editable: edit("scope") }),
      c.text("owner", { header: "Owner", width: 124, editable: edit("owner") }),
      c.status("state", {
        header: "Allocation status",
        width: 120,
        tone: (a) => allocationStateTone[a.state],
        editable: select("state", allocationStates),
      }),
    ]);
  }, [programId, editable]);

  const table = useDataTable({
    columns,
    data: allocations,
    getRowId: (a) => a.id,
    label,
  });

  if (allocations.length === 0) {
    return <p className="pt-150 font-body text-subtle">Not allocated.</p>;
  }

  return (
    <Box paddingBlockStart="space.050">
      <DataTable table={table} />
    </Box>
  );
}

/* ------------------------------------------------- The element's own view */

/** The same allocations read from the element end. */
export function ElementAllocationTable({
  allocations,
  programId,
  requirementFor,
}: {
  allocations: Allocation[];
  programId: string;
  requirementFor: (requirementId: string) => Requirement | undefined;
}) {
  if (allocations.length === 0) {
    return <p className="pt-150 font-body text-subtle">No requirement allocated here.</p>;
  }

  return (
    <Table className="pt-050">
      <thead>
        <Table.Row>
          <Table.Header width={112}>Requirement</Table.Header>
          <Table.Header>Shall statement</Table.Header>
          <Table.Header width={112}>Responsibility</Table.Header>
          <Table.Header width={92}>Coverage</Table.Header>
          <Table.Header width={260}>Implementation responsibility</Table.Header>
          <Table.Header width={124}>Owner</Table.Header>
          <Table.Header width={150}>Allocation status</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        {allocations.map((a) => {
          const requirement = requirementFor(a.requirement);
          return (
            <Table.Row key={a.id} title={a.rationale}>
              <Table.Cell className="max-w-none">
                <RequirementHover requirementId={a.requirement}>
                  <TextLink>
                    <Link
                      to="/programs/$programId/requirements/$requirementId"
                      params={{ programId, requirementId: a.requirement }}
                      search={{ element: a.targetKind === "node" ? a.target : undefined }}
                    >
                      <Id>{a.requirement}</Id>
                    </Link>
                  </TextLink>
                </RequirementHover>
              </Table.Cell>
              <Table.Cell className="truncate" title={requirement?.text}>
                {requirement?.text ?? "—"}
              </Table.Cell>
              <Table.Cell>
                <Badge
                  variant="secondary"
                  size="xsmall"
                  tone={responsibilityTone[a.responsibility]}
                >
                  {a.responsibility}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Badge variant="secondary" size="xsmall" tone={coverageTone[a.coverage]}>
                  {a.coverage}
                </Badge>
              </Table.Cell>
              <Table.Cell className="truncate" title={a.scope}>
                {a.scope}
              </Table.Cell>
              <Table.Cell className="truncate">{a.owner}</Table.Cell>
              <Table.Cell>
                <Stack as="span" space="space.025">
                  <Badge variant="secondary" size="xsmall" tone={allocationStateTone[a.state]}>
                    {a.state}
                  </Badge>
                  <SuspectFlag
                    link={{ kind: "allocation", id: a.id }}
                    name={`${a.requirement} on ${resolveTarget(a).name}`}
                  />
                </Stack>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </tbody>
    </Table>
  );
}

/* --------------------------------------------------------- The derived trace */

/**
 * The control trace for one element, as a table. The header above it carries
 * the "computed, not recorded" claim in one line; repeating it here in prose
 * only pushes the data further down the page.
 */
export function DerivedControlTrace({
  trace,
  programId,
}: {
  trace: NodeControlTrace;
  programId: string;
}) {
  if (trace.hops.length === 0 && trace.withoutControl.length === 0) {
    return <p className="pt-150 font-body text-subtle">Reaches no control.</p>;
  }

  return (
    <Stack className="pt-050" space="space.150">
      {trace.hops.length > 0 ? (
        <Table className="pt-050">
          <thead>
            <Table.Row>
              <Table.Header width={104}>Control</Table.Header>
              <Table.Header width={112}>Via requirement</Table.Header>
              <Table.Header width={88}>Path</Table.Header>
              <Table.Header width={112}>Responsibility</Table.Header>
              <Table.Header width={92}>Coverage</Table.Header>
              <Table.Header>Implementation responsibility</Table.Header>
            </Table.Row>
          </thead>
          <tbody>
            {trace.hops.map((hop, i) => (
              <TraceRow
                key={`${hop.allocation.id}-${hop.control}-${i}`}
                hop={hop}
                programId={programId}
              />
            ))}
          </tbody>
        </Table>
      ) : null}

      {trace.withoutControl.length > 0 ? (
        <Box
          className="rounded-large border border-default bg-surface-sunken"
          paddingInline="space.150"
          paddingBlock="space.100"
        >
          <p className="font-body-small">
            <span className="font-medium">
              {trace.withoutControl.length} allocated here{" "}
              {trace.withoutControl.length === 1 ? "names" : "name"} no control of its own
            </span>
            <span className="text-subtle">
              {" "}
              — written by threat analysis, policy or architecture.
            </span>
          </p>
          <Stack className="pt-075" as="ul" space="space.050">
            {trace.withoutControl.map((r) => (
              <Inline
                key={r.id}
                className="min-w-0"
                as="li"
                space="space.100"
                alignBlock="baseline"
              >
                <TextLink className="shrink-0">
                  <Link
                    to="/programs/$programId/requirements/$requirementId"
                    params={{ programId, requirementId: r.id }}
                    search={{ element: trace.target }}
                  >
                    <Id>{r.id}</Id>
                  </Link>
                </TextLink>
                <span className="min-w-0 truncate font-body-small text-subtle">{r.text}</span>
              </Inline>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Stack>
  );
}

function TraceRow({ hop, programId }: { hop: ControlTraceHop; programId: string }) {
  return (
    <Table.Row title={hop.rationale}>
      <Table.Cell>
        <TextLink>
          <Link
            to="/programs/$programId/controls/$controlId"
            params={{ programId, controlId: hop.control }}
            search={{
              tab: undefined,
              scope: closestProgramScope(
                programId,
                hop.allocation.targetKind === "node" ? hop.allocation.target : undefined,
              )?.id,
              element: hop.allocation.targetKind === "node" ? hop.allocation.target : undefined,
            }}
          >
            <Id>{hop.control}</Id>
          </Link>
        </TextLink>
      </Table.Cell>
      <Table.Cell>
        <RequirementHover requirementId={hop.requirement}>
          <TextLink>
            <Link
              to="/programs/$programId/requirements/$requirementId"
              params={{ programId, requirementId: hop.requirement }}
              search={{
                element: hop.allocation.targetKind === "node" ? hop.allocation.target : undefined,
              }}
            >
              <Id>{hop.requirement}</Id>
            </Link>
          </TextLink>
        </RequirementHover>
      </Table.Cell>
      <Table.Cell>
        {hop.via === "direct" ? (
          "Direct"
        ) : (
          <Inline
            title={`Inherited from ${hop.through}`}
            as="span"
            space="space.050"
            alignBlock="center"
          >
            <ArrowRight className="shrink-0 size-150" />
            <Id className="text-subtle">{hop.through}</Id>
          </Inline>
        )}
      </Table.Cell>
      <Table.Cell>
        <Badge
          variant="secondary"
          size="xsmall"
          tone={responsibilityTone[hop.allocation.responsibility]}
        >
          {hop.allocation.responsibility}
        </Badge>
      </Table.Cell>
      <Table.Cell>
        <Badge variant="secondary" size="xsmall" tone={coverageTone[hop.allocation.coverage]}>
          {hop.allocation.coverage}
        </Badge>
      </Table.Cell>
      <Table.Cell className="truncate">{hop.allocation.scope}</Table.Cell>
    </Table.Row>
  );
}

/* ------------------------------------------------- The control's own view */

/** What one control obligation turned into, as a table. */
export function ControlRequirementTable({
  requirements,
  programId,
  controlId,
  allocationCount,
  elementId,
}: {
  requirements: Requirement[];
  programId: string;
  controlId: string;
  allocationCount: (requirementId: string) => number;
  elementId?: string | undefined;
}) {
  if (requirements.length === 0) {
    return <p className="pt-150 font-body text-subtle">No linked requirements.</p>;
  }

  return (
    <Table className="pt-050">
      <thead>
        <Table.Row>
          <Table.Header width={112}>Requirement</Table.Header>
          <Table.Header width={104}>Type</Table.Header>
          <Table.Header>Shall statement</Table.Header>
          <Table.Header width={132}>Relationship</Table.Header>
          <Table.Header width={72} className="text-right">
            Allocations
          </Table.Header>
          <Table.Header width={150}>Engineering state</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        {requirements.map((r) => {
          const direct = r.derivations.find(
            (d) =>
              (d.sourceType === "Control statement" || d.sourceType === "Overlay") &&
              d.sourceId === controlId,
          );
          const count = allocationCount(r.id);
          return (
            <Table.Row key={r.id} title={r.text}>
              <Table.Cell className="max-w-none">
                <RequirementHover requirementId={r.id}>
                  <TextLink>
                    <Link
                      to="/programs/$programId/requirements/$requirementId"
                      params={{ programId, requirementId: r.id }}
                      search={{ element: elementId }}
                    >
                      <Id>{r.id}</Id>
                    </Link>
                  </TextLink>
                </RequirementHover>
              </Table.Cell>
              <Table.Cell className="truncate">{r.type}</Table.Cell>
              <Table.Cell className="truncate">{r.text}</Table.Cell>
              <Table.Cell>
                {direct ? (
                  direct.relation === "mapped" ? (
                    "Mapped to"
                  ) : (
                    "Derived from"
                  )
                ) : (
                  <Inline
                    title={`Inherited from ${r.parent}`}
                    as="span"
                    space="space.050"
                    alignBlock="center"
                  >
                    <ArrowRight className="shrink-0 size-150" />
                    <Id className="text-subtle">{r.parent}</Id>
                  </Inline>
                )}
              </Table.Cell>
              <Table.Cell className="tabular-nums text-right">
                {count === 0 ? <span className="text-subtle">—</span> : count}
              </Table.Cell>
              <Table.Cell>
                <Badge variant="secondary" size="xsmall" tone={requirementStateTone[r.state]}>
                  {r.state}
                </Badge>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </tbody>
    </Table>
  );
}
