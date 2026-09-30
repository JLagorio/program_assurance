import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  type CollapsibleProps,
} from "../components/collapsible";

import { KeyValue } from "../components/key-value";
import { cn } from "../lib/cn";

export type InspectorGroupData = {
  /** The group's name, a noun for the kind of fact: "Ownership", "Schedule". */
  title: string;
  /** The facts, label and value, a handful. */
  rows: { label: string; value: ReactNode }[];
};

export type InspectorProps = Omit<ComponentProps<"div">, "children"> & {
  /** The groups, in the order the reader needs them. Every group opens. */
  groups: InspectorGroupData[];
  /** Under the groups: a link button, "Edit properties". */
  footer?: ReactNode;
};

/** Reusable groups of properties. The surrounding layout owns positioning and scrolling. Each group is an Inspector.Group, its rows one KeyValue.Group, and its heading takes the contextual level: an h3 outside every HeadingLevelProvider, an h3 in a titled panel's body, an h2 in an Aside wrapped in `HeadingLevelProvider level={2}`. */
function InspectorRoot({ groups, footer, ...props }: InspectorProps) {
  return (
    <div {...props} data-slot="inspector">
      {groups.map((g) => (
        <InspectorGroup key={g.title} title={g.title}>
          <KeyValue.Group>
            {g.rows.map((r) => (
              <KeyValue key={r.label} label={r.label}>
                {r.value}
              </KeyValue>
            ))}
          </KeyValue.Group>
        </InspectorGroup>
      ))}
      {footer ? <div className="pt-150">{footer}</div> : null}
    </div>
  );
}

export type InspectorGroupProps = Omit<
  ComponentProps<"div">,
  "title" | "children" | "className" | "defaultValue"
> & {
  /** The group's name, a noun for the kind of fact: "Ownership", "Exposure". */
  title: string;
  /** The facts: a KeyValue.Group of a handful of KeyValue rows; a row of Badges; a short list. KeyValues given directly, and nothing else, become one KeyValue.Group. */
  children: ReactNode;
  /** At the top end of the group, before the rows: an IconButton ("Edit properties") or a link button. */
  action?: ReactNode;
  /** Whether the group starts open: `true` by default. `false` for the collapsed Details a reader opens when they need provenance, counts or derivation. */
  defaultOpen?: boolean | undefined;
  /** The open state, when the caller controls it. */
  open?: boolean | undefined;
  /** Called when the reader opens or closes the group, with Base UI's event details (`details.cancel()` keeps the state). */
  onOpenChange?: CollapsibleProps["onOpenChange"] | undefined;
  className?: string | undefined;
};

/** One group of facts on its own: a folding row, open by default, a KeyValue.Group of rows as its children (KeyValues given directly become one). Native `div` props and the ref reach the group's root. Its title is a CollapsibleHeader, a button inside a heading at the contextual level (an h3 outside every provider), with a chevron that turns while the group is open. The action sits beside the title while the whole title fits beside it on one line; otherwise it takes the next row, at the end, rather than squeezing the title. */
export function InspectorGroup({
  title,
  children,
  action,
  defaultOpen = true,
  open,
  onOpenChange,
  className,
  ...props
}: InspectorGroupProps) {
  return (
    <Collapsible
      {...props}
      {...(open === undefined ? { defaultOpen } : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
      data-slot="inspector-group"
      className={cn("border-t border-default first:border-t-0", className)}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-100">
        <CollapsibleHeader>{title}</CollapsibleHeader>
        {action ? (
          <div className="ms-auto flex max-w-full shrink-0 flex-wrap justify-end">{action}</div>
        ) : null}
      </div>
      <CollapsibleContent>
        <div className="pb-200">
          <div className="flex flex-col">
            {onlyKeyValues(children) ? <KeyValue.Group>{children}</KeyValue.Group> : children}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Whether the children are KeyValue rows and nothing else, so the group can make them one list. */
function onlyKeyValues(children: ReactNode) {
  const items = Children.toArray(children);
  return (
    items.length > 0 && items.every((child) => isValidElement(child) && child.type === KeyValue)
  );
}

export const Inspector = Object.assign(InspectorRoot, { Group: InspectorGroup });
