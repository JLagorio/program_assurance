/**
 * True activity timeline: chronological grouping, per-user filters that
 * persist, read/unread state, and a detail drawer for a single event.
 */

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Circle } from "lucide-react";

import {
  Avatar,
  Button,
  DropdownMenu,
  Empty,
  Inline,
  Sheet,
  Timeline,
  ToggleGroup,
} from "@ledger/design-system";
import { cn } from "@ledger/design-system/cn";
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
          value={filters.kind}
          onChange={(k) => update({ kind: k })}
          items={(["All", ...activityKinds] as const).map((k) => ({
            value: k,
            label: (
              <Inline as="span" display="inline-flex" space="space.075" alignBlock="center">
                {k}
                <span className="tabular-nums opacity-disabled">{counts[k] ?? 0}</span>
              </Inline>
            ),
          }))}
        />

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
                        <Avatar name={e.actor} size="xsmall" />
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
        onClose={() => setOpenId(null)}
        title={active?.title ?? ""}
        subtitle={active ? `${active.kind} · ${active.actor}` : undefined}
        footer={
          active ? (
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
                <Link to={active.to} params={active.params as never}>
                  <Button variant="primary" size="small">
                    Open record
                  </Button>
                </Link>
              ) : null}
            </>
          ) : null
        }
      >
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
    <DropdownMenu
      align="end"
      width={220}
      trigger={({ toggle }) => (
        <Button variant="secondary" size="xsmall" onClick={toggle}>
          {label}: {value}
          <ChevronDown className="text-subtle size-150" />
        </Button>
      )}
    >
      {(close) => (
        <>
          <DropdownMenu.Label>{label}</DropdownMenu.Label>
          {options.map((o) => (
            <DropdownMenu.Item
              key={o}
              isSelected={o === value}
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
