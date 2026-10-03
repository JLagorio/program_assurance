import {
  Children,
  isValidElement,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type ComponentProps,
} from "react";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import {
  FieldSetStateContext,
  FieldStateContext,
  GroupFieldContext,
  type FieldState,
} from "./controls";
import { Separator } from "./separator";

/** A legacy `data-invalid` / `data-disabled` value: absent, or whether it is set. */
const flag = (value: unknown) =>
  value === undefined || value === null
    ? undefined
    : value === true || value === "true" || value === "";

export type FieldSetProps = ComponentProps<"fieldset"> & {
  /**
   * Disables every control in the group, including the Checkbox, Radio and Switch roots a native
   * `<fieldset disabled>` does not reach, and dims the legend and labels. An ancestor FieldSet's
   * or the surrounding Field's `disabled` wins.
   */
  disabled?: boolean | undefined;
  /** Replace the fieldset element, or compose it with another component. */
  render?: FieldsetPrimitive.Root.Props["render"];
};
/** A group of fields or choices under one legend. Base UI Fieldset underneath: a RadioGroup inside is named by the legend. */
export function FieldSet({ className, disabled, render, ...props }: FieldSetProps) {
  const parent = useContext(FieldSetStateContext);
  // A group Field's `disabled` disables its fieldset too, so the legend and every choice are inactive.
  const field = useContext(FieldStateContext);
  const resolved = Boolean(parent?.disabled || disabled || field?.disabled);
  const state = useMemo(() => ({ disabled: resolved }), [resolved]);
  return (
    <FieldSetStateContext.Provider value={state}>
      <FieldsetPrimitive.Root
        {...(props as FieldsetPrimitive.Root.Props)}
        data-slot="field-set"
        disabled={resolved}
        render={render}
        className={cn("flex min-w-0 flex-col gap-100", className)}
      />
    </FieldSetStateContext.Provider>
  );
}

export type FieldLegendProps = ComponentProps<"legend"> & {
  variant?: "legend" | "label" | undefined;
  /**
   * Shows the required marker, as FieldLabel does. Defaults to the `required` of a Field around the
   * FieldSet. In a CheckboxGroup, where no checkbox announces the requirement, the legend also says
   * it to assistive technology (the locale's "(required)").
   */
  required?: boolean | undefined;
};
/** The group's name. Inside a FieldSet it is Base UI's Fieldset.Legend, which also names a RadioGroup in the set. */
export function FieldLegend({
  className,
  variant = "legend",
  required,
  children,
  ...props
}: FieldLegendProps) {
  const { t } = useLedgerLocale();
  const inFieldSet = useContext(FieldSetStateContext) !== null;
  const field = useContext(FieldStateContext);
  const group = useContext(GroupFieldContext);
  const marked = required ?? field?.required;
  // A radio group takes `aria-required`; a checkbox group's role cannot, so its name carries it.
  const spoken = marked && group !== null && group.field === field;
  const classes = cn(
    "group/field-legend font-medium text-subtle group-data-invalid/field:text-danger group-data-disabled/field:text-disabled data-disabled:text-disabled",
    variant === "label" ? "font-body-small" : "font-body",
    className,
  );
  const content = (
    <>
      {children}
      {marked && (
        <span
          aria-hidden="true"
          data-slot="field-required"
          className="ps-050 text-danger group-data-disabled/field-legend:text-disabled"
        >
          *
        </span>
      )}
      {spoken && <span className="sr-only"> {t("requiredGroup")}</span>}
    </>
  );
  if (inFieldSet)
    return (
      <FieldsetPrimitive.Legend
        render={<legend />}
        {...(props as FieldsetPrimitive.Legend.Props)}
        data-slot="field-legend"
        data-variant={variant}
        className={classes}
      >
        {content}
      </FieldsetPrimitive.Legend>
    );
  return (
    <legend {...props} data-slot="field-legend" data-variant={variant} className={classes}>
      {content}
    </legend>
  );
}

export type FieldGroupProps = ComponentProps<"div">;
export function FieldGroup({ className, ...props }: FieldGroupProps) {
  return (
    <div
      {...props}
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full min-w-0 flex-col gap-200",
        className,
      )}
    />
  );
}

/* A choice control (Checkbox, Radio, Switch) sits on the first line of its label, however many
   lines the label wraps to: the row aligns to the top, the 16px box and radio fill the label's
   16px line (font.body.small), and beside a medium Switch (20px) the text steps down space.025 so
   its first line centres on the track. Any other control centres on its label. */
