import { Children, isValidElement, useState, type ComponentProps, type ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  type CollapsibleProps,
} from "../components/collapsible";

import { KeyValue } from "../components/key-value";
import { useAsideDisclosure } from "../layout/slots";
import { cn } from "../lib/cn";

/** @deprecated With `groups`: compose Inspector.Group children instead. One group as data. */
export type InspectorGroupData = {
  /** The group's name, a noun for the kind of fact: "Ownership", "Schedule". */
  title: string;
  /** The facts, label and value, a handful. */
  rows: { label: string; value: ReactNode }[];
};

export type InspectorProps = Omit<ComponentProps<"div">, "children"> & {
  /** The groups, Inspector.Group parts, in the order the reader needs them. */
  children?: ReactNode | undefined;
  /** @deprecated Compose Inspector.Group children instead (`<Inspector><Inspector.Group title="Ownership"><KeyValue label="Owner">…</KeyValue></Inspector.Group></Inspector>`); the data form goes in the next minor version. The groups as data, each an open Inspector.Group with its rows, before any children. */
  groups?: InspectorGroupData[] | undefined;
  /** Under the groups: a link button, "Edit properties". */
  footer?: ReactNode | undefined;
};

/** A record's facts in groups: the Inspector.Group children, in the order the reader needs them, then the `footer`. The surrounding layout owns positioning and scrolling. Each group's heading takes the contextual level: an h3 outside every HeadingLevelProvider, an h3 in a titled panel's body, an h2 in a Shell.Aside rail. Native `div` props and the ref reach the root. */
function InspectorRoot({ groups, footer, children, ...props }: InspectorProps) {
  return (
    <div {...props} data-slot="inspector">
      {groups?.map((g) => (
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
      {children}
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
  action?: ReactNode | undefined;
  /** Whether the group starts open: `true` by default. `false` for the collapsed Details a reader opens when they need provenance, counts or derivation. */
  defaultOpen?: boolean | undefined;
  /** The open state, when the caller controls it. */
  open?: boolean | undefined;
  /** Called when the reader opens or closes the group, with Base UI's event details (`details.cancel()` keeps the state). */
  onOpenChange?: CollapsibleProps["onOpenChange"] | undefined;
  className?: string | undefined;
};

/** One group of facts: a folding row, open by default, a KeyValue.Group of rows as its children (KeyValues given directly become one). Native `div` props and the ref reach the group's root. Its title is a CollapsibleHeader, a button inside a heading at the contextual level (an h3 outside every provider), with a chevron that turns while the group is open. The action sits beside the title while the whole title fits beside it on one line; otherwise it takes the next row, at the end, rather than squeezing the title. In a Shell.Aside shown as the Details disclosure, a group named as the disclosure is its content: its own title steps aside, since the disclosure's row says it, and its rows stay open while the disclosure is. */
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
  const disclosure = useAsideDisclosure();
  const merged =
    disclosure !== null &&
    disclosure.trim().toLocaleLowerCase() === title.trim().toLocaleLowerCase();
  // Controlled throughout, so a group can be held open while it is the disclosure's content and
  // fold again as a rail's group, without Base UI switching between its two modes.
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  return (
    <Collapsible
      {...props}
      open={merged || (open ?? ownOpen)}
      onOpenChange={(next, details) => {
        onOpenChange?.(next, details);
        if (!details.isCanceled) setOwnOpen(next);
      }}
      data-slot="inspector-group"
      data-merged={merged ? "" : undefined}
      className={cn("border-t border-default first:border-t-0", className)}
    >
      {!merged || action ? (
        <div className="flex min-w-0 flex-wrap items-center gap-100">
          {merged ? null : <CollapsibleHeader>{title}</CollapsibleHeader>}
          {action ? (
            <div className="ms-auto flex max-w-full shrink-0 flex-wrap justify-end">{action}</div>
          ) : null}
        </div>
      ) : null}
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
