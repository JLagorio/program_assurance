import { Link } from "@tanstack/react-router";
import { useState } from "react";

import {
  Absent,
  Badge,
  Block,
  Button,
  Fact,
  Grid,
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

import {
  childrenOf,
  descendantsOf,
  nodeById,
  pathLabel,
  useCompositionGraph,
  type CompositionNode,
} from "@/lib/composition";
import { workIndex } from "@/lib/control-board";
import {
  controlById,
  inForceRevision,
  openRevision,
  revisionTone,
  useControlSetVersion,
} from "@/lib/control-set";
import { positionOf, useWorkVersion } from "@/lib/control-work";
import { programControlRows } from "@/lib/program-controls";
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
import { AllocateRequirementsSheet } from "./allocate-picker";
import { ProposeChange, RevisionActions, RevisionReview } from "./control-set-revisions";
import { ControlHover, RequirementHover } from "./glances";

const impactTone = { Low: "neutral", Moderate: "warning", High: "danger" } as const;

export function NodePreviewSheet({
  programId,
  nodeId,
  onClose,
  onSelect,
  onBack,
  onEdit,
  onMove,
}: {
  programId: string;
  nodeId: string | null;
  onClose: () => void;
  /** Drill into a child without leaving the sheet: the next frame of the stack. */
  onSelect: (nodeId: string) => void;
  /** Back to the frame before, when there is one. */
  onBack?: (() => void) | undefined;
  onEdit?: ((node: CompositionNode) => void) | undefined;
  onMove?: ((node: CompositionNode) => void) | undefined;
}) {
  const nodes = useCompositionGraph(programId);
  useScopesVersion();
  useControlSetVersion();
  useRequirementsVersion();
  useWorkVersion();
  const [allocating, setAllocating] = useState(false);

  const node = nodes.find((item) => item.id === nodeId) ?? null;
  const scope = node
    ? (scopesForProgram(programId).find((s) => s.element === node.id) ?? null)
    : null;
  const set = scope ? controlSetFor(scope.id) : null;
  const inForce = scope ? inForceRevision(scope.id) : null;
  const open = scope ? openRevision(scope.id) : null;
  const triad = scope ? triadOf(scope) : null;

  const subtree = node ? [node, ...descendantsOf(node.id)] : [];
  const allocations = subtree.flatMap((n) => allocationsOn(n.id));
  const allocatedRequirements = new Set(allocations.map((allocation) => allocation.requirement));
  const applicableControls = node ? programControlRows(programId, node.id).length : 0;
  const reached = new Map<string, string>();
  for (const n of subtree) {
    for (const c of derivedControlTrace(n.id).controls) if (!reached.has(c)) reached.set(c, n.id);
  }
  const index = workIndex(programId);
  const parts = node ? childrenOf(node.id) : [];

  return (
    <PreviewSheet
      open={node !== null}
      onClose={onClose}
      onBack={onBack}
      width={760}
      id={node?.id ?? ""}
      title={node?.name ?? ""}
      subtitle={node ? `${node.kind} · ${pathLabel(node.id)}` : undefined}
      status={
        open ? (
          <Indicator tone={revisionTone[open.state]}>
            v{open.number} {open.state.toLowerCase()}
          </Indicator>
        ) : inForce ? (
          <Indicator tone="success">v{inForce.number} in force</Indicator>
        ) : undefined
      }
      facts={
        node ? (
          <>
            <Fact label="Class">{node.class}</Fact>
            <Fact label="Zone">{node.zone}</Fact>
            <Fact label="Criticality">{node.criticality}</Fact>
          </>
        ) : undefined
      }
      openTo={
        <Link
          to="/programs/$programId/components/$componentId"
          params={{ programId, componentId: node?.id ?? "" }}
        />
      }
      links={
        scope && node ? (
          <TextLink
            render={
              <Link
                to="/programs/$programId/components/$componentId"
                params={{ programId, componentId: node.id }}
                search={{ tab: "Control set" }}
              />
            }
          >
            Control set and revisions
          </TextLink>
        ) : null
      }
      actions={
        node ? (
          <Inline space="space.100" alignBlock="center" shouldWrap>
            {onEdit ? (
              <Button size="small" variant="secondary" onClick={() => onEdit(node)}>
                Edit
              </Button>
            ) : null}
            {onMove && node.parent ? (
              <Button size="small" variant="secondary" onClick={() => onMove(node)}>
                Move
              </Button>
            ) : null}
            {open ? <RevisionActions revision={open} /> : null}
          </Inline>
        ) : null
      }
    >
      {node ? (
        <Stack space="space.050">
          <Block title="Element">
            <Grid
              as="dl"
              columnGap="space.300"
              templateColumns={{ base: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" }}
            >
              <KeyValue label="Supplier">
                {node.supplier}
                {node.version !== "—" ? ` · ${node.version}` : ""}
              </KeyValue>
              <KeyValue label="Attested">{node.attested ? "Yes" : "No"}</KeyValue>
            </Grid>
            {node.note ? (
              <Text as="p" size="small" color="color.text.subtle" className="pt-100">
                {node.note}
              </Text>
            ) : null}
          </Block>

          <Inline space="space.200" alignBlock="center" shouldWrap className="py-100">
            <TextLink
              render={
                <Link
                  to="/programs/$programId"
                  params={{ programId }}
                  search={(previous) => ({
                    ...previous,
                    tab: "Controls",
                    element: node.id,
                    peek: undefined,
                  })}
                />
              }
            >
              View applicable controls ({applicableControls})
            </TextLink>
            <TextLink
              render={
                <Link
                  to="/programs/$programId"
                  params={{ programId }}
                  search={(previous) => ({
                    ...previous,
                    tab: "Requirements",
                    element: node.id,
                    peek: undefined,
                  })}
                />
              }
            >
              View allocated requirements ({allocatedRequirements.size})
            </TextLink>
          </Inline>

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
                    <Badge variant="secondary" size="xsmall" tone={impactTone[triad[o]]}>
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
            title="Allocated requirements"
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
                          <RequirementHover requirementId={a.requirement}>
                            <TextLink
                              render={
                                <Link
                                  to="/programs/$programId/requirements/$requirementId"
                                  params={{ programId, requirementId: a.requirement }}
                                />
                              }
                            >
                              <Id>{a.requirement}</Id>
                            </TextLink>
                          </RequirementHover>
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
                              onClick={() => onSelect(a.target)}
                            >
                              {on?.name ?? a.target}
                            </Button>
                          )}
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          {a.responsibility} · {a.coverage}
                        </Table.Cell>
                        <Table.Cell>
                          <Badge
                            variant="secondary"
                            size="xsmall"
                            tone={allocationStateTone[a.state]}
                          >
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
            <Block title="Controls linked through requirements" count={reached.size}>
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
                            <ControlHover controlId={control} programId={programId}>
                              <TextLink
                                render={
                                  <Link
                                    to="/programs/$programId/controls/$controlId"
                                    params={{ programId, controlId: control }}
                                    search={{ tab: undefined }}
                                  />
                                }
                              >
                                <Id>{control}</Id>
                              </TextLink>
                            </ControlHover>
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
                      Allocated requirements
                    </Table.Header>
                    <Table.Header width={96} className="text-right">
                      Linked controls
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
                            onClick={() => onSelect(child.id)}
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
            <AllocateRequirementsSheet
              open
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
