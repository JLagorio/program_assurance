import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  useContext,
  useMemo,
  type ComponentProps,
  type ReactNode,
} from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { Truncate } from "./truncate";

/** How a group's rows lay out: label beside value, label over value, or beside until the row is too narrow. */
export type KeyValueLayout = "auto" | "columns" | "stacked";
/**
 * The label column: a named step (`narrow`, `default`, `wide`), or `auto`, as wide as the longest
 * label up to `wide`.
 */
export type KeyValueLabelWidth = "narrow" | "default" | "wide" | "auto";

/* In an `auto` group a row keeps its label beside the value while the value has at least this
   much room, `dimension.part.keyValue` (8rem), and puts the label over the value below it. Every
   row in a group has the same width, label basis and value basis, so the rows change together. */
const MIN_VALUE_WIDTH = token("dimension.part.keyValue");
/* The label column's steps, in rem, so the column grows with the reader's text size as the label
   and the value's rem minimum do (WCAG 1.4.4): `narrow` 5.5rem, `default` 6.5rem, `wide` 10rem,
   88, 104 and 160px at 16px. `auto` is as wide as the longest label, up to `wide`, past which a
   label wraps. A deprecated number is CSS pixels at the default text size, drawn in rem. */
const LABEL_STEPS = {
  narrow: token("dimension.part.keyValueLabelNarrow"),
  default: token("dimension.part.keyValueLabel"),
  wide: token("dimension.part.keyValueLabelWide"),
} as const;
const labelColumn = (width: KeyValueLabelWidth | number | undefined) =>
  width === undefined
    ? LABEL_STEPS.default
    : typeof width === "number"
      ? `${width / 16}rem`
      : width === "auto"
        ? `fit-content(${LABEL_STEPS.wide})`
        : LABEL_STEPS[width];
/* Where an `auto` label column stacks in an `auto` group: below `dimension.container.xs` (20rem)
   the value would have less than its 8rem beside a label at `wide`. Stacked, label and value
   stretch to the row's width, as in a `stacked` group, so a long value (an id, a URN) truncates
   in it: the row's baseline alignment would otherwise size each to its text and a value with an
   unbroken token would run past the row. */
const AUTO_STACKS =
  "@max-xs/key-value:flex @max-xs/key-value:flex-col @max-xs/key-value:items-stretch @max-xs/key-value:gap-y-025";

/* A value that truncates clips across only, at its own box, in every browser. What sits in it
   keeps its whole focus ring, tint and field without a clip margin (which Safari lacks):
   - space.050 at the end holds the ring of a control that ends there (a CopyButton after an id);
   - a link draws the kit's ring inside its own edge, as a link in a table cell does, so the clip
     cannot take it at the value's start;
   - a link that is the whole value is cut to the value's width, so its ellipsis and its ring are
     its own; the value's reveal measures it. A link inside a composed value (a code and a title)
     stays inline, since a cut inline block would drop out whole beside the ellipsis;
   - an Editable truncates its own text and keeps its reach inside its box at the end, so a value
     that is an Editable does not clip, and the Editable's tint, ring and field reach past the
     value's start as they do everywhere, on the text column with the plain values around it. */
const VALUE_CLIP =
  "pe-050 text-default [&_a:not([data-slot^=link-]):focus-visible]:outline-field-focused has-[>[data-slot=editable]]:overflow-x-visible has-[>[data-slot=editable]]:pe-0";
const LINK_IS_THE_VALUE =
  "[&>a:not([data-slot^=link-])]:inline-block [&>a:not([data-slot^=link-])]:min-w-0 [&>a:not([data-slot^=link-])]:max-w-full [&>a:not([data-slot^=link-])]:overflow-x-clip [&>a:not([data-slot^=link-])]:text-ellipsis [&>a:not([data-slot^=link-])]:whitespace-nowrap [&>a:not([data-slot^=link-])]:align-top";

/** Whether the value is one element (a TextLink, an Editable, a Person) rather than text or a composition. */
const isOneElement = (children: ReactNode) => {
  const items = Children.toArray(children);
  return items.length === 1 && isValidElement(items[0]) && items[0].type !== Fragment;
};

const GroupContext = createContext<{
  labelWidth: KeyValueLabelWidth | number | undefined;
  layout: KeyValueLayout;
} | null>(null);

