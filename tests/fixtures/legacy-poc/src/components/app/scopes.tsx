import {
  currentRevision,
  openRevision,
  revisionTone,
  useControlSetVersion,
} from "@/lib/control-set";
import { controlSetFor, type AssessmentScope, type ProgramRollup } from "@/lib/scopes";

import { Button, Indicator, Item, Section } from "@ledger/design-system";
import { Link } from "@tanstack/react-router";

import { SystemTree } from "./system-tree";

export function ScopeTable({
  programId,
  elementId,
}: {
  scopes: AssessmentScope[];
  rollup: ProgramRollup;
  programId: string;
  elementId?: string | undefined;
}) {
  return <SystemTree programId={programId} elementId={elementId} />;
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
