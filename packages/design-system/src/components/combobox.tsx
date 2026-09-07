"use client";

import { Combobox as Primitive } from "@base-ui/react/combobox";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Check, ChevronDown, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { controlBase, controlHeight, useFieldControl, type ControlSize } from "./controls";

export type ComboboxOption = {
  /** The value the Combobox reports. */
  value: string;
  /** The option's text, in the list and in the field once chosen. */
  label: string;
  /** Extra text the filter matches but does not show: an id, an alias, a role. */
  keywords?: string | undefined;
  /** A short hint at the end of the row: a kind, a count, a role. A word or two. */
  meta?: ReactNode;
  /** A choice the reader cannot make yet, kept in the list so they know it exists. */
  disabled?: boolean | undefined;
};

type ComboboxOwnProps = {
  /** The options, every one known before the list opens. */
  options: ComboboxOption[];
  /** The controlled value participates in native form submission when named. */
  name?: string | undefined;
  form?: string | undefined;
  /** The chosen value. The Combobox is always controlled. */
  value?: string | undefined;
  /** Called with the chosen option value, or an empty string when cleared. */
  onChange: (value: string) => void;
  /** What the field says with nothing chosen: "Choose an owner". */
  placeholder?: string | undefined;
  /** @deprecated Use placeholder. This is a fallback for the same editable field. */
  searchPlaceholder?: string | undefined;
  /** What the list says when nothing matches. A sentence. */
  empty?: ReactNode;
  /** `medium` (32px) in a form; `small` (28px) in a toolbar. */
  size?: ControlSize | undefined;
  /** The width in pixels of the field and its list. In a form the column sets the field and the list matches. */
  width?: number | undefined;
  /** Not available. The last resort. */
  disabled?: boolean | undefined;
  /** Open on first render; for a page that exists to make this choice, and for the docs. */
  defaultOpen?: boolean | undefined;
  /** Layout and appearance on the input group. Native attributes and ref target the input. */
  className?: string | undefined;
  /** Layout and appearance on the input group; width overrides style.width. */
  style?: ComponentProps<"div">["style"];
  /** The name, when there is no Field around it. */
  id?: string | undefined;
  "aria-labelledby"?: string | undefined;
  "aria-label"?: string | undefined;
  /** Set by the Field from `error`; the border turns. */
  "aria-invalid"?: boolean | undefined;
  /** Set by the Field from `isRequired`. */
  "aria-required"?: boolean | undefined;
  /** Set by the Field: the hint or the error is the control's description. */
  "aria-describedby"?: string | undefined;
};

export type ComboboxProps = ComboboxOwnProps &
  Omit<ComponentProps<"input">, keyof ComboboxOwnProps | "children" | "type" | "defaultValue">;

/** Base UI's generic selection, filtering, form and popup state. Root has no DOM element. */
export type ComboboxRootProps<
  Value,
  Multiple extends boolean | undefined = false,
> = Primitive.Root.Props<Value, Multiple> & {
  /** Defaults to LedgerProvider's direction, including keyboard and popup positioning. */
  dir?: "ltr" | "rtl" | undefined;
};
export type ComboboxInputProps = Omit<ComponentProps<typeof Primitive.Input>, "size"> & {
  size?: ControlSize | undefined;
};
export type ComboboxInputGroupProps = ComponentProps<typeof Primitive.InputGroup>;
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
export type ComboboxGroupLabelProps = ComponentProps<typeof Primitive.GroupLabel>;
export type ComboboxCollectionProps = ComponentProps<typeof Primitive.Collection>;
export type ComboboxValueProps = ComponentProps<typeof Primitive.Value>;
export type ComboboxSeparatorProps = ComponentProps<typeof Primitive.Separator>;
export type ComboboxChipsProps = ComponentProps<typeof Primitive.Chips>;
export type ComboboxChipProps = ComponentProps<typeof Primitive.Chip>;
export type ComboboxChipRemoveProps = ComponentProps<typeof Primitive.ChipRemove>;
export type ComboboxClearProps = ComponentProps<typeof Primitive.Clear>;
export type ComboboxStatusProps = ComponentProps<typeof Primitive.Status>;

