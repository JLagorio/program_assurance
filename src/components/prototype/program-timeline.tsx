import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Button,
  DateTime,
  Inline,
  LinkButton,
  Progress,
  ProgressLabel,
  ProgressValue,
  Section,
  Stack,
  Text,
  Timeline,
  useLedgerLocale,
} from "@ledger/design-system";
import { Check, CircleDashed, Clock3, Minus, TriangleAlert, X } from "lucide-react";
import { lifecycleGateDate, programTimeline, type LifecycleGate } from "@/lib/program-timeline";
import { lifecycleGateStatuses, statusTone } from "@/lib/status";
import { StatusBadge } from "@/components/app/status";
import { EmptyMessage } from "./work-common";
import { ProgramRecordDialog } from "./program-shared";
import { useEndOnHide } from "./record-preview";

function gateIcon(status: string) {
  if (["completed", "passed"].includes(status)) return <Check aria-hidden />;
  if (["blocked", "failed"].includes(status)) return <X aria-hidden />;
  if (status === "at_risk") return <TriangleAlert aria-hidden />;
  if (status === "in_review") return <Clock3 aria-hidden />;
  if (status === "waived") return <Minus aria-hidden />;
  return <CircleDashed aria-hidden />;
}

/** When a gate falls due or was decided, in the reader's words; the preview holds the full value. */
function gateTime(gate: LifecycleGate) {
  const date = lifecycleGateDate(gate);
  if (!date) return "Date not set";
  return (
    <>
      {date.label} <DateTime value={date.value} format="date" focusable={false} />
    </>
  );
}

/**
 * One strip of gates across the Overview. The kit Timeline scrolls itself where it is narrower
 * than its stages; each stage keeps at least a rail's width (`itemWidth="rail"`), so its title and
 * date stay readable, and a cut title shows whole on hover and focus.
 */
function GateRail({
  gates,
  label,
  onSelect,
}: {
  gates: LifecycleGate[];
  label: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Stack space="space.050" className="min-w-0">
      <Text size="small" color="color.text.subtle">
        {label}
      </Text>
      <Timeline label={label} orientation="horizontal" align="start" size="large" itemWidth="rail">
        {gates.map((gate) => (
          <Timeline.Item
            key={gate.id}
            title={gate.title}
            icon={gateIcon(gate.status)}
            tone={statusTone(lifecycleGateStatuses, gate.status)}
            time={gateTime(gate)}
            meta={gate.sequence_number !== null ? `Step ${gate.sequence_number}` : undefined}
            onSelect={() => onSelect(gate.id)}
            footer={
              <StatusBadge statuses={lifecycleGateStatuses} value={gate.status} size="xsmall" />
            }
          />
        ))}
      </Timeline>
    </Stack>
  );
}

/**
 * Program milestones use the recorded gate schedule, never inferred stage completion. The header
 * counts the gates, and a Progress bar under it says how many are completed ("3 of 5").
 */
export function ProgramTimeline({
  programId,
  gates,
}: {
  programId: string;
  gates: LifecycleGate[];
}) {
  const { formatNumber } = useLedgerLocale();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEndOnHide(() => setSelectedId(null));
  const selected = gates.find((gate) => gate.id === selectedId);
  const { sequenced, scheduled, unscheduled } = programTimeline(gates);
  const completed = gates.filter((gate) => ["completed", "passed"].includes(gate.status)).length;
  const schedule = (
    <Link to="/programs/$programId" params={{ programId }} search={{ tab: "Schedule" }} />
  );
  if (!gates.length)
    return (
      <Section title="Lifecycle timeline">
        <EmptyMessage
          compact
          title="No lifecycle gates yet"
          description="Gates mark the reviews and decisions the program passes through; they are set on the Schedule tab."
          action={
            <LinkButton size="small" render={schedule}>
              Set up program work
            </LinkButton>
          }
        />
      </Section>
    );
  return (
    <>
      <Section
        title="Lifecycle timeline"
        count={gates.length}
        countMax={9999}
        action={
          <LinkButton size="small" variant="subtle" render={schedule}>
            Open schedule
          </LinkButton>
        }
      >
        <Stack space="space.150" className="min-w-0">
          <Progress
            size="small"
            value={completed}
            max={gates.length}
            tone={completed === gates.length ? "success" : "information"}
            getAriaValueText={() => `${formatNumber(completed)} of ${formatNumber(gates.length)}`}
          >
            <ProgressLabel>Gates completed</ProgressLabel>
            <ProgressValue>
              {() => `${formatNumber(completed)} of ${formatNumber(gates.length)}`}
            </ProgressValue>
          </Progress>
          {sequenced.length > 0 && (
            <GateRail label="Workflow steps" gates={sequenced} onSelect={setSelectedId} />
          )}
          {scheduled.length > 0 && (
            <GateRail
              label={sequenced.length ? "Scheduled gates without a step" : "Scheduled gates"}
              gates={scheduled}
              onSelect={setSelectedId}
            />
          )}
          {unscheduled.length > 0 && (
            <Stack space="space.075">
              <Text size="small" color="color.text.subtle">
                Unscheduled gates
              </Text>
              <Inline shouldWrap space="space.075">
                {unscheduled.map((gate) => (
                  <Button
                    key={gate.id}
                    variant="subtle"
                    size="small"
                    onClick={() => setSelectedId(gate.id)}
                    iconBefore={gateIcon(gate.status)}
                  >
                    {gate.title}
                    <StatusBadge
                      statuses={lifecycleGateStatuses}
                      value={gate.status}
                      size="xsmall"
                    />
                  </Button>
                ))}
              </Inline>
            </Stack>
          )}
        </Stack>
      </Section>
      {selected && (
        <ProgramRecordDialog
          table="lifecycle_gates"
          row={selected}
          initialValues={{ program_id: programId }}
          records={[...sequenced, ...scheduled, ...unscheduled]}
          onSelect={(row) => setSelectedId(row.id)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
