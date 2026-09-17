import { createFileRoute } from "@tanstack/react-router";
import { ProductLibraryIndex } from "@/components/prototype/library-products";
export const Route = createFileRoute("/library/products/")({
  head: () => ({ meta: [{ title: "Products — Program Assurance" }] }),
  component: ProductLibraryIndex,
});
