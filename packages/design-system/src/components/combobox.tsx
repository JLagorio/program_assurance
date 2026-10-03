"use client";

import { Combobox as Primitive } from "@base-ui/react/combobox";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Check, ChevronDown, X } from "lucide-react";
import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "../lib/cn";
import {
  menuItem,
  menuItemHighlighted,
  menuItemDisabled,
  menuChoiceSelected,
  menuItemDescription,
  menuLabel,
  menuSeparator,
} from "./menu";
import { classes } from "../lib/base-ui";
import { Scroller, ScrollerArrow, ScrollerViewport } from "./scroller";
import { useLedgerLocale } from "../lib/locale";
import { useFieldControlState, type ControlSize } from "./controls";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./input-group";
import { countOptions, joinIds, textOf, wrapText } from "./option-text";

/** Base UI's generic selection, filtering, form and popup state. Root has no DOM element. */
export type ComboboxProps<
  Value = unknown,
  Multiple extends boolean | undefined = false,
> = Primitive.Root.Props<Value, Multiple> & {
  /** Defaults to LedgerProvider's direction, including keyboard and popup positioning. */
  dir?: "ltr" | "rtl" | undefined;
};
export type ComboboxInputProps = Omit<ComponentProps<typeof Primitive.Input>, "size"> & {
  size?: ControlSize | undefined;
  showTrigger?: boolean | undefined;
  showClear?: boolean | undefined;
};
export type ComboboxTriggerProps = ComponentProps<typeof Primitive.Trigger>;
export type ComboboxContentProps = ComponentProps<typeof Primitive.Popup> &
  Pick<Primitive.Positioner.Props, "side" | "align" | "sideOffset" | "alignOffset" | "anchor"> & {
    /** Override where the popup is portaled, for example an enclosing dialog. */
    portalContainer?: Primitive.Portal.Props["container"];
    /** Retain the closed popup; Base UI keeps it hidden and inert. */
    keepMounted?: boolean | undefined;
  };
export type ComboboxListProps = ComponentProps<typeof Primitive.List>;
export type ComboboxItemProps = ComponentProps<typeof Primitive.Item> & {
  /**
   * A second line under the option, in smaller subtle text that wraps: what tells two similar
   * options apart. It is the option's accessible description, not part of its name, and typeahead
   * and filtering never read it.
   */
  description?: ReactNode | undefined;
  /**
   * Why the option cannot be chosen. It disables the option, which the arrow keys still reach and a
   * screen reader announces as unavailable, and shows the reason as the description line in place of
   * `description`, readable on the disabled row. An empty string is no reason.
   */
  disabledReason?: string | undefined;
};
export type ComboboxEmptyProps = ComponentProps<typeof Primitive.Empty>;
export type ComboboxGroupProps = ComponentProps<typeof Primitive.Group>;
export type ComboboxLabelProps = ComponentProps<typeof Primitive.GroupLabel>;
export type ComboboxCollectionProps = ComponentProps<typeof Primitive.Collection>;
export type ComboboxValueProps = ComponentProps<typeof Primitive.Value>;
export type ComboboxSeparatorProps = ComponentProps<typeof Primitive.Separator>;
export type ComboboxChipsProps = ComponentProps<typeof Primitive.Chips>;
export type ComboboxChipProps = ComponentProps<typeof Primitive.Chip> & {
  showRemove?: boolean | undefined;
  /**
   * The chip's value in words, for its remove button's name: "Remove React". Unsaid, the chip's own
   * text.
   */
  label?: string | undefined;
};
export type ComboboxChipRemoveProps = ComponentProps<typeof Primitive.ChipRemove>;
export type ComboboxClearProps = ComponentProps<typeof Primitive.Clear>;
export type ComboboxStatusProps = ComponentProps<typeof Primitive.Status> & {
  /**
   * How many options match before Root's `limit` cut the list, or a server's total for remote
   * results. While the list shows fewer, the status says "Showing 50 of 312. Type to narrow the
   * list." Children, such as a loading or failure message, take its place while there are any.
   */
  total?: number | undefined;
};

/** What ComboboxInput tells the parts beside it: how it is named, so the list and the chevron can
    say the same words outside a Field. */
type InputNaming = { labelledBy?: string | undefined; label?: string | undefined };

