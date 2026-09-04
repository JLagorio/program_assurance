/**
 * The two composition pieces that make the program page actionable:
 *
 *   LifecycleBar — the program IS a state machine, so the stage lives in the
 *                  header as one dense line, not in the tab strip.
 *   NextActions  — a short owned/dated list derived from existing records.
 */

import { useState } from "react";
import { Check, ChevronRight, Lock } from "lucide-react";

import { Badge, Button, Dot, Id, Inline, Person, Section, Table } from "@ledger/design-system";
import { cn } from "@ledger/design-system/cn";
import type { ProgramState, Stage } from "@/lib/program-stage";
import { stages } from "@/lib/program-stage";
import type { NextAction, Posture } from "@/lib/program-actions";

export function LifecycleBar({
  state,
  selected,
  onSelect,
}: {
  state: ProgramState;
  selected: Stage | null;
  onSelect: (stage: Stage | null) => void;
}) {
  return (
    <Inline
      className="border-t border-default pt-100"
      space="space.300"
      rowSpace="space.100"
      alignBlock="center"
      shouldWrap
    >
      <Inline className="min-w-0" alignBlock="center">
        {stages.map((s, i) => {
          const status = state.stageStatus[s];
          const isSelected = selected === s;
          const blocked = status === "current" && state.blockerTone === "danger";
          return (
            <Inline key={s} space="space.075" alignBlock="center">
              {i > 0 ? (
                <span
                  className={cn(
                    "h-px",
                    status === "locked" ? "bg-neutral" : "bg-brand-subtlest",
                    "w-250",
                  )}
                />
              ) : null}
              <button
                onClick={() => onSelect(isSelected ? null : s)}
                aria-pressed={isSelected}
                className={cn(
                  "inline-flex items-center gap-075 rounded-full px-100 py-025 font-body-small transition-colors",
                  isSelected ? "bg-neutral text-default" : "hover:bg-neutral-subtle-hovered",
                  status === "locked" ? "text-subtle" : "text-default",
                  status === "current" ? "font-semibold" : "font-medium",
                )}
              >
                {status === "done" ? (
                  <Check className="text-success size-150" />
                ) : status === "current" ? (
                  <Dot tone={blocked ? "danger" : "information"} />
                ) : (
                  <span className="rounded-full border border-bold size-075" />
                )}
                {s}
              </button>
            </Inline>
          );
        })}
      </Inline>

      <Inline
        className="ml-auto font-body-small"
        space="space.200"
        rowSpace="space.050"
        alignBlock="center"
        shouldWrap
      >
        <Inline as="span" space="space.075" alignBlock="center">
          <Id className="text-subtle">{state.currentGate?.id ?? "—"}</Id>
          <span className="truncate">{state.currentGate?.name}</span>
        </Inline>
        {state.daysOut !== null ? (
          <span
            className={cn(
              "tabular-nums",
              state.daysOut < 0
                ? "font-medium text-danger"
                : state.daysOut < 30
                  ? "font-medium text-warning"
                  : "text-subtle",
            )}
          >
            {state.daysOut < 0 ? `${Math.abs(state.daysOut)}d overdue` : `${state.daysOut}d out`}
          </span>
        ) : null}
        {state.blocker ? (
          <Badge tone={state.blockerTone === "danger" ? "danger" : "warning"}>
            {state.blocker}
          </Badge>
        ) : (
          <span className="text-subtle">No blocker</span>
        )}
      </Inline>
    </Inline>
  );
}

