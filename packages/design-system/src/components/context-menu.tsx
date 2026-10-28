import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import type { ComponentProps } from "react";
import { useLedgerLocale } from "../lib/locale";
import { MenuContent, type DropdownMenuContentProps } from "./dropdown-menu";

export type ContextMenuProps = ContextMenuPrimitive.Root.Props;
/** A pointer, touch or keyboard context menu. Its items are the shared DropdownMenu parts. */
export function ContextMenu(props: ContextMenuProps) {
  const { direction } = useLedgerLocale();
  return (
    <DirectionProvider direction={direction}>
      <ContextMenuPrimitive.Root {...props} />
    </DirectionProvider>
  );
}
export type ContextMenuTriggerProps = ComponentProps<typeof ContextMenuPrimitive.Trigger>;
/** A focusable target when used on its own. A composing grid may supply its own slot and semantics. */
export function ContextMenuTrigger({ onKeyDown, ...props }: ContextMenuTriggerProps) {
  return (
    <ContextMenuPrimitive.Trigger
      tabIndex={0}
      data-slot="context-menu-trigger"
      {...props}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.nativeEvent.isComposing || event.repeat) return;
        if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return;
        if ((event.target as HTMLElement).closest('input, textarea, [contenteditable="true"]'))
          return;
        event.preventDefault();
        const activeId = event.currentTarget.getAttribute("aria-activedescendant");
        const target =
          (activeId ? event.currentTarget.ownerDocument.getElementById(activeId) : null) ??
          (event.target as HTMLElement);
        const bounds = target.getBoundingClientRect();
        target.dispatchEvent(
          new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: bounds.x + bounds.width / 2,
            clientY: bounds.y + bounds.height / 2,
          }),
        );
      }}
    />
  );
}
export type ContextMenuContentProps = DropdownMenuContentProps;
/** Shares the menu surface, item spacing, collision handling and scroll controls with DropdownMenu. */
export function ContextMenuContent(props: ContextMenuContentProps) {
  return <MenuContent {...props} slot="context-menu-content" />;
}