type ComboboxContextValue = {
  direction: "ltr" | "rtl";
  /** Root's `grid`: the list is a grid of rows rather than a listbox. */
  grid: boolean;
  /** The InputGroup ComboboxInput draws outside the popup: the popup's default anchor. */
  inputGroup: RefObject<HTMLDivElement | null>;
  naming: InputNaming;
  setNaming: (naming: InputNaming) => void;
};

const ComboboxContext = createContext<ComboboxContextValue>({
  direction: "ltr",
  grid: false,
  inputGroup: { current: null },
  naming: {},
  setNaming: () => {},
});

/** Set inside the popup, where a search input is not the anchor. */
const InPopupContext = createContext(false);

/** The chip's words, for its remove button's name. */
const ChipLabelContext = createContext<string | undefined>(undefined);

/**
 * `autoHighlight` is on: typing highlights the first match, so Enter chooses it. Pass
 * `autoHighlight={false}` to leave the highlight to the arrow keys.
 */
export function Combobox<Value, Multiple extends boolean | undefined = false>({
  dir,
  locale,
  autoHighlight = true,
  ...props
}: ComboboxProps<Value, Multiple>) {
  const ledger = useLedgerLocale();
  const field = useFieldControlState();
  const direction = dir ?? ledger.direction;
  const inputGroup = useRef<HTMLDivElement | null>(null);
  const [naming, setNamingState] = useState<InputNaming>({});
  const setNaming = useCallback(
    (next: InputNaming) =>
      setNamingState((previous) =>
        previous.labelledBy === next.labelledBy && previous.label === next.label ? previous : next,
      ),
    [],
  );
  const grid = Boolean(props.grid);
  const context = useMemo(
    () => ({ direction, grid, inputGroup, naming, setNaming }),
    [direction, grid, naming, setNaming],
  );
  return (
    <ComboboxContext.Provider value={context}>
      <DirectionProvider direction={direction}>
        <Primitive.Root<Value, Multiple>
          locale={locale ?? ledger.locale}
          autoHighlight={autoHighlight}
          {...props}
          disabled={props.disabled || field.disabled}
        />
      </DirectionProvider>
    </ComboboxContext.Provider>
  );
}

/**
 * Search input and its trigger/clear controls, composed with the shared InputGroup. The chevron is
 * Base UI's trigger: outside the tab order (the arrow keys open the list from the input) and named
 * by the field's label, as the input is.
 */
export function ComboboxInput({
  size = "medium",
  showTrigger = true,
  showClear = false,
  children,
  disabled,
  className,
  ...props
}: ComboboxInputProps) {
  const { t } = useLedgerLocale();
  const { inputGroup, setNaming } = useContext(ComboboxContext);
  const inPopup = useContext(InPopupContext);
  const labelledBy = props["aria-labelledby"];
  const label = props["aria-label"];
  // The list takes the input's name; only an input outside the popup is the popup's anchor.
  useLayoutEffect(() => {
    setNaming({ labelledBy, label });
  }, [labelledBy, label, setNaming]);
  return (
    <Primitive.InputGroup ref={inPopup ? undefined : inputGroup} render={<InputGroup />}>
      <Primitive.Input
        disabled={disabled}
        className={className}
        render={<InputGroupInput size={size} />}
        {...props}
        data-slot="input-group-control"
        data-combobox-input=""
      />
      {(showTrigger || showClear) && (
        <InputGroupAddon align="inline-end">
          {showTrigger && (
            <Primitive.Trigger
              data-slot="combobox-trigger"
              // A Field's label names it (Base UI's aria-labelledby); outside one, the input's.
              {...(labelledBy ? { "aria-labelledby": labelledBy } : {})}
              disabled={disabled}
              className="group-has-[[data-slot=combobox-clear]]/input-group:hidden"
              render={
                <InputGroupButton
                  variant="subtle"
                  icon={<ChevronDown className="size-icon-small" />}
                  label={label ?? t("showOptions")}
                />
              }
            />
          )}
          {showClear && <ComboboxClear disabled={disabled} />}
        </InputGroupAddon>
      )}
      {children}
    </Primitive.InputGroup>
  );
}

const iconControl =
  "inline-flex size-control-small shrink-0 items-center justify-center rounded-small icon-subtle outline-none hover:bg-neutral-subtle-hovered focus-visible:outline-focused disabled:cursor-not-allowed disabled:text-disabled data-[disabled]:text-disabled";

