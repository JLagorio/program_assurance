import type { ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "../lib/cn";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
};

/** The bottom sheet: a task surface that rises from the bottom edge with a drag handle, for narrow screens and quick actions. */
export function Drawer({ open, onClose, title, description, footer, children, className }: DrawerProps) {
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-blanket" />
        <DrawerPrimitive.Content
          style={{ maxWidth: 640, maxHeight: "85vh" }}
          className={cn("fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full flex-col rounded-t-xxlarge bg-surface-overlay shadow-overlay outline-none", className)}
        >
          <div className="flex shrink-0 justify-center pt-150">
            <DrawerPrimitive.Handle className="h-050 w-500 rounded-full bg-neutral-bold" />
          </div>
          <div className="flex shrink-0 flex-col gap-025 px-250 pb-150 pt-150">
            <DrawerPrimitive.Title className="font-heading-xsmall text-default">{title}</DrawerPrimitive.Title>
            {description ? <DrawerPrimitive.Description className="font-body text-subtle">{description}</DrawerPrimitive.Description> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-default px-250 py-200">{children}</div>
          {footer ? <div className="flex shrink-0 items-center justify-end gap-100 border-t border-default bg-surface-sunken px-250 py-150">{footer}</div> : null}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
