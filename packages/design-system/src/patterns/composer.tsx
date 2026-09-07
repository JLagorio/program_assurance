import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";

import { Button, Textarea } from "../components";
import { cn } from "../lib/cn";
import { Box } from "../primitives";

export type ComposerSuggestion = {
  /** Stable, unique key within the result set; never inferred from the display label. */
  id: string;
  /** Accessible option text. */
  label: string;
  /** Exact replacement text, including any desired trailing space. The caller owns serialization. */
  insertText: string;
  /** Decorative avatar or icon before the label. */
  leading?: ReactNode;
  /** Supporting text after the label. */
  description?: ReactNode;
};

export type ComposerSuggestions = {
  /** Inclusive UTF-16 start offset of the text to replace. */
  start: number;
  /** Exclusive UTF-16 end offset, bounded by the current draft length. */
  end: number;
  /** Ordered options. The caller owns filtering and result limits. */
  items: readonly ComposerSuggestion[];
};

type DraftProps =
  | { value: string; onValueChange: (value: string) => void; defaultValue?: never }
  | {
      value?: undefined;
      defaultValue?: string | undefined;
      onValueChange?: ((value: string) => void) | undefined;
    };

export type ComposerProps = DraftProps & {
  /** Accessible name of the textarea; independent of its placeholder. */
  label: string;
  /** Receives trimmed, nonempty text. Fulfillment clears the submitted draft; rejection preserves it and shows errorMessage. */
  onSubmit: (text: string) => void | Promise<void>;
  /** Synchronous suggestion adapter. Return a replacement range and options, or null to close. No mention syntax is built in. */
  getSuggestions?: ((text: string, caret: number) => ComposerSuggestions | null) | undefined;
  /** Accessible name of the suggestions list; translate in the consuming application. */
  suggestionsLabel?: string | undefined;
  /** Text on the primary action. */
  submitLabel?: string | undefined;
  /** Text on the optional cancel action. */
  cancelLabel?: string | undefined;
  /** Visible recovery message after submission rejects. Translate in the consuming application. */
  errorMessage?: string | undefined;
  /** Optional dismissal. Disabled while submission is pending. */
  onCancel?: (() => void) | undefined;
  /** A second thing to do with the draft, rendered before the cancel and primary actions: a secondary Button the caller wires to the draft it keeps. */
  actions?: ReactNode;
  /** Decorative author or context marker beside the field. */
  leading?: ReactNode;
  /** Instructions below the field, also associated with it as a description. */
  hint?: ReactNode;
  /** Additional fields above the textarea. */
  children?: ReactNode;
  /** Text displayed while the field is empty. */
  placeholder?: string | undefined;
  /** Initial focus on the textarea, for an explicitly opened composer. */
  autoFocus?: boolean | undefined;
  /** Disables editing, suggestions, submission and cancellation. */
  disabled?: boolean | undefined;
  /** DOM id on the visible textarea. */
  id?: string | undefined;
  /** Native textarea name. Submission is via onSubmit, not an enclosing form. */
  name?: string | undefined;
  /** Ref to the visible textarea for focus and selection integration. */
  ref?: Ref<HTMLTextAreaElement> | undefined;
  className?: string | undefined;
};