export function ComboboxTrigger({ className, children, ...props }: ComboboxTriggerProps) {
  return (
    <Primitive.Trigger
      {...props}
      data-slot="combobox-trigger"
      className={classes(iconControl, className)}
    >
      {children}
      <ChevronDown aria-hidden="true" className="size-icon-small" />
    </Primitive.Trigger>
  );
}

type Anchor = ComboboxContentProps["anchor"];

/** The anchor as an element, when it is one or a ref to one; a function or a virtual element is not. */
function anchorElement(anchor: Anchor | RefObject<HTMLElement | null>): HTMLElement | null {
  if (!anchor || typeof anchor !== "object") return null;
  if (anchor instanceof HTMLElement) return anchor;
  if ("current" in anchor) return anchor.current instanceof HTMLElement ? anchor.current : null;
  return null;
}

/**
 * Reports the anchor's layout width while the popup is open. Base UI's `--anchor-width` is the
 * anchor's on-screen box, which a transform changes: opened while its dialog is still scaling in,
 * the popup would follow every frame of the entrance, and a list that changes height as the reader
 * types would resize the popup inside the same ResizeObserver pass that measured it (a loop
 * Chromium reports). The layout width holds still through a transform.
 */
function AnchorWidth({
  anchor,
  onWidth,
}: {
  anchor: Anchor | RefObject<HTMLElement | null>;
  onWidth: (width: number | undefined) => void;
}) {
  useLayoutEffect(() => {
    const element = anchorElement(anchor);
    if (!element) {
      onWidth(undefined);
      return undefined;
    }
    const width = parseFloat(getComputedStyle(element).width);
    onWidth(Number.isFinite(width) ? width : undefined);
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.borderBoxSize?.[0];
      onWidth(box ? box.inlineSize : element.offsetWidth);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [anchor, onWidth]);
  return null;
}

/**
 * Popup with a collision-aware positioner and portal; DOM props/ref target Popup. It is as wide as
 * its anchor (the input group, or `anchor`), measured without transforms.
 */
export function ComboboxContent({
  side = "bottom",
  align = "start",
  sideOffset = 4,
  alignOffset = 0,
  anchor,
  portalContainer,
  keepMounted,
  className,
  style,
  children,
  ...props
}: ComboboxContentProps) {
  const { direction, inputGroup } = useContext(ComboboxContext);
  const [anchorWidth, setAnchorWidth] = useState<number | undefined>(undefined);
  const defaults = {
    width: anchorWidth === undefined ? "var(--anchor-width)" : `${anchorWidth}px`,
    maxWidth: "var(--available-width)",
    maxHeight: "var(--available-height)",
  };
  return (
    <>
      <Primitive.Portal container={portalContainer} keepMounted={keepMounted}>
        <Primitive.Positioner
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          anchor={anchor}
          positionMethod="fixed"
          className="z-overlay isolate"
        >
          <Primitive.Popup
            dir={direction}
            className={classes(
              "flex min-w-0 flex-col overflow-hidden rounded-large border border-default bg-surface-overlay font-body text-default shadow-overlay outline-none data-[open]:animate-enter data-[closed]:animate-exit",
              className,
            )}
            style={
              typeof style === "function"
                ? (state) => ({ ...defaults, ...style(state) })
                : { ...defaults, ...style }
            }
            {...props}
            data-slot="combobox-content"
          >
            <InPopupContext.Provider value={true}>
              {children}
              <AnchorWidth anchor={anchor ?? inputGroup} onWidth={setAnchorWidth} />
            </InPopupContext.Provider>
          </Primitive.Popup>
        </Primitive.Positioner>
      </Primitive.Portal>
    </>
  );
}

/**
 * The options, named by the field's label (or the input's own name outside a Field), in a
 * Scroller: hover arrows at an edge that can still scroll, and the native scrollbar for a list
 * too long to cross by hovering. The List is the scroll element, so a virtualizer can take its ref.
 */
export function ComboboxList({ className, style, ...props }: ComboboxListProps) {
  const { t } = useLedgerLocale();
  const field = useFieldControlState();
  const { naming, grid } = useContext(ComboboxContext);
  const defaults = { maxHeight: "min(var(--ds-dimension-layout-panel), var(--available-height))" };
  const labelledBy = props["aria-labelledby"] ?? naming.labelledBy ?? field.labelId;
  const label = labelledBy ? undefined : (props["aria-label"] ?? naming.label ?? t("options"));
  return (
    <Scroller orientation="vertical" surface="overlay">
      <ScrollerViewport
        render={
          <Primitive.List
            className={classes("overscroll-none p-050 outline-none empty:p-0", className)}
            style={
              typeof style === "function"
                ? (state) => ({ ...defaults, ...style(state) })
                : { ...defaults, ...style }
            }
            {...props}
            data-slot="combobox-list"
            // Base UI's own values, restated: the Scroller's viewport props must not unset them.
            role={grid ? "grid" : "listbox"}
            tabIndex={-1}
            aria-labelledby={labelledBy}
            aria-label={label}
          />
        }
      />
      <ScrollerArrow edge="start" />
      <ScrollerArrow edge="end" />
    </Scroller>
  );
}

export function ComboboxItem({
  className,
  children,
  description,
  disabledReason,
  disabled,
  "aria-describedby": describedBy,
  ...props
}: ComboboxItemProps) {
  const descriptionId = useId();
  const reason = disabledReason ? disabledReason : undefined;
  const line = reason ?? description;
  const hasLine = line !== undefined && line !== null && line !== false && line !== "";
  return (
    <Primitive.Item
      className={classes(
        cn(
          menuItem,
          menuItemHighlighted,
          menuItemDisabled,
          menuChoiceSelected,
          "relative pe-400 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-small",
        ),
        className,
      )}
      disabled={Boolean(disabled || reason)}
      aria-describedby={hasLine ? joinIds(describedBy, descriptionId) : describedBy}
      {...props}
      data-slot="combobox-item"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Text runs sit in their own shrinkable span, so a long unbroken value wraps in the row. */}
        <div className="flex min-w-0 items-center gap-100 whitespace-normal break-words">
          {wrapText(children)}
        </div>
        {hasLine ? (
          // Hidden from the name; aria-describedby still reads it.
          <span
            id={descriptionId}
            aria-hidden
            data-slot="combobox-item-description"
            className={menuItemDescription}
          >
            {line}
          </span>
        ) : null}
      </div>
      <Primitive.ItemIndicator
        aria-hidden="true"
        className="pointer-events-none absolute end-100 flex size-icon-small items-center"
      >
        <Check className="size-icon-small" />
      </Primitive.ItemIndicator>
    </Primitive.Item>
  );
}