const DirectionContext = createContext<"ltr" | "rtl">("ltr");
const PopupContext = createContext(false);

function ComboboxRoot<Value, Multiple extends boolean | undefined = false>({
  dir,
  locale,
  value,
  defaultValue,
  onValueChange,
  inputRef,
  ...props
}: ComboboxRootProps<Value, Multiple>) {
  type Selection = ComboboxRootProps<Value, Multiple>["value"];
  const [uncontrolledValue, setUncontrolledValue] = useState<Selection>(
    () => defaultValue ?? ((props.multiple ? [] : null) as Selection),
  );
  const [owningForm, setOwningForm] = useState<HTMLFormElement | null>(null);
  const bindInput = useCallback(
    (node: HTMLInputElement | null) => {
      setOwningForm(node?.form ?? null);
      if (typeof inputRef === "function") return inputRef(node);
      if (inputRef) inputRef.current = node;
    },
    [inputRef, props.form],
  );
  useEffect(() => {
    if (!owningForm || value !== undefined) return;
    const reset = (event: Event) => {
      // Let an application cancel the native reset before changing selection.
      queueMicrotask(() => {
        if (!event.defaultPrevented)
          setUncontrolledValue(defaultValue ?? ((props.multiple ? [] : null) as Selection));
      });
    };
    owningForm.addEventListener("reset", reset);
    return () => owningForm.removeEventListener("reset", reset);
  }, [owningForm, value, defaultValue, props.multiple]);
  const ledger = useLedgerLocale();
  const direction = dir ?? ledger.direction;
  return (
    <DirectionContext.Provider value={direction}>
      <DirectionProvider direction={direction}>
        <Primitive.Root<Value, Multiple>
          locale={locale ?? ledger.locale}
          {...props}
          inputRef={bindInput}
          value={value === undefined ? uncontrolledValue : value}
          onValueChange={(next, details) => {
            onValueChange?.(next, details);
            if (!details.isCanceled && value === undefined) setUncontrolledValue(next);
          }}
        />
      </DirectionProvider>
    </DirectionContext.Provider>
  );
}

/** Native search input. Optional surrounding InputGroup supplies a shared border with Trigger/Clear. */
function ComboboxInput({ size = "medium", className, ...props }: ComboboxInputProps) {
  const inPopup = useContext(PopupContext);
  const bound = useFieldControl(props);
  return (
    <Primitive.Input
      data-slot="combobox-input"
      className={classes(
        cn(controlBase, controlHeight[size], "min-w-0", inPopup ? "flex-none" : "flex-1"),
        className,
      )}
      {...(inPopup ? props : bound)}
    />
  );
}

function ComboboxInputGroup({ className, ...props }: ComboboxInputGroupProps) {
  return (
    <Primitive.InputGroup
      data-slot="combobox-input-group"
      className={classes(
        "flex min-w-0 items-center rounded-medium border border-input bg-input pe-050 has-[:focus-visible]:border-focused has-[:focus-visible]:outline-focused has-[[aria-invalid=true]]:border-danger data-[disabled]:border-disabled data-[disabled]:bg-disabled [&_[data-slot=combobox-input]]:border-0 [&_[data-slot=combobox-input]]:bg-transparent [&_[data-slot=combobox-input]]:outline-none",
        className,
      )}
      {...props}
    />
  );
}

const iconControl =
  "inline-flex size-control-small shrink-0 items-center justify-center rounded-small icon-subtle outline-none hover:bg-neutral-subtle-hovered focus-visible:outline-focused disabled:cursor-not-allowed disabled:text-disabled data-[disabled]:text-disabled";

function ComboboxTrigger({ className, children, ...props }: ComboboxTriggerProps) {
  return (
    <Primitive.Trigger
      data-slot="combobox-trigger"
      className={classes(iconControl, className)}
      {...props}
    >
      {children ?? <ChevronDown aria-hidden="true" className="size-icon-small" />}
    </Primitive.Trigger>
  );
}

