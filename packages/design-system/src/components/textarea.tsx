import { Field as FieldPrimitive } from "@base-ui/react/field";
import { type ComponentProps } from "react";
import { cn } from "../lib/cn";
import { controlBase, useFieldControlState } from "./controls";

export type TextareaProps = ComponentProps<"textarea">;

/**
 * Several lines of text. A native textarea on Base UI's Field.Control, so inside a Field it takes
 * the label, hint and error ids and the Field's `invalid`, `disabled` and `required`, as Input
 * does. Explicit ids and ARIA still win.
 */
export function Textarea({ className, ...props }: TextareaProps) {
  const field = useFieldControlState();
  return (
    <FieldPrimitive.Control
      data-slot="textarea"
      render={<textarea />}
      {...(props as unknown as FieldPrimitive.Control.Props)}
      {...(field.required && props["aria-required"] === undefined ? { "aria-required": true } : {})}
      className={cn(controlBase, "flex min-h-800 resize-y py-075", className)}
    />
  );
}