export function ComboboxEmpty({ className, ...props }: ComboboxEmptyProps) {
  return (
    <Primitive.Empty
      className={classes("px-150 py-200 text-center font-body text-subtle empty:p-0", className)}
      {...props}
      data-slot="combobox-empty"
    />
  );
}

/**
 * A polite live message outside the options: loading, a failed search, or with `total`, how many
 * of the matches the list shows.
 */
export function ComboboxStatus({ className, total, children, ...props }: ComboboxStatusProps) {
  const { t, formatNumber } = useLedgerLocale();
  const shown = countOptions(Primitive.useFilteredItems());
  const hasChildren = children !== undefined && children !== null && children !== false;
  const count =
    total !== undefined && total > shown
      ? t("showingOf", { shown: formatNumber(shown), total: formatNumber(total) })
      : null;
  return (
    <Primitive.Status
      className={classes("px-150 py-100 font-body-small text-subtle empty:p-0", className)}
      {...props}
      data-slot="combobox-status"
    >
      {hasChildren ? children : count}
    </Primitive.Status>
  );
}
export function ComboboxGroup({ className, ...props }: ComboboxGroupProps) {
  return (
    <Primitive.Group
      className={classes("min-w-0", className)}
      {...props}
      data-slot="combobox-group"
    />
  );
}
/** A section heading inside the list, the same as SelectLabel's. */
export function ComboboxLabel({ className, ...props }: ComboboxLabelProps) {
  return (
    <Primitive.GroupLabel
      className={classes(menuLabel, className)}
      {...props}
      data-slot="combobox-label"
    />
  );
}
/** A hairline between sections, the same as SelectSeparator's. */
export function ComboboxSeparator({ className, ...props }: ComboboxSeparatorProps) {
  return (
    <Primitive.Separator
      className={classes(menuSeparator, className)}
      {...props}
      data-slot="combobox-separator"
    />
  );
}
export function ComboboxChips({ className, ...props }: ComboboxChipsProps) {
  return (
    <Primitive.Chips
      className={classes(
        "flex min-h-control-medium flex-wrap items-center gap-050 rounded-medium border border-input bg-input p-050 has-[:focus-visible]:border-focused has-[:focus-visible]:outline-field-focused has-[[aria-invalid=true]]:border-danger has-[[aria-invalid=true]]:has-[:focus-visible]:border-danger has-[[aria-invalid=true]]:has-[:focus-visible]:outline-field-danger",
        className,
      )}
      {...props}
      data-slot="combobox-chips"
    />
  );
}
/** One chosen value. Its remove button is named "Remove" and the chip's words ("Remove React"). */
export function ComboboxChip({
  className,
  children,
  showRemove = true,
  label,
  ...props
}: ComboboxChipProps) {
  const words = label ?? (textOf(children, ComboboxChipRemove) || undefined);
  return (
    <ChipLabelContext.Provider value={words}>
      <Primitive.Chip
        className={classes(
          "flex max-w-full items-center gap-050 rounded-small bg-neutral px-075 font-body-small text-default outline-none focus-visible:outline-focused data-[disabled]:text-disabled",
          className,
        )}
        {...props}
        data-slot="combobox-chip"
      >
        {children}
        {showRemove && <ComboboxChipRemove />}
      </Primitive.Chip>
    </ChipLabelContext.Provider>
  );
}
export function ComboboxChipRemove({ className, children, ...props }: ComboboxChipRemoveProps) {
  const { t } = useLedgerLocale();
  const words = useContext(ChipLabelContext);
  return (
    <Primitive.ChipRemove
      aria-label={words ? t("removeNamed", { label: words }) : t("remove")}
      className={classes(iconControl, className)}
      {...props}
      data-slot="combobox-chip-remove"
    >
      {children ?? <X aria-hidden="true" className="size-icon-small" />}
    </Primitive.ChipRemove>
  );
}
/**
 * Clears the value. An icon child replaces the X, and the button is named "Clear" (or its
 * `aria-label`); a text child is the button's visible name.
 */
