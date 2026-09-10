import { createFileRoute } from "@tanstack/react-router";
import { AssuranceLibraryIndex } from "@/components/app/assurance-library";
export const Route = createFileRoute("/library/overlays/")({
  head: () => ({ meta: [{ title: "Overlays — Equinox GRC" }] }),
  component: () => <AssuranceLibraryIndex kind="Overlay" />,
});
