import { useLedgerLocale } from "../lib/locale";
import { Slottable } from "@radix-ui/react-slot";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";

import { Count } from "./badge";
import { cn } from "../lib/cn";

/**
 * Views within one page. Tabs holds the selection; Tabs.List is the strip, a tablist with a rule
 * under it and the indicator that slides to the selected tab; Tabs.Tab is one tab; Tabs.Panel is
 * the view a tab shows. Radix Tabs underneath: one tab stop for the strip, arrows between tabs,
 * the selected tab's `aria-controls` to its panel. Uncontrolled with `defaultValue`, or the
 * caller's state with `value` and `onValueChange`, which on a record is the router's search param.
 */

export type TabsProps = {
  /** Reading and keyboard direction; defaults to the surrounding LedgerProvider. */
  dir?: "ltr" | "rtl" | undefined;
  /** The selected tab's value, with `onValueChange`. On a record it is the router's search param, so a tab has a URL. */
  value?: string | undefined;
  /** The tab selected at first, when uncontrolled. */
  defaultValue?: string | undefined;
  /** Called with the tab's value when the reader selects one. */
  onValueChange?: ((value: string) => void) | undefined;
  /** `automatic`, the default: arrowing to a tab selects it, for a view that is there at once. `manual`: arrows move focus and Enter or Space selects, for a view that loads. */
  activation?: "automatic" | "manual" | undefined;
  /** Render the child as the root instead of a div: a page's own root element. */
  asChild?: boolean | undefined;
  className?: string | undefined;
  /** A Tabs.List and the Tabs.Panels, in any layout between them. */
  children: ReactNode;
};

function TabsRoot({
  dir,
  value,
  defaultValue,
  onValueChange,
  activation = "automatic",
  asChild,
  className,
  children,
}: TabsProps) {
  const { direction } = useLedgerLocale();
  return (
    <TabsPrimitive.Root
      dir={dir ?? direction}
      {...(value === undefined ? (defaultValue === undefined ? {} : { defaultValue }) : { value })}
      {...(onValueChange ? { onValueChange } : {})}
      {...(asChild ? { asChild: true } : {})}
      activationMode={activation}
      orientation="horizontal"
      className={className}
    >
      {children}
    </TabsPrimitive.Root>
  );
}

export type TabListProps = {
  /** The strip's accessible name, when a page has more than one strip. */
  label?: string | undefined;
  className?: string | undefined;
  /** The Tabs.Tabs, two to six. */
  children: ReactNode;
};

type Mark = { x: number; width: number };

/** The strip: a tablist with a rule under it. The indicator under the selected tab is one element that slides, measured from the tab, so a change of selection reads as one mark moving. */
function TabList({ label, className, children }: TabListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mark, setMark] = useState<Mark | null>(null);

  useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;
    const sizes = new ResizeObserver(() => measure());
    const measure = () => {
      const active = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
      const next =
        active && active.offsetWidth > 0
          ? { x: active.offsetLeft, width: active.offsetWidth }
          : null;
      setMark((prev) =>
        prev && next && prev.x === next.x && prev.width === next.width ? prev : next,
      );
      for (const tab of list.querySelectorAll('[role="tab"]')) sizes.observe(tab);
    };
    measure();
    sizes.observe(list);
    const changes = new MutationObserver(measure);
    changes.observe(list, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-state"],
    });
    return () => {
      sizes.disconnect();
      changes.disconnect();
    };
  }, []);

  return (
    <TabsPrimitive.List
      ref={ref}
      aria-label={label}
      className={cn(
        "relative flex items-center gap-300 overflow-x-auto border-b border-default",
        className,
      )}
    >
      {children}
      {mark ? (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 h-025 rounded-full bg-brand-bold transition-all duration-medium ease-standard motion-reduce:transition-none"
          style={{ left: mark.x, width: mark.width }}
        />
      ) : null}
    </TabsPrimitive.List>
  );
}

export type TabProps = {
  /** The tab's value: what Tabs selects, and what its Panel matches. */
  value: string;
  /** A number after the label, as a Count. Null or undefined shows nothing, so `count={open || null}` hides a zero. */
  count?: number | string | null | undefined;
  /** Anything else after the label: a Badge for the view's state. */
  trailing?: ReactNode;
  /** A tab the reader cannot open. Prefer the tab open with an Empty in its panel; see the page. */
  disabled?: boolean | undefined;
  /** The child (a router's Link) takes the tab's role, state and classes; the count and trailing follow its label. */
  asChild?: boolean | undefined;
  className?: string | undefined;
  /** The label: one or two words, the view's name. */
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "children" | "className" | "disabled" | "value">;

function Tab({
  value,
  count,
  trailing,
  disabled,
  asChild,
  className,
  children,
  ...rest
}: TabProps) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      {...(disabled ? { disabled: true } : {})}
      {...(asChild ? { asChild: true } : {})}
      className={cn(
        "relative inline-flex h-control-medium shrink-0 items-center gap-075 whitespace-nowrap px-050 font-body font-medium text-subtle outline-none transition-colors duration-fast ease-standard hover:text-default focus-visible:outline-focused data-[state=active]:text-default data-disabled:pointer-events-none data-disabled:text-disabled",
        className,
      )}
      {...rest}
    >
      <Slottable>{children}</Slottable>
      {count != null ? <Count value={count} max={9999} /> : null}
      {trailing}
    </TabsPrimitive.Trigger>
  );
}

export type TabPanelProps = {
  /** The tab this is the view of. */
  value: string;
  /** Keep the view mounted while another tab shows, hidden: a table whose scroll and selection should survive a visit to another tab. Off by default; a view mounts when its tab is selected. */
  keepMounted?: boolean | undefined;
  /** Render the child as the panel instead of a div: a page's body column. */
  asChild?: boolean | undefined;
  className?: string | undefined;
  /** The view: Sections, Cards, a Table. */
  children?: ReactNode;
};

/** The view a tab shows: a tabpanel named by its tab, in the tab order after the strip. */
function TabPanel({ value, keepMounted, asChild, className, children }: TabPanelProps) {
  return (
    <TabsPrimitive.Content
      value={value}
      {...(keepMounted ? { forceMount: true as const } : {})}
      {...(asChild ? { asChild: true } : {})}
      className={cn(
        "outline-none focus-visible:outline-focused",
        keepMounted && "data-[state=inactive]:hidden",
        className,
      )}
    >
      {children}
    </TabsPrimitive.Content>
  );
}

export const Tabs = Object.assign(TabsRoot, { List: TabList, Tab, Panel: TabPanel });
