import type { ReactNode } from "react";

export type InspectorGroupData = { title: string; rows: { label: string; value: ReactNode }[] };

/**
 * Facts that stay put.
 *
 * `RailGroup` scrolls away with the page and only renders beside one tab, so
 * the answer to "who owns this" kept ending up below the fold or on another
 * screen. This is sticky and always present.
 */
function InspectorRoot({ groups, footer }: { groups: InspectorGroupData[]; footer?: ReactNode }) {
  return (
    <aside className="lg:sticky lg:top-[104px] lg:max-h-[calc(100vh-140px)] lg:self-start lg:overflow-y-auto">
      <div>
        {groups.map((g) => (
          <InspectorGroup key={g.title} title={g.title}>
            {g.rows.map((r) => (
              <div key={r.label} className="flex items-baseline gap-2">
                <dt className="w-[104px] shrink-0 text-[12px] leading-[1.5] text-muted-foreground">
                  {r.label}
                </dt>
                <dd className="min-w-0 flex-1 text-[12.5px]">{r.value}</dd>
              </div>
            ))}
          </InspectorGroup>
        ))}
        {footer ? <div className="pt-3">{footer}</div> : null}
      </div>
    </aside>
  );
}

/**
 * One group of facts: eyebrow title, optional action, KeyValue rows as children.
 * Replaces RailGroup, which collapsed and drew its own rules; groups now share
 * one look whether they sit in an Inspector or in a legacy ShowPage rail.
 */
function InspectorGroup({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="py-3 first:pt-0 last:pb-0">
      <div className="flex h-5 items-center gap-2 pb-1">
        <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground/80">
          {title}
        </div>
        {action ? <span className="ml-auto flex items-center">{action}</span> : null}
      </div>
      <dl className="space-y-[3px]">{children}</dl>
    </section>
  );
}

export const Inspector = Object.assign(InspectorRoot, { Group: InspectorGroup });
