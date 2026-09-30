import { useRows } from "@/lib/models";
import { useLibraryComponentItems } from "@/lib/library-items";
import { useProductConfigurationItems } from "@/lib/product-items";
import { useReferenceData, type ReferenceData } from "../profile-tailoring/use-reference-data";

/**
 * Reference records, workspace parties, the published component library and the published product
 * configurations the wizard offers. Each step waits only for what it shows: the program step for
 * the parties, the catalog step for the reference records, the systems step and the review for
 * everything, so the reader can start typing while the catalog loads.
 */
export function useWizardResources() {
  const reference = useReferenceData();
  const parties = useRows("parties");
  const library = useLibraryComponentItems();
  const products = useProductConfigurationItems();
  const queries = [...reference.queries, parties, ...library.queries, ...products.queries];
  const byStep: readonly (typeof queries)[] = [[parties], reference.queries, queries, queries];
  return {
    queries,
    /** What step `index` shows loads from; its region waits, and fails, on these alone. */
    stepQueries: (index: number) => byStep[index] ?? queries,
    /** Step `index` has what it shows: its region is drawn and Continue can check it. */
    stepReady: (index: number) =>
      (byStep[index] ?? queries).every((query) => query.data !== undefined),
    pending: queries.some((query) => query.isPending),
    error: queries.find((query) => query.error)?.error,
    ready: queries.every((query) => query.data !== undefined),
    parties: parties.data ?? [],
    data: reference.data,
    libraryItems: library.items,
    productItems: products.items,
  };
}
export type WizardResources = ReferenceData;
