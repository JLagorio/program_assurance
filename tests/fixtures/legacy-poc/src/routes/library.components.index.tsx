import { createFileRoute } from "@tanstack/react-router";
import { AssuranceLibraryIndex } from "@/components/app/assurance-library";
export const Route = createFileRoute("/library/components/")({
  head: () => ({ meta: [{ title: "Components — Equinox GRC" }] }),
  component: () => <AssuranceLibraryIndex />,
});
