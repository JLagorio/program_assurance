/**
 * The two composition pieces that make the program page actionable:
 *
 *   LifecycleBar — the program IS a state machine, so the stage lives in the
 *                  header as one dense line, not in the tab strip.
 *   NextActions  — a short owned/dated list derived from existing records.
 */

import { useState } from "react";
import { Check, ChevronRight, Lock } from "lucide-react";

import { Badge, Dot, Mono, Person, Section, Table, Td, Tr } from "@/components/app/ui";
import { cn } from "@/lib/utils";
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
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-2.5">
      <div className="flex min-w-0 items-center">
        {stages.map((s, i) => {
          const status = state.stageStatus[s];
          const isSelected = selected === s;
          const blocked = status === "current" && state.blockerTone === "danger";
          return (
            <div key={s} className="flex items-center">
              {i > 0 ? (
                <span
                  className={cn(
                    "mx-1.5 h-px w-5",
                    status === "locked" ? "bg-border" : "bg-primary/40",
                  )}
                />
              ) : null}
              <button
                onClick={() => onSelect(isSelected ? null : s)}
                aria-pressed={isSelected}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-12 transition-colors",
                  isSelected ? "bg-muted text-foreground" : "hover:bg-muted",
                  status === "locked" ? "text-muted-foreground" : "text-foreground",
                  status === "current" ? "font-semibold" : "font-medium",
                )}
              >
                {status === "done" ? (
                  <Check className="size-3 text-success" />
                ) : status === "current" ? (
                  <Dot tone={blocked ? "danger" : "info"} />
                ) : (
                  <span className="size-1.5 rounded-full border border-muted-foreground/50" />
                )}
                {s}
              </button>
            </div>
          );
        })}
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-12">
        <span className="flex items-center gap-1.5">
          <Mono className="text-muted-foreground">{state.currentGate?.id ?? "—"}</Mono>
          <span className="truncate">{state.currentGate?.name}</span>
        </span>
        {state.daysOut !== null ? (
          <span
            className={cn(
              "tnum",
              state.daysOut < 0
                ? "font-medium text-danger"
                : state.daysOut < 30
                  ? "font-medium text-warning"
                  : "text-muted-foreground",
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
          <span className="text-muted-foreground">No blocker</span>
        )}
      </div>
    </div>
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
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-12">
      {items.map((i) => (
        <button
          key={i.label}
          onClick={() => onJump(i.tab)}
          className="group flex items-baseline gap-1.5"
        >
          <span className="text-muted-foreground">{i.label}</span>
          <span
            className={cn(
              "tnum font-medium group-hover:underline",
              i.tone === "danger"
                ? "text-danger"
                : i.tone === "warning"
                  ? "text-warning"
                  : "text-foreground",
            )}
          >
            {i.value}
          </span>
        </button>
      ))}
    </div>
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
        <span className="tnum text-12 text-muted-foreground">
          {actions.length} item{actions.length === 1 ? "" : "s"}
        </span>
      }
    >
      {actions.length === 0 ? (
        <p className="pt-3 text-13 text-muted-foreground">
          Nothing is waiting on this program right now.
        </p>
      ) : (
        <>
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: 24 }} />
              <col />
              <col style={{ width: 168 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 132 }} />
            </colgroup>
            <tbody>
              {shown.map((a) => (
                <Tr key={a.id} onClick={() => onRun(a)} className="group cursor-pointer">
                  <Td className="w-6">
                    <Dot tone={a.tone} />
                  </Td>
                  <Td className="truncate font-medium">{a.label}</Td>
                  <Td className="w-[168px]">
                    <Person name={a.owner} />
                  </Td>
                  <Td
                    className={cn(
                      "tnum w-[110px] text-right",
                      a.tone === "danger" ? "font-medium text-danger" : "text-muted-foreground",
                    )}
                  >
                    {a.due}
                  </Td>
                  <Td className="w-[132px] text-right">
                    <span className="inline-flex items-center gap-1 text-12 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {a.cta}
                      <ChevronRight className="size-3.5" />
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          {actions.length > 5 ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-12 font-medium text-primary hover:underline"
            >
              {expanded ? "Show less" : `Show ${actions.length - 5} more`}
            </button>
          ) : null}
        </>
      )}
    </Section>
  );
}

export function LockedNotice({ stage, gate }: { stage: string; gate?: string | undefined }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-12 text-muted-foreground">
      <Lock className="size-3.5" />
      Preview — {stage} work opens after {gate ?? "the current gate"}. Records here are read-only
      until then.
    </div>
  );
}
