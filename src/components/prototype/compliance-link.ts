import type { ComplianceStatus, RequirementCompliance } from "@/lib/product-assurance";
import { registerViews } from "@/lib/register-views";
import { questionSearch } from "./collection-question";

/** A requirement's answer as the matrix filters it: the program's, or none yet. */
export type ComplianceAnswer = ComplianceStatus | "unanswered";

/** The search that opens a program's Compliance matrix on a question: a document's requirements at an answer, or met one way. */
export function complianceSearch(question: {
  document?: string | undefined;
  answer?: ComplianceAnswer | undefined;
  metBy?: RequirementCompliance["metBy"] | undefined;
}): Record<string, unknown> {
  return {
    ...(question.document ? { document: question.document } : {}),
    ...questionSearch(registerViews.compliance, {
      search: "",
      filters: [
        ...(question.answer ? [{ id: "answer", value: [question.answer] }] : []),
        ...(question.metBy ? [{ id: "metBy", value: [question.metBy] }] : []),
      ],
    }),
  };
}
