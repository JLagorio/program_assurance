import { type ComponentProps } from "react";
import { cn } from "../lib/cn";
import { controlBase } from "./controls";

export type TextareaProps = ComponentProps<"textarea">;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(controlBase, "flex min-h-800 resize-y py-075", className)}
      {...props}
    />
  );
}
