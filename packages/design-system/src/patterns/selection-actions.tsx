import {
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Button } from "../components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  type PopoverContentProps,
} from "../components/popover";
import { cn } from "../lib/cn";

export type SelectionActionsProps = Omit<ComponentProps<"div">, "children"> & {
  label: string;
  children: ReactNode;
  /** A live element or virtual rectangle. Omit it for an always-inline action row. */
  anchor?: PopoverContentProps["anchor"] | undefined;
  /** Change this when the captured range changes, to reopen its floating actions. */
  selectionKey?: string | number | undefined;
};
const precisePointer = () => window.matchMedia("(pointer: fine)").matches;
const subscribePointer = (notify: () => void) => {
  const query = window.matchMedia("(pointer: fine)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const firstControl = (root: HTMLElement | null) =>
  root?.querySelector<HTMLElement>(
    'button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]',
  );
/** Captured-selection actions with a fixed keyboard entry and an inline touch/Escape fallback. */
export function SelectionActions({
  label,
  anchor,
  selectionKey,
  children,
  className,
  ...props
}: SelectionActionsProps) {
  const fine = useSyncExternalStore(subscribePointer, precisePointer, () => false);
  const [dismissed, setDismissed] = useState<{ key: string | number | undefined } | null>(null);
  const floating = fine && !!anchor && dismissed?.key !== selectionKey;
  // Null is not a dismissal when the host has no identity key.
  const showFloating = fine && !!anchor && (!dismissed || floating);
  const panel = useRef<HTMLDivElement>(null);
  const inline = useRef<HTMLDivElement>(null);
  const restoreInline = useRef(false);
  useLayoutEffect(() => {
    if (!showFloating && restoreInline.current) {
      restoreInline.current = false;
      firstControl(inline.current)?.focus({ preventScroll: true });
    }
  }, [showFloating]);
  const content = (
    <div className="flex min-w-0 flex-wrap items-center gap-100" role="group" aria-label={label}>
      {children}
    </div>
  );
  return (
    <div {...props} className={cn("min-w-0", className)} data-slot="selection-actions">
      {showFloating ? (
        <Popover
          open
          onOpenChange={(open, details) => {
            if (open) return;
            if (details.reason === "trigger-press") {
              details.cancel();
              firstControl(panel.current)?.focus();
              return;
            }
            restoreInline.current = !!panel.current?.contains(document.activeElement);
            setDismissed({ key: selectionKey });
          }}
        >
          <PopoverTrigger render={<Button size="small" variant="subtle" />}>{label}</PopoverTrigger>
          <PopoverContent
            ref={panel}
            anchor={anchor}
            side="top"
            align="center"
            sideOffset={8}
            positionMethod="fixed"
            collisionPadding={8}
            initialFocus={false}
            finalFocus={false}
            aria-label={label}
            style={{ width: "max-content" }}
            onPointerDown={(event) => {
              // Clicking an action keeps a native text range alive. Keyboard focus still works normally.
              if ((event.target as HTMLElement).closest("button")) event.preventDefault();
            }}
          >
            {content}
          </PopoverContent>
        </Popover>
      ) : (
        <div ref={inline}>{content}</div>
      )}
    </div>
  );
}