/** A text draft with optional completion suggestions and serialized, recoverable submission. */
export function Composer({
  label,
  onSubmit,
  getSuggestions,
  suggestionsLabel = "Suggestions",
  submitLabel = "Send",
  cancelLabel = "Cancel",
  errorMessage = "Could not send. Try again.",
  onCancel,
  actions,
  leading,
  hint = "Ctrl/⌘ + Enter to send",
  children,
  placeholder,
  autoFocus,
  disabled = false,
  id,
  name,
  ref,
  className,
  value: controlledValue,
  defaultValue = "",
  onValueChange,
}: ComposerProps) {
  const [draft, setDraft] = useState(defaultValue);
  const value = controlledValue ?? draft;
  const [acceptedDraft, setAcceptedDraft] = useState<{ value: string } | null>(null);
  const [suggestions, setSuggestions] = useState<(ComposerSuggestions & { source: string }) | null>(
    null,
  );
  const [active, setActive] = useState(0);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const submitting = useRef(false);
  const mounted = useRef(true);
  const field = useRef<HTMLTextAreaElement | null>(null);
  const uid = useId();
  const listId = `${uid}-options`;
  const open =
    !disabled &&
    !pending &&
    suggestions !== null &&
    suggestions.source === value &&
    suggestions.items.length > 0;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, listId]);

  // Compare after React commits parent updates, including replacements made synchronously in onSubmit.
  useEffect(() => {
    if (!acceptedDraft) return;
    if (value === acceptedDraft.value) {
      if (controlledValue === undefined) setDraft("");
      onValueChange?.("");
    }
    setAcceptedDraft(null);
  }, [acceptedDraft, value, controlledValue, onValueChange]);

  const update = (next: string) => {
    if (controlledValue === undefined) setDraft(next);
    onValueChange?.(next);
  };
  const suggest = (text: string, caret: number) => {
    if (disabled || submitting.current) return;
    const next = getSuggestions?.(text, caret) ?? null;
    const valid =
      next &&
      Number.isInteger(next.start) &&
      Number.isInteger(next.end) &&
      next.start >= 0 &&
      next.end >= next.start &&
      next.end <= text.length;
    setSuggestions(valid ? { ...next, source: text } : null);
    setActive(0);
  };
  const insert = (option: ComposerSuggestion) => {
    if (!suggestions || suggestions.source !== value || disabled || submitting.current) return;
    const next =
      value.slice(0, suggestions.start) + option.insertText + value.slice(suggestions.end);
    const caret = suggestions.start + option.insertText.length;
    update(next);
    setSuggestions(null);
    setFailed(false);
    requestAnimationFrame(() => {
      if (!mounted.current) return;
      field.current?.focus();
      field.current?.setSelectionRange(caret, caret);
    });
  };
  const submit = async () => {
    const text = value.trim();
    if (!text || disabled || submitting.current) return;
    const submittedDraft = value;
    submitting.current = true;
    setPending(true);
    setFailed(false);
    setSuggestions(null);
    try {
      await onSubmit(text);
      // A controlled parent may replace the draft while saving. Never erase that newer value.
      if (mounted.current) setAcceptedDraft({ value: submittedDraft });
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      submitting.current = false;
      if (mounted.current) setPending(false);
    }
  };
  const keydown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (open && suggestions) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        setActive(
          (index) => (index + direction + suggestions.items.length) % suggestions.items.length,
        );
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        insert(suggestions.items[active] ?? suggestions.items[0]!);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setSuggestions(null);
        return;
      }
    }
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <Box className={cn("flex gap-100", className)} aria-busy={pending}>
      {leading ? (
        <Box as="span" className="flex h-400 shrink-0 items-center">
          {leading}
        </Box>
      ) : null}
      <Box className="flex min-w-0 flex-1 flex-col gap-100">
        {children}
        <Box className="relative">
          <Textarea
            ref={(element) => {
              field.current = element;
              if (typeof ref === "function") return ref(element);
              if (ref) ref.current = element;
            }}
            id={id}
            name={name}
            value={value}
            onChange={(event) => {
              update(event.target.value);
              setFailed(false);
              suggest(event.target.value, event.target.selectionStart);
            }}
            onClick={(event) => suggest(value, event.currentTarget.selectionStart)}
            onKeyUp={(event) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
                suggest(value, event.currentTarget.selectionStart);
            }}
            onKeyDown={keydown}
            onBlur={() => setSuggestions(null)}
            placeholder={placeholder}
            aria-label={label}
            aria-describedby={
              [hint ? `${uid}-hint` : "", failed ? `${uid}-error` : ""].filter(Boolean).join(" ") ||
              undefined
            }
            aria-autocomplete={getSuggestions ? "list" : undefined}
            aria-controls={open ? listId : undefined}
            aria-activedescendant={open ? `${listId}-${active}` : undefined}
            autoFocus={autoFocus}
            disabled={disabled}
            readOnly={pending}
            rows={3}
          />
          {open && suggestions ? (
            <Box
              as="ul"
              id={listId}
              role="listbox"
              aria-label={suggestionsLabel}
              className="absolute start-0 top-full z-50 max-w-full overflow-y-auto rounded-large border border-default bg-surface-overlay py-050 shadow-overlay"
              style={{ width: 280, maxHeight: 240 }}
            >
              {suggestions.items.map((option, index) => (
                <Box
                  as="li"
                  key={option.id}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insert(option)}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "flex cursor-pointer items-center gap-100 px-150 py-075 font-body text-default",
                    index === active && "bg-neutral-subtle-hovered",
                  )}
                >
                  {option.leading}
                  <Box as="span" className="min-w-0 truncate">
                    {option.label}
                  </Box>
                  {option.description ? (
                    <Box as="span" className="ms-auto shrink-0 font-body-small text-subtle">
                      {option.description}
                    </Box>
                  ) : null}
                </Box>
              ))}
            </Box>
          ) : null}
        </Box>
        {failed ? (
          <Box id={`${uid}-error`} role="alert" className="font-body-small text-danger">
            {errorMessage}
          </Box>
        ) : null}
        <Box className="flex flex-wrap items-center gap-100">
          {hint ? (
            <Box as="span" id={`${uid}-hint`} className="font-body-xsmall text-subtlest">
              {hint}
            </Box>
          ) : null}
          <Box as="span" className="ms-auto flex items-center gap-100">
            {actions}
            {onCancel ? (
              <Button
                size="small"
                variant="subtle"
                onClick={onCancel}
                disabled={disabled || pending}
              >
                {cancelLabel}
              </Button>
            ) : null}
            <Button
              size="small"
              variant="primary"
              onClick={() => void submit()}
              disabled={disabled || !value.trim()}
              isLoading={pending}
            >
              {submitLabel}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
