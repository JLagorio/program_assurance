import { useRows } from "@/lib/models";
import { useLibraryComponentItems } from "@/lib/library-items";
import { useProductConfigurationItems } from "@/lib/product-items";
import { useReferenceData, type ReferenceData } from "../profile-tailoring/use-reference-data";

/** Reference records, workspace parties, the published component library and the published product configurations the wizard offers. */
export function useWizardResources() {
  const reference = useReferenceData();
  const parties = useRows("parties");
  const library = useLibraryComponentItems();
  const products = useProductConfigurationItems();
  const queries = [...reference.queries, parties, ...library.queries, ...products.queries];
  return {
    queries,
    pending: queries.some((query) => query.isPending),
    error: queries.find((query) => query.error)?.error,
    ready: queries.every((query) => query.data !== undefined),
    retry: () =>
      Promise.all(queries.filter((query) => query.error).map((query) => query.refetch())),
    parties: parties.data ?? [],
    data: reference.data,
    libraryItems: library.items,
    productItems: products.items,
  };
}
export type WizardResources = ReferenceData;
