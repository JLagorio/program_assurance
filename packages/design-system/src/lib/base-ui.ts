import { cn } from "./cn";

/** Base UI accepts a state callback as well as a string for `className`. Preserve both on every styled part. */
export function classes<State>(
  base: string,
  className?: string | ((state: State) => string | undefined) | undefined,
) {
  return typeof className === "function"
    ? (state: State) => cn(base, className(state))
    : cn(base, className);
}