const fieldVariants = cva("group/field flex min-w-0 gap-050", {
  variants: {
    orientation: {
      vertical: "flex-col",
      horizontal: [
        "flex-row items-center gap-100 has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto",
        "has-[>[data-slot=checkbox],>[data-slot=radio-group-item],>[data-slot=switch]]:items-start",
        "has-[>[data-slot=switch][data-size=medium]]:*:data-[slot=field-label]:pt-025 has-[>[data-slot=switch][data-size=medium]]:*:data-[slot=field-content]:pt-025",
      ],
      responsive: [
        "flex-col @md/field-group:flex-row @md/field-group:items-center @md/field-group:gap-100 @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto",
        "@md/field-group:has-[>[data-slot=checkbox],>[data-slot=radio-group-item],>[data-slot=switch]]:items-start",
        "@md/field-group:has-[>[data-slot=switch][data-size=medium]]:*:data-[slot=field-label]:pt-025 @md/field-group:has-[>[data-slot=switch][data-size=medium]]:*:data-[slot=field-content]:pt-025",
      ],
    },
  },
  defaultVariants: { orientation: "vertical" },
});

type FieldRootOptions = Pick<
  FieldPrimitive.Root.Props,
  | "name"
  | "validate"
  | "validationMode"
  | "validationDebounceTime"
  | "actionsRef"
  | "dirty"
  | "touched"
>;

/**
 * One control with its label, hint and error. Base UI Field underneath: the FieldLabel, the
 * FieldDescription and FieldError ids reach the control (`htmlFor`, `aria-labelledby`,
 * `aria-describedby`) without ids or ARIA written by hand, and `invalid`, `disabled` and
 * `required` reach Input, Textarea, InputGroupInput, the Select trigger, the Combobox input,
 * Checkbox, RadioGroup and Switch. Explicit ids and ARIA on the parts still win.
 */
export type FieldProps = ComponentProps<"div"> &
  VariantProps<typeof fieldVariants> &
  FieldRootOptions & {
    /**
     * Marks the field invalid: the control gets `aria-invalid` and `data-invalid`, and the label
     * and FieldError the danger colour. Pass it from the form library (TanStack Form:
     * `isTouched && !isValid`). Defaults to true while a FieldError inside shows a message, and to
     * Base UI's own result when `validate` or a native constraint fails.
     */
    invalid?: boolean | undefined;
    /**
     * Disables the control and dims the label. A FieldSet's `disabled` also reaches it, and so does
     * an ancestor Field's, so each choice in its own Field follows a disabled group Field.
     */
    disabled?: boolean | undefined;
    /**
     * Announces the requirement on the control (`aria-required`) and shows the FieldLabel's or
     * FieldLegend's asterisk. It is not a native constraint: the form library checks it, or the
     * control's own `required` makes Base UI and the browser check it. A group Field requires the
     * group, not every checkbox in it.
     */
    required?: boolean | undefined;
    /** Replace the field's element, or compose it with another component. */
    render?: FieldPrimitive.Root.Props["render"];
    /** Earlier callers set this by hand; it is still read as `invalid`. Prefer `invalid`. */
    "data-invalid"?: boolean | "true" | "false" | undefined;
    /** Dims the label without disabling the control, for a control disabled on its own. Prefer `disabled`. */
    "data-disabled"?: boolean | "true" | "false" | "" | undefined;
  };
export function Field({
  className,
  orientation = "vertical",
  invalid,
  disabled,
  required,
  render,
  "data-invalid": dataInvalid,
  "data-disabled": dataDisabled,
  ...props
}: FieldProps) {
  // A nested Field (a choice in a group Field) follows the group's `disabled`, as Base UI's Field.Item does.
  const parentDisabled = useContext(FieldStateContext)?.disabled;
  const resolvedDisabled = disabled || parentDisabled || undefined;
  const [shownErrors, setShownErrors] = useState(0);
  const [labelId, setLabelId] = useState<string | undefined>();
  const registerError = useCallback(() => {
    setShownErrors((count) => count + 1);
    return () => setShownErrors((count) => count - 1);
  }, []);
  const registerLabel = useCallback((id: string) => {
    setLabelId(id);
    return () => setLabelId((current) => (current === id ? undefined : current));
  }, []);
  const state = useMemo<FieldState>(
    () => ({ required, disabled: resolvedDisabled, registerError, labelId, registerLabel }),
    [required, resolvedDisabled, registerError, labelId, registerLabel],
  );
  const resolvedInvalid = invalid ?? flag(dataInvalid) ?? (shownErrors > 0 ? true : undefined);
  // A group only when it is named: the label already names the one control inside.
  const named = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
  return (
    <FieldStateContext.Provider value={state}>
      <FieldPrimitive.Root
        {...(named ? { role: "group" } : {})}
        data-slot="field"
        data-orientation={orientation}
        {...(flag(dataDisabled) ? { "data-disabled": "" } : {})}
        {...(props as FieldPrimitive.Root.Props)}
        invalid={resolvedInvalid}
        disabled={resolvedDisabled}
        render={render}
        className={cn(fieldVariants({ orientation }), className)}
      />
    </FieldStateContext.Provider>
  );
}

