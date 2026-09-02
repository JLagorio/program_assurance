import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* Several Collapsibles that know about each other. `single` (the default)
   opens one at a time and lets the open one close; `multiple` is independent
   sections with one keyboard model. Same row as Collapsible, so a page can mix
   them. */
function AccordionRoot({
  type = "single",
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}: {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
  children: ReactNode;
}) {
  const shared = { className: cn("border-b border-border", className), children };
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
  children,
}: {
  value: string;
  title: ReactNode;
  count?: number | string | null;
  children: ReactNode;
}) {
  return (
    <AccordionPrimitive.Item value={value} className="border-t border-border">
      <AccordionPrimitive.Header asChild>
        <div>
          <AccordionPrimitive.Trigger className="group/accordion flex w-full items-center gap-2 rounded-sm py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/35">
            <ChevronDown className="size-3.5 shrink-0 -rotate-90 text-muted-foreground transition-transform group-data-[state=open]/accordion:rotate-0" />
            <span className="text-[13px] font-medium tracking-[-0.005em]">{title}</span>
            {count !== undefined && count !== null && count !== 0 ? (
              <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                {count}
              </span>
            ) : null}
          </AccordionPrimitive.Trigger>
        </div>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
        <div className="pb-4">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}

export const Accordion = Object.assign(AccordionRoot, { Item: AccordionItem });
