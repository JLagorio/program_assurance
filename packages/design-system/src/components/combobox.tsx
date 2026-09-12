"use client";

import { Combobox as Primitive } from "@base-ui/react/combobox";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Check, ChevronDown, X } from "lucide-react";
import { createContext, useContext, type ComponentProps, useRef } from "react";
import { cn } from "../lib/cn";
import { menuItem, menuItemHighlighted, menuItemDisabled, menuChoiceSelected } from "./menu";
import { classes } from "../lib/base-ui";
import { useLedgerLocale } from "../lib/locale";
import { type ControlSize } from "./controls";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./input-group";

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
export type ComboboxItemProps = ComponentProps<typeof Primitive.Item>;
export type ComboboxEmptyProps = ComponentProps<typeof Primitive.Empty>;
export type ComboboxGroupProps = ComponentProps<typeof Primitive.Group>;
export type ComboboxLabelProps = ComponentProps<typeof Primitive.GroupLabel>;
export type ComboboxCollectionProps = ComponentProps<typeof Primitive.Collection>;
export type ComboboxValueProps = ComponentProps<typeof Primitive.Value>;
export type ComboboxSeparatorProps = ComponentProps<typeof Primitive.Separator>;
export type ComboboxChipsProps = ComponentProps<typeof Primitive.Chips>;
export type ComboboxChipProps = ComponentProps<typeof Primitive.Chip> & {
  showRemove?: boolean | undefined;
};
export type ComboboxChipRemoveProps = ComponentProps<typeof Primitive.ChipRemove>;
export type ComboboxClearProps = ComponentProps<typeof Primitive.Clear>;
export type ComboboxStatusProps = ComponentProps<typeof Primitive.Status>;

const DirectionContext = createContext<"ltr" | "rtl">("ltr");

export function Combobox<Value, Multiple extends boolean | undefined = false>({
  dir,
  locale,
  ...props
}: ComboboxProps<Value, Multiple>) {
  const ledger = useLedgerLocale();
  const direction = dir ?? ledger.direction;
  return (
    <DirectionContext.Provider value={direction}>
      <DirectionProvider direction={direction}>
        <Primitive.Root<Value, Multiple> locale={locale ?? ledger.locale} {...props} />
      </DirectionProvider>
    </DirectionContext.Provider>
  );
}

