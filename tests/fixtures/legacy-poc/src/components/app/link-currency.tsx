import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Indicator,
  Inline,
} from "@ledger/design-system";
import { useRef, useState } from "react";

import { currentSession } from "@/lib/control-work";
import { currencyOf, reviewLink, useLinkCurrencyVersion, type LinkRef } from "@/lib/link-currency";

export function SuspectFlag({ link, name }: { link: LinkRef; name: string }) {
  const alertCancelRef = useRef<HTMLButtonElement>(null);

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
        onOpenChange={(next) => {
          if (!next) {
            setConfirming(false);
          }
        }}
      >
        <AlertDialogContent
          initialFocus={alertCancelRef}
          className="top-200 translate-y-0 sm:top-1000"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Reviewed, still holds</AlertDialogTitle>
            <AlertDialogDescription>{`${name} is recorded as re-read by ${who} against ${causes.length === 1 ? "this change" : `these ${causes.length} changes`}. It stays Current until the next one.`}</AlertDialogDescription>
            <ul className="list-disc ps-200 font-body-small text-subtle">
              {causes.map((c) => (
                <li key={c.key}>{c.detail}</li>
              ))}
            </ul>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={alertCancelRef}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="primary"

              onClick={() => {
                reviewLink(link, who);
                setConfirming(false);
              }}
            >
              Record the review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Inline>
  );
}
