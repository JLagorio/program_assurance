import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field";
import { Minus, Plus } from "lucide-react";
import { useContext, useId, type CSSProperties, type Ref } from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { buttonVariants } from "./button";
import {
  FieldStateContext,
  useFieldControlState,
  controlHeight,
  type ControlSize,
} from "./controls";

/** Props that describe the text box, so they reach the input rather than the root. */
type InputBoundProps = {
  /** An example value, never the label. */
  placeholder?: string | undefined;
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: boolean | "true" | "false" | undefined;
  "aria-required"?: boolean | "true" | "false" | undefined;
  autoFocus?: boolean | undefined;
};

export type NumberFieldProps = Omit<
  NumberFieldPrimitive.Root.Props,
  "className" | "style" | "children" | "ref" | "locale" | keyof InputBoundProps
> &
  InputBoundProps & {
    /** Medium (32px) in a form; small (28px) in a toolbar, a row or a rail. Medium by default. */
    size?: ControlSize | undefined;
    /**
     * The locale that formats and parses the number. Defaults to the closest LedgerProvider's
     * locale (en-US without one), not the browser's, so the server and the client agree.
     */
    locale?: Intl.LocalesArgument | undefined;
    /**
     * Whether the mouse wheel steps the value. It only ever steps the field that has focus and sits
     * under the pointer, so scrolling a form past it never changes it. Off by default.
     */
    allowWheelScrub?: boolean | undefined;
    /** The visible input. `inputRef` is Base UI's hidden input that carries the value in a form. */
    ref?: Ref<HTMLInputElement> | undefined;
    /** Classes for the root, where the field's width is set. */
    className?: string | undefined;
    /** Style for the root, such as a width. */
    style?: CSSProperties | undefined;
  };

/**
 * The frame InputGroup draws, keyed to the one input inside it: border, hover, focus, invalid,
 * disabled and read-only. Base UI's hidden form input sits outside the group.
 */
const frame =
  "relative flex w-full min-w-0 items-center overflow-x-clip rounded-medium border border-input bg-input transition-colors duration-fast ease-standard hover:bg-input-hovered motion-reduce:transition-none has-[input:focus-visible]:border-focused has-[input:focus-visible]:bg-input-pressed has-[input:focus-visible]:outline-field-focused has-[input[aria-invalid=true]]:border-danger has-[input[aria-invalid=true]:focus-visible]:border-danger has-[input[aria-invalid=true]:focus-visible]:outline-field-danger has-[input:disabled]:border-disabled has-[input:disabled]:bg-disabled has-[input[readonly]]:bg-surface-sunken has-[input[readonly]]:hover:bg-surface-sunken";

/** Only the props that are set: Base UI merges an explicit `undefined` over its own value, such as a Field's `aria-invalid`. */
const defined = <T extends Record<string, unknown>>(props: T) =>
  Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

const stepper = cn(
  buttonVariants({ variant: "subtle", size: "xsmall" }),
  "relative touch-target size-control-xsmall shrink-0 p-0 data-[disabled]:cursor-not-allowed",
);

/**
 * A number, typed or stepped, formatted in the reader's locale. Base UI NumberField underneath:
 * arrow keys step by `step` (Shift by `largeStep`, Alt by `smallStep`), Home and End go to `min`
 * and `max`, and the value is clamped to them. The decrement and increment buttons are named from
 * the locale and, inside a Field, by its label too ("Increase Retention"). They are not Tab stops,
 * since the arrow keys do the same, and a touch screen reader reaches them by swiping. Inside a
 * Field it takes the label, hint, error, `invalid`, `disabled` and `required`.
 */
export function NumberField({
  size = "medium",
  locale,
  allowWheelScrub = false,
  readOnly,
  disabled,
  className,
  style,
  ref,
  placeholder,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
  autoFocus,
  ...props
}: NumberFieldProps) {
  const { t, locale: ledgerLocale } = useLedgerLocale();
  const field = useContext(FieldStateContext);
  const { required: fieldRequired, disabled: fieldSetDisabled } = useFieldControlState();
  const decrementId = useId();
  const incrementId = useId();
  const labelId = field?.labelId;
  // The Field's `required` is announced; the Root's own `required` is the native constraint.
  const required = ariaRequired ?? (fieldRequired && !props.required ? true : undefined);
  // A stepper is named by its own words and whatever names the input, in the input's order of
  // precedence: an `aria-labelledby` or a FieldLabel ("Increase Retention"), else `aria-label`.
  const labelledBy = ariaLabelledBy ?? labelId;
  const stepperName = (id: string, direction: "increase" | "decrease") => {
    const own = t(direction === "increase" ? "increaseValue" : "decreaseValue");
    if (labelledBy) return { "aria-label": own, "aria-labelledby": `${id} ${labelledBy}` };
    if (ariaLabel)
      return {
        "aria-label": t(direction === "increase" ? "increaseValueFor" : "decreaseValueFor", {
          label: ariaLabel,
        }),
      };
    return { "aria-label": own };
  };

  return (
    <NumberFieldPrimitive.Root
      {...props}
      locale={locale ?? ledgerLocale}
      allowWheelScrub={allowWheelScrub}
      {...defined({ readOnly, disabled: disabled || fieldSetDisabled || undefined })}
      className={cn("min-w-0", className)}
      style={style}
      data-slot="number-field"
      data-size={size}
    >
      <NumberFieldPrimitive.Group
        data-slot="number-field-group"
        className={cn(frame, controlHeight[size])}
      >
        <NumberFieldPrimitive.Input
          ref={ref}
          {...defined({
            placeholder,
            autoFocus,
            "aria-label": ariaLabel,
            "aria-labelledby": ariaLabelledBy,
            "aria-describedby": ariaDescribedBy,
            "aria-invalid": ariaInvalid,
            "aria-required": required,
          })}
          aria-roledescription={t("numberField")}
          data-slot="number-field-input"
          className="h-full min-w-0 flex-1 bg-transparent px-100 font-body text-default tabular-nums outline-none placeholder:text-subtlest disabled:cursor-not-allowed disabled:text-disabled"
        />
        {readOnly ? null : (
          <span
            data-slot="number-field-steppers"
            className="flex shrink-0 items-center gap-025 pe-050"
          >
            <NumberFieldPrimitive.Decrement
              id={decrementId}
              {...stepperName(decrementId, "decrease")}
              data-slot="number-field-decrement"
              className={stepper}
            >
              <Minus aria-hidden="true" />
            </NumberFieldPrimitive.Decrement>
            <NumberFieldPrimitive.Increment
              id={incrementId}
              {...stepperName(incrementId, "increase")}
              data-slot="number-field-increment"
              className={stepper}
            >
              <Plus aria-hidden="true" />
            </NumberFieldPrimitive.Increment>
          </span>
        )}
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  );
}
