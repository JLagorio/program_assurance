import { useCallback, useState } from "react";

/**
 * Required fields, checked on submit. Name the values; the Fields they belong to carry
 * `isRequired` and `error={req.errorFor(key)}`; the primary button stays enabled and calls
 * `req.check()` first. The first empty field turns red with the message under it. A value of
 * `false` is a field that is not required right now (`{ note: needsReason && note }`).
 */
export function useRequired<K extends string>(
  values: Record<K, string | null | undefined | false>,
  message = "Required.",
) {
  const [missing, setMissing] = useState<K | null>(null);
  const check = useCallback(() => {
    const first = (Object.keys(values) as K[]).find(
      (k) => values[k] !== false && !String(values[k] ?? "").trim(),
    );
    setMissing(first ?? null);
    return first === undefined;
  }, [values]);
  const reset = useCallback(() => setMissing(null), []);
  const errorFor = (key: K) => (missing === key ? message : undefined);
  return { check, reset, errorFor, missing };
}
