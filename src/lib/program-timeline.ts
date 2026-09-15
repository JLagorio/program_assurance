import type { Row } from "./models";

export type LifecycleGate = Row<"lifecycle_gates">;
type GateOrder = Pick<LifecycleGate, "id" | "title" | "sequence_number" | "due_on" | "decided_at">;

export function lifecycleGateDate(gate: Pick<GateOrder, "due_on" | "decided_at">) {
  if (gate.due_on) return { value: gate.due_on, label: "Due" };
  if (gate.decided_at) return { value: gate.decided_at, label: "Decided" };
  return null;
}

/** An explicit workflow order and a date schedule are different sources of order. */
export function programTimeline<T extends GateOrder>(gates: readonly T[]) {
  const sequenced: T[] = [];
  const scheduled: T[] = [];
  const unscheduled: T[] = [];
  for (const gate of gates) {
    if (gate.sequence_number !== null) sequenced.push(gate);
    else if (lifecycleGateDate(gate)) scheduled.push(gate);
    else unscheduled.push(gate);
  }
  const byName = (a: T, b: T) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
  const byDate = (a: T, b: T) => {
    const left = lifecycleGateDate(a)?.value;
    const right = lifecycleGateDate(b)?.value;
    if (!left || !right) return left ? -1 : right ? 1 : byName(a, b);
    return Date.parse(left) - Date.parse(right) || byName(a, b);
  };
  sequenced.sort((a, b) => a.sequence_number! - b.sequence_number! || byDate(a, b));
  scheduled.sort(byDate);
  unscheduled.sort(byName);
  return { sequenced, scheduled, unscheduled };
}

export function lifecycleGateTone(status: string) {
  if (["completed", "passed"].includes(status)) return "success" as const;
  if (["blocked", "failed"].includes(status)) return "danger" as const;
  if (status === "at_risk") return "warning" as const;
  if (status === "in_review") return "information" as const;
  return "neutral" as const;
}