export type FieldContentProps = ComponentProps<"div">;
export function FieldContent({ className, ...props }: FieldContentProps) {
  return (
    <div
      {...props}
      data-slot="field-content"
      className={cn("group/field-content flex min-w-0 flex-1 flex-col gap-025", className)}
    />
  );
}

/** The label: a native label. Inside a Field it is Base UI's Field.Label, tied to the control without `htmlFor`. */
export type FieldLabelProps = ComponentProps<"label"> & {
  /**
   * Shows the required marker, an asterisk hidden from assistive technology (the control
   * announces the requirement). Defaults to the Field's `required`; `false` hides it where most of
   * a form is required and only the optional fields are marked.
   */
  required?: boolean | undefined;
};
export function FieldLabel({ className, required, children, id, ...props }: FieldLabelProps) {
  const field = useContext(FieldStateContext);
  const generatedId = useId();
  const labelId = id ?? generatedId;
  // A label wrapping a Field is a choice card: its Field owns its own label association.
  const wrapsField = Children.toArray(children).some(
    (child) => isValidElement(child) && child.type === Field,
  );
  const marked = !wrapsField && (required ?? field?.required);
  const bound = Boolean(field) && !wrapsField;
  const registerLabel = field?.registerLabel;
  useLayoutEffect(
    () => (bound && registerLabel ? registerLabel(labelId) : undefined),
    [bound, registerLabel, labelId],
  );
  const classes = cn(
    // The label dims with its Field, and with a control disabled on its own or by a native
    // fieldset: the control is a child of the Field (or the input of a group that is), so a
    // disabled choice in a group dims only its own label.
    "group/field-label peer/field-label flex w-fit items-center gap-050 font-body-small font-medium text-subtle data-invalid:text-danger data-disabled:text-disabled group-data-disabled/field:text-disabled group-has-[>:disabled,>[data-disabled],>*>[data-slot=input-group-control]:disabled,>*>[data-slot=input-group-control][data-disabled]]/field:text-disabled",
    "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:items-stretch has-[>[data-slot=field]]:rounded-medium has-[>[data-slot=field]]:border has-[>[data-slot=field]]:border-default has-[>[data-slot=field]]:p-150 has-[>[data-slot=field]]:transition-colors has-[>[data-slot=field]]:duration-fast has-[>[data-slot=field]]:ease-standard has-[>[data-slot=field]]:not-has-[:disabled,[aria-disabled=true]]:hover:bg-neutral-subtle-hovered has-[>[data-slot=field]]:has-[:focus-visible]:outline-focused has-[>[data-slot=field]]:**:data-[slot=checkbox]:outline-none has-[>[data-slot=field]]:**:data-[slot=radio-group-item]:outline-none has-[>[data-slot=field]]:**:data-[slot=switch]:outline-none has-[>[data-slot=field]]:has-data-checked:border-selected has-[>[data-slot=field]]:has-data-checked:bg-selected has-[>[data-slot=field]]:has-data-checked:not-has-[:disabled,[aria-disabled=true]]:hover:bg-selected-hovered has-[>[data-slot=field][data-invalid]]:border-danger",
    "has-[>[data-slot=field]]:has-[:disabled,[aria-disabled=true]]:border-disabled has-[>[data-slot=field]]:has-[:disabled,[aria-disabled=true]]:bg-disabled has-[>[data-slot=field]]:has-[:disabled,[aria-disabled=true]]:cursor-not-allowed",
    className,
  );
  const content = (
    <>
      {children}
      {marked && (
        <span
          aria-hidden="true"
          data-slot="field-required"
          className="text-danger group-data-disabled/field-label:text-disabled group-has-[>:disabled,>[data-disabled],>*>[data-slot=input-group-control]:disabled,>*>[data-slot=input-group-control][data-disabled]]/field:text-disabled"
        >
          *
        </span>
      )}
    </>
  );
  if (bound)
    return (
      <FieldPrimitive.Label {...props} data-slot="field-label" id={labelId} className={classes}>
        {content}
      </FieldPrimitive.Label>
    );
  return (
    <label {...props} data-slot="field-label" id={id} className={classes}>
      {content}
    </label>
  );
}

export type FieldTitleProps = ComponentProps<"div">;
/**
 * A choice card's title, when a FieldLabel wrapping the card already makes a click anywhere on it
 * choose. Inside the card's Field it names the control on its own (`aria-labelledby`), so the
 * FieldDescription beside it describes the control once instead of also becoming its name.
 */
