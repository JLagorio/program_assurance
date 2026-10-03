import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { ProductLibraryRecord, type ProductTab } from "@/components/prototype/library-products";

/** Every tab the record has: a record, so the type checker notices a tab added or removed there. */
const productTabs: Record<ProductTab, true> = {
  Overview: true,
  Structure: true,
  Configurations: true,
  Variants: true,
  Versions: true,
};
const isProductTab = (value: unknown): value is ProductTab =>
  typeof value === "string" && Object.hasOwn(productTabs, value);

export const Route = createFileRoute("/library/products/$productKey")({
  // The version and the tab a reader chose survive a reload, Back and a shared link. The tab is
  // typed as a string so the record's own version navigation, which spreads the previous search
  // without naming this route, still type-checks; only a real tab name gets through.
  validateSearch: (
    search: Record<string, unknown>,
  ): { version?: string | undefined; tab?: string | undefined } => ({
    ...(typeof search["version"] === "string" ? { version: search["version"] } : {}),
    ...(isProductTab(search["tab"]) ? { tab: search["tab"] } : {}),
  }),
  head: () => ({ meta: [{ title: "Product — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ProductPage,
});
function ProductPage() {
  const { productKey } = Route.useParams();
  const record = useRow("products", productKey);
  useRecordTitle("Product", record.data?.name);
  const { version, tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ProductLibraryRecord
      id={productKey}
      {...(version ? { initialVersion: version } : {})}
      // The address owns the tab, so Back to an address without one is Overview again.
      tab={isProductTab(tab) ? tab : "Overview"}
      onTabChange={(next) => void navigate({ search: (previous) => ({ ...previous, tab: next }) })}
    />
  );
}
