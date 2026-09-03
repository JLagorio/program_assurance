import { useCallback, useState } from "react";

/**
 * Required fields for a form that submits on a button. Pass the current values keyed by field;
 * `check()` on submit marks the first empty one and returns false; `errorFor(key)` feeds the
 * Field's `error`, which turns the control's border red and shows the message under it. The
 * asterisk is the Field's `isRequired`, set beside it so the two never drift.
 */
export function useRequired<K extends string>(
  values: Record<K, string | null | undefined>,
  message = "Required.",
) {
  const [missing, setMissing] = useState<K | null>(null);
  const check = useCallback(() => {
    const first = (Object.keys(values) as K[]).find((k) => !String(values[k] ?? "").trim());
    setMissing(first ?? null);
    return first === undefined;
  }, [values]);
  const reset = useCallback(() => setMissing(null), []);
  const errorFor = (key: K) => (missing === key ? message : undefined);
  return { check, reset, errorFor, missing };
}
