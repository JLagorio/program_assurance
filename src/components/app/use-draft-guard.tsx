import { useRef, useState } from "react";
import { useBlocker } from "@tanstack/react-router";
import { discardChanges, useConfirmation } from "./confirmation";

/** Shared dismissal and in-flight protection for forms that write through a domain command. */
export function useDraftGuard({
  dirty,
  onClose,
  description = "Discard your unsaved changes?",
}: {
  dirty: boolean;
  onClose: () => void;
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
  async function close() {
    if (pending.current) return;
    if (!dirty || (await confirm(discardChanges(description)))) {
      bypass.current = true;
      onClose();
    }
  }
  function start() {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true);
    return true;
  }
  function finish() {
    pending.current = false;
    setBusy(false);
  }
  function complete() {
    bypass.current = true;
    onClose();
  }
  return { busy, confirmation, close, start, finish, complete };
}
