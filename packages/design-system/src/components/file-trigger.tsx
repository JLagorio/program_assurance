import { useFieldRootContext } from "@base-ui/react/internals/field-root-context";
import { useLabelableContext, useLabelableId } from "@base-ui/react/internals/labelable-provider";
import { useCallback, useContext, useId, useRef, type ChangeEvent, type Ref } from "react";

import { useLedgerLocale } from "../lib/locale";
import { Button, type ButtonProps } from "./button";
import { FieldSetStateContext, FieldStateContext } from "./controls";

/* A button that opens the browser's file picker. The native file input is in the document, hidden
   (`hidden`, so it takes no space, no focus and no place in the accessibility tree), and the button
   is the control: it is focused, named and described, and the picker returns focus to it when it
   closes. Inside a Field the button is the Field's control, as Base UI's own controls are: the
   FieldLabel points at it, clicking the label opens the picker, the FieldDescription and FieldError
   describe it, and the Field's invalid and disabled reach it. */

export type FileTriggerProps = Omit<ButtonProps, "onSelect" | "type"> & {
  /**
   * The file types the picker offers, as the input's `accept`: media types (`application/pdf`),
   * wildcards (`image/*`) and extensions (`.csv`), in a string or a list. The picker filters by it
   * but a reader can still choose another file, so check the files you receive; DropZone does.
   */
  accept?: string | readonly string[] | undefined;
  /** Lets the reader choose several files at once. One by default. */
  multiple?: boolean | undefined;
  /** On a phone, offers the camera directly: `environment` the rear one, `user` the front. */
  capture?: "user" | "environment" | undefined;
  /**
   * Called with the chosen files once the picker closes with a choice; not called when the reader
   * cancels. The input is emptied after each choice, so choosing the same file again (after a
   * removal or a failed upload) calls it again.
   */
  onSelect?: ((files: File[]) => void) | undefined;
  /** The hidden file input, for a test or a caller that opens the picker itself. */
  inputRef?: Ref<HTMLInputElement> | undefined;
};

/** `accept` as the input attribute: a comma-separated list, or nothing. */
export function acceptAttribute(accept: FileTriggerProps["accept"]) {
  const list = typeof accept === "string" ? accept : accept?.join(",");
  return list?.trim() ? list : undefined;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

/**
 * A Button that opens the file picker, with `accept`, `multiple` and `onSelect`. Every Button prop
 * applies: `variant`, `size`, `iconBefore`, `isLoading`, `disabledReason`. Its label defaults to
 * "Choose a file", or "Choose files" with `multiple`. Inside a Field, the FieldLabel names it
 * together with its own words ("Signed agreement Choose a file") and the Field's hint and error
 * describe it.
 */
export function FileTrigger({
  accept,
  multiple = false,
  capture,
  onSelect,
  inputRef,
  onClick,
  children,
  id,
  disabled,
  ...props
}: FileTriggerProps) {
  const { t } = useLedgerLocale();
  const input = useRef<HTMLInputElement | null>(null);
  const labelable = useLabelableContext();
  const fieldRoot = useFieldRootContext();
  const field = useContext(FieldStateContext);
  const fieldSet = useContext(FieldSetStateContext);
  const controlId = useLabelableId({ id });
  const requiredId = useId();
  const wordsId = useId();
  const resolvedDisabled = Boolean(
    disabled || fieldRoot.disabled || field?.disabled || fieldSet?.disabled,
  );
  const labelId = labelable.labelId ?? field?.labelId;
  const required = Boolean(field?.required && labelId);
  // The Field's label names the button with the button's own words after it, so a speech user
  // can say what they see. The words are referenced by their own span: the label points at the
  // button (`for`), so a reference to the button itself would read the label twice. A caller's
  // aria-label or aria-labelledby wins.
  const labelledBy =
    props["aria-labelledby"] ??
    (props["aria-label"] === undefined && labelId
      ? [labelId, required ? requiredId : undefined, wordsId].filter(Boolean).join(" ")
      : undefined);
  const describedBy = labelable.getDescriptionProps({
    "aria-describedby": props["aria-describedby"],
  })["aria-describedby"];
  const invalid = props["aria-invalid"] ?? (fieldRoot.state.valid === false ? true : undefined);

  const setInput = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      assignRef(inputRef, node);
    },
    [inputRef],
  );
  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    // Emptied, so the same file chosen again is a change.
    event.currentTarget.value = "";
    if (files.length) onSelect?.(files);
  };

  return (
    <>
      <Button
        {...props}
        data-slot="file-trigger"
        id={controlId}
        disabled={resolvedDisabled}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          input.current?.click();
        }}
      >
        <span id={wordsId} data-slot="file-trigger-label">
          {children ?? t(multiple ? "chooseFiles" : "chooseFile")}
        </span>
      </Button>
      {required ? (
        <span id={requiredId} hidden>
          {t("requiredGroup")}
        </span>
      ) : null}
      {/* No data-slot: a ButtonGroup rounds its last `[data-slot]` child, which must stay the button. */}
      <input
        ref={setInput}
        type="file"
        hidden
        tabIndex={-1}
        data-file-trigger-input=""
        accept={acceptAttribute(accept)}
        multiple={multiple}
        capture={capture}
        disabled={resolvedDisabled}
        onChange={choose}
      />
    </>
  );
}
