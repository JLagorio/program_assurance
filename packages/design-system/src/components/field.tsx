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
        data-slot="field-set"
        {...(props as FieldsetPrimitive.Root.Props)}
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
        data-slot="field-legend"
        data-variant={variant}
        render={<legend />}
        {...(props as FieldsetPrimitive.Legend.Props)}
        className={classes}
      >
        {content}
      </FieldsetPrimitive.Legend>
    );
  return (
    <legend data-slot="field-legend" data-variant={variant} className={classes} {...props}>
      {content}
    </legend>
  );
}

export type FieldGroupProps = ComponentProps<"div">;
export function FieldGroup({ className, ...props }: FieldGroupProps) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full min-w-0 flex-col gap-200 data-[slot=checkbox-group]:gap-150",
        className,
      )}
      {...props}
    />
  );
}

const fieldVariants = cva("group/field flex min-w-0 gap-050", {
  variants: {
    orientation: {
      vertical: "flex-col",
      horizontal:
        "flex-row items-center gap-100 has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto",
      responsive:
        "flex-col @md/field-group:flex-row @md/field-group:items-center @md/field-group:gap-100 @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto",
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
  return (
    <FieldStateContext.Provider value={state}>
      <FieldPrimitive.Root
        role="group"
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
      data-slot="field-content"
      className={cn("group/field-content flex min-w-0 flex-1 flex-col gap-025", className)}
      {...props}
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
    "group/field-label peer/field-label flex w-fit items-center gap-050 font-body-small font-medium text-subtle data-invalid:text-danger data-disabled:text-disabled group-data-disabled/field:text-disabled peer-disabled:cursor-not-allowed peer-disabled:text-disabled peer-aria-disabled:cursor-not-allowed peer-aria-disabled:text-disabled",
    "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:items-stretch has-[>[data-slot=field]]:rounded-medium has-[>[data-slot=field]]:border has-[>[data-slot=field]]:border-default has-[>[data-slot=field]]:p-150 has-[>[data-slot=field]]:transition-colors has-[>[data-slot=field]]:duration-fast has-[>[data-slot=field]]:ease-standard has-[>[data-slot=field]]:not-has-[:disabled,[aria-disabled=true]]:hover:bg-neutral-subtle-hovered has-[>[data-slot=field]]:has-[:focus-visible]:outline-focused has-[>[data-slot=field]]:has-data-checked:border-selected has-[>[data-slot=field]]:has-data-checked:bg-selected has-[>[data-slot=field]]:has-data-checked:not-has-[:disabled,[aria-disabled=true]]:hover:bg-selected-hovered has-[>[data-slot=field][data-invalid]]:border-danger",
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
          className="text-danger group-data-disabled/field-label:text-disabled"
        >
          *
        </span>
      )}
    </>
  );
  if (bound)
    return (
      <FieldPrimitive.Label data-slot="field-label" id={labelId} className={classes} {...props}>
        {content}
      </FieldPrimitive.Label>
    );
  return (
    <label data-slot="field-label" id={id} className={classes} {...props}>
      {content}
    </label>
  );
}

export type FieldTitleProps = ComponentProps<"div">;
export function FieldTitle({ className, ...props }: FieldTitleProps) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-050 font-body-small font-medium text-subtle group-data-invalid/field:text-danger group-data-disabled/field:text-disabled",
        className,
      )}
      {...props}
    />
  );
}

/** A hint. Inside a Field it is Base UI's Field.Description: the control is described by it without `aria-describedby`. */
export type FieldDescriptionProps = ComponentProps<"p">;
export function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  const field = useContext(FieldStateContext);
  const classes = cn(
    "font-body-small text-subtlest text-start group-has-data-checked/field-label:not-group-data-disabled/field:text-selected [&>a]:underline [&>a]:underline-offset-2 [&>a:hover]:text-default",
    className,
  );
  if (field)
    return (
      <FieldPrimitive.Description data-slot="field-description" className={classes} {...props} />
    );
  return <p data-slot="field-description" className={classes} {...props} />;
}

export type FieldSeparatorProps = ComponentProps<"div">;
export function FieldSeparator({ children, className, ...props }: FieldSeparatorProps) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn("flex min-h-250 items-center gap-100 font-body-small", className)}
      {...props}
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
        data-slot="field-error"
        {...(props as FieldPrimitive.Error.Props)}
        {...text}
        {...(match !== undefined ? { match } : content ? { match: true } : {})}
        className={classes}
      />
    );
  }
  if (!content) return null;
  return (
    <div data-slot="field-error" className={classes} {...props}>
      {content}
    </div>
  );
}
