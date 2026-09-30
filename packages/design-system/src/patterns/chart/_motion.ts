import { useMemo, type ComponentProps } from "react";
import type { Line } from "recharts";

import { tokenValue, type TokenName } from "../../generated/tokens";
import { useReducedMotion } from "../../lib/use-reduced-motion";

export { useReducedMotion };

const readToken = (name: TokenName, fallback: string) => {
  if (typeof document === "undefined") return fallback;
  return tokenValue(name) || fallback;
};

/** Recharts types its easing as a few names, and parses a `cubic-bezier()` too; the token's curve is cast to pass. */
type Easing = NonNullable<ComponentProps<typeof Line>["animationEasing"]>;

export type Motion = {
  isAnimationActive: boolean;
  animationDuration: number;
  animationEasing: Easing;
  animationBegin: number;
};

/**
 * Recharts' animation props on the motion tokens: marks arrive over `motion.duration.slow` on the
 * standard curve, and a change of data moves them the same way. Under reduced motion they draw in place.
 */
export function useMotion(): Motion {
  const off = useReducedMotion();
  return useMemo(
    () => ({
      isAnimationActive: !off,
      animationDuration: parseInt(readToken("motion.duration.slow", "400ms"), 10) || 400,
      animationEasing: readToken(
        "motion.easing.standard",
        "cubic-bezier(0.2, 0, 0.2, 1)",
      ) as Easing,
      animationBegin: 0,
    }),
    [off],
  );
}

/** The tooltip follows the pointer over `motion.duration.fast`. */
export function useTooltipMotion() {
  const off = useReducedMotion();
  return useMemo(
    () => ({
      isAnimationActive: !off,
      animationDuration: parseInt(readToken("motion.duration.fast", "120ms"), 10) || 120,
      animationEasing: "ease-out" as const,
    }),
    [off],
  );
}
