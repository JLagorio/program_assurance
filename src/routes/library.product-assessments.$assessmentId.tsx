import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { ProductAssessmentRecord } from "@/components/prototype/product-assessment";
export const Route = createFileRoute("/library/product-assessments/$assessmentId")({
  // The element an assessor is working survives a reload, Back and a shared link.
  validateSearch: (search: Record<string, unknown>): { element?: string | undefined } => ({
    ...(typeof search["element"] === "string" ? { element: search["element"] } : {}),
  }),
  head: () => ({ meta: [{ title: "Product assessment — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ProductAssessmentPage,
});
function ProductAssessmentPage() {
  const { assessmentId } = Route.useParams();
  const { element } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ProductAssessmentRecord
      key={assessmentId}
      assessmentId={assessmentId}
      element={element}
      onElement={(next) =>
        void navigate({ search: (current) => ({ ...current, element: next }), resetScroll: false })
      }
    />
  );
}
