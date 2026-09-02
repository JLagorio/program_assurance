import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* An Input with something at either end: a search icon, a unit, a shortcut
   hint, a clear button. The addons sit over the control and the control's
   padding makes room; the child is any Input or NativeSelect. */
export function InputGroup({
  leading,
  trailing,
  className,
  children,
}: {
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "relative block",
        leading && "[&>input]:pl-8 [&>select]:pl-8",
        trailing && "[&>input]:pr-10 [&>select]:pr-10",
        className,
      )}
    >
      {leading ? (
        <span className="pointer-events-none absolute left-2.5 top-1/2 flex -translate-y-1/2 items-center text-muted-foreground [&_svg]:size-3.5">
          {leading}
        </span>
      ) : null}
      {children}
      {trailing ? (
        <span className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[11px] text-muted-foreground [&_svg]:size-3.5">
          {trailing}
        </span>
      ) : null}
    </span>
  );
}
