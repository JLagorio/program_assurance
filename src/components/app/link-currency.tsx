/**
 * The row flag for a link whose upstream changed, and the one action that
 * clears it. Nothing renders while the link is Current; a Suspect or
 * Invalidated link gets the Indicator beside its state and a "Reviewed" link
 * that asks for a word before it records the review.
 */

import { useState } from "react";

import { AlertDialog, Button, Indicator, Inline } from "@ledger/design-system";
import { currentSession } from "@/lib/control-work";
import { currencyOf, reviewLink, useLinkCurrencyVersion, type LinkRef } from "@/lib/link-currency";

export function SuspectFlag({ link, name }: { link: LinkRef; name: string }) {
  useLinkCurrencyVersion();
  const [confirming, setConfirming] = useState(false);
  const { currency, causes } = currencyOf(link);
  if (currency === "Current") return null;
  const who = currentSession().name;
  return (
    <Inline as="span" space="space.100" alignBlock="center">
      <Indicator
        tone={currency === "Invalidated" ? "danger" : "warning"}
        title={causes.map((c) => c.detail).join("\n")}
      >
        {currency}
      </Indicator>
      <Button variant="link" size="small" onClick={() => setConfirming(true)}>
        Review
      </Button>
      <AlertDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          reviewLink(link, who);
          setConfirming(false);
        }}
        title="Reviewed, still holds"
        description={`${name} is recorded as re-read by ${who} against ${causes.length === 1 ? "this change" : `these ${causes.length} changes`}. It stays Current until the next one.`}
        confirmLabel="Record the review"
      >
        <ul className="list-disc ps-200 font-body-small text-subtle">
          {causes.map((c) => (
            <li key={c.key}>{c.detail}</li>
          ))}
        </ul>
      </AlertDialog>
    </Inline>
  );
}
