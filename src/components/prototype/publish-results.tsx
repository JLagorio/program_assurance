// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// Assessment results to publish are published from their preview: Publish assessment results is its
// record header's one small primary, for a reader who may write, and the same command is an item of
// the assessment campaign record's Actions menu, for the campaign's latest draft results that hold
// a finding (`useCampaignResultsToPublish` in assessment-results), where it stays in place and says
// why while there are none (This campaign has no assessment results to publish; its draft results
// hold no finding yet; they are all published).
//
// Each confirms first (`usePublishResults` in publish-results): the prompt names the results and
// how many findings they hold, and says publishing freezes them, since the program's control
// statuses and traces read them from then on. It runs `publish_assessment_results` as its action,
// at the revision the reader saw and holding the findings the reader was told, one request a
// prompt, which the command answers again as it first did; a refusal (results another session
// published first, results changed since, results with no finding) shows inside the prompt, and a
// toast reports the publication. The command also records the publication in the program's
// activity, one activity event naming the publisher's party, the program and the campaign, so the
// Portfolio's Recent activity and the program's Activity read "Priya Raghavan published assessment
// results of Continuous monitoring FY2027" over the results and the findings they froze ("Interim
// results: 20 findings."), linked to the campaign record; a direct update of a revision's state, as
// the seeds and the tests publish, writes no event, and results published before the command
// recorded one have none.

import type { RefObject } from "react";
import { toast, useLedgerLocale } from "@ledger/design-system";
import { useConfirmation } from "@/components/app/confirmation";
import { usePublishAssessmentResults, type ResultsToPublish } from "@/lib/assessment-results";

/**
 * Keeps focus on the control that asked once the prompt lets go of it. The control may be drawn
 * again while the prompt closes (to say why it no longer runs, the results being published here or
 * in another session), and the prompt's own return would then find the old one gone. Focus the
 * reader has put somewhere else stays there.
 */
function holdFocus(target: RefObject<HTMLElement | null>) {
  let tries = 0;
  const settle = () => {
    const active = document.activeElement;
    if (active === target.current) return;
    if (active && active !== document.body && !active.closest('[role="alertdialog"]')) return;
    if (!active || active === document.body) target.current?.focus();
    if (document.activeElement === target.current) return;
    if (tries++ < 60) requestAnimationFrame(settle);
  };
  requestAnimationFrame(settle);
}

/**
 * Publish assessment results, as the Review queue's preview, an assessment campaign's Actions menu
 * and its Assessment results preview ask it: a confirmation that names the results and says
 * publishing freezes their findings, which runs the command as its action (a refusal shows inside
 * it, the action its retry), then a toast. Each confirmation sends one request, so a retry after an
 * answer that was lost is answered as the first was. Render `confirmation` where it outlives the
 * control that asked: beside the preview, outside the menu. `ask` resolves true once the results
 * are published; `returnFocus`, the control that asked where it stays in place, keeps focus however
 * the prompt ends.
 */
export function usePublishResults() {
  const { formatPlural } = useLedgerLocale();
  const publish = usePublishAssessmentResults();
  const { confirm, confirmation } = useConfirmation();
  const ask = async (
    results: ResultsToPublish,
    returnFocus?: RefObject<HTMLElement | null> | undefined,
  ) => {
    const requestId = crypto.randomUUID();
    const held = formatPlural(results.findings, {
      one: "{count} finding. Publishing freezes it: from then on the program's control statuses and traces read it, and it can no longer change.",
      other:
        "{count} findings. Publishing freezes them: from then on the program's control statuses and traces read them, and they can no longer change.",
    });
    const published = await confirm({
      title: "Publish assessment results?",
      description: `${results.title} holds ${held}`,
      confirmLabel: "Publish assessment results",
      variant: "primary",
      failureTitle: "The assessment results were not published",
      action: () => publish.mutateAsync({ ...results, requestId }),
    });
    if (returnFocus) holdFocus(returnFocus);
    if (published)
      toast.add({
        type: "success",
        title: "Assessment results published",
        description: results.title,
      });
    return published;
  };
  return { ask, confirmation };
}
