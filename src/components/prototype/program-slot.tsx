// The program's action slot, Josef's decisions of 2026-11-17 ("Slot · Role-true: the top right
// holds this reader's next step, or who it waits on; each program records its roles" and "Signing ·
// Held to roles: the assessor judges, the lead assessor publishes, only the authorizing official
// signs"). What holds for this part alone:
//
// The program's Overview and its Authorization view end their header with the kit's
// `PageHeader.Slot` in PageHeader.Actions' place, one of its forms derived by `programSlot` in
// src/lib/program-slot (the rules are there): Sign for the authorizing official while a package
// version waits on a decision (`Button intent="sign"` with their name, which opens the
// authorization decision's form with them as its decision maker), Publish assessment results for
// the lead assessor while draft results hold findings (the same confirmation as the Review
// queue's), Waiting on the holder of the role for everyone else (their role and what for, since
// when), Assign owner for a writer while open risks or operational issues have no owner (a link to
// the register asked for exactly those), or no form. Edit program is in the slot's `more`, the
// record's other commands behind a subtle icon button, so the slot keeps the page's one primary. A
// program that records nobody in any role keeps today's header: Edit program as its primary. While
// the roles are read the slot draws nothing; a read that fails is the page's alert, and roles that
// cannot be read keep today's header.
//
// The boards' Remind is left out: nothing sends a reminder yet, so the wait draws no button.

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { DropdownMenuItem, PageHeader, useLedgerLocale } from "@ledger/design-system";
import { useRow } from "@/lib/models";
import { partAddress } from "@/lib/program-parts";
import { registerViews } from "@/lib/register-views";
import { unownedQuestions } from "@/lib/owner-assign";
import { roleWords, useReaderRoles } from "@/lib/program-roles";
import { useProgramSlot, type DecisionWait, type ResultsWait } from "@/lib/program-slot";
import { useWorkspace } from "@/components/app/workspace";
import { questionSearch } from "./collection-question";
import { usePublishResults } from "./publish-results";
import { ProductRecordDialog } from "./product-record-dialog";
import { RecordActions, ReportFailures } from "./work-common";

/** What each wait asks of the role that holds it, after the role's words. */
const WAIT_FOR = {
  package: "to decide",
  assessment_results: "to publish results",
} as const;

/**
 * The program header's actions: the slot where the program records its roles, else Edit program as
 * today. `onEdit` opens the program's edit, which the slot keeps in its `more`.
 */
export function ProgramHeaderSlot({
  programId,
  onEdit,
}: {
  programId: string;
  onEdit: () => void;
}) {
  const workspace = useWorkspace();
  const { slot, queries } = useProgramSlot(programId);
  const canEdit = workspace.role !== "viewer";
  const more = canEdit
    ? {
        label: "More program actions",
        items: <DropdownMenuItem onClick={onEdit}>Edit program</DropdownMenuItem>,
      }
    : undefined;
  return (
    <>
      <ReportFailures queries={queries} />
      {slot === undefined ? null : slot.form === "unrecorded" ? (
        <PageHeader.Actions>
          <RecordActions table="programs" editLabel="Edit program" onEdit={onEdit} />
        </PageHeader.Actions>
      ) : slot.form === "sign" ? (
        <SignSlot programId={programId} wait={slot.wait} more={more} />
      ) : slot.form === "advance" && slot.step.kind === "publish" ? (
        <PublishSlot wait={slot.step.wait} more={more} />
      ) : slot.form === "advance" && slot.step.kind === "assign_owner" ? (
        <OwnerSlot programId={programId} step={slot.step} more={more} />
      ) : slot.form === "waiting" ? (
        <PageHeader.Slot
          waitingOn={{
            name: slot.holder.name,
            role: `${roleWords(slot.role)}, ${WAIT_FOR[slot.wait.kind]}`,
            since: slot.wait.since,
          }}
          more={more}
        />
      ) : (
        <PageHeader.Slot more={more} />
      )}
    </>
  );
}

