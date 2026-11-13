import { createFileRoute } from "@tanstack/react-router";
import { BusinessLinesIndex } from "@/components/prototype/business-lines";
export const Route = createFileRoute("/library/business-lines/")({
  head: () => ({ meta: [{ title: "Business lines — Program Assurance" }] }),
  component: BusinessLinesIndex,
});
