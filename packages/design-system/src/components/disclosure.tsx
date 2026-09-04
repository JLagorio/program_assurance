import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { Count } from "./badge";

/* Reference material: present, addressable, closed. Collapsible is one section; Accordion is
   several that know about each other. Both share one trigger row so a page can mix them. The row
   is the title, flush with the body under it and semibold so it reads as a section, a count after
   it, and the chevron at the end: down while closed, up while open. */

const trigger =
  "group/disclosure flex w-full items-center gap-100 rounded-small py-100 text-left outline-none focus-visible:outline-focused";

function TriggerRow({
  title,
  count,
}: {
  title: ReactNode;
  count?: number | string | null | undefined;
}) {
  return (
    <>
      <span className="min-w-0 truncate font-body font-semibold text-default">{title}</span>
      {count !== undefined && count !== null && count !== 0 ? (
        <Count value={typeof count === "number" ? count : Number(count) || 0} />
      ) : null}
      <ChevronDown className="ms-auto size-icon-small shrink-0 icon-subtle transition-transform duration-fast ease-standard group-data-[state=open]/disclosure:rotate-180" />
    </>
  );
}

export type CollapsibleProps = {
  title: ReactNode;
  count?: number | string | null | undefined;
  defaultOpen?: boolean | undefined;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  className?: string | undefined;
  /** The trigger and the body inset by space.300, for a surface whose rules run edge to edge. */
  inset?: boolean | undefined;
  children: ReactNode;
};

/** One section that opens and closes. Radix underneath for aria-expanded and the keyboard; uncontrolled unless `open` is passed. */
export function Collapsible({
  title,
  count,
  defaultOpen = false,
  open,
  onOpenChange,
  className,
  inset,
  children,
}: CollapsibleProps) {
  return (
    <CollapsiblePrimitive.Root
      {...(open === undefined ? { defaultOpen } : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
      className={cn("border-t border-default", className)}
    >
      <CollapsiblePrimitive.Trigger className={cn(trigger, inset && "px-300")}>
        <TriggerRow title={title} count={count} />
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content className={cn("pb-200", inset && "px-300")}>
        {children}
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}

export type AccordionProps = {
  /** `single` opens one at a time and lets the open one close; `multiple` is independent sections with one keyboard model. */
  type?: "single" | "multiple" | undefined;
  defaultValue?: string | string[] | undefined;
  value?: string | string[] | undefined;
  onValueChange?: ((value: string | string[]) => void) | undefined;
  className?: string | undefined;
  children: ReactNode;
};

function AccordionRoot({
  type = "single",
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}: AccordionProps) {
  const shared = { className: cn("border-b border-default", className), children };
  if (type === "multiple") {
    const many = (v: string | string[] | undefined) =>
      v === undefined ? undefined : Array.isArray(v) ? v : [v];
    return (
      <AccordionPrimitive.Root
        type="multiple"
        {...(value === undefined
          ? { defaultValue: many(defaultValue) ?? [] }
          : { value: many(value) ?? [] })}
        {...(onValueChange ? { onValueChange } : {})}
        {...shared}
      />
    );
  }
  const one = (v: string | string[] | undefined) =>
    v === undefined ? undefined : Array.isArray(v) ? (v[0] ?? "") : v;
  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      {...(value === undefined
        ? { defaultValue: one(defaultValue) ?? "" }
        : { value: one(value) ?? "" })}
      {...(onValueChange ? { onValueChange } : {})}
      {...shared}
    />
  );
}

function AccordionItem({
  value,
  title,
  count,
  inset,
  className,
  children,
}: {
  value: string;
  title: ReactNode;
  count?: number | string | null | undefined;
  /** The trigger and the body inset by space.300, for a surface whose rules run edge to edge. */ inset?:
    boolean | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <AccordionPrimitive.Item value={value} className={cn("border-t border-default", className)}>
      <AccordionPrimitive.Header asChild>
        <div>
          <AccordionPrimitive.Trigger className={cn(trigger, inset && "px-300")}>
            <TriggerRow title={title} count={count} />
          </AccordionPrimitive.Trigger>
        </div>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="overflow-hidden data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out">
        <div className={cn("pb-200", inset && "px-300")}>{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}

export const Accordion = Object.assign(AccordionRoot, { Item: AccordionItem });
