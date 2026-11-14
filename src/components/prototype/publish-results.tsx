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
 * Publish assessment results, as the Review queue's preview and an assessment campaign's Actions
 * menu ask it: a confirmation that names the results and says publishing freezes their findings,
 * which runs the command as its action (a refusal shows inside it, the action its retry), then a
 * toast. Each confirmation sends one request, so a retry after an answer that was lost is answered
 * as the first was. Render `confirmation` where it outlives the control that asked: beside the
 * preview, outside the menu. `ask` resolves true once the results are published; `returnFocus`,
 * the control that asked where it stays in place, keeps focus however the prompt ends.
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
