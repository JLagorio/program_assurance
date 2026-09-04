/**
 * The preview sheet for one element of the system: what a reader gets when
 * they click a row of the tree. Everything related, in one panel, with the
 * full record one click away. The peek-panel pattern (Jira issue peek, Linear
 * side peek, Salesforce record preview): the list keeps its place, the panel
 * carries the actions that make sense without leaving. The stack of frames lives
 * in the route's `?peek=` search param (usePeekStack): a row clicked in the tree
 * opens a stack of one, a part clicked inside pushes a frame, the chevron and the
 * browser's back pop it, close drops it all.
 */

import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import {
  Absent,
  Badge,
  Block,
  Button,
  Glance,
  Id,
  Indicator,
  Inline,
  KeyValue,
  PreviewSheet,
  Stack,
  Table,
  Text,
  TextLink,
} from "@ledger/design-system";

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
import { usePeekStack } from "@/lib/peek";
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
}: {
  programId: string;
  /** The row the tree clicked; it becomes the stack's first frame. */
  nodeId: string | null;
  onClose: () => void;
  /** Unused: the sheet keeps its own stack in the URL. Kept so callers that pass it still compile. */
  onSelect?: ((nodeId: string) => void) | undefined;
}) {
  useScopesVersion();
  useControlSetVersion();
  useRequirementsVersion();
  useWorkVersion();
  const [allocating, setAllocating] = useState(false);
  const peek = usePeekStack();

  // The tree owns the first frame in its state; the URL owns the stack. A new row from the tree starts a
  // fresh stack; the stack emptying under a still-set row means the browser's back closed the sheet.
  const prevNode = useRef(nodeId);
  const prevDepth = useRef(peek.stack.length);
  useEffect(() => {
    const changed = nodeId !== prevNode.current;
    const emptied = prevDepth.current > 0 && peek.stack.length === 0;
    prevNode.current = nodeId;
    prevDepth.current = peek.stack.length;
    if (changed && nodeId && nodeId !== peek.current) peek.open(nodeId);
    else if (emptied && nodeId && !changed) onClose();
  }, [nodeId, peek, onClose]);
  const close = () => {
    peek.close();
    onClose();
  };

  const current = peek.current ?? nodeId;
  const node = current ? (nodeById.get(current) ?? null) : null;
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
    <PreviewSheet
      open={node !== null}
      onClose={close}
      onBack={peek.stack.length > 1 ? peek.back : undefined}
      width={760}
      id={node?.id ?? ""}
      title={node?.name ?? ""}
      subtitle={node ? `${node.kind} · ${pathLabel(node.id)}` : undefined}
      openTo={
        <Link
          to="/programs/$programId/components/$componentId"
          params={{ programId, componentId: node?.id ?? "" }}
        />
      }
      links={
        scope && node ? (
          <TextLink>
            <Link
              to="/programs/$programId/components/$componentId"
              params={{ programId, componentId: node.id }}
              search={{ tab: "Control set" }}
            >
              Control set and revisions
            </Link>
          </TextLink>
        ) : null
      }
      actions={open ? <RevisionActions revision={open} /> : null}
    >
      {node ? (
        <Stack space="space.050">
          <Block title="Element">
            <Glance density="peek">
              <KeyValue label="Class">{node.class}</KeyValue>
              <KeyValue label="Zone">{node.zone}</KeyValue>
              <KeyValue label="Criticality">{node.criticality}</KeyValue>
              <KeyValue label="Supplier">
                {node.supplier}
                {node.version !== "—" ? ` · ${node.version}` : ""}
              </KeyValue>
              <KeyValue label="Attested">{node.attested ? "Yes" : "No"}</KeyValue>
            </Glance>
            {node.note ? (
              <Text as="p" size="small" color="color.text.subtle" className="pt-100">
                {node.note}
              </Text>
            ) : null}
          </Block>

          {scope && triad && set ? (
            <Block
              title="Control set"
              count={inForce ? `v${inForce.number} in force · ${set.total} controls` : "none yet"}
              action={open ? null : <ProposeChange scopeId={scope.id} />}
            >
              <Inline
                className="font-body-small"
                space="space.250"
                rowSpace="space.050"
                alignBlock="center"
                shouldWrap
              >
                {objectives.map((o) => (
                  <Inline key={o} as="span" space="space.075" alignBlock="center">
                    {o}
                    <Badge size="xsmall" tone={impactTone[triad[o]]}>
                      {triad[o]}
                    </Badge>
                  </Inline>
                ))}
                <Text color="color.text.subtle">
                  {scope.parameters.systemClass} · {scope.parameters.hosting} ·{" "}
                  {scope.parameters.classification}
                </Text>
              </Inline>
              <Text as="p" size="small" color="color.text.subtle" className="pt-100">
                Overlays: {set.overlays.map((o) => o.name).join(", ") || "none"}.
              </Text>
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
              <Table>
                <thead>
                  <Table.Row>
                    <Table.Header width={96}>Requirement</Table.Header>
                    <Table.Header>Shall statement</Table.Header>
                    <Table.Header width={150}>On</Table.Header>
                    <Table.Header width={110}>Role</Table.Header>
                    <Table.Header width={104}>State</Table.Header>
                  </Table.Row>
                </thead>
                <tbody>
                  {allocations.map((a) => {
                    const req = requirementById.get(a.requirement);
                    const on = nodeById.get(a.target);
                    return (
                      <Table.Row key={a.id}>
                        <Table.Cell className="max-w-none">
                          <TextLink>
                            <Link
                              to="/programs/$programId/requirements/$requirementId"
                              params={{ programId, requirementId: a.requirement }}
                            >
                              <Id>{a.requirement}</Id>
                            </Link>
                          </TextLink>
                        </Table.Cell>
                        <Table.Cell className="truncate" title={req?.text}>
                          {req?.text ?? "—"}
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          {a.target === node.id ? (
                            "This element"
                          ) : (
                            <Button
                              variant="link"
                              className="truncate"
                              onClick={() => peek.push(a.target)}
                            >
                              {on?.name ?? a.target}
                            </Button>
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
              <Text as="p" size="small" color="color.text.subtle">
                Nothing is allocated to this element or its parts.
              </Text>
            )}
          </Block>

          {!scope ? (
            <Block title="Controls reached" count={reached.size}>
              {reached.size ? (
                <Table>
                  <thead>
                    <Table.Row>
                      <Table.Header width={96}>Control</Table.Header>
                      <Table.Header>Title</Table.Header>
                      <Table.Header width={150}>Through</Table.Header>
                      <Table.Header width={150}>Work</Table.Header>
                    </Table.Row>
                  </thead>
                  <tbody>
                    {[...reached.entries()].slice(0, 20).map(([control, via]) => {
                      const work = index.get(control) ?? null;
                      const position = work ? positionOf(work) : "Unassigned";
                      return (
                        <Table.Row key={control}>
                          <Table.Cell className="max-w-none">
                            <TextLink>
                              <Link
                                to="/programs/$programId/controls/$controlId"
                                params={{ programId, controlId: control }}
                                search={{ tab: undefined }}
                              >
                                <Id>{control}</Id>
                              </Link>
                            </TextLink>
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
                <Text as="p" size="small" color="color.text.subtle">
                  No requirement on this element names a control yet.
                </Text>
              )}
              {reached.size > 20 ? (
                <Text as="p" size="small" color="color.text.subtle" className="pt-100">
                  First 20 of {reached.size}.
                </Text>
              ) : null}
            </Block>
          ) : null}

          {parts.length ? (
            <Block title="Contains" count={parts.length}>
              <Table>
                <thead>
                  <Table.Row>
                    <Table.Header>Part</Table.Header>
                    <Table.Header width={150}>Kind</Table.Header>
                    <Table.Header width={110} className="text-right">
                      Requirements
                    </Table.Header>
                    <Table.Header width={96} className="text-right">
                      Controls
                    </Table.Header>
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
                          <Button
                            variant="link"
                            className="truncate"
                            onClick={() => peek.push(child.id)}
                          >
                            {child.name}
                          </Button>
                        </Table.Cell>
                        <Table.Cell className="truncate">{child.kind}</Table.Cell>
                        <Table.Cell className="tabular-nums text-right">
                          {reqs.size || <Absent />}
                        </Table.Cell>
                        <Table.Cell className="tabular-nums text-right">
                          {ctrls.size || <Absent />}
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
        </Stack>
      ) : null}
    </PreviewSheet>
  );
}
