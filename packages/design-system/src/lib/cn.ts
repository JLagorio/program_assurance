import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import { mergeConfig } from "../generated/merge-config";

// tailwind-merge does not know generated utilities; without the config it files text-subtle
// under font-size and drops the colour class that precedes it. The config is generated with the tokens.
const twMerge = extendTailwindMerge(mergeConfig);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
