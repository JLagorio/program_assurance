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

import { Badge, Table, Id, Editable } from "@/ds/primitives";
import { cn } from "@/lib/utils";
import {
  allocationStateTone,
  allocationStates,
  coverages,
  responsibilities,
  saveRequirementField,
  setAllocationField,
  coverageTone,
  derivationSourceTone,
  requirementStateTone,
  resolveTarget,
  responsibilityTone,
  type Allocation,
  type ControlTraceHop,
  type Derivation,
  type NodeControlTrace,
  type Requirement,
} from "@/lib/requirements";

/** Cell that wraps instead of truncating — for the one column that is prose. */
const wrap = "max-w-none whitespace-normal align-top py-2 leading-[1.45]";

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
      <Link
        to="/programs/$programId/components/$componentId"
        params={{ programId, componentId: target.id }}
        className="min-w-0 text-primary hover:underline"
        title={target.detail}
      >
        {target.name}
      </Link>
    );
  }

  if (target.kind === "provider") {
    return (
      <Link
        to="/library/components/$componentKey"
        params={{ componentKey: target.id }}
        className="min-w-0 text-primary hover:underline"
        title={target.detail}
      >
        {target.name}
      </Link>
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
  if (!first) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className="flex min-w-0 items-center gap-1"
      title={derivations.map((d) => `${d.sourceType}: ${d.sourceId}`).join("\n")}
    >
      <Badge size="xs" tone={derivationSourceTone[first.sourceType]}>
        {first.sourceId}
      </Badge>
      {rest.length ? (
        <span className="shrink-0 text-11 text-muted-foreground">+{rest.length}</span>
      ) : null}
    </span>
  );
}

/**
 * The top-level view. Children are indented under their parent because the
 * decomposition is structure the reader needs, not decoration.
 */
