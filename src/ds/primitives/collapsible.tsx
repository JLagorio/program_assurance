import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Reference material: present, addressable, closed.
 *
 * The catalog statement, the assessment objectives and the discussion are all
 * things a reader occasionally needs and never needs first. Rendering them
 * expanded is most of why a control page reads as a novel. Radix underneath
 * for aria-expanded, aria-controls and the keyboard; uncontrolled unless `open`
 * is passed. For a set that opens one at a time, see Accordion.
 */
export function Collapsible({
  title,
  count,
  defaultOpen = false,
  open,
  onOpenChange,
  className,
  children,
}: {
  title: ReactNode;
  count?: number | string | null;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <CollapsiblePrimitive.Root
      {...(open === undefined ? { defaultOpen } : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
      className={cn("border-t border-border", className)}
    >
      <CollapsiblePrimitive.Trigger className="group/collapsible flex w-full items-center gap-2 rounded-sm py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/35">
        <ChevronDown className="size-3.5 shrink-0 -rotate-90 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-0" />
        <span className="text-[13px] font-medium tracking-[-0.005em]">{title}</span>
        {count !== undefined && count !== null && count !== 0 ? (
          <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
            {count}
          </span>
        ) : null}
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content className="pb-4">{children}</CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}