export function FieldTitle({ className, onClick, onPointerDown, ...props }: FieldTitleProps) {
  const field = useContext(FieldStateContext);
  const classes = cn(
    "flex w-fit items-center gap-050 font-body-small font-medium text-subtle group-data-invalid/field:text-danger group-data-disabled/field:text-disabled",
    className,
  );
  if (field)
    return (
      <FieldPrimitive.Label
        nativeLabel={false}
        render={<div />}
        {...(props as FieldPrimitive.Label.Props)}
        data-slot="field-title"
        // The wrapping label chooses; the title only names. Base UI's own label handlers would
        // move focus on press, so they are skipped; the caller's own handlers still run.
        onClick={(event) => {
          event.preventBaseUIHandler();
          (onClick as FieldPrimitive.Label.Props["onClick"])?.(event);
        }}
        onPointerDown={(event) => {
          event.preventBaseUIHandler();
          (onPointerDown as FieldPrimitive.Label.Props["onPointerDown"])?.(event);
        }}
        className={classes}
      />
    );
  return (
    <div
      {...props}
      {...(onClick ? { onClick } : {})}
      {...(onPointerDown ? { onPointerDown } : {})}
      data-slot="field-title"
      className={classes}
    />
  );
}

/** A hint. Inside a Field it is Base UI's Field.Description: the control is described by it without `aria-describedby`. */
export type FieldDescriptionProps = ComponentProps<"p">;
export function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  const field = useContext(FieldStateContext);
  const classes = cn(
    // On a chosen card's selected fill the hint keeps its neutral colour one step darker, so it
    // reads as a hint and holds 4.5:1 on the fill.
    "font-body-small text-subtlest text-start group-has-data-checked/field-label:not-group-data-disabled/field:text-subtle [&>a]:underline [&>a]:underline-offset-2 [&>a:hover]:text-default",
    className,
  );
  if (field)
    return (
      <FieldPrimitive.Description {...props} data-slot="field-description" className={classes} />
    );
  return <p {...props} data-slot="field-description" className={classes} />;
}

export type FieldSeparatorProps = ComponentProps<"div">;
export function FieldSeparator({ children, className, ...props }: FieldSeparatorProps) {
  return (
    <div
      {...props}
      data-slot="field-separator"
      data-content={!!children}
      className={cn("flex min-h-250 items-center gap-100 font-body-small", className)}
    >
      <Separator isDecorative className="min-w-0 flex-1" />
      {children && (
        <span data-slot="field-separator-content" className="min-w-0 text-center text-subtlest">
          {children}
        </span>
      )}
      {children && <Separator isDecorative className="min-w-0 flex-1" />}
    </div>
  );
}

export type FieldErrorProps = ComponentProps<"div"> & {
  /** Messages from a form library (TanStack Form's `field.state.meta.errors`); duplicates and empty entries drop out. Children win. */
  errors?: Array<{ message?: string | undefined } | undefined> | undefined;
  /**
   * Base UI validation inside a Field: the validity state that shows this message
   * (`"valueMissing"`, `"typeMismatch"`, …). Without it, a FieldError with messages always shows
   * them and marks the Field invalid, and one without shows Base UI's message whenever the Field
   * fails its `validate` or a native constraint.
   */
  match?: FieldPrimitive.Error.Props["match"];
};
/**
 * What fixes the field. Not a live region: focus moves to the first invalid control on submit and
 * the control is described by the message, so it is read once. Inside a Field it is Base UI's
 * Field.Error, tied to the control without `aria-describedby`.
 */
export function FieldError({ className, children, errors, match, ...props }: FieldErrorProps) {
  const field = useContext(FieldStateContext);
  const content = useMemo(() => {
    if (children) return children;
    const messages = [...new Set(errors?.map((error) => error?.message).filter(Boolean))];
    if (!messages.length) return null;
    if (messages.length === 1) return messages[0];
    return (
      <ul className="flex list-disc flex-col gap-025 ps-200">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    );
  }, [children, errors]);
  const shown = Boolean(content) && match === undefined;
  const registerError = field?.registerError;
  useLayoutEffect(
    () => (shown && registerError ? registerError() : undefined),
    [shown, registerError],
  );
  const classes = cn("font-body-small text-danger", className);
  if (field) {
    const text = content ? { children: content } : {};
    return (
      <FieldPrimitive.Error
        {...(props as FieldPrimitive.Error.Props)}
        {...text}
        {...(match !== undefined ? { match } : content ? { match: true } : {})}
        data-slot="field-error"
        className={classes}
      />
    );
  }
  if (!content) return null;
  return (
    <div {...props} data-slot="field-error" className={classes}>
      {content}
    </div>
  );
}
