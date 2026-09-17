import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@ledger/design-system";

type ConfirmationOptions = {
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "primary" | "danger";
};

/** Render `confirmation` inside the owning overlay root so only the top dialog dismisses. */
export function useConfirmation() {
  const [request, setRequest] = useState<ConfirmationOptions | null>(null);
  const [open, setOpen] = useState(false);
  const decision = useRef<((confirmed: boolean) => void) | null>(null);
  const settle = useCallback((confirmed: boolean) => {
    const resolve = decision.current;
    decision.current = null;
    setOpen(false);
    resolve?.(confirmed);
  }, []);
  const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    // A second intent must not piggyback on an unrelated confirmation.
    if (decision.current) return Promise.resolve(false);
    return new Promise((resolve) => {
      decision.current = resolve;
      setRequest(options);
      setOpen(true);
    });
  }, []);
  useEffect(
    () => () => {
      decision.current?.(false);
      decision.current = null;
    },
    [],
  );
  const confirmation = (
    <AlertDialog
      open={open}
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{request?.title}</AlertDialogTitle>
          <AlertDialogDescription>{request?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="subtle">Cancel</AlertDialogCancel>
          <AlertDialogAction variant={request?.variant ?? "danger"} onClick={() => settle(true)}>
            {request?.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { confirm, confirmation };
}

export const discardChanges = (description: string): ConfirmationOptions => ({
  title: "Discard changes?",
  description,
  confirmLabel: "Discard changes",
  variant: "danger",
});
