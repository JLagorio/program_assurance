/**
 * The systems view: every assessment scope inside one authorization boundary,
 * what each one's categorization actually costs it in controls, and where its
 * control set stands. A subsystem is added here: it becomes a node in the
 * composition tree, a scope with its own categorization, and a first
 * control-set revision.
 */

import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Badge,
  Box,
  Button,
  Combobox,
  Field,
  Id,
  Indicator,
  Inline,
  Input,
  Item,
  Section,
  Select,
  Sheet,
  Stack,
  Table,
  Textarea,
  toast,
} from "@ledger/design-system";
import { addCompositionNodes, nextNodeId, nodesForProgram } from "@/lib/composition";
import {
  createInitialRevision,
  currentRevision,
  initialOverlayDecisions,
  openRevision,
  revisionTone,
  useControlSetVersion,
} from "@/lib/control-set";
import { addScopes, controlSetFor, objectives, triadOf } from "@/lib/scopes";
import type { AssessmentScope, ProgramRollup } from "@/lib/scopes";

import { SystemTree } from "./system-tree";

const impactTone = { Low: "neutral", Moderate: "warning", High: "danger" } as const;

const people = ["Grace Hoppel", "Marcus Ryde", "Dana Whitlock", "Priya Raghavan", "Sarah Chen"];

export function ScopeTable({
  scopes,
  rollup,
  programId,
}: {
  scopes: AssessmentScope[];
  rollup: ProgramRollup;
  programId: string;
}) {
  useControlSetVersion();
  return (
    <Stack space="space.200">
      <SystemTree programId={programId} />
      <Box
        className="rounded-large border border-default"
        paddingInline="space.200"
        paddingBlock="space.150"
      >
        <p className="font-body-small">
          <span className="font-medium">
            {rollup.total} controls in the program set — the union of {scopes.length} scopes, not
            the highest of them.
          </span>{" "}
          <span className="text-subtle">
            {rollup.singleScope} are required by exactly one scope. CNSSI 1253 selects per objective
            and never collapses the triad, so a scope at A=Low sheds contingency obligations while
            keeping every confidentiality control at High.
          </span>
        </p>
      </Box>
    </Stack>
  );
}

/* ---------------------------------------------------- Controls tab pointer */

/** On the program's Controls tab: where each scope's control set stands, and the one place it changes. */
export function ControlSetsSummary({
  scopes,
  onOpen,
}: {
  scopes: AssessmentScope[];
  onOpen: () => void;
}) {
  useControlSetVersion();
  const open = scopes.filter((s) => openRevision(s.id)).length;
  return (
    <Section
      title="Control sets"
      description="Each scope's categorization, overlays and tailoring are frozen as a numbered revision. A change is proposed, reviewed and approved on the Systems tab; nothing here is edited in place."
      action={
        <Button size="small" variant="secondary" onClick={onOpen}>
          {open ? `Review ${open} open change${open === 1 ? "" : "s"}` : "Open Systems"}
        </Button>
      }
    >
      <Item.Group className="pt-050">
        {scopes.map((s) => {
          const rev = currentRevision(s.id);
          const set = controlSetFor(s.id);
          return (
            <Item
              key={s.id}
              title={s.name}
              meta={`${set?.total ?? 0} controls`}
              trailing={
                rev ? (
                  <Indicator tone={revisionTone[rev.state]}>
                    v{rev.number} · {rev.state}
                  </Indicator>
                ) : undefined
              }
              link={
                <Link
                  to="/programs/$programId/components/$componentId"
                  params={{ programId: s.program, componentId: s.element }}
                  search={{ tab: "Control set" }}
                />
              }
            />
          );
        })}
      </Item.Group>
    </Section>
  );
}