export function PostureLine({
  posture,
  onJump,
}: {
  posture: Posture;
  onJump: (tab: "Controls" | "Findings" | "Evidence" | "POA&M") => void;
}) {
  const items: {
    label: string;
    value: string;
    tone?: "danger" | "warning" | undefined;
    tab: "Controls" | "Findings" | "Evidence" | "POA&M";
  }[] = [
    {
      label: "Controls satisfied",
      value: `${posture.controlsSatisfied}/${posture.controlsTotal}`,
      tab: "Controls",
    },
    {
      label: "Open findings",
      value: `${posture.findingsOpen}${posture.catI ? ` · ${posture.catI} CAT I` : ""}`,
      tone: posture.catI > 0 ? "danger" : undefined,
      tab: "Findings",
    },
    {
      label: "POA&M open",
      value: `${posture.poamOpen}${posture.poamOverdue ? ` · ${posture.poamOverdue} overdue` : ""}`,
      tone: posture.poamOverdue > 0 ? "danger" : undefined,
      tab: "POA&M",
    },
    {
      label: "Evidence stale",
      value: `${posture.evidenceStale}`,
      tone: posture.evidenceStale > 0 ? "warning" : undefined,
      tab: "Evidence",
    },
    {
      label: "Inherited",
      value: `${posture.inheritedControls}`,
      tab: "Controls",
    },
  ];

  return (
    <Inline
      className="font-body-small"
      space="space.300"
      rowSpace="space.075"
      alignBlock="center"
      shouldWrap
    >
      {items.map((i) => (
        <button
          key={i.label}
          onClick={() => onJump(i.tab)}
          className="flex items-baseline gap-075 rounded-small px-050 transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered"
        >
          <span className="text-subtle">{i.label}</span>
          <span
            className={cn(
              "tabular-nums font-medium",
              i.tone === "danger"
                ? "text-danger"
                : i.tone === "warning"
                  ? "text-warning"
                  : "text-default",
            )}
          >
            {i.value}
          </span>
        </button>
      ))}
    </Inline>
  );
}

export function OpenWorkSection({
  actions,
  onRun,
}: {
  actions: NextAction[];
  onRun: (action: NextAction) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? actions : actions.slice(0, 5);

  return (
    <Section
      title="Open work"
      action={
        <span className="tabular-nums font-body-small text-subtle">
          {actions.length} item{actions.length === 1 ? "" : "s"}
        </span>
      }
    >
      {actions.length === 0 ? (
        <p className="pt-150 font-body text-subtle">
          Nothing is waiting on this program right now.
        </p>
      ) : (
        <>
          <Table className="table-fixed">
            <tbody>
              {shown.map((a) => (
                <Table.Row key={a.id} onClick={() => onRun(a)} className="group cursor-pointer">
                  <Table.Cell width={24}>
                    <Dot tone={a.tone} />
                  </Table.Cell>
                  <Table.Cell className="truncate">{a.label}</Table.Cell>
                  <Table.Cell width={168}>
                    <Person name={a.owner} />
                  </Table.Cell>
                  <Table.Cell
                    className={cn(
                      "tabular-nums text-right",
                      a.tone === "danger" ? "text-danger" : "",
                    )}
                    width={110}
                  >
                    {a.due}
                  </Table.Cell>
                  <Table.Cell className="text-right" width={132}>
                    <Inline
                      className="font-body-small text-subtle opacity-0 transition-opacity group-hover:opacity-100"
                      as="span"
                      display="inline-flex"
                      space="space.050"
                      alignBlock="center"
                    >
                      {a.cta}
                      <ChevronRight className="size-icon-small" />
                    </Inline>
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
          {actions.length > 5 ? (
            <Button
              onClick={() => setExpanded((v) => !v)}
              variant="link"
              size="small"
              className="pt-100"
            >
              {expanded ? "Show less" : `Show ${actions.length - 5} more`}
            </Button>
          ) : null}
        </>
      )}
    </Section>
  );
}

export function LockedNotice({ stage, gate }: { stage: string; gate?: string | undefined }) {
  return (
    <Inline
      className="rounded-medium border border-dashed border-default px-150 py-100 font-body-small text-subtle"
      space="space.100"
      alignBlock="center"
    >
      <Lock className="size-icon-small" />
      Preview — {stage} work opens after {gate ?? "the current gate"}. Records here are read-only
      until then.
    </Inline>
  );
}