type More = Parameters<typeof PageHeader.Slot>[0]["more"];

/**
 * The authorizing official's signature: the sign Button with their own name, which opens the
 * authorization decision's form on the version that waits, with them as its decision maker.
 */
function SignSlot({
  programId,
  wait,
  more,
}: {
  programId: string;
  wait: DecisionWait;
  more: More;
}) {
  const reader = useReaderRoles(programId);
  const partyId =
    reader.data?.find((role) => role.role === "authorizing_official")?.partyId ?? null;
  const signer = useRow("parties", partyId);
  const [signing, setSigning] = useState(false);
  const name = signer.data?.name;
  // Their name could not be read: the page's alert says so, and the slot keeps the other commands.
  if (!partyId || !name)
    return (
      <>
        <ReportFailures queries={[signer]} />
        {signer.isError && <PageHeader.Slot more={more} />}
      </>
    );
  return (
    <>
      <PageHeader.Slot
        sign={{
          label: "Record authorization decision",
          signer: name,
          role: roleWords("authorizing_official"),
          onSign: () => setSigning(true),
        }}
        more={more}
      />
      {signing && (
        <ProductRecordDialog
          table="authorization_decisions"
          operationLabel="Record authorization decision"
          description={
            wait.version === null
              ? wait.packageTitle
              : `${wait.packageTitle} · version ${wait.version}`
          }
          initialValues={{ package_revision_id: wait.versionId, decision_maker_party_id: partyId }}
          onClose={() => setSigning(false)}
        />
      )}
    </>
  );
}

/**
 * The lead assessor's publication: Publish assessment results, why (the draft holds findings) and
 * whose (the campaign), through the same confirmation the Review queue's preview asks.
 */
function PublishSlot({ wait, more }: { wait: ResultsWait; more: More }) {
  const { formatPlural } = useLedgerLocale();
  const results = useRow("assessment_results_revisions", wait.resultsId);
  const publish = usePublishResults();
  const [asking, setAsking] = useState(false);
  const row = results.data;
  return (
    <>
      <PageHeader.Slot
        advance={{
          label: "Publish assessment results",
          reason: formatPlural(wait.findings, {
            one: "Draft results hold {count} finding",
            other: "Draft results hold {count} findings",
          }),
          ...(wait.campaignTitle ? { detail: wait.campaignTitle } : {}),
          isLoading: !row || asking,
          onAction: () => {
            if (!row || asking) return;
            setAsking(true);
            void publish
              .ask({
                id: row.id,
                title: wait.resultsTitle,
                versionNumber: row.version_number,
                revision: row.revision,
                findings: wait.findings,
              })
              .finally(() => setAsking(false));
          },
        }}
        more={more}
      />
      {publish.confirmation}
    </>
  );
}

/**
 * The program's own step for a writer: its open risks (or operational issues) nobody owns, a link
 * to the register asked for exactly those, where Assign owner is the selection's verb.
 */
function OwnerSlot({
  programId,
  step,
  more,
}: {
  programId: string;
  step: { collection: "risks" | "operational_issues"; count: number };
  more: More;
}) {
  const { formatPlural } = useLedgerLocale();
  const risks = step.collection === "risks";
  const address = partAddress(risks ? "Risks" : "Findings");
  const question = risks
    ? questionSearch(registerViews.programRisks, unownedQuestions.risks)
    : questionSearch(registerViews.programOperationalIssues, unownedQuestions.operational_issues);
  return (
    <PageHeader.Slot
      advance={{
        label: "Assign owner",
        reason: formatPlural(
          step.count,
          risks
            ? { one: "{count} open risk", other: "{count} open risks" }
            : { one: "{count} open operational issue", other: "{count} open operational issues" },
        ),
        detail: "no owner",
        link: (
          <Link
            to="/programs/$programId"
            params={{ programId }}
            search={{ ...address.search, ...question }}
            {...(address.hash ? { hash: address.hash } : {})}
          />
        ),
      }}
      more={more}
    />
  );
}
