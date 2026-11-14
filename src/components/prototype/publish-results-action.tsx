import { useRef, useState, type RefObject } from "react";
import { Button } from "@ledger/design-system";
import { RESULTS_NEED_FINDINGS, type ResultsToPublish } from "@/lib/assessment-results";
import { useRow } from "@/lib/models";

/** The results a preview offers to publish: its revision, its name and the findings it says. */
export type ResultsOffered = { id: string; title: string; findings: number };

/**
 * Publish assessment results, the one primary of a preview of draft results: the Review queue's
 * and the assessment campaign's Assessment results. The results revision is read as the preview
 * opens, for the revision the reader saw; the findings are the number the preview says. It keeps
 * its place and says why while that read loads, when it fails, while the results hold no finding,
 * and once they are published, here or in another session, so focus stays on it. Key it by the
 * results, so another record's preview starts again.
 */
export function PublishResultsAction({
  results: offered,
  onPublish,
}: {
  results: ResultsOffered;
  onPublish: (
    results: ResultsToPublish,
    returnFocus: RefObject<HTMLElement | null>,
  ) => Promise<boolean>;
}) {
  const results = useRow("assessment_results_revisions", offered.id);
  const [published, setPublished] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const row = results.data;
  const waits =
    published || row?.state === "published"
      ? "These assessment results are published."
      : row === null
        ? "These assessment results are no longer available."
        : results.isError
          ? "The assessment results could not be read."
          : !row
            ? "Reading the assessment results…"
            : offered.findings < 1
              ? RESULTS_NEED_FINDINGS
              : undefined;
  const publish = async () => {
    if (!row || waits) return;
    const done = await onPublish(
      {
        id: row.id,
        title: offered.title,
        versionNumber: row.version_number,
        revision: row.revision,
        findings: offered.findings,
      },
      button,
    );
    if (done) setPublished(true);
  };
  return (
    <Button
      ref={button}
      size="small"
      variant="primary"
      onClick={() => void publish()}
      {...(waits ? { disabledReason: waits } : {})}
    >
      Publish assessment results
    </Button>
  );
}
