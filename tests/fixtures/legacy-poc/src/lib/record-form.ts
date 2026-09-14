import { useForm, useStore, revalidateLogic, type DeepKeys } from "@tanstack/react-form";
import { useCallback, useEffect, useId, useRef, type SetStateAction } from "react";
import { useLedgerLocale } from "@ledger/design-system";
import { z } from "zod";

/** Shared record-form policy. TanStack owns values, field metadata and submission.
 * Submit metadata selects the command for dialogs with more than one action.
 * Draft saves can deliberately bypass submission without bypassing final validation. */
export function useRecordForm<T extends Record<string, unknown>>(
  defaultValues: T,
  required: (values: T) => Partial<Record<DeepKeys<T>, unknown>>,
) {
  const { t } = useLedgerLocale();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const validate = (value: T) => {
    const fields: Record<string, string> = {};
    const schema = z.string().trim().min(1, t("required"));
    for (const [key, entry] of Object.entries(required(value))) {
      if (entry === false) continue;
      const result = schema.safeParse(entry ?? "");
      if (!result.success) fields[key] = t("required");
    }
    return Object.keys(fields).length ? { fields } : undefined;
  };
  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    validators: { onDynamic: ({ value }) => validate(value) },
    onSubmitMeta: { save: (() => {}) as () => void | Promise<void> },
    onSubmit: async ({ meta }) => {
      await meta.save();
    },
    onSubmitInvalid: () => {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>(
            'input[aria-invalid="true"], textarea[aria-invalid="true"], select[aria-invalid="true"], button[aria-invalid="true"]',
          )
          ?.focus(),
      );
    },
  });
  const values = useStore(form.store, (state) => state.values);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  // Action switches can change requiredness without changing an input value.
  // Revalidate existing errors before TanStack's next submission checks field validity.
  const previousRequirements = useRef<string | undefined>(undefined);
  useEffect(() => {
    // Evaluate after render: a requirement may refer to the selected action declared after this hook.
    const requirements = JSON.stringify(
      Object.entries(required(form.state.values)).map(([key, value]) => [key, value !== false]),
    );
    if (requirements !== previousRequirements.current && form.state.submissionAttempts > 0) {
      void form.validate("change");
    }
    previousRequirements.current = requirements;
  }, [form, required]);
  // Stable setters keep existing draft transformations and effect dependencies intact.
  const setValue = useCallback(
    <K extends keyof T>(key: K, update: SetStateAction<T[K]>) => {
      form.setFieldValue(
        key as DeepKeys<T>,
        ((previous: T[K]) =>
          typeof update === "function"
            ? (update as (value: T[K]) => T[K])(previous)
            : update) as never,
      );
    },
    [form],
  );
  return { form, values, setValue, formId, formRef, isSubmitting };
}
