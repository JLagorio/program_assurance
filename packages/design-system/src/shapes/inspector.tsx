import type { ReactNode } from "react";

import { Accordion, Collapsible } from "../components/disclosure";
import { ScrollArea } from "../components/scroll-area";

export type InspectorGroupData = { title: string; rows: { label: string; value: ReactNode }[] };

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline gap-100">
      <dt className="shrink-0 font-body-small text-subtle" style={{ width: 104 }}>
        {label}
      </dt>
      <dd className="min-w-0 flex-1 font-body text-default">{value}</dd>
    </div>
  );
}

/** Facts that stay put: sticky under the top nav, always present, every group open until the reader folds it. With `sticky` off it is the same groups in a surface that scrolls on its own, the shell's Panel. */
function InspectorRoot({
  groups,
  footer,
  sticky = true,
}: {
  groups: InspectorGroupData[];
  footer?: ReactNode;
  sticky?: boolean | undefined;
}) {
  const body = (
    <>
      <Accordion type="multiple" defaultValue={groups.map((g) => g.title)} className="border-b-0">
        {groups.map((g) => (
          <Accordion.Item key={g.title} value={g.title} title={g.title}>
            <dl className="flex flex-col gap-025">
              {g.rows.map((r) => (
                <Row key={r.label} label={r.label} value={r.value} />
              ))}
            </dl>
          </Accordion.Item>
        ))}
      </Accordion>
      {footer ? <div className="pt-150">{footer}</div> : null}
    </>
  );
  if (!sticky) return <div>{body}</div>;
  return (
    <aside className="lg:sticky-rail">
      <ScrollArea className="max-h-full">{body}</ScrollArea>
    </aside>
  );
}

/** One group of facts on its own: the folding row of an Inspector segment, open by default, KeyValue rows as children. */
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
      {action ? <div className="flex justify-end pb-050">{action}</div> : null}
      <dl className="flex flex-col gap-025">{children}</dl>
    </Collapsible>
  );
}

export const Inspector = Object.assign(InspectorRoot, { Group: InspectorGroup });
