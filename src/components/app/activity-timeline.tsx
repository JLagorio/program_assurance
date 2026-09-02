/**
 * True activity timeline: chronological grouping, per-user filters that
 * persist, read/unread state, and a detail drawer for a single event.
 */

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Circle } from "lucide-react";

import { Avatar, Button, DropdownMenu, Sheet, Timeline } from "@/ds/primitives";
import { Empty } from "@/ds/patterns";
import { cn } from "@/lib/utils";
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

const toneRing: Record<string, string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  success: "bg-success",
  info: "bg-primary",
  neutral: "bg-muted-foreground/50",
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
      <div className="flex flex-wrap items-center gap-1.5 pb-3 pt-3">
        {(["All", ...activityKinds] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => update({ kind: k })}
            aria-pressed={filters.kind === k}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-12 font-medium transition-colors duration-100",
              filters.kind === k
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-surface-hover",
            )}
          >
            {k}
            <span className="tnum opacity-70">{counts[k] ?? 0}</span>
          </button>
        ))}

        <span className="ml-auto flex items-center gap-1.5">
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
            <Button variant="ghost" size="xs" onClick={reset}>
              Clear
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="xs"
            disabled={unread === 0}
            onClick={() => markAllRead(filtered.map((e) => e.id))}
          >
            Mark all read{unread ? ` (${unread})` : ""}
          </Button>
        </span>
      </div>

      {filtered.length === 0 ? (
        <Empty
          title="No activity matches these filters"
          description="Adjust the type, owner, or date range to see more of this program's history."
          action={
            <Button variant="secondary" size="xs" onClick={reset}>
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
                        <Avatar name={e.actor} size="sm" />
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-2 ring-background",
                            toneRing[e.tone] ?? toneRing["neutral"],
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
                          "size-2",
                          isUnread
                            ? "fill-primary text-primary"
                            : "fill-transparent text-transparent",
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
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-12 font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : `Show ${filtered.length - shown.length} more`}
        </button>
      ) : null}

      <Sheet
        open={active !== null}
        onClose={() => setOpenId(null)}
        title={active?.title ?? ""}
        subtitle={active ? `${active.kind} · ${active.actor}` : undefined}
        footer={
          active ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  markUnread(active.id);
                  setOpenId(null);
                }}
              >
                Mark unread
              </Button>
              {active.to ? (
                <Link to={active.to} params={active.params as never}>
                  <Button variant="primary" size="sm">
                    Open record
                  </Button>
                </Link>
              ) : null}
            </>
          ) : null
        }
      >
        {active ? (
          <dl className="text-[12.5px]">
            <DrawerRow label="When" value={absoluteStamp(active.at)} />
            <DrawerRow label="Relative" value={relativeStamp(active.at)} />
            <DrawerRow label="Type" value={active.kind} />
            <DrawerRow label="Actor" value={active.actor} />
            {(active.details ?? []).map((d) => (
              <DrawerRow key={d.label} label={d.label} value={d.value} />
            ))}
          </dl>
        ) : null}
      </Sheet>
    </div>
  );
}

function DrawerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border-subtle py-1.5 last:border-0">
      <dt className="w-[120px] shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{value}</dd>
    </div>
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
    <DropdownMenu
      align="end"
      width={220}
      trigger={({ toggle }) => (
        <Button variant="secondary" size="xs" onClick={toggle}>
          {label}: {value}
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      )}
    >
      {(close) => (
        <>
          <DropdownMenu.Label>{label}</DropdownMenu.Label>
          {options.map((o) => (
            <DropdownMenu.Item
              key={o}
              selected={o === value}
              onSelect={() => {
                onSelect(o);
                close();
              }}
            >
              {o}
            </DropdownMenu.Item>
          ))}
        </>
      )}
    </DropdownMenu>
  );
}
