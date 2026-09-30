import { Field as FieldPrimitive } from "@base-ui/react/field";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type CSSProperties,
  type Ref,
  type RefObject,
} from "react";

import { announce } from "../lib/announce";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { fieldControl, useFieldControlState } from "./controls";

export type TextareaProps = ComponentProps<"textarea"> & {
  /**
   * The expected answer length in lines, and the box's height: two for a note, four for a
   * description, eight for a narrative. With `autoResize` it is the smallest the box gets. 3 by
   * default.
   */
  rows?: number | undefined;
  /**
   * Grows the box with its text, from `rows` lines up to `maxRows`, where it starts to scroll. The
   * reader never drags a corner to see what they wrote.
   */
  autoResize?: boolean | undefined;
  /** With `autoResize`, the most lines the box grows to before it scrolls. Unlimited by default. */
  maxRows?: number | undefined;
  /**
   * The most characters the answer may have, as a soft limit: a count under the box says how many
   * are left, and past the limit how many too many, while the text stays whole, so a pasted
   * statement never loses its tail unseen. The count describes the box, is announced when the
   * reader pauses, and marks the box invalid for native validation. Prefer it to `maxLength`,
   * which cuts a paste off silently.
   */
  characterLimit?: number | undefined;
};

/** Whether the browser grows a textarea by itself (`field-sizing: content`); Firefox measures instead. */
const sizesItself = () =>
  typeof CSS !== "undefined" && typeof CSS.supports === "function"
    ? CSS.supports("field-sizing", "content")
    : false;

/** A height of `lines` lines of the field's own text, its padding and its border. */
const linesHeight = (lines: number) =>
  `calc(${lines} * 1lh + 2 * var(--ds-space-075) + 2 * var(--ds-border-width))`;

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as RefObject<T | null>).current = value;
}

/** How long the reader pauses typing before the count is announced. */
const ANNOUNCE_AFTER = 1000;

/**
 * Several lines of text. A native textarea on Base UI's Field.Control, so inside a Field it takes
 * the label, hint and error ids and the Field's `invalid`, `disabled` and `required`, as Input
 * does. Explicit ids and ARIA still win.
 */
export function Textarea({
  className,
  style,
  rows = 3,
  autoResize = false,
  maxRows,
  characterLimit,
  ref,
  onChange,
  ...props
}: TextareaProps) {
  const field = useFieldControlState();
  const { t, formatNumber, formatPlural, messages } = useLedgerLocale();
  const element = useRef<HTMLTextAreaElement | null>(null);
  const setElement = useCallback(
    (node: HTMLTextAreaElement | null) => {
      element.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  // The length of the text, for the count: the controlled value, or what the reader has typed.
  const controlled = props.value !== undefined;
  const [typedLength, setTypedLength] = useState(() => String(props.defaultValue ?? "").length);
  const length = controlled ? String(props.value ?? "").length : typedLength;
  const limited = characterLimit !== undefined && characterLimit >= 0;
  const over = limited ? length - characterLimit : 0;
  const countMessage = !limited
    ? ""
    : over > 0
      ? formatPlural(over, { one: messages.charactersOverOne, other: messages.charactersOverOther })
      : formatPlural(-over, {
          one: messages.charactersLeftOne,
          other: messages.charactersLeftOther,
        });
  const countId = useId();

  // A native form reset puts back the default text without a change event.
  useEffect(() => {
    const form = element.current?.form;
    if (controlled || !form) return;
    let later: ReturnType<typeof setTimeout> | undefined;
    const onReset = () => {
      // The reset event fires before the form restores its fields.
      later = setTimeout(() => setTypedLength(element.current?.value.length ?? 0));
    };
    form.addEventListener("reset", onReset);
    return () => {
      form.removeEventListener("reset", onReset);
      clearTimeout(later);
    };
  }, [controlled]);

  // Past the limit the box fails native validation with the count's words, so a form that lets
  // the browser or Base UI check it stops there; the text itself is never cut. Only a message the
  // count set is cleared, so a Field's own `validate` result is left alone.
  const countValidity = useRef(false);
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    if (over > 0) {
      node.setCustomValidity(countMessage);
      countValidity.current = true;
    } else if (countValidity.current) {
      node.setCustomValidity("");
      countValidity.current = false;
    }
  }, [over, countMessage]);

  // The count is heard once the reader pauses, not on every keystroke.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const spoken = useRef(countMessage);
  useEffect(() => () => clearTimeout(timer.current), []);
  const scheduleAnnouncement = () => {
    if (!limited) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const node = element.current;
      if (!node || node.ownerDocument.activeElement !== node) return;
      const message = node.dataset["count"] ?? "";
      if (!message || message === spoken.current) return;
      spoken.current = message;
      announce(message);
    }, ANNOUNCE_AFTER);
  };

  // Where the browser cannot grow the box by itself, it is measured after every change.
  const [measured, setMeasured] = useState<number | null>(null);
  const measure = useCallback(() => {
    const node = element.current;
    if (!autoResize || !node || sizesItself()) return;
    const previous = node.style.height;
    node.style.height = "auto";
    const border = node.offsetHeight - node.clientHeight;
    const next = node.scrollHeight + border;
    node.style.height = previous;
    setMeasured((current) => (current === next ? current : next));
  }, [autoResize]);
  useLayoutEffect(() => {
    measure();
  }, [measure, props.value]);

  const sizing: CSSProperties = autoResize
    ? {
        fieldSizing: "content",
        minHeight: linesHeight(rows),
        ...(maxRows !== undefined ? { maxHeight: linesHeight(Math.max(rows, maxRows)) } : {}),
        ...(measured !== null ? { height: measured } : {}),
      }
    : {};

  const describedBy =
    [props["aria-describedby"], limited ? countId : undefined].filter(Boolean).join(" ") ||
    undefined;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(event);
    if (!controlled) setTypedLength(event.currentTarget.value.length);
    measure();
    scheduleAnnouncement();
  };

  const control = (
    <FieldPrimitive.Control
      data-slot="textarea"
      render={<textarea />}
      {...({ ...props, rows, onChange: handleChange } as unknown as FieldPrimitive.Control.Props)}
      ref={setElement as unknown as FieldPrimitive.Control.Props["ref"]}
      {...(describedBy ? { "aria-describedby": describedBy } : {})}
      {...(limited ? { "data-count": countMessage } : {})}
      {...(over > 0 ? { "data-over-limit": "" } : {})}
      {...(field.required && props["aria-required"] === undefined ? { "aria-required": true } : {})}
      style={{ ...sizing, ...style }}
      className={cn(
        fieldControl,
        "flex py-075 data-over-limit:border-danger",
        autoResize ? "resize-none" : "resize-y",
        className,
      )}
    />
  );
  if (!limited) return control;
  return (
    <>
      {control}
      <p
        id={countId}
        data-slot="textarea-count"
        data-over-limit={over > 0 ? "" : undefined}
        className="font-body-small text-end text-subtlest tabular-nums data-over-limit:text-danger"
      >
        <span className="sr-only">
          {t("characterLimit", { limit: formatNumber(characterLimit) })}{" "}
        </span>
        {countMessage}
      </p>
    </>
  );
}