/** Search input and its trigger/clear controls, composed with the shared InputGroup. */
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
  return (
    <Primitive.InputGroup render={<InputGroup />}>
      <Primitive.Input
        data-slot="input-group-control"
        data-combobox-input=""
        disabled={disabled}
        className={className}
        render={<InputGroupInput size={size} />}
        {...props}
      />
      {(showTrigger || showClear) && (
        <InputGroupAddon align="inline-end">
          {showTrigger && (
            <InputGroupButton
              size="icon-xs"
              variant="subtle"
              render={<ComboboxTrigger aria-label={t("choose")} />}
              className="group-has-[[data-slot=combobox-clear]]/input-group:hidden"
              disabled={disabled}
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
      data-slot="combobox-trigger"
      className={classes(iconControl, className)}
      {...props}
    >
      {children}
      <ChevronDown aria-hidden="true" className="size-icon-small" />
    </Primitive.Trigger>
  );
}

/** Popup with a collision-aware positioner and portal; DOM props/ref target Popup. */
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
  ...props
}: ComboboxContentProps) {
  const direction = useContext(DirectionContext);
  const defaults = {
    width: "var(--anchor-width)",
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
          className="z-50 isolate"
        >
          <Primitive.Popup
            data-slot="combobox-content"
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
          />
        </Primitive.Positioner>
      </Primitive.Portal>
    </>
  );
}

export function ComboboxList({ className, style, ...props }: ComboboxListProps) {
  const defaults = { maxHeight: "min(var(--ds-dimension-layout-panel), var(--available-height))" };
  const { t } = useLedgerLocale();
  return (
    <Primitive.List
      aria-labelledby={props["aria-labelledby"]}
      aria-label={props["aria-labelledby"] ? undefined : t("choose")}
      data-slot="combobox-list"
      className={classes(
        "min-h-0 overflow-y-auto overscroll-none p-050 outline-none empty:p-0",
        className,
      )}
      style={
        typeof style === "function"
          ? (state) => ({ ...defaults, ...style(state) })
          : { ...defaults, ...style }
      }
      {...props}
    />
  );
}

export function ComboboxItem({ className, children, ...props }: ComboboxItemProps) {
  return (
    <Primitive.Item
      data-slot="combobox-item"
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
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center gap-100 whitespace-normal break-words">
        {children}
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
      data-slot="combobox-empty"
      className={classes("px-150 py-200 text-center font-body text-subtle empty:p-0", className)}
      {...props}
    />
  );
}
export function ComboboxStatus({ className, ...props }: ComboboxStatusProps) {
  return (
    <Primitive.Status
      data-slot="combobox-status"
      className={classes("px-150 py-100 font-body-small text-subtle empty:p-0", className)}
      {...props}
    />
  );
}
export function ComboboxGroup({ className, ...props }: ComboboxGroupProps) {
  return (
    <Primitive.Group
      data-slot="combobox-group"
      className={classes("min-w-0", className)}
      {...props}
    />
  );
}
export function ComboboxLabel({ className, ...props }: ComboboxLabelProps) {
  return (
    <Primitive.GroupLabel
      data-slot="combobox-label"
      className={classes("px-100 py-100 font-body-small font-medium text-subtle", className)}
      {...props}
    />
  );
}
export function ComboboxSeparator({ className, ...props }: ComboboxSeparatorProps) {
  return (
    <Primitive.Separator
      data-slot="combobox-separator"
      className={classes("my-050 h-px bg-border", className)}
      {...props}
    />
  );
}
export function ComboboxChips({ className, ...props }: ComboboxChipsProps) {
  return (
    <Primitive.Chips
      data-slot="combobox-chips"
      className={classes(
        "flex min-h-control-medium flex-wrap items-center gap-050 rounded-medium border border-input bg-input p-050 has-[:focus-visible]:border-focused has-[:focus-visible]:outline-focused has-[[aria-invalid=true]]:border-danger",
        className,
      )}
      {...props}
    />
  );
}
export function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxChipProps) {
  return (
    <Primitive.Chip
      data-slot="combobox-chip"
      className={classes(
        "flex max-w-full items-center gap-050 rounded-small bg-neutral px-075 font-body-small text-default outline-none focus-visible:outline-focused data-[disabled]:text-disabled",
        className,
      )}
      {...props}
    >
      {children}
      {showRemove && <ComboboxChipRemove />}
    </Primitive.Chip>
  );
}
export function ComboboxChipRemove({ className, children, ...props }: ComboboxChipRemoveProps) {
  const { t } = useLedgerLocale();
  return (
    <Primitive.ChipRemove
      data-slot="combobox-chip-remove"
      aria-label={t("clear")}
      className={classes(iconControl, className)}
      {...props}
    >
      {children ?? <X aria-hidden="true" className="size-icon-small" />}
    </Primitive.ChipRemove>
  );
}
export function ComboboxClear({ className, children, ...props }: ComboboxClearProps) {
  const { t } = useLedgerLocale();
  return (
    <Primitive.Clear
      data-slot="combobox-clear"
      render={<InputGroupButton variant="subtle" size="icon-xs" />}
      aria-label={t("clear")}
      className={classes(iconControl, className)}
      {...props}
    >
      {children ?? <X aria-hidden="true" className="size-icon-small" />}
    </Primitive.Clear>
  );
}

export function ComboboxValue(props: ComboboxValueProps) {
  return <Primitive.Value data-slot="combobox-value" {...props} />;
}
export function ComboboxCollection(props: ComboboxCollectionProps) {
  return <Primitive.Collection data-slot="combobox-collection" {...props} />;
}
export type ComboboxChipsInputProps = Primitive.Input.Props;
export function ComboboxChipsInput({ className, ...props }: ComboboxChipsInputProps) {
  return (
    <Primitive.Input
      data-slot="combobox-chip-input"
      data-combobox-input=""
      className={classes(
        "min-w-800 flex-1 bg-transparent px-075 py-050 outline-none placeholder:text-subtlest disabled:text-disabled",
        className,
      )}
      {...props}
    />
  );
}
export function useComboboxAnchor() {
  return useRef<HTMLDivElement | null>(null);
}
