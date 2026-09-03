/* Façade: the prototype's kit barrel now re-exports @ledger/design-system. The adapters keep the
   old link dialects alive until their call sites are rewritten; then this file goes and imports
   point at the package. */
export * from "@ledger/design-system";
export { Breadcrumb, Item, Tabs } from "../adapters";