/** Popup with a collision-aware positioner and portal; DOM props/ref target Popup. */
function ComboboxContent({
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
  const [enclosingDialog, setEnclosingDialog] = useState<HTMLElement | null>(null);
  const locateDialog = useCallback((node: HTMLSpanElement | null) => {
    setEnclosingDialog(node?.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ?? null);
  }, []);
  const defaults = {
    width: "var(--anchor-width)",
    maxWidth: "var(--available-width)",
    maxHeight: "var(--available-height)",
  };
  return (
    <>
      <span hidden ref={locateDialog} />
      <Primitive.Portal
        container={portalContainer === undefined ? (enclosingDialog ?? undefined) : portalContainer}
        keepMounted={keepMounted}
      >
        <Primitive.Positioner
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          anchor={anchor}
          positionMethod="fixed"
          className="z-50 isolate"
        >
          <PopupContext.Provider value={true}>
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
          </PopupContext.Provider>
        </Primitive.Positioner>
      </Primitive.Portal>
    </>
  );
}

function ComboboxList({ className, style, ...props }: ComboboxListProps) {
  const defaults = { maxHeight: "min(var(--ds-dimension-layout-panel), var(--available-height))" };
  const bound = useFieldControl(props);
  const { t } = useLedgerLocale();
  return (
    <Primitive.List
      aria-labelledby={bound["aria-labelledby"]}
      aria-label={bound["aria-labelledby"] ? undefined : t("choose")}
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

function ComboboxItem({ className, children, ...props }: ComboboxItemProps) {
  return (
    <Primitive.Item
      data-slot="combobox-item"
      className={classes(
        "relative flex min-h-control-medium cursor-default select-none items-center gap-100 rounded-small px-100 py-050 font-body outline-none data-[highlighted]:bg-selected data-[highlighted]:text-selected data-[disabled]:text-disabled",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <Primitive.ItemIndicator
        aria-hidden="true"
        className="flex size-icon-small shrink-0 items-center"
      >
        <Check className="size-icon-small" />
      </Primitive.ItemIndicator>
    </Primitive.Item>
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxEmptyProps) {
  return (
    <Primitive.Empty
      data-slot="combobox-empty"
      className={classes("px-150 py-200 text-center font-body text-subtle empty:p-0", className)}
      {...props}
    />
  );
}
function ComboboxStatus({ className, ...props }: ComboboxStatusProps) {
  return (
    <Primitive.Status
      data-slot="combobox-status"
      className={classes("px-150 py-100 font-body-small text-subtle empty:p-0", className)}
      {...props}
    />
  );
}
function ComboboxGroup({ className, ...props }: ComboboxGroupProps) {
  return (
    <Primitive.Group
      data-slot="combobox-group"
      className={classes("min-w-0", className)}
      {...props}
    />
  );
}
function ComboboxGroupLabel({ className, ...props }: ComboboxGroupLabelProps) {
  return (
    <Primitive.GroupLabel
      data-slot="combobox-group-label"
      className={classes("px-100 py-100 font-body-small font-medium text-subtle", className)}
      {...props}
    />
  );
}
function ComboboxSeparator({ className, ...props }: ComboboxSeparatorProps) {
  return (
    <Primitive.Separator
      data-slot="combobox-separator"
      className={classes("my-050 h-px bg-border", className)}
      {...props}
    />
  );
}
function ComboboxChips({ className, ...props }: ComboboxChipsProps) {
  return (
    <Primitive.Chips
      data-slot="combobox-chips"
      className={classes(
        "flex min-h-control-medium flex-wrap items-center gap-050 rounded-medium border border-input bg-input p-050 has-[:focus-visible]:border-focused has-[:focus-visible]:outline-focused has-[[aria-invalid=true]]:border-danger [&_[data-slot=combobox-input]]:w-auto [&_[data-slot=combobox-input]]:border-0 [&_[data-slot=combobox-input]]:bg-transparent [&_[data-slot=combobox-input]]:outline-none",
        className,
      )}
      {...props}
    />
  );
}
function ComboboxChip({ className, ...props }: ComboboxChipProps) {
  return (
    <Primitive.Chip
      data-slot="combobox-chip"
      className={classes(
        "flex max-w-full items-center gap-050 rounded-small bg-neutral px-075 font-body-small text-default outline-none focus-visible:outline-focused data-[disabled]:text-disabled",
        className,
      )}
      {...props}
    />
  );
}
function ComboboxChipRemove({ className, children, ...props }: ComboboxChipRemoveProps) {
  return (
    <Primitive.ChipRemove
      data-slot="combobox-chip-remove"
      className={classes(iconControl, className)}
      {...props}
    >
      {children ?? <X aria-hidden="true" className="size-icon-small" />}
    </Primitive.ChipRemove>
  );
}
function ComboboxClear({ className, children, ...props }: ComboboxClearProps) {
  const { t } = useLedgerLocale();
  return (
    <Primitive.Clear
      data-slot="combobox-clear"
      aria-label={t("clear")}
      className={classes(iconControl, className)}
      {...props}
    >
      {children ?? <X aria-hidden="true" className="size-icon-small" />}
    </Primitive.Clear>
  );
}

/** Single selection searched directly in the field, with an options-only popup. */
function ComboboxSelect({
  options,
  name,
  form,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  empty,
  size = "medium",
  width,
  disabled,
  readOnly,
  required,
  defaultOpen = false,
  className,
  style,
  ...inputProps
}: ComboboxProps) {
  const { t, locale } = useLedgerLocale();
  const generatedId = useId();
  const bound = useFieldControl(inputProps);
  const inputId = bound.id ?? generatedId;
  const [open, setOpen] = useState(defaultOpen);
  const { contains } = Primitive.useFilter({ locale });
  return (
    <ComboboxRoot<string>
      items={options.map((option) => option.value)}
      name={name}
      form={form}
      value={value || null}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      open={open && !disabled}
      onOpenChange={(next) => setOpen(next && !disabled)}
      itemToStringLabel={(item) => options.find((option) => option.value === item)?.label ?? ""}
      filter={(item, query) => {
        const option = options.find((option) => option.value === item);
        return Boolean(
          option && contains(`${option.label} ${option.value} ${option.keywords ?? ""}`, query),
        );
      }}
      inputRef={(node) => {
        node?.setAttribute("data-ds-focus-target", inputId);
      }}
      onValueChange={(next) => {
        if (disabled || readOnly || options.find((option) => option.value === next)?.disabled)
          return;
        onChange(next ?? "");
      }}
      dir={inputProps.dir === "rtl" || inputProps.dir === "ltr" ? inputProps.dir : undefined}
    >
      <ComboboxInputGroup
        style={{ ...style, ...(width === undefined ? {} : { width }) }}
        className={cn("w-full", controlHeight[size], className)}
      >
        <ComboboxInput
          {...bound}
          id={inputId}
          size={size}
          placeholder={placeholder ?? searchPlaceholder ?? t("choose")}
          className="h-full"
        />
        <ComboboxTrigger aria-label={t("choose")} className="h-full" />
      </ComboboxInputGroup>
      <ComboboxContent style={width === undefined ? undefined : { width }}>
        <ComboboxList>
          {(item: string) => {
            const option = options.find((option) => option.value === item)!;
            return (
              <ComboboxItem key={item} value={item} disabled={option.disabled}>
                <span className="flex min-w-0 items-center gap-100">
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.meta != null && (
                    <span className="font-body-small text-subtle">{option.meta}</span>
                  )}
                </span>
              </ComboboxItem>
            );
          }}
        </ComboboxList>
        <ComboboxEmpty>{empty ?? t("noMatches")}</ComboboxEmpty>
      </ComboboxContent>
    </ComboboxRoot>
  );
}

export const Combobox = Object.assign(ComboboxSelect, {
  Root: ComboboxRoot,
  Input: ComboboxInput,
  InputGroup: ComboboxInputGroup,
  Trigger: ComboboxTrigger,
  Content: ComboboxContent,
  List: ComboboxList,
  Item: ComboboxItem,
  Empty: ComboboxEmpty,
  Group: ComboboxGroup,
  GroupLabel: ComboboxGroupLabel,
  Collection: Primitive.Collection,
  Value: Primitive.Value,
  Separator: ComboboxSeparator,
  Chips: ComboboxChips,
  Chip: ComboboxChip,
  ChipRemove: ComboboxChipRemove,
  Clear: ComboboxClear,
  Status: ComboboxStatus,
});
