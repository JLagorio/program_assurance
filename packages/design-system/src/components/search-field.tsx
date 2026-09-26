import { Search, X } from "lucide-react";
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
  type RefObject,
} from "react";

import { useLedgerLocale } from "../lib/locale";
import { FieldStateContext, useFieldControlState, type ControlSize } from "./controls";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./input-group";
import type { InputProps } from "./input";

export type SearchFieldProps = Omit<
  InputProps,
  "type" | "size" | "className" | "style" | "value" | "defaultValue" | "onSubmit"
> & {
  /** The query, when the caller owns it. Pair it with `onValueChange`. */
  value?: string | undefined;
  /** The first query, when the field owns it. */
  defaultValue?: string | undefined;
  /** Medium (32px) in a form; small (28px) in a toolbar, beside small buttons. Medium by default. */
  size?: ControlSize | undefined;
  /**
   * Runs the search on Enter, with the current query, for a search that does not narrow as the
   * reader types. Enter never submits a form around the field, with or without it: a live filter
   * inside a dialog's form leaves saving to the form's own primary.
   */
  onSubmit?: ((value: string) => void) | undefined;
  /** Called after the clear button or Escape has emptied the field. `onValueChange` has already run with "". */
  onClear?: (() => void) | undefined;
  /** Classes for the field's frame, where its width is set. The input's own props go to the input. */
  className?: string | undefined;
  /** Style for the field's frame, such as a width or a flex basis. */
  style?: CSSProperties | undefined;
};

type KeyDownEvent = Parameters<NonNullable<InputProps["onKeyDown"]>>[0];

/** Only the props that are set: Base UI merges an explicit `undefined` over its own value. */
const defined = <T extends Record<string, unknown>>(props: T) =>
  Object.fromEntries(
    Object.entries(props).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as RefObject<T | null>).current = value;
}

/**
 * One search input: the search icon, the query, and a clear button while there is a query.
 * Escape clears a query (and a second Escape reaches whatever holds the field, such as a
 * dialog); Enter never submits a surrounding form, and runs `onSubmit` when there is one. The
 * native input props, the ref and `onValueChange` reach the input; `className` and `style` go to
 * the frame. Inside a Field it takes the label, hint, error, `invalid`, `disabled` and `required`.
 */
export function SearchField({
  value,
  defaultValue,
  size = "medium",
  onSubmit,
  onClear,
  className,
  style,
  ref,
  onChange,
  onKeyDown,
  disabled,
  readOnly,
  placeholder,
  ...props
}: SearchFieldProps) {
  const { t } = useLedgerLocale();
  const field = useContext(FieldStateContext);
  const fieldSet = useFieldControlState();
  const input = useRef<HTMLInputElement | null>(null);
  const setInput = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      assignRef(ref, node);
    },
    [ref],
  );
  // Whether an uncontrolled field holds a query; a controlled one reads `value`.
  const [typed, setTyped] = useState(() => (defaultValue ?? "") !== "");
  const filled = value !== undefined ? String(value) !== "" : typed;
  const inactive = Boolean(disabled || field?.disabled || fieldSet.disabled || readOnly);

  // A field with no label of its own is named by its placeholder, or "Search".
  const named =
    props["aria-label"] !== undefined ||
    props["aria-labelledby"] !== undefined ||
    props.id !== undefined ||
    field?.labelId !== undefined;

  // Empties the field through the same input event typing sends, so `onValueChange`, native
  // `onChange`, a Field's dirty and filled state, and a form library all see the change.
  const clear = () => {
    const element = input.current;
    if (!element) return;
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value")?.set;
    setter?.call(element, "");
    element.dispatchEvent(new Event("input", { bubbles: true }));
    // Once more through the element's own setter, a no-op for the browser, so anything that
    // tracks the value itself (a testing library) sees the empty field too. A controlled caller
    // that kept its query has already had it put back, and keeps it.
    if (element.value === "") element.value = "";
    onClear?.();
    element.focus();
  };

  const handleKeyDown = (event: KeyDownEvent) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    // A key that confirms or cancels an input method's composition belongs to the input method:
    // Enter there is not a search, and Escape there is not a clear.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit?.(event.currentTarget.value);
      return;
    }
    if (event.key === "Escape" && event.currentTarget.value !== "" && !inactive) {
      // This Escape belongs to the query; the next one reaches a dialog or popover around it.
      event.preventDefault();
      event.stopPropagation();
      clear();
    }
  };

  // A native form reset puts back the default query without an input event.
  const controlled = value !== undefined;
  useEffect(() => {
    const form = input.current?.form;
    if (controlled || !form) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onReset = () => {
      // The reset event fires before the form restores its fields.
      timer = setTimeout(() => setTyped((input.current?.value ?? "") !== ""));
    };
    form.addEventListener("reset", onReset);
    return () => {
      form.removeEventListener("reset", onReset);
      clearTimeout(timer);
    };
  }, [controlled]);

  return (
    // The frame and the icon are not groups: one searchbox needs no unnamed group around it.
    <InputGroup className={className} style={style} role={undefined} data-slot="search-field">
      <InputGroupInput
        type="search"
        enterKeyHint="search"
        {...(named ? {} : { "aria-label": placeholder ?? t("search") })}
        {...props}
        ref={setInput}
        size={size}
        {...defined({ placeholder, disabled, readOnly, value, defaultValue })}
        onChange={(event) => {
          onChange?.(event);
          if (value === undefined) setTyped(event.currentTarget.value !== "");
        }}
        onKeyDown={handleKeyDown}
      />
      <InputGroupAddon role={undefined}>
        <Search aria-hidden="true" />
      </InputGroupAddon>
      {filled && !inactive ? (
        <InputGroupAddon align="inline-end" role={undefined} className="pe-050">
          <InputGroupButton
            size="icon-xs"
            aria-label={t("clearSearch")}
            // Escape clears from the keyboard, so the button is not a Tab stop; a touch screen
            // reader still reaches it by swiping.
            tabIndex={-1}
            // Keep focus in the query while the pointer presses the button.
            onMouseDown={(event) => event.preventDefault()}
            onClick={clear}
            className="relative touch-target"
            data-slot="search-field-clear"
          >
            <X aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}
