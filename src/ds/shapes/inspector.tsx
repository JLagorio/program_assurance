import type { ReactNode } from "react";

import { Accordion } from "../primitives/accordion";
import { Collapsible } from "../primitives/collapsible";
import { ScrollArea } from "../primitives/scroll-area";

export type InspectorGroupData = { title: string; rows: { label: string; value: ReactNode }[] };

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-[104px] shrink-0 text-[12px] leading-[1.5] text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-[12.5px]">{value}</dd>
    </div>
  );
}

/**
 * Facts that stay put.
 *
 * `RailGroup` scrolls away with the page and only renders beside one tab, so
 * the answer to "who owns this" kept ending up below the fold or on another
 * screen. This is sticky and always present. Each group is a segment of an
 * accordion: every one starts open, and a reader folds away what they are not
 * using. Long rails scroll with the kit's bar, not the platform's.
 */
function InspectorRoot({ groups, footer }: { groups: InspectorGroupData[]; footer?: ReactNode }) {
  return (
    <aside className="lg:sticky lg:top-[104px] lg:self-start">
      <ScrollArea className="lg:max-h-[calc(100vh-140px)]">
        <Accordion type="multiple" defaultValue={groups.map((g) => g.title)} className="border-b-0">
          {groups.map((g) => (
            <Accordion.Item key={g.title} value={g.title} title={g.title}>
              <dl className="space-y-[3px]">
                {g.rows.map((r) => (
                  <Row key={r.label} label={r.label} value={r.value} />
                ))}
              </dl>
            </Accordion.Item>
          ))}
        </Accordion>
        {footer ? <div className="pt-3">{footer}</div> : null}
      </ScrollArea>
    </aside>
  );
}

/**
 * One group of facts on its own: the same folding row as an Inspector
 * segment, open by default, KeyValue rows as children. Legacy ShowPage rails
 * stack several of these.
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
    <Collapsible title={title} defaultOpen className="first:border-t-0">
      {action ? <div className="flex justify-end pb-1">{action}</div> : null}
      <dl className="space-y-[3px]">{children}</dl>
    </Collapsible>
  );
}

export const Inspector = Object.assign(InspectorRoot, { Group: InspectorGroup });
