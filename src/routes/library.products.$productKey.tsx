import { createFileRoute } from "@tanstack/react-router";
import { ProductLibraryRecord } from "@/components/prototype/library-products";
export const Route = createFileRoute("/library/products/$productKey")({
  validateSearch: (search: Record<string, unknown>): { version?: string } =>
    typeof search["version"] === "string" ? { version: search["version"] } : {},
  head: () => ({ meta: [{ title: "Product — Program Assurance" }] }),
  component: ProductPage,
});
function ProductPage() {
  const { productKey } = Route.useParams();
  const { version } = Route.useSearch();
  return <ProductLibraryRecord id={productKey} {...(version ? { initialVersion: version } : {})} />;
}
