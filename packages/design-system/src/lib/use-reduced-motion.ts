import { useSyncExternalStore } from "react";

/*
 * Whether the reader asked for less motion, from `prefers-reduced-motion`, kept current when they
 * change the setting. For motion a stylesheet cannot reach: a chart library's animation props, a
 * drag library's transitions, a scroll the page asks for. CSS motion answers the media query itself.
 */

const QUERY = "(prefers-reduced-motion: reduce)";

const matches = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(QUERY).matches;

const subscribe = (onChange: () => void) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const subscribeNothing = () => () => {};

/**
 * Whether the reader asked for less motion: false on the server and before hydration. With
 * `listening` false it reads the setting on each render without following changes, for a part
 * that has nothing to animate now (a row that cannot move).
 */
export function useReducedMotion(listening = true): boolean {
  return useSyncExternalStore(listening ? subscribe : subscribeNothing, matches, () => false);
}
