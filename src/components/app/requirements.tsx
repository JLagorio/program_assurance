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

import { Badge, Box, Editable, Id, Inline, Stack, Table, TextLink } from "@ledger/design-system";
import { ControlHover, ElementHover, RequirementHover } from "@/components/app/glances";
import { SuspectFlag } from "@/components/app/link-currency";
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
      <Badge size="xsmall" tone={derivationSourceTone[first.sourceType]}>
        {first.sourceId}
      </Badge>
      {rest.length ? (
        <span className="shrink-0 font-body-xsmall text-subtle">+{rest.length}</span>
      ) : null}
    </Inline>
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
    <Table className="pt-050">
      <thead>
        <Table.Row>
          <Table.Header width={112}>Requirement</Table.Header>
          <Table.Header width={104}>Type</Table.Header>
          <Table.Header>Shall statement</Table.Header>
          <Table.Header width={104}>Derives from</Table.Header>
          <Table.Header width={72} className="text-right">
            Alloc
          </Table.Header>
          <Table.Header width={104}>Method</Table.Header>
          <Table.Header width={116}>Owner</Table.Header>
          <Table.Header width={150}>State</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        {rows.map(({ requirement, depth }) => {
          const count = allocationCount(requirement.id);
          return (
            <Table.Row
              key={requirement.id}
              className={cn(selected === requirement.id && "bg-selected")}
              title={requirement.text}
            >
              <Table.Cell className="max-w-none">
                <span style={{ paddingLeft: `${depth * 12}px` }}>
                  <RequirementHover requirementId={requirement.id}>
                    <TextLink>
                      <Link
                        to="/programs/$programId/requirements/$requirementId"
                        params={{ programId, requirementId: requirement.id }}
                      >
                        <Id>{requirement.id}</Id>
                      </Link>
                    </TextLink>
                  </RequirementHover>
                </span>
              </Table.Cell>
              <Table.Cell className="truncate">{requirement.type}</Table.Cell>
              <Table.Cell className="truncate">{requirement.text}</Table.Cell>
              <Table.Cell className="truncate">
                <SourceCell derivations={requirement.derivations} />
              </Table.Cell>
              <Table.Cell className="tabular-nums text-right">
                {count === 0 ? <span className="text-subtle">—</span> : count}
              </Table.Cell>
              <Table.Cell className="truncate">{requirement.method}</Table.Cell>
              <Table.Cell className="truncate">{requirement.owner}</Table.Cell>
              <Table.Cell>
                <Badge size="xsmall" tone={requirementStateTone[requirement.state]}>
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
  requirementId,
}: {
  derivations: Derivation[];
  programId: string;
  /** When given, each source row carries its currency flag. */
  requirementId?: string | undefined;
}) {
  if (derivations.length === 0) {
    return <p className="pt-150 font-body text-danger">No provenance recorded.</p>;
  }

  return (
    <Table className="pt-050">
      <thead>
        <Table.Row>
          <Table.Header width={150}>Source type</Table.Header>
          <Table.Header width={150}>Source</Table.Header>
          <Table.Header width={260}>Name</Table.Header>
          <Table.Header>Why it produces this requirement</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        {derivations.map((d) => (
          <Table.Row key={`${d.sourceType}-${d.sourceId}`}>
            <Table.Cell className="align-top py-100">
              <Badge size="xsmall" tone={derivationSourceTone[d.sourceType]}>
                {d.sourceType}
              </Badge>
            </Table.Cell>
            <Table.Cell className="align-top py-100">
              <Stack as="span" space="space.025">
                <SourceLink derivation={d} programId={programId} />
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

function SourceLink({ derivation, programId }: { derivation: Derivation; programId: string }) {
  const { sourceType, sourceId } = derivation;

  if (sourceType === "Control statement" || sourceType === "Overlay") {
    return (
      <ControlHover controlId={sourceId} programId={programId}>
        <TextLink>
          <Link
            to="/programs/$programId/controls/$controlId"
            params={{ programId, controlId: sourceId }}
            search={{ tab: undefined }}
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
    return <p className="pt-150 font-body text-subtle">Not allocated.</p>;
  }

  return (
    <Table className="pt-050">
      <thead>
        <Table.Row>
          <Table.Header width={230}>Allocated to</Table.Header>
          <Table.Header width={88}>Kind</Table.Header>
          <Table.Header width={112}>Responsibility</Table.Header>
          <Table.Header width={92}>Coverage</Table.Header>
          <Table.Header>Scope of the claim</Table.Header>
          <Table.Header width={124}>Owner</Table.Header>
          <Table.Header width={150}>State</Table.Header>
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
                    <Badge size="xsmall" tone={responsibilityTone[v]}>
                      {v}
                    </Badge>
                  )}
                />
              ) : (
                <Badge size="xsmall" tone={responsibilityTone[a.responsibility]}>
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
                    <Badge size="xsmall" tone={coverageTone[v]}>
                      {v}
                    </Badge>
                  )}
                />
              ) : (
                <Badge size="xsmall" tone={coverageTone[a.coverage]}>
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
              <Stack as="span" space="space.025">
                {editable ? (
                  <Editable.Select
                    label="State"
                    options={allocationStates}
                    value={a.state}
                    onChange={(next) => setAllocationField(a.id, { state: next })}
                    save={(next) => saveRequirementField(`${a.id} state`, next)}
                    render={(v) => (
                      <Badge size="xsmall" tone={allocationStateTone[v]}>
                        {v}
                      </Badge>
                    )}
                  />
                ) : (
                  <Badge size="xsmall" tone={allocationStateTone[a.state]}>
                    {a.state}
                  </Badge>
                )}
                <SuspectFlag
                  link={{ kind: "allocation", id: a.id }}
                  name={`${a.requirement} on ${resolveTarget(a).name}`}
                />
              </Stack>
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
          <Table.Header width={260}>Scope of the claim</Table.Header>
          <Table.Header width={124}>Owner</Table.Header>
          <Table.Header width={150}>State</Table.Header>
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
                <Badge size="xsmall" tone={responsibilityTone[a.responsibility]}>
                  {a.responsibility}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Badge size="xsmall" tone={coverageTone[a.coverage]}>
                  {a.coverage}
                </Badge>
              </Table.Cell>
              <Table.Cell className="truncate" title={a.scope}>
                {a.scope}
              </Table.Cell>
              <Table.Cell className="truncate">{a.owner}</Table.Cell>
              <Table.Cell>
                <Stack as="span" space="space.025">
                  <Badge size="xsmall" tone={allocationStateTone[a.state]}>
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
            search={{ tab: undefined }}
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
        <Badge size="xsmall" tone={responsibilityTone[hop.allocation.responsibility]}>
          {hop.allocation.responsibility}
        </Badge>
      </Table.Cell>
      <Table.Cell>
        <Badge size="xsmall" tone={coverageTone[hop.allocation.coverage]}>
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
      <p className="pt-150 font-body text-subtle">
        No security requirement derived from this control yet.
      </p>
    );
  }

  return (
    <Table className="pt-050">
      <thead>
        <Table.Row>
          <Table.Header width={112}>Requirement</Table.Header>
          <Table.Header width={104}>Type</Table.Header>
          <Table.Header>Shall statement</Table.Header>
          <Table.Header width={112}>Path</Table.Header>
          <Table.Header width={72} className="text-right">
            Alloc
          </Table.Header>
          <Table.Header width={150}>State</Table.Header>
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
              </Table.Cell>
              <Table.Cell className="truncate">{r.type}</Table.Cell>
              <Table.Cell className="truncate">{r.text}</Table.Cell>
              <Table.Cell>
                {direct ? (
                  "Direct"
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
                <Badge size="xsmall" tone={requirementStateTone[r.state]}>
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