export function ComboboxClear({
  className,
  children,
  render,
  "aria-label": ariaLabel,
  ...props
}: ComboboxClearProps) {
  const { t } = useLedgerLocale();
  const name = ariaLabel ?? t("clear");
  // An icon, the X by default, makes the input group's square icon button, named by `name`.
  const iconOnly = !render && (children === undefined || isValidElement(children));
  // Visible words name the button themselves; "Clear" in their place would break Label in Name.
  const worded = typeof children === "string" || typeof children === "number";
  return (
    <Primitive.Clear
      {...props}
      data-slot="combobox-clear"
      render={
        iconOnly ? (
          <InputGroupButton
            variant="subtle"
            icon={isValidElement(children) ? children : <X className="size-icon-small" />}
            label={name}
          />
        ) : (
          (render ?? <InputGroupButton variant="subtle" />)
        )
      }
      {...(iconOnly || (worded && ariaLabel === undefined) ? {} : { "aria-label": name })}
      className={classes(worded ? "" : iconControl, className)}
    >
      {iconOnly ? undefined : children}
    </Primitive.Clear>
  );
}

export function ComboboxValue(props: ComboboxValueProps) {
  return <Primitive.Value {...props} data-slot="combobox-value" />;
}
export function ComboboxCollection(props: ComboboxCollectionProps) {
  return <Primitive.Collection {...props} data-slot="combobox-collection" />;
}
export type ComboboxChipsInputProps = Primitive.Input.Props;
export function ComboboxChipsInput({ className, ...props }: ComboboxChipsInputProps) {
  const { setNaming } = useContext(ComboboxContext);
  const labelledBy = props["aria-labelledby"];
  const label = props["aria-label"];
  useLayoutEffect(() => {
    setNaming({ labelledBy, label });
  }, [labelledBy, label, setNaming]);
  return (
    <Primitive.Input
      data-combobox-input=""
      className={classes(
        "min-w-800 flex-1 bg-transparent px-075 py-050 outline-none placeholder:text-subtlest disabled:text-disabled",
        className,
      )}
      {...props}
      data-slot="combobox-chip-input"
    />
  );
}
export function useComboboxAnchor() {
  return useRef<HTMLDivElement | null>(null);
}
