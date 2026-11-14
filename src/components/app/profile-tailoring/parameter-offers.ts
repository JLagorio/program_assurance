import { useMemo } from "react";
import { CYBER_RESILIENCY_FRAMEWORK, useFramework, useFrameworkItems } from "@/lib/frameworks";
import type { WizardParameterPreview } from "@/lib/program-wizard-reference";
import {
  RESILIENCY_KINDS,
  RESILIENCY_PARAMETERS,
  resiliencyParameter,
  resiliencyVocabulary,
  vocabularyValues,
  type ResiliencyVocabulary,
} from "@/lib/resiliency-choice";

/*
 * What a parameter's values are entered from and how: shared by the tailoring's Set parameter
 * values and an overlay's, so both offer the same choices in the same entry modes.
 */

/**
 * What a parameter's values are chosen from when a reference vocabulary names them: SA-24's five
 * parameters name items of the cyber resiliency framework. `undefined` for every other parameter,
 * and for these five while the framework's reference data is not loaded: the values are then typed.
 */
export type Offer =
  | { state: "loading" }
  | { state: "failed"; retrying: boolean; retry: () => void }
  | {
      state: "ready";
      vocabulary: ResiliencyVocabulary;
      /** The framework and where it prints the list, when the framework's own record could be read. */
      source: string | undefined;
    };

/**
 * The cyber resiliency vocabulary, read once as the dialog opens on a set that holds one of
 * SA-24's parameters, and what each parameter is offered from it. An overlay's Set parameter values
 * offers the same.
 */
export function useOffers(enabled: boolean) {
  const items = useFrameworkItems(CYBER_RESILIENCY_FRAMEWORK, { kinds: RESILIENCY_KINDS, enabled });
  const framework = useFramework(CYBER_RESILIENCY_FRAMEWORK, { enabled });
  const title = framework.data?.title;
  // One object a parameter for as long as the read stands: a list drawn from it keeps its place
  // while the reader picks.
  const ready = useMemo(() => {
    const offers = new Map<string, Offer>();
    for (const parameter of RESILIENCY_PARAMETERS) {
      const vocabulary = resiliencyVocabulary(parameter.sourceId, items.data ?? []);
      if (vocabulary)
        offers.set(parameter.sourceId, {
          state: "ready",
          vocabulary,
          source: title ? `${title} · ${vocabulary.printedIn.join(", ")}` : undefined,
        });
    }
    return offers;
  }, [items.data, title]);
  return (parameterSourceId: string): Offer | undefined => {
    if (!enabled || !resiliencyParameter(parameterSourceId)) return undefined;
    // A refresh that fails keeps the vocabulary already read.
    if (!items.data && items.error)
      return { state: "failed", retrying: items.isFetching, retry: () => void items.refetch() };
    if (!items.data || framework.isPending) return { state: "loading" };
    return ready.get(parameterSourceId);
  };
}

/**
 * How the values are entered: a Select for one literal choice, several from a list for more (boxes,
 * or a searched list under headings when the choices come in groups), else lines of text.
 */
export type EntryMode = "one" | "many" | "text";

export function entryMode(
  item: Pick<WizardParameterPreview, "choices" | "values"> & {
    parameter: Pick<WizardParameterPreview["parameter"], "has_selection" | "selection_count">;
  },
  vocabulary: ResiliencyVocabulary | undefined,
): EntryMode {
  // A vocabulary's titles are chosen as a source's choices are, several at once. A value that
  // names none of them was typed, and the values stay text.
  if (vocabulary) return vocabularyValues(vocabulary, item.values) ? "many" : "text";
  const { choices, parameter, values } = item;
  // A choice with an embedded parameter or markup is not a literal the reader can pick as it stands.
  const literal = choices.length > 0 && !choices.some((choice) => /\{\{|<[^>]+>/.test(choice));
  if (!literal || !parameter.has_selection || values.some((value) => !choices.includes(value)))
    return "text";
  return (parameter.selection_count ?? "one") === "one" ? "one" : "many";
}

/** "Source choices", with how many of them a parameter takes. */
export const choiceHeadingOf = (parameter: { selection_count: string | null }) =>
  `Source choices${parameter.selection_count ? ` · ${parameter.selection_count.replaceAll("-", " ")}` : ""}`;
