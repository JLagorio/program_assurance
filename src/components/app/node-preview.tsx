/**
 * The preview sheet for one element of the system: what a reader gets when
 * they click a row of the tree. Everything related, in one panel, with the
 * full record one click away. The peek-panel pattern (Jira issue peek, Linear
 * side peek, Salesforce record preview): the list keeps its place, the panel
 * carries the actions that make sense without leaving.
 */

import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { Badge, Button, Id, Indicator, KeyValue, Sheet, Table } from "@ledger/design-system";
import { Block } from "@ledger/design-system";

import { ProposeChange, RevisionActions, RevisionReview } from "./control-set-revisions";
import { AllocateToNodeDialog } from "./system-tree";
import { childrenOf, descendantsOf, nodeById, pathLabel } from "@/lib/composition";
import { workIndex } from "@/lib/control-board";
import {
  controlById,
  inForceRevision,
  openRevision,
  useControlSetVersion,
} from "@/lib/control-set";
import { positionOf, useWorkVersion } from "@/lib/control-work";
import {
  allocationStateTone,
  allocationsOn,
  derivedControlTrace,
  requirementById,
  useRequirementsVersion,
} from "@/lib/requirements";
import {
  controlSetFor,
  objectives,
  scopesForProgram,
  triadOf,
  useScopesVersion,
} from "@/lib/scopes";

const impactTone = { Low: "neutral", Moderate: "warning", High: "danger" } as const;

