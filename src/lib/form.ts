import { useCallback, useState } from "react";

/*
 * Per-field errors for a hand-rolled form. The form names its required fields with a key each,
 * runs `validate` on submit with one check per key (a message when the field is invalid, nothing
 * when it is fine), and passes `errors.key` to the matching Field. The kit's Field puts
 * aria-invalid on its control, which is what `focusFirstInvalid` looks for after React paints.
 */

export type FormErrors<K extends string> = Partial<Record<K, string>>;

/** One check per key: a message when the field is invalid, or anything falsy when it is fine. */
export type FormChecks<K extends string> = Partial<Record<K, string | false | null | undefined>>;

export function focusFirstInvalid() {
  requestAnimationFrame(() => {
    const control = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    control?.focus();
  });
}

export function useFormErrors<K extends string>() {
  const [errors, setErrors] = useState<FormErrors<K>>({});

  /** Sets the errors from the checks and returns whether the form is valid. Invalid focuses the first bad control. */
  const validate = useCallback((checks: FormChecks<K>): boolean => {
    const next: FormErrors<K> = {};
    for (const key of Object.keys(checks) as K[]) {
      const message = checks[key];
      if (typeof message === "string" && message) next[key] = message;
    }
    setErrors(next);
    const valid = Object.keys(next).length === 0;
    if (!valid) focusFirstInvalid();
    return valid;
  }, []);

  const clear = useCallback(() => setErrors({}), []);

  return { errors, validate, clear };
}

/** The usual check: a required text field is empty. */
export function required(value: string | null | undefined, message: string): string | false {
  return value?.trim() ? false : message;
}
