import type { ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";

/* The bottom sheet: a task surface that rises from the bottom edge with a
   drag handle, for narrow screens and quick actions. For the side panel that
   keeps the page visible, see Sheet; for a focused task over the page, Dialog. */
export function Drawer({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/25" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85vh] w-full max-w-[640px] flex-col rounded-t-xl bg-card shadow-pop outline-none",
            className,
          )}
        >
          <DrawerPrimitive.Handle className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-border-strong" />
          <div className="shrink-0 px-5 pb-3 pt-3">
            <DrawerPrimitive.Title className="text-[15px] font-medium tracking-[-0.01em]">
              {title}
            </DrawerPrimitive.Title>
            {description ? (
              <DrawerPrimitive.Description className="mt-0.5 text-[13px] text-muted-foreground">
                {description}
              </DrawerPrimitive.Description>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-border px-5 py-4">
            {children}
          </div>
          {footer ? (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-subtle px-5 py-3">
              {footer}
            </div>
          ) : null}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