export function NodePreviewSheet({
  programId,
  nodeId,
  onClose,
  onSelect,
}: {
  programId: string;
  nodeId: string | null;
  onClose: () => void;
  /** Drill into a child without leaving the sheet. */
  onSelect: (nodeId: string) => void;
}) {
  useScopesVersion();
  useControlSetVersion();
  useRequirementsVersion();
  useWorkVersion();
  const [allocating, setAllocating] = useState(false);

  const node = nodeId ? (nodeById.get(nodeId) ?? null) : null;
  const scope = node
    ? (scopesForProgram(programId).find((s) => s.element === node.id) ?? null)
    : null;
  const set = scope ? controlSetFor(scope.id) : null;
  const inForce = scope ? inForceRevision(scope.id) : null;
  const open = scope ? openRevision(scope.id) : null;
  const triad = scope ? triadOf(scope) : null;

  const subtree = node ? [node, ...descendantsOf(node.id)] : [];
  const allocations = subtree.flatMap((n) => allocationsOn(n.id));
  const reached = new Map<string, string>();
  for (const n of subtree) {
    for (const c of derivedControlTrace(n.id).controls) if (!reached.has(c)) reached.set(c, n.id);
  }
  const index = workIndex(programId);
  const parts = node ? childrenOf(node.id) : [];

  return (
    <Sheet
      open={node !== null}
      onClose={onClose}
      width={760}
      title={node?.name ?? ""}
      subtitle={node ? `${node.kind} · ${pathLabel(node.id)}` : undefined}
      footer={
        node ? (
          <div className="flex w-full items-center justify-between gap-150">
            <span className="flex items-center gap-200 font-body-small">
              <Link
                to="/programs/$programId/components/$componentId"
                params={{ programId, componentId: node.id }}
                className="text-brand hover:underline"
              >
                Open the full record
              </Link>
              {scope ? (
                <Link
                  to="/programs/$programId/systems/$scopeId"
                  params={{ programId, scopeId: scope.id }}
                  search={{ tab: "Control set" }}
                  className="text-brand hover:underline"
                >
                  Control set and revisions
                </Link>
              ) : null}
            </span>
            {open ? <RevisionActions revision={open} /> : null}
          </div>
        ) : null
      }
    >
      {node ? (
        <div className="space-y-050">
          <Block title="Element">
            <div className="grid grid-cols-2 gap-x-300 sm:grid-cols-3">
              <KeyValue label="Id">
                <Id>{node.id}</Id>
              </KeyValue>
              <KeyValue label="Class">{node.class}</KeyValue>
              <KeyValue label="Zone">{node.zone}</KeyValue>
              <KeyValue label="Criticality">{node.criticality}</KeyValue>
              <KeyValue label="Supplier">
                {node.supplier}
                {node.version !== "—" ? ` · ${node.version}` : ""}
              </KeyValue>
              <KeyValue label="Attested">{node.attested ? "Yes" : "No"}</KeyValue>
            </div>
            {node.note ? <p className="pt-100 font-body-small text-subtle">{node.note}</p> : null}
          </Block>

          {scope && triad && set ? (
            <Block
              title="Control set"
              count={inForce ? `v${inForce.number} in force · ${set.total} controls` : "none yet"}
              action={open ? null : <ProposeChange scopeId={scope.id} />}
            >
              <div className="flex flex-wrap items-center gap-x-250 gap-y-050 font-body-small">
                {objectives.map((o) => (
                  <span key={o} className="flex items-center gap-075">
                    {o}
                    <Badge size="xsmall" tone={impactTone[triad[o]]}>
                      {triad[o]}
                    </Badge>
                  </span>
                ))}
                <span className="text-subtle">
                  {scope.parameters.systemClass} · {scope.parameters.hosting} ·{" "}
                  {scope.parameters.classification}
                </span>
              </div>
              <p className="pt-100 font-body-small text-subtle">
                Overlays: {set.overlays.map((o) => o.name).join(", ") || "none"}.
              </p>
            </Block>
          ) : null}

          {open ? <RevisionReview revision={open} programId={programId} compact /> : null}

          <Block
            title="Requirements"
            count={allocations.length}
            action={
              <Button size="small" variant="secondary" onClick={() => setAllocating(true)}>
                Allocate
              </Button>
            }
          >
            {allocations.length ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "96px" }} />
                  <col />
                  <col style={{ width: "150px" }} />
                  <col style={{ width: "110px" }} />
                  <col style={{ width: "104px" }} />
                </colgroup>
                <thead>
                  <Table.Row>
                    <Table.Header>Requirement</Table.Header>
                    <Table.Header>Shall statement</Table.Header>
                    <Table.Header>On</Table.Header>
                    <Table.Header>Role</Table.Header>
                    <Table.Header>State</Table.Header>
                  </Table.Row>
                </thead>
                <tbody>
                  {allocations.map((a) => {
                    const req = requirementById.get(a.requirement);
                    const on = nodeById.get(a.target);
                    return (
                      <Table.Row key={a.id}>
                        <Table.Cell className="max-w-none">
                          <Link
                            to="/programs/$programId/requirements/$requirementId"
                            params={{ programId, requirementId: a.requirement }}
                            className="hover:underline"
                          >
                            <Id className="text-brand">{a.requirement}</Id>
                          </Link>
                        </Table.Cell>
                        <Table.Cell className="truncate" title={req?.text}>
                          {req?.text ?? "—"}
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          {a.target === node.id ? (
                            "This element"
                          ) : (
                            <button
                              type="button"
                              className="truncate text-brand hover:underline"
                              onClick={() => onSelect(a.target)}
                            >
                              {on?.name ?? a.target}
                            </button>
                          )}
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          {a.responsibility} · {a.coverage}
                        </Table.Cell>
                        <Table.Cell>
                          <Badge size="xsmall" tone={allocationStateTone[a.state]}>
                            {a.state}
                          </Badge>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </tbody>
              </Table>
            ) : (
              <p className="font-body-small text-subtle">
                Nothing is allocated to this element or its parts.
              </p>
            )}
          </Block>

          {!scope ? (
            <Block title="Controls reached" count={reached.size}>
              {reached.size ? (
                <Table className="table-fixed">
                  <colgroup>
                    <col style={{ width: "96px" }} />
                    <col />
                    <col style={{ width: "150px" }} />
                    <col style={{ width: "150px" }} />
                  </colgroup>
                  <thead>
                    <Table.Row>
                      <Table.Header>Control</Table.Header>
                      <Table.Header>Title</Table.Header>
                      <Table.Header>Through</Table.Header>
                      <Table.Header>Work</Table.Header>
                    </Table.Row>
                  </thead>
                  <tbody>
                    {[...reached.entries()].slice(0, 20).map(([control, via]) => {
                      const work = index.get(control) ?? null;
                      const position = work ? positionOf(work) : "Unassigned";
                      return (
                        <Table.Row key={control}>
                          <Table.Cell className="max-w-none">
                            <Link
                              to="/programs/$programId/controls/$controlId"
                              params={{ programId, controlId: control }}
                              search={{ tab: undefined }}
                              className="hover:underline"
                            >
                              <Id className="text-brand">{control}</Id>
                            </Link>
                          </Table.Cell>
                          <Table.Cell className="truncate">
                            {controlById(control)?.title ?? "—"}
                          </Table.Cell>
                          <Table.Cell className="truncate">
                            {via === node.id ? "Here" : (nodeById.get(via)?.name ?? via)}
                          </Table.Cell>
                          <Table.Cell>
                            <Indicator
                              tone={
                                position === "Satisfied"
                                  ? "success"
                                  : position === "Unassigned"
                                    ? "neutral"
                                    : "information"
                              }
                            >
                              {position}
                            </Indicator>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </tbody>
                </Table>
              ) : (
                <p className="font-body-small text-subtle">
                  No requirement on this element names a control yet.
                </p>
              )}
              {reached.size > 20 ? (
                <p className="pt-100 font-body-small text-subtle">First 20 of {reached.size}.</p>
              ) : null}
            </Block>
          ) : null}

          {parts.length ? (
            <Block title="Contains" count={parts.length}>
              <Table className="table-fixed">
                <colgroup>
                  <col />
                  <col style={{ width: "150px" }} />
                  <col style={{ width: "110px" }} />
                  <col style={{ width: "96px" }} />
                </colgroup>
                <thead>
                  <Table.Row>
                    <Table.Header>Part</Table.Header>
                    <Table.Header>Kind</Table.Header>
                    <Table.Header className="text-right">Requirements</Table.Header>
                    <Table.Header className="text-right">Controls</Table.Header>
                  </Table.Row>
                </thead>
                <tbody>
                  {parts.map((child) => {
                    const sub = [child, ...descendantsOf(child.id)];
                    const reqs = new Set(
                      sub.flatMap((n) => allocationsOn(n.id).map((a) => a.requirement)),
                    );
                    const ctrls = new Set(sub.flatMap((n) => derivedControlTrace(n.id).controls));
                    return (
                      <Table.Row key={child.id}>
                        <Table.Cell className="max-w-none">
                          <button
                            type="button"
                            className="truncate text-brand hover:underline"
                            onClick={() => onSelect(child.id)}
                          >
                            {child.name}
                          </button>
                        </Table.Cell>
                        <Table.Cell className="truncate">{child.kind}</Table.Cell>
                        <Table.Cell className="tabular-nums text-right">
                          {reqs.size || <span className="text-subtle">—</span>}
                        </Table.Cell>
                        <Table.Cell className="tabular-nums text-right">
                          {ctrls.size || <span className="text-subtle">—</span>}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </tbody>
              </Table>
            </Block>
          ) : null}

          {allocating ? (
            <AllocateToNodeDialog
              programId={programId}
              node={node}
              onClose={() => setAllocating(false)}
            />
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}
