import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Scroller, ScrollerArrow, ScrollerViewport } from "./scroller";

export type ViewSwitcherProps = Omit<ComponentProps<"nav">, "children"> & {
  /** The row's name, what its views are of: "Controls views". It names the navigation, so two rows on one page never read alike. */
  label: string;
  /** ViewSwitcher.Item links, in the order the views are read: four at most. */
  children: ReactNode;
};

/**
 * The views a tab holds, as one named, compact row of links: each view a page of its own. On a
 * view's own page the row marks it current; on the tab, which shows none of its views, none is.
 * The row is as wide as its links; where its frame is narrower, a phone or a panel, it scrolls in
 * its own strip and keeps the current view in view, never wrapping and never widening the page.
 * A `nav` landmark named by `label`, holding a list. Links come in through `render`: the kit
 * never imports a router.
 */
function ViewSwitcherRoot({ label, children, className, ...props }: ViewSwitcherProps) {
  return (
    <nav
      {...props}
      aria-label={label}
      data-slot="view-switcher"
      className={cn("min-w-0", className)}
    >
      <Scroller orientation="horizontal" className="w-fit max-w-full">
        <ScrollerViewport>
          {/* `role="list"` keeps the list, and its count, in WebKit, which drops it from a list
              without markers. */}
          <ul
            role="list"
            data-slot="view-switcher-list"
            className="flex w-max list-none items-center gap-025 rounded-medium border border-input p-025"
          >
            {children}
          </ul>
        </ScrollerViewport>
        <ScrollerArrow edge="start" />
        <ScrollerArrow edge="end" />
      </Scroller>
    </nav>
  );
}

export type ViewSwitcherItemProps = useRender.ComponentProps<"a"> & {
  /**
   * The view this page shows: `aria-current="page"` on its link, so a screen reader says which
   * view is open, and the current place's fill with an ink edge. Leave it off on the tab, which
   * shows none of its views. A router link that sets `aria-current` itself when it matches is drawn
   * current too; give it exact matching.
   */
  isActive?: boolean | undefined;
};

/* The current view is keyed on its link's own state, `aria-current="page"`, whoever set it: the
   current place's fill (`color.background.current`) under the default text colour, and an ink
   edge (`color.border.current`) drawn on ::after so it never changes the link's size. The edge is
   the cue that does not rest on the fill; forced colours paint the link as Highlight instead
   (forced-colors.css). */
const current =
  "aria-[current=page]:bg-current-default aria-[current=page]:text-default aria-[current=page]:hover:bg-current-default aria-[current=page]:after:pointer-events-none aria-[current=page]:after:absolute aria-[current=page]:after:inset-0 aria-[current=page]:after:rounded-small aria-[current=page]:after:border aria-[current=page]:after:border-current-default";

/** One view: a link, an anchor by default, or the element given to `render`, such as a router's Link. Native props and the ref reach the link. */
export function ViewSwitcherItem({
  render,
  ref,
  isActive,
  className,
  ...props
}: ViewSwitcherItemProps) {
  const link = useRender({
    defaultTagName: "a",
    render,
    ref,
    state: { slot: "view-switcher-link" },
    props: mergeProps<"a">(props, {
      ...(isActive ? { "aria-current": "page" as const } : {}),
      ...{ "data-slot": "view-switcher-link" },
      className: cn(
        "relative inline-flex h-control-xsmall items-center whitespace-nowrap rounded-small px-100 font-body-small font-medium text-subtle outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered hover:text-default focus-visible:outline-focused",
        current,
        className,
      ),
    }),
  });
  return (
    <li data-slot="view-switcher-item" className="flex">
      {link}
    </li>
  );
}

/** A tab's views as a row of links, with its item as a member and, for docs and imports, by name. */
export const ViewSwitcher = Object.assign(ViewSwitcherRoot, { Item: ViewSwitcherItem });
