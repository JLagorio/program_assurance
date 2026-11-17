import { createFileRoute } from "@tanstack/react-router";
import { ComponentLibraryIndex } from "@/components/prototype/library-components";
export const Route = createFileRoute("/library/component-sets/")({
  head: () => ({ meta: [{ title: "Component sets — Program Assurance" }] }),
  component: ComponentLibraryIndex,
});
