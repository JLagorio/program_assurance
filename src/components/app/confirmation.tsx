import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertTitle,
} from "@ledger/design-system";

export type ConfirmationOptions = {
  /** The question: "Delete program?". */
  title: string;
  /** The consequence, not the question again: "The task details you entered will be lost." */
  description: string;
  /** The verb on the Action: "Delete program", "Discard changes". */
  confirmLabel: string;
  /** The safe way out. "Cancel" by default; `discardChanges` says "Keep editing". */
  cancelLabel?: string | undefined;
  variant?: "primary" | "danger" | undefined;
  /**
   * The command the decision runs. While it runs the prompt stays open and pending: Escape and
   * Cancel do nothing and the Action shows it is working. A failure is said inside the prompt,
   * with the Action as the retry. `confirm` resolves true once the command has succeeded, and
   * false when the reader cancels, before or after a failure.
   */
  action?: (() => Promise<unknown>) | undefined;
  /** The failure's title when `action` throws: "The program was not deleted". */
  failureTitle?: string | undefined;
};

/** Render `confirmation` inside the owning overlay root so only the top dialog dismisses. */
export function useConfirmation() {
  const [request, setRequest] = useState<ConfirmationOptions | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const running = useRef(false);
  const decision = useRef<((confirmed: boolean) => void) | null>(null);
  const settle = useCallback((confirmed: boolean) => {
    if (running.current) return;
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
      setFailure(null);
      setOpen(true);
    });
  }, []);
  async function accept() {
    const action = request?.action;
    if (!action) {
      settle(true);
      return;
    }
    if (running.current) return;
    running.current = true;
    setPending(true);
    setFailure(null);
    try {
      await action();
      running.current = false;
      setPending(false);
      settle(true);
    } catch (cause) {
      running.current = false;
      setPending(false);
      setFailure(cause instanceof Error ? cause.message : "The request could not be completed.");
    }
  }
  useEffect(
    () => () => {
      running.current = false;
      decision.current?.(false);
      decision.current = null;
    },
    [],
  );
  const confirmation = (
    <AlertDialog
      open={open}
      pending={pending}
      onOpenChange={(next) => {
        if (!next) settle(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{request?.title}</AlertDialogTitle>
          <AlertDialogDescription>{request?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        {failure ? (
          <AlertDialogBody>
            <Alert variant="destructive" role="alert">
              <AlertCircle aria-hidden />
              <AlertTitle>{request?.failureTitle ?? "That did not work"}</AlertTitle>
              <AlertDescription>{failure}</AlertDescription>
            </Alert>
          </AlertDialogBody>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel variant="subtle">{request?.cancelLabel ?? "Cancel"}</AlertDialogCancel>
          <AlertDialogAction
            variant={request?.variant ?? "danger"}
            isLoading={pending}
            onClick={() => void accept()}
          >
            {request?.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { confirm, confirmation };
}

/**
 * The prompt before a draft is thrown away. `description` says what is lost ("The task details
 * you entered will be lost."); the safe answer is Keep editing, which keeps the values and the
 * place.
 */
export const discardChanges = (description: string): ConfirmationOptions => ({
  title: "Discard changes?",
  description,
  confirmLabel: "Discard changes",
  cancelLabel: "Keep editing",
  variant: "danger",
});
