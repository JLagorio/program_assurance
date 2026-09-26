import { useCallback, useEffect, useRef, useState } from "react";
import type { ErrorSummaryIssue } from "@ledger/design-system";

/** One field's problem after a submission: the field's key and what fixes it, naming the field. */
export type FormIssue<Key extends string> = { field: Key; message: string };

/**
 * Whether the DateTimeField whose day input is `node` has focus and a half-typed moment it has not
 * reported yet. The field checks for a missing half when focus leaves it, so Enter inside it
 * submits the form first, with no value and no entry error. Before validating, the form moves
 * focus out, which makes the field report, and counts the entry as that attempt's issue with the
 * field's own words, `useLedgerLocale().t("dateTimeIncomplete")`.
 */
export function unsettledMoment(node: HTMLElement | null): boolean {
  const field = node?.closest('[data-slot="date-time-field"]');
  if (!field?.contains(document.activeElement)) return false;
  return [...field.querySelectorAll("input")].some(
    (input) => input.type !== "hidden" && input.value.trim() !== "",
  );
}

/**
 * Submit-time feedback for a form of kit Fields. Validate on submit, then on change: `submitted`
 * turns the fields' own errors on after the first attempt, and `report` takes that attempt's
 * issues in field order. One issue moves focus to its control once the field shows its error;
 * several fill `summary` for an ErrorSummary (with `focusKey={attempts}`), which takes focus and
 * leads to each control. `ref(field)` registers the control; `node(field)` reads it, for
 * DialogContent `initialFocus`.
 */
export function useFormFeedback<Key extends string>() {
  const nodes = useRef(new Map<Key, HTMLElement | null>());
  const callbacks = useRef(new Map<Key, (node: HTMLElement | null) => void>());
  const focusNext = useRef<Key | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [summary, setSummary] = useState<ErrorSummaryIssue[]>([]);
  const ref = useCallback((field: Key) => {
    let callback = callbacks.current.get(field);
    if (!callback) {
      callback = (node: HTMLElement | null) => {
        nodes.current.set(field, node);
      };
      callbacks.current.set(field, callback);
    }
    return callback;
  }, []);
  const node = useCallback((field: Key) => nodes.current.get(field) ?? null, []);
  const report = useCallback((issues: readonly FormIssue<Key>[]) => {
    setAttempts((count) => count + 1);
    if (issues.length > 1) {
      focusNext.current = null;
      setSummary(
        issues.map((issue) => ({
          id: issue.field,
          message: issue.message,
          target: () => nodes.current.get(issue.field),
        })),
      );
    } else {
      setSummary([]);
      focusNext.current = issues[0]?.field ?? null;
    }
    return issues.length === 0;
  }, []);
  // Focus after the render that marks the field, so the control is already described by its error.
  useEffect(() => {
    const field = focusNext.current;
    focusNext.current = null;
    if (field) nodes.current.get(field)?.focus();
  }, [attempts]);
  return { submitted: attempts > 0, attempts, summary, ref, node, report };
}