export type KeyValueProps = ComponentProps<"dl"> & {
  /** The fact's name, in the label column: "Owner", "Last verified". A label longer than its column wraps to the next line; it is never cut. */
  label: string;
  /**
   * The label column: `narrow` (88px) for short labels in a card, a glance or a chart's details,
   * `default` (104px) for a rail, `wide` (160px) for labels of about twenty characters, each at
   * the default text size and growing with the reader's; `auto`, as wide as the longest label up
   * to `wide`, in a page body. Inside a KeyValue.Group it is the group's; every KeyValue in one
   * rail takes the same, so give it to the group once. A number of CSS pixels is deprecated:
   * write the nearest step, which `ledger/no-deprecated-name` writes. @default "default"
   */
  labelWidth?: KeyValueLabelWidth | number | undefined;
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
  // An `auto` group is one grid: its rows are subgrids, so every label shares the column the
  // longest one sets. A row with a width of its own spans the grid and keeps its own columns.
  const autoGroup = group?.labelWidth === "auto" && layout !== "stacked";
  const subgrid = autoGroup && labelWidth === undefined;

  // The label wraps rather than being cut, so every reader reads the same label, a touch screen
  // included; its first line keeps the value's baseline.
  const term = (
    <dt
      className="min-w-0 break-words text-subtle"
      style={
        flowing && !subgrid && layout === "auto"
          ? { flex: `1 0 ${width === "auto" ? "auto" : labelColumn(width)}` }
          : undefined
      }
    >
      {label}
    </dt>
  );
  // A value truncates across only: overflow-x clip keeps the ellipsis and leaves the block axis
  // visible, so the touch area of an Editable or a TextLink in the value (at least 24px tall,
  // taller than its line) and its focus ring reach above and below the row instead of being cut.
  // Across, VALUE_CLIP keeps each control's ring inside the clip.
  const valueStyle =
    flowing && !subgrid && layout === "auto" ? { flex: `999 1 ${MIN_VALUE_WIDTH}` } : undefined;
  // The group ends at the value: a KeyValue inside it (a peek's facts, portaled or not) is its own
  // definition list again, not a row of a list it does not sit in.
  const content = <GroupContext.Provider value={null}>{children}</GroupContext.Provider>;
  const value = wrap ? (
    <dd className="min-w-0 break-words text-default" style={valueStyle}>
      {content}
    </dd>
  ) : (
    <Truncate
      render={<dd />}
      className={cn(VALUE_CLIP, isOneElement(children) && LINK_IS_THE_VALUE)}
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
        autoGroup && "col-span-full",
        // In an `auto` group a row is a subgrid of the group's two columns, and in an `auto` layout
        // it puts the label over the value below the group's container query.
        subgrid && "grid grid-cols-subgrid items-baseline gap-x-150",
        subgrid && layout === "auto" && AUTO_STACKS,
        !subgrid && layout === "columns" && "grid items-baseline gap-150",
        !subgrid && layout === "auto" && "flex flex-wrap items-baseline gap-x-150 gap-y-025",
        // Stacked, label and value each take the row's width, so a long value truncates in it.
        layout === "stacked" && "flex flex-col gap-025",
        className,
      )}
      style={
        !subgrid && layout === "columns"
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
  /**
   * The label column for every row: `narrow` (88px), `default` (104px, a rail's), `wide` (160px),
   * each at the default text size and growing with the reader's, or `auto`, as wide as the group's
   * longest label up to `wide`, for a page body. In an `auto` layout an `auto` column puts each
   * label over its value when the group is under 20rem (`dimension.container.xs`). A row's own
   * `labelWidth` overrides it. A number of CSS pixels is deprecated: write the nearest step, which
   * `ledger/no-deprecated-name` writes. @default "default"
   */
  labelWidth?: KeyValueLabelWidth | number | undefined;
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
  style,
  render,
  ref,
  ...props
}: KeyValueGroupProps) {
  const value = useMemo(() => ({ labelWidth, layout }), [labelWidth, layout]);
  // An `auto` label column is one grid the rows share as subgrids, so it is as wide as the longest
  // label; in an `auto` layout the group is the container its rows stack in.
  const autoColumn = labelWidth === "auto" && layout !== "stacked";
  const element = useRender({
    defaultTagName: "dl",
    render,
    ref,
    state: { slot: "key-value-group" },
    props: mergeProps<"dl">(props, {
      ...{ "data-slot": "key-value-group", "data-layout": layout },
      ...(autoColumn ? { "data-label-width": "auto" } : {}),
      className: cn(
        autoColumn ? "grid min-w-0 gap-x-150 font-body" : "flex min-w-0 flex-col font-body",
        autoColumn && layout === "auto" && "@container/key-value",
        className,
      ),
      style: autoColumn
        ? { gridTemplateColumns: `${labelColumn("auto")} minmax(0, 1fr)`, ...style }
        : style,
    }),
  });
  return <GroupContext.Provider value={value}>{element}</GroupContext.Provider>;
}

export const KeyValue = Object.assign(KeyValueRoot, { Group: KeyValueGroup });
