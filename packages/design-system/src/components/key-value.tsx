import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { createContext, useContext, useMemo, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { Truncate } from "./truncate";

/** How a group's rows lay out: label beside value, label over value, or beside until the row is too narrow. */
export type KeyValueLayout = "auto" | "columns" | "stacked";

const DEFAULT_LABEL_WIDTH = 104;
/* In an `auto` group a row keeps its label beside the value while the value has at least this
   much room, and puts the label over the value below it. Every row in a group has the same
   width, label basis and value basis, so the rows change together. */
const MIN_VALUE_WIDTH = "8rem";

const GroupContext = createContext<{ labelWidth: number; layout: KeyValueLayout } | null>(null);

export type KeyValueProps = ComponentProps<"dl"> & {
  /** The fact's name, in the label column: "Owner", "Last verified". A label that is cut shows in full on hover. */
  label: string;
  /** The label column's width: the group's inside a KeyValue.Group, otherwise 104. Every KeyValue in one rail takes the same; give it to the group once. */
  labelWidth?: number | undefined;
  /** Lets a long value run to several lines instead of truncating: a statement, an objective. */
  wrap?: boolean | undefined;
  /** The value: text, a Badge, a Person, a TextLink, an Absent. A value that is cut shows its full text in a tooltip on hover and on keyboard focus of a control inside it. */
  children: ReactNode;
};

/**
 * One rail row: a label column and a value. On its own it is its own definition list, so it is
 * valid wherever it sits; inside a KeyValue.Group it is one row of the group's list.
 */
function KeyValueRoot({ label, labelWidth, wrap, children, className, style, ...props }: KeyValueProps) {
  const group = useContext(GroupContext);
  const width = labelWidth ?? group?.labelWidth ?? DEFAULT_LABEL_WIDTH;
  const layout = group?.layout ?? "columns";
  const flowing = group !== null && layout !== "columns";

  const term = (
    <Truncate
      render={<dt />}
      className="text-subtle"
      style={flowing ? { flex: layout === "auto" ? `1 0 ${width}px` : undefined } : undefined}
    >
      {label}
    </Truncate>
  );
  // A value truncates across only: overflow-x clip keeps the ellipsis and leaves the block axis
  // visible, so the touch area of an Editable or a TextLink in the value (at least 24px tall,
  // taller than its line) and its focus ring reach past the row instead of being cut.
  const valueStyle = flowing && layout === "auto" ? { flex: `999 1 ${MIN_VALUE_WIDTH}` } : undefined;
  // The group ends at the value: a KeyValue inside it (a peek's facts, portaled or not) is its own
  // definition list again, not a row of a list it does not sit in.
  const content = <GroupContext.Provider value={null}>{children}</GroupContext.Provider>;
  const value = wrap ? (
    <dd className="min-w-0 break-words text-default" style={valueStyle}>
      {content}
    </dd>
  ) : (
    <Truncate render={<dd />} className="text-default" style={valueStyle}>
      {content}
    </Truncate>
  );

  if (group === null)
    return (
      <dl
        {...props}
        data-slot="key-value"
        className={cn("grid items-baseline gap-150 py-050 font-body", className)}
        style={{ gridTemplateColumns: `${width}px minmax(0, 1fr)`, ...style }}
      >
        {term}
        {value}
      </dl>
    );

  // Inside a group the row is a div of the group's dl, which HTML allows for grouping a dt and its dd.
  const { ref, ...rowProps } = props;
  return (
    <div
      {...(rowProps as ComponentProps<"div">)}
      ref={ref as ComponentProps<"div">["ref"]}
      data-slot="key-value"
      data-layout={layout}
      className={cn(
        "items-baseline py-050",
        layout === "columns" && "grid gap-150",
        layout === "auto" && "flex flex-wrap gap-x-150 gap-y-025",
        layout === "stacked" && "flex flex-col gap-025",
        className,
      )}
      style={
        layout === "columns"
          ? { gridTemplateColumns: `${width}px minmax(0, 1fr)`, ...style }
          : style
      }
    >
      {term}
      {value}
    </div>
  );
}

export type KeyValueGroupProps = useRender.ComponentProps<"dl"> & {
  /** The label column's width for every row, 104 by default; a row's own `labelWidth` overrides it. */
  labelWidth?: number | undefined;
  /**
   * `auto` (the default) keeps each label beside its value while the value has at least 8rem,
   * and puts the label over the value when the group is narrower: a rail, a phone, a narrow
   * panel. `columns` never stacks; `stacked` always does.
   */
  layout?: KeyValueLayout | undefined;
  /** KeyValue rows, in the order the reader asks: who, how often, when last, when next. */
  children?: ReactNode | undefined;
};

/** One definition list for a rail or a record's properties: its KeyValues share the label width and the layout. */
export function KeyValueGroup({
  labelWidth = DEFAULT_LABEL_WIDTH,
  layout = "auto",
  className,
  render,
  ref,
  ...props
}: KeyValueGroupProps) {
  const value = useMemo(() => ({ labelWidth, layout }), [labelWidth, layout]);
  const element = useRender({
    defaultTagName: "dl",
    render,
    ref,
    state: { slot: "key-value-group" },
    props: mergeProps<"dl">(props, {
      ...{ "data-slot": "key-value-group", "data-layout": layout },
      className: cn("flex min-w-0 flex-col font-body", className),
    }),
  });
  return <GroupContext.Provider value={value}>{element}</GroupContext.Provider>;
}

export const KeyValue = Object.assign(KeyValueRoot, { Group: KeyValueGroup });
