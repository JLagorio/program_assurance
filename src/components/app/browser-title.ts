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

/** The title a screen has set, or null for the route's own; the server always has none. */
export function useScreenTitle(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}
