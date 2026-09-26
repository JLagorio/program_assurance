import { useRef, useState } from "react";
import { useBlocker } from "@tanstack/react-router";
import { discardChanges, useConfirmation } from "./confirmation";

/**
 * Shared dismissal and in-flight protection for forms that write through a domain command: a
 * dirty close or route change asks first, and a pending save blocks both (with the browser's own
 * `beforeunload` for a reload or a closed tab). Pair `busy` with the kit Dialog's `pending`.
 */
export function useDraftGuard({
  dirty,
  onClose,
  description = "The changes you made will be lost.",
}: {
  dirty: boolean;
  onClose: () => void;
  /** What discarding loses, said in the prompt: "The task details you entered will be lost." */
  description?: string;
}) {
  const { confirm, confirmation } = useConfirmation();
  const pending = useRef(false);
  const bypass = useRef(false);
  const [busy, setBusy] = useState(false);
  useBlocker({
    shouldBlockFn: async () =>
      !bypass.current &&
      (pending.current || (dirty && !(await confirm(discardChanges(description))))),
    enableBeforeUnload: () => !bypass.current && (dirty || pending.current),
  });
  /** Close on request: asks first when dirty, and does nothing while a save is pending. */
  async function close() {
    if (pending.current) return;
    if (!dirty || (await confirm(discardChanges(description)))) {
      bypass.current = true;
      onClose();
    }
  }
  /** The save starts: returns false when one is already running. */
  function start() {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true);
    return true;
  }
  /** The save has settled, either way. */
  function finish() {
    pending.current = false;
    setBusy(false);
  }
  /** The draft is saved: nothing asks again, and the form closes. */
  function complete() {
    bypass.current = true;
    onClose();
  }
  /**
   * The draft is saved and the caller leaves on its own (to the new record, or through its own
   * close): nothing asks again, and `onClose` is not called.
   */
  function release() {
    bypass.current = true;
  }
  // `confirm` is the guard's own prompt, for a second question the form asks ("Change program?"),
  // so the form renders one `confirmation`.
  return { busy, confirmation, confirm, close, start, finish, complete, release };
}
