import { useSyncExternalStore } from "react";

/*
 * The kit's one touch predicate: some pointer is coarse (a phone, a tablet, a touchscreen laptop).
 * Wherever it matches, a reader may be on the touch screen, which cannot hover and has no Escape
 * key, so every touch behaviour keys on it alone: a control shown only on hover shows at rest
 * (row actions, the preview eye, a header's column menu, a card's actions), a control drawn under
 * 24px gets its hit area (touch-target in touch.css), a field in place shows its Cancel and Save,
 * a text field sets its text at 16px, and the keyboard hint for sending a draft is left out. In a
 * class it is the `any-pointer-coarse:` variant, in a stylesheet `@media (any-pointer: coarse)`,
 * and in script `useTouch`. A hybrid laptop with a trackpad and a touch screen matches, so its
 * touch screen gets what a tablet's does; hover still works with the trackpad.
 */

export const TOUCH_QUERY = "(any-pointer: coarse)";

const canMatch = () => typeof window !== "undefined" && typeof window.matchMedia === "function";

const matches = () => canMatch() && window.matchMedia(TOUCH_QUERY).matches;

const subscribe = (onChange: () => void) => {
  if (!canMatch()) return () => {};
  const query = window.matchMedia(TOUCH_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/** Whether some pointer is coarse (TOUCH_QUERY): false on the server and before hydration. */
export function useTouch(): boolean {
  return useSyncExternalStore(subscribe, matches, () => false);
}
