import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { createContext, useContext, useMemo, type ComponentProps, type ReactNode } from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { Truncate } from "./truncate";

/** How a group's rows lay out: label beside value, label over value, or beside until the row is too narrow. */
export type KeyValueLayout = "auto" | "columns" | "stacked";

/* In an `auto` group a row keeps its label beside the value while the value has at least this
   much room, `dimension.part.keyValue` (8rem), and puts the label over the value below it. Every
   row in a group has the same width, label basis and value basis, so the rows change together. */
const MIN_VALUE_WIDTH = token("dimension.part.keyValue");
/* The label column is given in CSS pixels at the default text size and drawn in rem, so it grows
   with the reader's text size as the label and the value's rem minimum do (WCAG 1.4.4): at 16px
   it is exactly the width given. Without one it is `dimension.part.keyValueLabel` (6.5rem, 104px
   at 16px). */
const labelColumn = (width: number | undefined) =>
  width === undefined ? token("dimension.part.keyValueLabel") : `${width / 16}rem`;
/* How far the focus ring reaches past a control: its width plus its offset (outline-focused),
   2px and 2px, which is space.050. One token rather than their sum, because Chromium takes no
   calc() in overflow-clip-margin. */
const RING_ROOM = "var(--ds-space-050)";

const GroupContext = createContext<{
  labelWidth: number | undefined;
  layout: KeyValueLayout;
} | null>(null);

export type KeyValueProps = ComponentProps<"dl"> & {
  /** The fact's name, in the label column: "Owner", "Last verified". A label longer than its column wraps to the next line; it is never cut. */
  label: string;
  /** The label column's width in CSS pixels at the default text size (it grows with the reader's text size): the group's inside a KeyValue.Group, otherwise 104 (`dimension.part.keyValueLabel`). Every KeyValue in one rail takes the same; give it to the group once. */
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
function KeyValueRoot({
  label,
  labelWidth,
  wrap,
  children,
  className,
  style,
  ...props
}: KeyValueProps) {
  const group = useContext(GroupContext);
  const width = labelWidth ?? group?.labelWidth;
  const layout = group?.layout ?? "columns";
  const flowing = group !== null && layout !== "columns";

  // The label wraps rather than being cut, so every reader reads the same label, a touch screen
  // included; its first line keeps the value's baseline.
  const term = (
    <dt
      className="min-w-0 break-words text-subtle"
      style={
        flowing ? { flex: layout === "auto" ? `1 0 ${labelColumn(width)}` : undefined } : undefined
      }
    >
      {label}
    </dt>
  );
  // A value truncates across only: overflow-x clip keeps the ellipsis and leaves the block axis
  // visible, so the touch area of an Editable or a TextLink in the value (at least 24px tall,
  // taller than its line) and its focus ring reach past the row instead of being cut. Where the
  // browser takes a clip margin (Chromium needs the clip on both axes for one), the value clips on
  // both with the ring's reach all round, which also holds a 24px touch area on the 20px line: a
  // control at either edge keeps its whole ring, and an Editable's field its sides.
  const valueStyle = {
    ...(flowing && layout === "auto" ? { flex: `999 1 ${MIN_VALUE_WIDTH}` } : {}),
    overflowClipMargin: RING_ROOM,
  };
  // The group ends at the value: a KeyValue inside it (a peek's facts, portaled or not) is its own
  // definition list again, not a row of a list it does not sit in.
  const content = <GroupContext.Provider value={null}>{children}</GroupContext.Provider>;
  const value = wrap ? (
    <dd
      className="min-w-0 break-words text-default"
      style={flowing && layout === "auto" ? { flex: `999 1 ${MIN_VALUE_WIDTH}` } : undefined}
    >
      {content}
    </dd>
  ) : (
    <Truncate
      render={<dd />}
      className="text-default supports-[overflow-clip-margin:4px]:overflow-clip"
      style={valueStyle}
    >
      {content}
    </Truncate>
  );

  if (group === null)
    return (
      <dl
        {...props}
        data-slot="key-value"
        className={cn("grid items-baseline gap-150 py-050 font-body", className)}
        style={{ gridTemplateColumns: `${labelColumn(width)} minmax(0, 1fr)`, ...style }}
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
        "py-050",
        layout === "columns" && "grid items-baseline gap-150",
        layout === "auto" && "flex flex-wrap items-baseline gap-x-150 gap-y-025",
        // Stacked, label and value each take the row's width, so a long value truncates in it.
        layout === "stacked" && "flex flex-col gap-025",
        className,
      )}
      style={
        layout === "columns"
          ? { gridTemplateColumns: `${labelColumn(width)} minmax(0, 1fr)`, ...style }
          : style
      }
    >
      {term}
      {value}
    </div>
  );
}

export type KeyValueGroupProps = useRender.ComponentProps<"dl"> & {
  /** The label column's width for every row in CSS pixels at the default text size, 104 by default (`dimension.part.keyValueLabel`); it grows with the reader's text size. A row's own `labelWidth` overrides it. */
  labelWidth?: number | undefined;
  /**
   * `auto` (the default) keeps each label beside its value while the value has at least 8rem
   * (`dimension.part.keyValue`), and puts the label over the value when the group is narrower: a
   * rail, a phone, a narrow panel. `columns` never stacks; `stacked` always does.
   */
  layout?: KeyValueLayout | undefined;
  /** KeyValue rows, in the order the reader asks: who, how often, when last, when next. */
  children?: ReactNode | undefined;
};

/** One definition list for a rail or a record's properties: its KeyValues share the label width and the layout. */
export function KeyValueGroup({
  labelWidth,
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
