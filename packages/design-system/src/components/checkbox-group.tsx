import { CheckboxGroup as CheckboxGroupPrimitive } from "@base-ui/react/checkbox-group";
import { useContext, useMemo, type ReactNode, type Ref } from "react";

import { useLedgerLocale } from "../lib/locale";
import { Checkbox, type CheckboxProps } from "./checkbox";
import { FieldStateContext, GroupFieldContext, useFieldControlState } from "./controls";
import { Field, FieldLabel, FieldSet } from "./field";

export type CheckboxGroupProps = Omit<CheckboxGroupPrimitive.Props, "render" | "ref"> & {
  ref?: Ref<HTMLFieldSetElement> | undefined;
  /**
   * The `value` of every checkbox in the group. Needed for a CheckboxGroupSelectAll, which ticks
   * them all and shows mixed while only some are ticked.
   */
  allValues?: string[] | undefined;
  /** Disables every checkbox in the group. An ancestor FieldSet's `disabled` also reaches it. */
  disabled?: boolean | undefined;
};

/**
 * Several choices that can each be true, under one legend. Base UI CheckboxGroup rendered as a
 * FieldSet: it owns the ticked values (`value`, `defaultValue`, `onValueChange`), and each
 * Checkbox inside takes a `value`. Start the children with a FieldLegend. Inside a Field, the
 * group takes the Field's hint and error; a required Field requires the group, not each box.
 */
export function CheckboxGroup({
  disabled,
  className,
  children,
  ref,
  ...props
}: CheckboxGroupProps) {
  const control = useFieldControlState();
  const field = useContext(FieldStateContext);
  const resolved = Boolean(disabled || control.disabled);
  const group = useMemo(() => ({ field }), [field]);
  return (
    <GroupFieldContext.Provider value={group}>
      <CheckboxGroupPrimitive
        data-slot="checkbox-group"
        {...props}
        ref={ref as Ref<HTMLDivElement>}
        disabled={resolved}
        className={className}
        render={<FieldSet disabled={resolved} />}
      >
        {children}
      </CheckboxGroupPrimitive>
    </GroupFieldContext.Provider>
  );
}

export type CheckboxGroupSelectAllProps = Omit<CheckboxProps, "parent" | "value" | "children"> & {
  /** The label. Defaults to the locale's "Select all". */
  children?: ReactNode | undefined;
};

/**
 * The select-all box of a CheckboxGroup with `allValues`: ticked when every item is, mixed when
 * some are, and a press ticks or clears them all. A labelled horizontal Field; props reach the
 * Checkbox.
 */
export function CheckboxGroupSelectAll({ children, ...props }: CheckboxGroupSelectAllProps) {
  const { t } = useLedgerLocale();
  return (
    <Field orientation="horizontal" data-slot="checkbox-group-select-all">
      <Checkbox {...props} parent />
      <FieldLabel>{children ?? t("selectAll")}</FieldLabel>
    </Field>
  );
}
