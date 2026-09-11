import { ChevronDown } from "lucide-react";
import { type ReactNode } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/collapsible";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/accordion";

import { KeyValue } from "../components/key-value";

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
};

/** Reusable groups of properties. The surrounding layout owns positioning and scrolling. */
function InspectorRoot({ groups, footer }: InspectorProps) {
  const body = (
    <>
      <Accordion defaultValue={groups.map((g) => g.title)} multiple className="border-b-0">
        {groups.map((g, index) => (
          <AccordionItem
            value={g.title}
            key={g.title}
            className={index === 0 ? "border-t-0" : "border-t border-default"}
          >
            <AccordionTrigger>{g.title}</AccordionTrigger>
            <AccordionContent>
              <div className="pb-200">
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
      {footer ? <div className="pt-150">{footer}</div> : null}
    </>
  );
  return <div>{body}</div>;
}

export type InspectorGroupProps = {
  /** The group's name, a noun for the kind of fact: "Ownership", "Exposure". */
  title: string;
  /** KeyValue rows, a handful; a row of Badges; a short list. */
  children: ReactNode;
  /** At the top end of the group, before the rows: an IconButton ("Edit properties") or a link button. */
  action?: ReactNode;
};

/** One group of facts on its own: a folding row, open by default, KeyValue rows as children. */
function InspectorGroup({ title, children, action }: InspectorGroupProps) {
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
        <div className="pb-200">
          {action ? <div className="flex justify-end pb-050">{action}</div> : null}
          <div className="flex flex-col">{children}</div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const Inspector = Object.assign(InspectorRoot, { Group: InspectorGroup });
