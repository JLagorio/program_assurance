import { useLedgerLocale } from "../lib/locale";
import { useCallback, useState, type RefObject } from "react";

type FieldValue = string | null | undefined | false;
export type ValidationOptions<K extends string> = {
  /** Scope native name/id lookup to this form; refs also support composite controls. */
  formRef?: RefObject<HTMLFormElement | null> | undefined;
  fieldRefs?: Partial<Record<K, RefObject<HTMLElement | null>>> | undefined;
  /** Optional format checks; required fields are checked first. */
  validate?: Partial<Record<K, (value: string) => string | null>> | undefined;
};

/** Requiredness and optional format validation. All submit errors are reported and repaired errors
 * clear as values change. False exempts a conditional field. Input values remain owned by the form.
 * Bind native names or fieldRefs to move focus to the first error. Call touch on blur for format
 * checks; requiredness remains a submit check. Server errors persist until explicitly cleared. */
export function useRequired<K extends string>(
  values: Record<K, FieldValue>,
  message?: string,
  options: ValidationOptions<K> = {},
) {
  const { t } = useLedgerLocale();
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<K, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Partial<Record<K, string>>>({});
  const keys = Object.keys(values) as K[];
  const validation = (key: K, submit: boolean) => {
    if (values[key] === false) return undefined;
    const value = String(values[key] ?? "").trim();
    if (!value) return submit ? (message ?? t("required")) : undefined;
    return options.validate?.[key]?.(value) ?? undefined;
  };
  const errors = Object.fromEntries(
    keys.flatMap((key) => {
      if (values[key] === false) return [];
      const error =
        serverErrors[key] ?? (submitted || touched[key] ? validation(key, submitted) : undefined);
      return error ? [[key, error]] : [];
    }),
  ) as Partial<Record<K, string>>;
  const missing = keys.find((key) => errors[key]) ?? null;
  const focus = (key: K) => {
    const explicit = options.fieldRefs?.[key]?.current;
    const form = options.formRef?.current;
    const named = form?.elements.namedItem(key);
    const native = named instanceof HTMLElement ? named : null;
    const byId = form
      ? Array.from(form.querySelectorAll<HTMLElement>("[id]")).find((el) => el.id === key)
      : null;
    const compositeId = native?.dataset["dsFocusTarget"];
    const composite = compositeId ? form?.ownerDocument.getElementById(compositeId) : null;
    const grouped = named instanceof RadioNodeList ? Array.from(named) : [];
    for (const target of [explicit, composite, native, byId, ...grouped]) {
      if (!target || target.matches(':disabled, [hidden], input[type="hidden"]')) continue;
      target.focus();
      if (target.ownerDocument.activeElement === target) return;
    }
  };
  const check = () => {
    setSubmitted(true);
    const first = keys.find(
      (key) => values[key] !== false && (serverErrors[key] || validation(key, true)),
    );
    if (first !== undefined) focus(first);
    return first === undefined;
  };
  const reset = useCallback(() => {
    setSubmitted(false);
    setTouched({});
    setServerErrors({});
  }, []);
  const touch = (key: K) => setTouched((previous) => ({ ...previous, [key]: true }));
  const clearServerError = (key: K) =>
    setServerErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  return {
    check,
    reset,
    errorFor: (key: K) => errors[key],
    missing,
    errors,
    touched,
    touch,
    focus,
    setServerErrors,
    clearServerError,
  };
}
