import {
  avatarHue,
  AvatarFallback,
  avatarInitials,
  Avatar,
  Box,
  Button,
  buttonVariants,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Empty,
  Inline,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Timeline,
  ToggleGroup,
  ToggleGroupItem,
} from "@ledger/design-system";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Circle } from "lucide-react";
import { useMemo, useState } from "react";
import { useActivityFilters, useReadState } from "@/lib/activity-prefs";
import {
  absoluteStamp,
  activityActors,
  activityCounts,
  activityKinds,
  dateRanges,
  groupActivity,
  inRange,
  relativeStamp,
  type ActivityEvent,
} from "@/lib/program-activity";
import { cn } from "@ledger/design-system/cn";

const toneRing: Record<string, string> = {
  danger: "bg-danger-bold",
  warning: "bg-warning-bold",
  success: "bg-success-bold",
  info: "bg-brand-bold",
  neutral: "bg-neutral-bold",
};

export function ActivityTimeline({
  programId,
  events,
}: {
  programId: string;
  events: ActivityEvent[];
}) {
  const { filters, update, reset } = useActivityFilters(programId);
  const { readIds, markRead, markUnread, markAllRead } = useReadState(programId);
  const [expanded, setExpanded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(() => activityCounts(events), [events]);
  const actors = useMemo(() => activityActors(events), [events]);

  const filtered = useMemo(
    () =>
      events.filter(
        (e) =>
          (filters.kind === "All" || e.kind === filters.kind) &&
          (filters.actor === "All" || e.actor === filters.actor) &&
          inRange(e.at, filters.range),
      ),
    [events, filters],
  );

  const shown = expanded ? filtered : filtered.slice(0, 12);
  const groups = useMemo(() => groupActivity(shown), [shown]);
  const unread = filtered.filter((e) => !readIds.has(e.id)).length;
  const active = useMemo(() => events.find((e) => e.id === openId) ?? null, [events, openId]);

  const open = (e: ActivityEvent) => {
    setOpenId(e.id);
    markRead(e.id);
  };

  return (
    <div>
      <Inline className="pb-150 pt-150" space="space.075" alignBlock="center" shouldWrap>
        <ToggleGroup
          aria-label="Activity type"
          size="sm"
          value={[filters.kind]}
          onValueChange={([kind]) => {
            if (kind !== undefined) update({ kind });
          }}
        >
          {(["All", ...activityKinds] as const).map((k) => (
            <ToggleGroupItem key={k} value={k}>
              <Inline as="span" display="inline-flex" space="space.075" alignBlock="center">
                {k}
                <span className="tabular-nums opacity-disabled">{counts[k] ?? 0}</span>
              </Inline>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Inline className="ml-auto" as="span" space="space.075" alignBlock="center">
          <FilterMenu
            label="Owner"
            value={filters.actor}
            options={["All", ...actors]}
            onSelect={(v) => update({ actor: v })}
          />
          <FilterMenu
            label="Date"
            value={filters.range}
            options={[...dateRanges]}
            onSelect={(v) => update({ range: v as (typeof dateRanges)[number] })}
          />
          {filters.kind !== "All" || filters.actor !== "All" || filters.range !== "All time" ? (
            <Button variant="subtle" size="xsmall" onClick={reset}>
              Clear
            </Button>
          ) : null}
          <Button
            variant="subtle"
            size="xsmall"
            disabled={unread === 0}
            onClick={() => markAllRead(filtered.map((e) => e.id))}
          >
            Mark all read{unread ? ` (${unread})` : ""}
          </Button>
        </Inline>
      </Inline>

      {filtered.length === 0 ? (
        <Empty
          title="No activity matches these filters"
          description="Adjust the type, owner, or date range to see more of this program's history."
          action={
            <Button variant="secondary" size="xsmall" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <Timeline>
          {groups.map((g) => (
            <Timeline.Group key={g.key} label={g.label} count={g.items.length}>
              {g.items.map((e) => {
                const isUnread = !readIds.has(e.id);
                return (
                  <Timeline.Item
                    key={e.id}
                    marker={
                      <span className="relative">
                        <Avatar
                          size="xsmall"
                          role="img"
                          aria-label={e.actor}
                          hue={avatarHue(e.actor)}
                          title={e.actor}
                        >
                          <AvatarFallback>{avatarInitials(e.actor, 1)}</AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            "absolute -bottom-025 -right-025 rounded-full outline-focused",
                            toneRing[e.tone] ?? toneRing["neutral"],
                            "size-100",
                          )}
                        />
                      </span>
                    }
                    title={e.title}
                    meta={`${e.actor} · ${e.kind}`}
                    time={relativeStamp(e.at)}
                    timeTitle={absoluteStamp(e.at)}
                    emphasis={isUnread}
                    trailing={
                      <Circle
                        className={cn(
                          isUnread ? "fill-current text-brand" : "invisible",
                          "size-100",
                        )}
                      />
                    }
                    onSelect={() => open(e)}
                  />
                );
              })}
            </Timeline.Group>
          ))}
        </Timeline>
      )}

      {filtered.length > shown.length || expanded ? (
        <Button
          onClick={() => setExpanded((v) => !v)}
          variant="link"
          size="small"
          className="pt-150"
        >
          {expanded ? "Show less" : `Show ${filtered.length - shown.length} more`}
        </Button>
      ) : null}

      <Sheet
        open={active !== null}
        onOpenChange={(next) => {
          if (!next) {
            setOpenId(null);
          }
        }}
      >
        <SheetContent side="end" style={{ maxWidth: 420 }}>
          <SheetHeader>
            <Box className="flex items-start gap-100">
              <Box className="flex min-w-0 flex-1 flex-col gap-025">
                <SheetTitle>{active?.title ?? ""}</SheetTitle>
                <SheetDescription>
                  {active ? `${active.kind} · ${active.actor}` : undefined}
                </SheetDescription>
              </Box>
            </Box>
          </SheetHeader>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
            {active ? (
              <dl className="font-body-small">
                <DrawerRow label="When" value={absoluteStamp(active.at)} />
                <DrawerRow label="Relative" value={relativeStamp(active.at)} />
                <DrawerRow label="Type" value={active.kind} />
                <DrawerRow label="Actor" value={active.actor} />
                {(active.details ?? []).map((d) => (
                  <DrawerRow key={d.label} label={d.label} value={d.value} />
                ))}
              </dl>
            ) : null}
          </Box>
          <SheetFooter>
            {active ? (
              <>
                <Button
                  variant="subtle"
                  size="small"
                  onClick={() => {
                    markUnread(active.id);
                    setOpenId(null);
                  }}
                >
                  Mark unread
                </Button>
                {active.to ? (
                  <Link
                    to={active.to}
                    params={active.params as never}
                    className={buttonVariants({ variant: "primary", size: "small" })}
                  >
                    Open record
                  </Link>
                ) : null}
              </>
            ) : null}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DrawerRow({ label, value }: { label: string; value: string }) {
  return (
    <Inline
      className="border-b border-default py-075 last:border-0"
      space="space.150"
      alignBlock="start"
    >
      <dt className="shrink-0 text-subtle" style={{ width: 120 }}>
        {label}
      </dt>
      <dd className="min-w-0 flex-1 break-words">{value}</dd>
    </Inline>
  );
}

function FilterMenu({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="secondary" size="xsmall">
            {label}: {value}
            <ChevronDown className="text-subtle size-150" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" style={{ width: 220 }}>
        <DropdownMenuRadioGroup value={value} onValueChange={onSelect}>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o} value={o} closeOnClick>
              {o}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
