import type { VariantDelta } from "@/lib/product-assurance";
import { registerViews } from "@/lib/register-views";
import { questionSearch } from "./collection-question";

/**
 * The search that opens a program's Product delta List on a question: a variant's controls at a
 * delta, of a family, or behind an element the program changed. Every count on the Overview's tray
 * and in the view links through it, so no number is a dead end.
 */
export function productDeltaSearch(question: {
  system?: string | undefined;
  delta?: VariantDelta | undefined;
  family?: string | undefined;
  element?: string | undefined;
}): Record<string, unknown> {
  return {
    ...(question.system ? { system: question.system } : {}),
    show: "list",
    ...questionSearch(registerViews.productDelta, {
      search: "",
      filters: [
        ...(question.delta ? [{ id: "delta", value: [question.delta] }] : []),
        ...(question.family ? [{ id: "family", value: [question.family] }] : []),
        ...(question.element ? [{ id: "changed", value: [question.element] }] : []),
      ],
    }),
  };
}
