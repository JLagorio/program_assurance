// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// Every route sets its browser title as `<Screen or record type> — Program Assurance` in its
// `head()`; a child route never inherits its parent's title. Once its record loads, a record route
// names it first, in the words of its h1: `<record name> — <record type> — Program Assurance`,
// through `useRecordTitle` in browser-title. A focused program view names itself first: `<view> —
// <program name> — Program Assurance`, through `useViewTitle`. While the record loads, and when it
// is missing, the type alone stands. A screen that stands in for the route titles itself through
// `useBrowserTitle`: the sign-in form is `Sign in — Program Assurance`, and a workspace that cannot
// open is `Workspace unavailable — Program Assurance`. The root renders the one `<title>`; a screen
// never renders its own. Labels use the same words across program tabs, global registers, create
// actions and forms.

import { useEffect, useSyncExternalStore } from "react";

/**
 * The browser title. A route's `head()` gives its screen or record type ("Task — Program
 * Assurance"); a screen that knows more says it here: a record page names its record once it loads
 * (`useRecordTitle`), and the sign-in and workspace screens that stand in for the route name
 * themselves (`useBrowserTitle`). The root's head renders the route's head tags with the title
 * `useScreenTitle` gives in place of the route's, so no second `<title>` competes with the router's.
 */

const PRODUCT = "Program Assurance";

/** "Sign in — Program Assurance"; "Prepare the SSP — Task — Program Assurance". */
function titleOf(parts: readonly string[]) {
  return [...parts, PRODUCT].join(" — ");
}

const stack: { title: string }[] = [];
const listeners = new Set<() => void>();
let current: string | null = null;
function publish() {
  current = stack.at(-1)?.title ?? null;
  for (const listener of listeners) listener();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/**
 * Titles the page while this component is mounted: `["Sign in"]` reads "Sign in — Program
 * Assurance". The latest mounted screen wins; nothing (null, or no parts) leaves the route's own
 * title. It is set after the render, so the server and the first client render agree.
 */
export function useBrowserTitle(parts: readonly string[] | null | undefined) {
  const title = parts?.length ? titleOf(parts) : null;
  useEffect(() => {
    if (!title) return;
    const entry = { title };
    stack.push(entry);
    publish();
    return () => {
      const index = stack.indexOf(entry);
      if (index >= 0) stack.splice(index, 1);
      publish();
    };
  }, [title]);
}

/**
 * A record page's title once its record loads: `useRecordTitle("Task", task?.title)` reads
 * "Prepare the SSP — Task — Program Assurance". The name is the one the page's h1 shows. While the
 * record loads, and when it is missing, the route's type title ("Task — Program Assurance") stands.
 */
export function useRecordTitle(type: string, name: string | null | undefined) {
  const trimmed = name?.trim();
  useBrowserTitle(trimmed ? [trimmed, type] : null);
}

/**
 * A record's focused view once its record loads: `useViewTitle("Posture", program?.name)` reads
 * "Posture — Atlas ground segment — Program Assurance". The view comes first, as the
 * page's h1 names it. While the record loads, and when it is missing, the route's title ("Posture —
 * Program Assurance") stands.
 */
export function useViewTitle(view: string, name: string | null | undefined) {
  const trimmed = name?.trim();
  useBrowserTitle(trimmed ? [view, trimmed] : null);
}

/** The title a screen has set, or null for the route's own; the server always has none. */
export function useScreenTitle(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}
