import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { ProductLibraryRecord } from "@/components/prototype/library-products";
export const Route = createFileRoute("/library/products/$productKey")({
  validateSearch: (search: Record<string, unknown>): { version?: string } =>
    typeof search["version"] === "string" ? { version: search["version"] } : {},
  head: () => ({ meta: [{ title: "Product — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ProductPage,
});
function ProductPage() {
  const { productKey } = Route.useParams();
  const record = useRow("products", productKey);
  useRecordTitle("Product", record.data?.name);
  const { version } = Route.useSearch();
  return <ProductLibraryRecord id={productKey} {...(version ? { initialVersion: version } : {})} />;
}
