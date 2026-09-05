import { useContext, type ReactNode } from "react";

import { Collapsible } from "../components/disclosure";
import { KeyValue } from "../components/key-value";
import { ScrollArea } from "../components/scroll-area";
import { cn } from "../lib/cn";
import { PanelContext } from "../lib/panel-context";

/* Groups of facts beside the work, each group a heading that folds, every group open until the
   reader folds it, a Configure link at the end. An accordion usually opens closed so its titles
   are the overview; a rail of facts is the exception, content the reader will read, so the
   groups open. The row is a label and a value, no nesting, a small set. A Collapsible.Group of
   KeyValue rows, sticky beside a page, scrolling with a panel. */

export type InspectorGroupData = {
  /** The group's name, a noun for the kind of fact: "Ownership", "Schedule". */
  title: string;
  /** The facts, label and value, a handful. */
  rows: { label: string; value: ReactNode }[];
};

export type InspectorProps = {
  /** The groups, in the order the reader needs them. Every group opens. */
  groups: InspectorGroupData[];
  /** Under the groups: a link button, "Edit properties". */
  footer?: ReactNode;
  /** Whether the rail stays put under the top nav and scrolls inside itself. On beside a page; off inside a Panel, which scrolls on its own. */
  sticky?: boolean | undefined;
};

/** Facts that stay put: in a ShowPage's rail or a WorkPane's detail, sticky under the top nav, every group open until the reader folds it. Inside a Panel, the detail of a selected row, the same groups in a surface that scrolls on its own; flush, the rules run edge to edge. */
function InspectorRoot({ groups, footer, sticky }: InspectorProps) {
  const panel = useContext(PanelContext);
  const isSticky = sticky ?? panel === null;
  const flush = panel?.flush ?? false;
  const body = (
    <>
      <Collapsible.Group inset={flush} className="border-b-0">
        {groups.map((g, index) => (
          <Collapsible
            key={g.title}
            title={g.title}
            defaultOpen
            className={index === 0 ? "border-t-0" : undefined}
          >
            <div className="flex flex-col">
              {g.rows.map((r) => (
                <KeyValue key={r.label} label={r.label}>
                  {r.value}
                </KeyValue>
              ))}
            </div>
          </Collapsible>
        ))}
      </Collapsible.Group>
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

export type InspectorGroupProps = {
  /** The group's name, a noun for the kind of fact: "Ownership", "Exposure". */
  title: string;
  /** KeyValue rows, a handful; a row of Badges; a short list. */
  children: ReactNode;
  /** At the top end of the group, before the rows: an IconButton ("Edit properties") or a link button. */
  action?: ReactNode;
};

/** One group of facts on its own: a folding row, open by default, KeyValue rows as children. In a flush Panel it is inset and runs edge to edge. */
function InspectorGroup({ title, children, action }: InspectorGroupProps) {
  const panel = useContext(PanelContext);
  return (
    <Collapsible
      title={title}
      defaultOpen
      inset={panel?.flush ?? false}
      className="first:border-t-0"
    >
      {action ? <div className="flex justify-end pb-050">{action}</div> : null}
      <div className="flex flex-col">{children}</div>
    </Collapsible>
  );
}

export const Inspector = Object.assign(InspectorRoot, { Group: InspectorGroup });