export function RequirementTable({
  requirements,
  programId,
  allocationCount,
  selected,
}: {
  requirements: Requirement[];
  programId: string;
  allocationCount: (requirementId: string) => number;
  selected?: string;
}) {
  const rows: { requirement: Requirement; depth: number }[] = [];
  const seen = new Set<string>();
  const walk = (requirement: Requirement, depth: number) => {
    if (seen.has(requirement.id)) return;
    seen.add(requirement.id);
    rows.push({ requirement, depth });
    for (const child of requirements.filter((r) => r.parent === requirement.id)) {
      walk(child, depth + 1);
    }
  };
  for (const r of requirements) {
    if (!r.parent || !requirements.some((p) => p.id === r.parent)) walk(r, 0);
  }
  for (const r of requirements) walk(r, 0);

  return (
    <Table className="mt-1">
      <colgroup>
        <col style={{ width: "112px" }} />
        <col style={{ width: "104px" }} />
        <col />
        <col style={{ width: "104px" }} />
        <col style={{ width: "72px" }} />
        <col style={{ width: "104px" }} />
        <col style={{ width: "116px" }} />
        <col style={{ width: "104px" }} />
      </colgroup>
      <thead>
        <Table.Row>
          <Table.Header>Requirement</Table.Header>
          <Table.Header>Type</Table.Header>
          <Table.Header>Shall statement</Table.Header>
          <Table.Header>Derives from</Table.Header>
          <Table.Header className="text-right">Alloc</Table.Header>
          <Table.Header>Method</Table.Header>
          <Table.Header>Owner</Table.Header>
          <Table.Header>State</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        {rows.map(({ requirement, depth }) => {
          const count = allocationCount(requirement.id);
          return (
            <Table.Row
              key={requirement.id}
              className={cn(selected === requirement.id && "bg-primary-soft/40")}
              title={requirement.text}
            >
              <Table.Cell className="max-w-none">
                <span style={{ paddingLeft: `${depth * 12}px` }}>
                  <Link
                    to="/programs/$programId/requirements/$requirementId"
                    params={{ programId, requirementId: requirement.id }}
                    className="hover:underline"
                  >
                    <Id className="text-primary">{requirement.id}</Id>
                  </Link>
                </span>
              </Table.Cell>
              <Table.Cell className="truncate">{requirement.type}</Table.Cell>
              <Table.Cell className="truncate">{requirement.text}</Table.Cell>
              <Table.Cell className="truncate">
                <SourceCell derivations={requirement.derivations} />
              </Table.Cell>
              <Table.Cell className="tnum text-right">
                {count === 0 ? <span className="text-muted-foreground">—</span> : count}
              </Table.Cell>
              <Table.Cell className="truncate">{requirement.method}</Table.Cell>
              <Table.Cell className="truncate">{requirement.owner}</Table.Cell>
              <Table.Cell>
                <Badge size="xs" tone={requirementStateTone[requirement.state]}>
                  {requirement.state}
                </Badge>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </tbody>
    </Table>
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
}: {
  derivations: Derivation[];
  programId: string;
}) {
  if (derivations.length === 0) {
    return <p className="pt-3 text-[13px] text-danger">No provenance recorded.</p>;
  }

  return (
    <Table className="mt-1">
      <colgroup>
        <col style={{ width: "150px" }} />
        <col style={{ width: "108px" }} />
        <col style={{ width: "260px" }} />
        <col />
      </colgroup>
      <thead>
        <Table.Row>
          <Table.Header>Source type</Table.Header>
          <Table.Header>Source</Table.Header>
          <Table.Header>Name</Table.Header>
          <Table.Header>Why it produces this requirement</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        {derivations.map((d) => (
          <Table.Row key={`${d.sourceType}-${d.sourceId}`}>
            <Table.Cell className="align-top py-2">
              <Badge size="xs" tone={derivationSourceTone[d.sourceType]}>
                {d.sourceType}
              </Badge>
            </Table.Cell>
            <Table.Cell className="align-top py-2">
              <SourceLink derivation={d} programId={programId} />
            </Table.Cell>
            <Table.Cell className={wrap}>{d.sourceLabel}</Table.Cell>
            <Table.Cell className={wrap}>{d.rationale}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

function SourceLink({ derivation, programId }: { derivation: Derivation; programId: string }) {
  const { sourceType, sourceId } = derivation;

  if (sourceType === "Control statement" || sourceType === "Overlay") {
    return (
      <Link
        to="/programs/$programId/controls/$controlId"
        params={{ programId, controlId: sourceId }}
        search={{ tab: undefined }}
        className="hover:underline"
      >
        <Id className="text-primary">{sourceId}</Id>
      </Link>
    );
  }

  if (sourceType === "Threat") {
    return (
      <Link
        to="/programs/$programId/te-phases"
        params={{ programId }}
        search={{ tab: "Threat scenarios", scenario: sourceId }}
        className="hover:underline"
      >
        <Id className="text-primary">{sourceId}</Id>
      </Link>
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
      <Link to={to} params={params as never} className="hover:underline">
        <Id className="text-primary">{sourceId}</Id>
      </Link>
    );
  }

  return <Id className="text-muted-foreground">{sourceId}</Id>;
}

/* -------------------------------------------------------------- Allocation */

/**
 * `editable` turns the three judgement columns into inline editors. Target and
 * kind are never editable here: moving an allocation to a different element is
 * a different act from revising the claim about this one, and conflating them
 * behind a dropdown would let a misclick silently reassign responsibility.
 */
export function AllocationTable({
  allocations,
  programId,
  editable = false,
}: {
  allocations: Allocation[];
  programId: string;
  editable?: boolean;
}) {
  if (allocations.length === 0) {
    return <p className="pt-3 text-[13px] text-muted-foreground">Not allocated.</p>;
  }

  return (
    <Table className="mt-1">
      <colgroup>
        <col style={{ width: "230px" }} />
        <col style={{ width: "88px" }} />
        <col style={{ width: "112px" }} />
        <col style={{ width: "92px" }} />
        <col />
        <col style={{ width: "124px" }} />
        <col style={{ width: "104px" }} />
      </colgroup>
      <thead>
        <Table.Row>
          <Table.Header>Allocated to</Table.Header>
          <Table.Header>Kind</Table.Header>
          <Table.Header>Responsibility</Table.Header>
          <Table.Header>Coverage</Table.Header>
          <Table.Header>Scope of the claim</Table.Header>
          <Table.Header>Owner</Table.Header>
          <Table.Header>State</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        {allocations.map((a) => (
          <Table.Row key={a.id} title={a.rationale}>
            <Table.Cell className="truncate">
              <TargetLink allocation={a} programId={programId} />
            </Table.Cell>
            <Table.Cell>{targetKindLabel(a)}</Table.Cell>
            <Table.Cell>
              {editable ? (
                <Editable.Select
                  label="Responsibility"
                  options={responsibilities}
                  value={a.responsibility}
                  onChange={(next) => setAllocationField(a.id, { responsibility: next })}
                  save={(next) => saveRequirementField(`${a.id} responsibility`, next)}
                  render={(v) => (
                    <Badge size="xs" tone={responsibilityTone[v]}>
                      {v}
                    </Badge>
                  )}
                />
              ) : (
                <Badge size="xs" tone={responsibilityTone[a.responsibility]}>
                  {a.responsibility}
                </Badge>
              )}
            </Table.Cell>
            <Table.Cell>
              {editable ? (
                <Editable.Select
                  label="Coverage"
                  options={coverages}
                  value={a.coverage}
                  onChange={(next) => setAllocationField(a.id, { coverage: next })}
                  save={(next) => saveRequirementField(`${a.id} coverage`, next)}
                  render={(v) => (
                    <Badge size="xs" tone={coverageTone[v]}>
                      {v}
                    </Badge>
                  )}
                />
              ) : (
                <Badge size="xs" tone={coverageTone[a.coverage]}>
                  {a.coverage}
                </Badge>
              )}
            </Table.Cell>
            <Table.Cell className="truncate" title={a.scope}>
              {editable ? (
                <Editable.Text
                  value={a.scope}
                  onChange={(next) => setAllocationField(a.id, { scope: next })}
                  save={(next) => saveRequirementField(`${a.id} scope`, next)}
                />
              ) : (
                a.scope
              )}
            </Table.Cell>
            <Table.Cell className="truncate">
              {editable ? (
                <Editable.Text
                  value={a.owner}
                  onChange={(next) => setAllocationField(a.id, { owner: next })}
                  save={(next) => saveRequirementField(`${a.id} owner`, next)}
                />
              ) : (
                a.owner
              )}
            </Table.Cell>
            <Table.Cell>
              {editable ? (
                <Editable.Select
                  label="State"
                  options={allocationStates}
                  value={a.state}
                  onChange={(next) => setAllocationField(a.id, { state: next })}
                  save={(next) => saveRequirementField(`${a.id} state`, next)}
                  render={(v) => (
                    <Badge size="xs" tone={allocationStateTone[v]}>
                      {v}
                    </Badge>
                  )}
                />
              ) : (
                <Badge size="xs" tone={allocationStateTone[a.state]}>
                  {a.state}
                </Badge>
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
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
    return <p className="pt-3 text-[13px] text-muted-foreground">No requirement allocated here.</p>;
  }

  return (
    <Table className="mt-1">
      <colgroup>
        <col style={{ width: "112px" }} />
        <col />
        <col style={{ width: "112px" }} />
        <col style={{ width: "92px" }} />
        <col style={{ width: "260px" }} />
        <col style={{ width: "124px" }} />
        <col style={{ width: "104px" }} />
      </colgroup>
      <thead>
        <Table.Row>
          <Table.Header>Requirement</Table.Header>
          <Table.Header>Shall statement</Table.Header>
          <Table.Header>Responsibility</Table.Header>
          <Table.Header>Coverage</Table.Header>
          <Table.Header>Scope of the claim</Table.Header>
          <Table.Header>Owner</Table.Header>
          <Table.Header>State</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        {allocations.map((a) => {
          const requirement = requirementFor(a.requirement);
          return (
            <Table.Row key={a.id} title={a.rationale}>
              <Table.Cell className="max-w-none">
                <Link
                  to="/programs/$programId/requirements/$requirementId"
                  params={{ programId, requirementId: a.requirement }}
                  className="hover:underline"
                >
                  <Id className="text-primary">{a.requirement}</Id>
                </Link>
              </Table.Cell>
              <Table.Cell className="truncate" title={requirement?.text}>
                {requirement?.text ?? "—"}
              </Table.Cell>
              <Table.Cell>
                <Badge size="xs" tone={responsibilityTone[a.responsibility]}>
                  {a.responsibility}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Badge size="xs" tone={coverageTone[a.coverage]}>
                  {a.coverage}
                </Badge>
              </Table.Cell>
              <Table.Cell className="truncate" title={a.scope}>
                {a.scope}
              </Table.Cell>
              <Table.Cell className="truncate">{a.owner}</Table.Cell>
              <Table.Cell>
                <Badge size="xs" tone={allocationStateTone[a.state]}>
                  {a.state}
                </Badge>
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
    return <p className="pt-3 text-[13px] text-muted-foreground">Reaches no control.</p>;
  }

  return (
    <div className="space-y-3 pt-1">
      {trace.hops.length > 0 ? (
        <Table className="mt-1">
          <colgroup>
            <col style={{ width: "104px" }} />
            <col style={{ width: "112px" }} />
            <col style={{ width: "88px" }} />
            <col style={{ width: "112px" }} />
            <col style={{ width: "92px" }} />
            <col />
          </colgroup>
          <thead>
            <Table.Row>
              <Table.Header>Control</Table.Header>
              <Table.Header>Via requirement</Table.Header>
              <Table.Header>Path</Table.Header>
              <Table.Header>Responsibility</Table.Header>
              <Table.Header>Coverage</Table.Header>
              <Table.Header>Scope of the claim</Table.Header>
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
        <div className="rounded-lg border border-border bg-subtle px-3 py-2.5">
          <p className="text-[12.5px]">
            <span className="font-medium">
              {trace.withoutControl.length} allocated here{" "}
              {trace.withoutControl.length === 1 ? "names" : "name"} no control of its own
            </span>
            <span className="text-muted-foreground">
              {" "}
              — written by threat analysis, policy or architecture.
            </span>
          </p>
          <ul className="mt-1.5 space-y-1">
            {trace.withoutControl.map((r) => (
              <li key={r.id} className="flex min-w-0 items-baseline gap-2">
                <Link
                  to="/programs/$programId/requirements/$requirementId"
                  params={{ programId, requirementId: r.id }}
                  className="shrink-0 hover:underline"
                >
                  <Id className="text-primary">{r.id}</Id>
                </Link>
                <span className="min-w-0 truncate text-[12.5px] text-muted-foreground">
                  {r.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function TraceRow({ hop, programId }: { hop: ControlTraceHop; programId: string }) {
  return (
    <Table.Row title={hop.rationale}>
      <Table.Cell>
        <Link
          to="/programs/$programId/controls/$controlId"
          params={{ programId, controlId: hop.control }}
          search={{ tab: undefined }}
          className="hover:underline"
        >
          <Id className="text-primary">{hop.control}</Id>
        </Link>
      </Table.Cell>
      <Table.Cell>
        <Link
          to="/programs/$programId/requirements/$requirementId"
          params={{ programId, requirementId: hop.requirement }}
          className="hover:underline"
        >
          <Id className="text-primary">{hop.requirement}</Id>
        </Link>
      </Table.Cell>
      <Table.Cell>
        {hop.via === "direct" ? (
          "Direct"
        ) : (
          <span className="flex items-center gap-1" title={`Inherited from ${hop.through}`}>
            <ArrowRight className="size-3 shrink-0" />
            <Id className="text-muted-foreground">{hop.through}</Id>
          </span>
        )}
      </Table.Cell>
      <Table.Cell>
        <Badge size="xs" tone={responsibilityTone[hop.allocation.responsibility]}>
          {hop.allocation.responsibility}
        </Badge>
      </Table.Cell>
      <Table.Cell>
        <Badge size="xs" tone={coverageTone[hop.allocation.coverage]}>
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
}: {
  requirements: Requirement[];
  programId: string;
  controlId: string;
  allocationCount: (requirementId: string) => number;
}) {
  if (requirements.length === 0) {
    return (
      <p className="pt-3 text-[13px] text-muted-foreground">
        No security requirement derived from this control yet.
      </p>
    );
  }

  return (
    <Table className="mt-1">
      <colgroup>
        <col style={{ width: "112px" }} />
        <col style={{ width: "104px" }} />
        <col />
        <col style={{ width: "112px" }} />
        <col style={{ width: "72px" }} />
        <col style={{ width: "104px" }} />
      </colgroup>
      <thead>
        <Table.Row>
          <Table.Header>Requirement</Table.Header>
          <Table.Header>Type</Table.Header>
          <Table.Header>Shall statement</Table.Header>
          <Table.Header>Path</Table.Header>
          <Table.Header className="text-right">Alloc</Table.Header>
          <Table.Header>State</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        {requirements.map((r) => {
          const direct = r.derivations.some(
            (d) =>
              (d.sourceType === "Control statement" || d.sourceType === "Overlay") &&
              d.sourceId === controlId,
          );
          const count = allocationCount(r.id);
          return (
            <Table.Row key={r.id} title={r.text}>
              <Table.Cell className="max-w-none">
                <Link
                  to="/programs/$programId/requirements/$requirementId"
                  params={{ programId, requirementId: r.id }}
                  className="hover:underline"
                >
                  <Id className="text-primary">{r.id}</Id>
                </Link>
              </Table.Cell>
              <Table.Cell className="truncate">{r.type}</Table.Cell>
              <Table.Cell className="truncate">{r.text}</Table.Cell>
              <Table.Cell>
                {direct ? (
                  "Direct"
                ) : (
                  <span className="flex items-center gap-1" title={`Inherited from ${r.parent}`}>
                    <ArrowRight className="size-3 shrink-0" />
                    <Id className="text-muted-foreground">{r.parent}</Id>
                  </span>
                )}
              </Table.Cell>
              <Table.Cell className="tnum text-right">
                {count === 0 ? <span className="text-muted-foreground">—</span> : count}
              </Table.Cell>
              <Table.Cell>
                <Badge size="xs" tone={requirementStateTone[r.state]}>
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
