import { createFileRoute } from "@tanstack/react-router";
import { ReviewQueue } from "@/components/prototype/review-queue";
export const Route = createFileRoute("/review-queue")({
  component: ReviewQueue,
  head: () => ({ meta: [{ title: "Review queue — Program Assurance" }] }),
});
