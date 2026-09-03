/**
 * One preview body per record type at the glance density, and the hover that
 * shows it. Hover on an id or a name is a glance: facts only, no actions. The
 * click is the peek and the footer link there is the record. Three record
 * types, one Glance each; the kit's HoverCard is the shell.
 */

import type { ReactNode } from "react";

import { Badge, Glance, HoverCard, Indicator } from "@ledger/design-system";
import { descendantsOf, nodeById, pathLabel } from "@/lib/composition";
import { workIndex } from "@/lib/control-board";
import { controlById, inForceRevision, openRevision, revisionTone } from "@/lib/control-set";
import { positionOf } from "@/lib/control-work";
import { coverageOf, coverageWord } from "@/lib/requirement-verification";
import {
  allocationsFor,
  allocationsOn,
  requirementById,
  requirementStateTone,
  requirementsForControl,
  resolveRequirement,
} from "@/lib/requirements";
import { rollupControlSet, scopesForProgram } from "@/lib/scopes";

export function ElementGlance({ nodeId }: { nodeId: string }) {
  const node = nodeById.get(nodeId);
  if (!node) return null;
  const scope = scopesForProgram(node.program).find((s) => s.element === node.id) ?? null;
  const open = scope ? openRevision(scope.id) : null;
  const inForce = scope ? inForceRevision(scope.id) : null;
  const subtree = [node, ...descendantsOf(node.id)];
  const requirements = new Set(
    subtree.flatMap((n) => allocationsOn(n.id).map((a) => a.requirement)),
  );
  return (
    <Glance
      id={node.id}
      title={node.name}
      meta={`${node.kind} · ${pathLabel(node.id)}`}
      status={
        open ? (
          <Indicator tone={revisionTone[open.state]}>
            v{open.number} {open.state.toLowerCase()}
          </Indicator>
        ) : inForce ? (
          <Indicator tone="success">v{inForce.number} in force</Indicator>
        ) : undefined
      }
      facts={[
        { label: "Class", value: node.class },
        { label: "Zone", value: node.zone },
        { label: "Criticality", value: node.criticality },
        { label: "Requirements", value: requirements.size || "—" },
      ]}
    />
  );
}

export function RequirementGlance({ requirementId }: { requirementId: string }) {
  const seed = requirementById.get(requirementId);
  if (!seed) return null;
  const r = resolveRequirement(seed);
  const carriers = allocationsFor(r.id).length;
  return (
    <Glance
      id={r.id}
      title={r.text}
      meta={`${r.type} · revision ${r.revision}`}
      status={
        <Badge size="xsmall" tone={requirementStateTone[r.state]}>
          {r.state}
        </Badge>
      }
      facts={[
        { label: "Owner", value: r.owner },
        { label: "Method", value: r.method },
        {
          label: "Carried by",
          value: carriers ? `${carriers} ${carriers === 1 ? "element" : "elements"}` : "—",
        },
        { label: "Verification", value: coverageWord(coverageOf(r)) },
      ]}
    />
  );
}

export function ControlGlance({ controlId, programId }: { controlId: string; programId: string }) {
  const control = controlById(controlId);
  if (!control) return null;
  const work = workIndex(programId).get(controlId) ?? null;
  const position = work ? positionOf(work) : "Unassigned";
  const rollup = rollupControlSet(programId);
  const scopes = rollup.controls.find((c) => c.control.id === controlId)?.scopes.length ?? 0;
  const requirements = requirementsForControl(controlId, programId).length;
  return (
    <Glance
      id={control.id}
      title={control.parentTitle ? `${control.parentTitle} · ${control.title}` : control.title}
      meta={control.family}
      status={
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
      }
      facts={[
        { label: "Owner", value: work?.owner || "—" },
        { label: "Requirements", value: requirements || "—" },
        { label: "Scopes", value: `${scopes} of ${rollup.scopes.length}` },
      ]}
    />
  );
}

/* The hovers. The child is the trigger: a TextLink around a Link, or a focusable span. */

export function ElementHover({ nodeId, children }: { nodeId: string; children: ReactNode }) {
  return (
    <HoverCard content={<ElementGlance nodeId={nodeId} />} width={300}>
      {children}
    </HoverCard>
  );
}

export function RequirementHover({
  requirementId,
  children,
}: {
  requirementId: string;
  children: ReactNode;
}) {
  return (
    <HoverCard content={<RequirementGlance requirementId={requirementId} />} width={300}>
      {children}
    </HoverCard>
  );
}

export function ControlHover({
  controlId,
  programId,
  children,
}: {
  controlId: string;
  programId: string;
  children: ReactNode;
}) {
  return (
    <HoverCard content={<ControlGlance controlId={controlId} programId={programId} />} width={300}>
      {children}
    </HoverCard>
  );
}
