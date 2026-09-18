import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceHome } from "@/components/app/record-browser";
export const Route = createFileRoute("/schema")({
  head: () => ({ meta: [{ title: "Schema inspector — Program Assurance" }] }),
  component: WorkspaceHome,
});
