import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The frozen type ladder (text-11 … text-20 in styles.css) is unknown to
// tailwind-merge, which then files those classes under text *colour* and drops
// whichever colour class precedes them in the same cn() call — primary buttons
// lost text-primary-foreground and rendered black text. Teach it the ladder.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["11", "12", "13", "15", "20"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
