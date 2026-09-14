import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceHome } from "@/components/app/record-browser";
export const Route = createFileRoute("/schema")({ component: WorkspaceHome });
