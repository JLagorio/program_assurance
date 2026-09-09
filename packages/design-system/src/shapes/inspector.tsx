import { ChevronDown } from "lucide-react";
import { useContext, type ReactNode } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/collapsible";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/accordion";

import { KeyValue } from "../components/key-value";
import { ScrollArea } from "../components/scroll-area";
import { cn } from "../lib/cn";
import { PanelContext } from "../lib/panel-context";

/* Groups of facts beside the work, each group a heading that folds, every group open until the
   reader folds it, a Configure link at the end. An accordion usually opens closed so its titles
   are the overview; a rail of facts is the exception, content the reader will read, so the
   groups open. The row is a label and a value, no nesting, a small set. An Accordion of AccordionItem sections and
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
      <Accordion defaultValue={groups.map((g) => g.title)} multiple className="border-b-0">
        {groups.map((g, index) => (
          <AccordionItem
            value={g.title}
            key={g.title}
            className={index === 0 ? "border-t-0" : "border-t border-default"}
          >
            <AccordionTrigger className={flush ? "px-300" : undefined}>{g.title}</AccordionTrigger>
            <AccordionContent>
              <div className={flush ? "px-300 pb-200" : "pb-200"}>
                <div className="flex flex-col">
                  {g.rows.map((r) => (
                    <KeyValue key={r.label} label={r.label}>
                      {r.value}
                    </KeyValue>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
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
    <Collapsible defaultOpen className="border-t border-default first:border-t-0">
      <h3>
        <CollapsibleTrigger className="group/collapsible flex w-full items-center gap-100 py-100 text-start font-body font-semibold hover:bg-neutral-subtle-hovered">
          {title}
          <ChevronDown
            aria-hidden="true"
            className="ms-auto size-icon-small shrink-0 transition-transform duration-fast ease-standard group-data-open/collapsible:rotate-180"
          />
        </CollapsibleTrigger>
      </h3>
      <CollapsibleContent>
        <div className={(panel?.flush ?? false) ? "px-300 pb-200" : "pb-200"}>
          {action ? <div className="flex justify-end pb-050">{action}</div> : null}
          <div className="flex flex-col">{children}</div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const Inspector = Object.assign(InspectorRoot, { Group: InspectorGroup });
