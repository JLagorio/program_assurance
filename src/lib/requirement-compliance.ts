import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useWorkspace } from "./workspace-context";
import { database, requireIdentity } from "./database";
import { invalidateModel, useRows, type ReadContext, type Row } from "./models";
import {
  COMPLIANCE_STATUS_ORDER,
  VERIFICATION_METHODS,
  type ComplianceStatus,
  type VerificationMethod,
} from "./product-assurance";
import { saveOnce, SaveOnceConflict, type SaveOnceOutcome } from "./save-once";

/*
 * A program's answer to a requirement of a customer's document: whether it complies, how that is
 * verified, and what the program says of it. One answer a requirement (`requirement_compliance`),
 * written at the revision the reader saw, so two people answering at once do not overwrite each
 * other, and safe to retry (`saveOnce`): a first answer is created under the id its form chose, so
 * a retry after a lost answer finds it. The matrix that reads the answers is
 * `requirement_source_compliance` in product-assurance.
 */

type Client = Pick<SupabaseClient, "from">;

/** The answer as a reader gives it. */
export type RequirementAnswer = {
  requirementId: string;
  /** The recorded answer's id, or for a first answer one chosen once when the form opened. */
  id: string;
  /** The revision of the recorded answer the reader saw; absent for a first answer. */
  revision?: number | undefined;
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

/** Why an answer was not saved, in the words of the compliance statement's form. */
export const ANSWER_CONFLICTS = {
  different:
    "An earlier try recorded this answer before you changed it. Your answer is kept; close the dialog and edit the compliance statement to apply it.",
  changed:
    "This answer changed in another session. Your answer is kept; close the dialog and open it again to load the current answer.",
  missing: "This answer is no longer recorded. Your answer is kept.",
  /** A first answer whose requirement another session answered meanwhile: one answer a requirement. */
  answered:
    "Another session answered this requirement first. Your answer is kept; close the dialog and open it again to load theirs.",
} as const;

/**
 * Record a program's answer to a requirement, or change it at the revision the reader saw. A
 * retry finds a first try that landed and writes nothing more; a conflict is a `SaveOnceConflict`
 * in `ANSWER_CONFLICTS`' words.
 */
export async function answerRequirement(
  client: Client,
  context: ReadContext,
  answer: RequirementAnswer,
): Promise<{ outcome: SaveOnceOutcome; record: Row<"requirement_compliance"> }> {
  const [issue] = requirementAnswerIssues(answer);
  if (issue) throw new Error(issue.message);
  if (answer.verificationMethod && !VERIFICATION_METHODS.includes(answer.verificationMethod))
    throw new Error("Choose a verification method from the list.");
  return saveOnce(client, context, {
    table: "requirement_compliance",
    id: answer.id,
    values: {
      status: answer.status,
      verification_method: answer.verificationMethod,
      statement: answer.statement?.trim() || null,
    },
    create: { engineering_requirement_id: answer.requirementId },
    revision: answer.revision,
    conflicts: ANSWER_CONFLICTS,
    taken: () => new SaveOnceConflict("changed", ANSWER_CONFLICTS.answered),
  });
}

/** Answer a requirement as a mutation; the matrix is read again once it settles. */
export function useAnswerRequirement() {
  const workspace = useWorkspace();
  const cache = useQueryClient();
  return useMutation<
    { outcome: SaveOnceOutcome; record: Row<"requirement_compliance"> },
    Error,
    RequirementAnswer
  >({
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
