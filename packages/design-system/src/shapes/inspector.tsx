import { useContext, type ReactNode } from "react";

import { Accordion, Collapsible } from "../components/disclosure";
import { ScrollArea } from "../components/scroll-area";
import { cn } from "../lib/cn";
import { PanelContext } from "../lib/panel-context";

export type InspectorGroupData = { title: string; rows: { label: string; value: ReactNode }[] };

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <dl className="flex items-baseline gap-100">
      <dt className="shrink-0 font-body-small text-subtle" style={{ width: 104 }}>
        {label}
      </dt>
      <dd className="min-w-0 flex-1 font-body text-default">{value}</dd>
    </dl>
  );
}

/** Facts that stay put: in a ShowPage's rail or a WorkPane's detail, sticky under the top nav, every group open until the reader folds it. Inside a Panel, the detail of a selected row, it is the same groups in a surface that scrolls on its own; in a flush Panel its rules run edge to edge and the first one sits on the top nav's border. */
function InspectorRoot({
  groups,
  footer,
  sticky,
}: {
  groups: InspectorGroupData[];
  footer?: ReactNode;
  /** Off inside a Panel by default. */
  sticky?: boolean | undefined;
}) {
  const panel = useContext(PanelContext);
  const isSticky = sticky ?? panel === null;
  const flush = panel?.flush ?? false;
  const body = (
    <>
      <Accordion type="multiple" defaultValue={groups.map((g) => g.title)} className="border-b-0">
        {groups.map((g, index) => (
          <Accordion.Item
            key={g.title}
            value={g.title}
            title={g.title}
            inset={flush}
            className={flush && index === 0 ? "border-t-0" : undefined}
          >
            <div className="flex flex-col gap-025">
              {g.rows.map((r) => (
                <Row key={r.label} label={r.label} value={r.value} />
              ))}
            </div>
          </Accordion.Item>
        ))}
      </Accordion>
      {footer ? <div className={cn("pt-150", flush && "px-300 pb-200")}>{footer}</div> : null}
    </>
  );
  if (!isSticky) return <div>{body}</div>;
  // A div, not an aside: the rail it sits in (a ShowPage's, a WorkPane's detail) is the landmark.
  return (
    <div className="lg:sticky-rail">
      <ScrollArea className="max-h-full">{body}</ScrollArea>
    </div>
  );
}

/** One group of facts on its own: the folding row of an Inspector segment, open by default, KeyValue rows as children. In a flush Panel it is inset and runs edge to edge. */
function InspectorGroup({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const panel = useContext(PanelContext);
  return (
    <Collapsible
      title={title}
      defaultOpen
      inset={panel?.flush ?? false}
      className="first:border-t-0"
    >
      {action ? <div className="flex justify-end pb-050">{action}</div> : null}
      <div className="flex flex-col gap-025">{children}</div>
    </Collapsible>
  );
}

export const Inspector = Object.assign(InspectorRoot, { Group: InspectorGroup });
