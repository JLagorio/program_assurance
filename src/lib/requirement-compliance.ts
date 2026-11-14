import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import { invalidateModel, useRows, writeRow, type ReadContext, type Row } from "./models";
import {
  COMPLIANCE_STATUS_ORDER,
  VERIFICATION_METHODS,
  type ComplianceStatus,
  type VerificationMethod,
} from "./product-assurance";

/*
 * A program's answer to a requirement of a customer's document: whether it complies, how that is
 * verified, and what the program says of it. One answer a requirement (`requirement_compliance`),
 * written at the revision the reader saw, so two people answering at once do not overwrite each
 * other. The matrix that reads the answers is `requirement_source_compliance` in product-assurance.
 */

type Client = Pick<SupabaseClient, "from">;

/** The answer as a reader gives it. */
export type RequirementAnswer = {
  requirementId: string;
  /** The answer already recorded, at the revision the reader saw; none for a first answer. */
  existing?: { id: string; revision: number } | null | undefined;
  status: ComplianceStatus;
  verificationMethod: VerificationMethod | null;
  statement: string | null;
};

export const ANSWER_NEEDS_STATUS = "Choose where the program stands on this requirement.";
/** A requirement the program does not meet says why, so the customer reads a reason. */
export const ANSWER_NEEDS_STATEMENT = "Say what is not met, or why the requirement does not apply.";

/** Whether an answer must say why: it is short of compliant. */
export const answerNeedsStatement = (status: ComplianceStatus | null | undefined): boolean =>
  status === "partially_compliant" || status === "non_compliant" || status === "not_applicable";

/** What stops an answer before it is sent; empty when it may go. */
export function requirementAnswerIssues(answer: {
  status: string | null | undefined;
  statement: string | null | undefined;
}): { field: "status" | "statement"; message: string }[] {
  const status = COMPLIANCE_STATUS_ORDER.find((value) => value === answer.status);
  if (!status) return [{ field: "status", message: ANSWER_NEEDS_STATUS }];
  if (answerNeedsStatement(status) && !answer.statement?.trim())
    return [{ field: "statement", message: ANSWER_NEEDS_STATEMENT }];
  return [];
}

/** Record a program's answer to a requirement, or change it at the revision the reader saw. */
export async function answerRequirement(
  client: Client,
  context: ReadContext,
  answer: RequirementAnswer,
): Promise<Row<"requirement_compliance">> {
  const [issue] = requirementAnswerIssues(answer);
  if (issue) throw new Error(issue.message);
  if (answer.verificationMethod && !VERIFICATION_METHODS.includes(answer.verificationMethod))
    throw new Error("Choose a verification method from the list.");
  const values = {
    status: answer.status,
    verification_method: answer.verificationMethod,
    statement: answer.statement?.trim() || null,
  };
  return answer.existing
    ? writeRow(client, context, "requirement_compliance", {
        id: answer.existing.id,
        revision: answer.existing.revision,
        values,
      })
    : writeRow(client, context, "requirement_compliance", {
        values: { ...values, engineering_requirement_id: answer.requirementId },
      });
}

/** Answer a requirement as a mutation; the matrix is read again once it settles. */
export function useAnswerRequirement() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<Row<"requirement_compliance">, Error, RequirementAnswer>({
    mutationFn: async (answer) =>
      answerRequirement(
        database(),
        { tenantId: workspace.tenantId, token: await requireIdentity(workspace) },
        answer,
      ),
    onSettled: () => void invalidateModel(cache, workspace.tenantId, "requirement_compliance"),
  });
}

/** The requirements documents a program has received, by code. */
export function useRequirementSources(programId: string | null | undefined) {
  const sources = useRows(
    "requirement_sources",
    { program_id: programId ?? "" },
    { enabled: !!programId },
  );
  return {
    query: sources,
    sources: sources.data
      ? [...sources.data].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
      : undefined,
  };
}

/** The answer recorded for a requirement, with the revision a change to it needs. */
export function useRequirementAnswer(requirementId: string | null | undefined) {
  return useRows(
    "requirement_compliance",
    { engineering_requirement_id: requirementId ?? "" },
    { enabled: !!requirementId },
  );
}
