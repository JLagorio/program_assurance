import { useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  IconButton,
  Inline,
  Section,
  Stack,
  Timeline,
} from "@ledger/design-system";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Clock3,
  Minus,
  TriangleAlert,
  X,
} from "lucide-react";
import { labelFor } from "@/lib/records";
import {
  lifecycleGateDate,
  lifecycleGateTone,
  programTimeline,
  type LifecycleGate,
} from "@/lib/program-timeline";
import { ProgramRecordDialog } from "./program-shared";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function gateIcon(status: string) {
  if (["completed", "passed"].includes(status)) return <Check aria-hidden />;
  if (["blocked", "failed"].includes(status)) return <X aria-hidden />;
  if (status === "at_risk") return <TriangleAlert aria-hidden />;
  if (status === "in_review") return <Clock3 aria-hidden />;
  if (status === "waived") return <Minus aria-hidden />;
  return <CircleDashed aria-hidden />;
}

function GateRail({
  gates,
  label,
  onSelect,
}: {
  gates: LifecycleGate[];
  label: string;
  onSelect: (id: string) => void;
}) {
  const rail = useRef<HTMLDivElement>(null);
  return (
    <Stack space="space.050" className="min-w-0">
      <Inline spread="space-between" alignBlock="center">
        <span className="font-body-small text-subtle">{label}</span>
        <Inline space="space.025">
          <IconButton
            label={`Scroll ${label.toLowerCase()} backward`}
            icon={<ChevronLeft />}
            size="small"
            variant="subtle"
            onClick={() => rail.current?.scrollBy({ left: -rail.current.clientWidth * 0.8 })}
          />
          <IconButton
            label={`Scroll ${label.toLowerCase()} forward`}
            icon={<ChevronRight />}
            size="small"
            variant="subtle"
            onClick={() => rail.current?.scrollBy({ left: rail.current.clientWidth * 0.8 })}
          />
        </Inline>
      </Inline>
      <div
        ref={rail}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="min-w-0 overflow-x-auto rounded-medium pb-100 focus-visible:outline-focused"
      >
        <Timeline
          label={label}
          orientation="horizontal"
          align="start"
          size="large"
          className="*:w-layout-rail *:shrink-0 *:basis-auto"
        >
          {gates.map((gate) => {
            const date = lifecycleGateDate(gate);
            const tone = lifecycleGateTone(gate.status);
            return (
              <Timeline.Item
                key={gate.id}
                title={
                  <span className="block whitespace-normal font-body-small font-medium">
                    {gate.title}
                  </span>
                }
                icon={gateIcon(gate.status)}
                tone={tone}
                time={
                  date ? `${date.label} ${dateFormat.format(new Date(date.value))}` : "Date not set"
                }
                dateTime={date?.value}
                meta={gate.sequence_number !== null ? `Step ${gate.sequence_number}` : undefined}
                onSelect={() => onSelect(gate.id)}
                footer={
                  <Badge size="xsmall" variant="secondary" tone={tone}>
                    {labelFor(gate.status)}
                  </Badge>
                }
              />
            );
          })}
        </Timeline>
      </div>
    </Stack>
  );
}

/** Program milestones use the recorded gate schedule, never inferred stage completion. */
export function ProgramTimeline({
  gates,
  onOpenSchedule,
}: {
  gates: LifecycleGate[];
  onOpenSchedule: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = gates.find((gate) => gate.id === selectedId);
  const { sequenced, scheduled, unscheduled } = programTimeline(gates);
  const completed = gates.filter((gate) => ["completed", "passed"].includes(gate.status)).length;
  if (!gates.length)
    return (
      <Box padding="space.200" className="rounded-medium border border-default">
        <Inline alignBlock="center" spread="space-between">
          <p className="text-subtle">No lifecycle gates defined.</p>
          <Button size="small" variant="subtle" onClick={onOpenSchedule}>
            Set up program work
          </Button>
        </Inline>
      </Box>
    );
  return (
    <>
      <Section
        title="Lifecycle timeline"
        description={`${completed} of ${gates.length} gates completed`}
        action={
          <Button size="small" variant="subtle" onClick={onOpenSchedule}>
            Open schedule
          </Button>
        }
      >
        <Stack space="space.150" className="min-w-0">
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
              <span className="font-body-small text-subtle">Unscheduled gates</span>
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
                    <Badge size="xsmall" variant="secondary" tone={lifecycleGateTone(gate.status)}>
                      {labelFor(gate.status)}
                    </Badge>
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
          records={[...sequenced, ...scheduled, ...unscheduled]}
          onSelect={(row) => setSelectedId(row.id)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
