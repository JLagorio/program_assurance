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
import { Popover, PopoverContent } from "../components/popover";
import { announce } from "../lib/announce";
import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { useTouch } from "../lib/touch";
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
  | { value: string; onValueChange: (value: string) => void; defaultValue?: undefined }
  | {
      value?: undefined;
      defaultValue?: string | undefined;
      onValueChange?: ((value: string) => void) | undefined;
    };

export type ComposerProps = DraftProps & {
  /** Accessible name of the textarea; independent of its placeholder. */
  label: string;
  /** Receives trimmed, nonempty text. Fulfillment clears the submitted draft and returns focus to the field; rejection preserves the draft and shows errorMessage. */
  onSubmit: (text: string) => void | Promise<void>;
  /** Synchronous suggestion adapter. Return a replacement range and options, or null to close. No mention syntax is built in. */
  getSuggestions?: ((text: string, caret: number) => ComposerSuggestions | null) | undefined;
  /** Accessible name of the suggestions list. Defaults to the LedgerProvider's "Suggestions". */
  suggestionsLabel?: string | undefined;
  /** Text on the primary action. Defaults to the LedgerProvider's "Send". */
  submitLabel?: string | undefined;
  /** Text on the optional cancel action. Defaults to the LedgerProvider's "Cancel". */
  cancelLabel?: string | undefined;
  /**
   * The message after submission rejects, or a function of the rejection that returns it, to show
   * the server's reason: `(error) => error instanceof Error ? error.message : "Could not send."`.
   * Defaults to the LedgerProvider's "Could not send. Try again."
   */
  errorMessage?: string | ((error: unknown) => string) | undefined;
  /** Optional dismissal. Disabled while submission is pending. */
  onCancel?: (() => void) | undefined;
  /** A second thing to do with the draft, rendered before the cancel and primary actions: a secondary Button the caller wires to the draft it keeps. */
  actions?: ReactNode;
  /** Decorative author or context marker beside the field. */
  leading?: ReactNode;
  /** Instructions below the field, also associated with it as a description. Defaults to the LedgerProvider's "Ctrl/⌘ + Enter to send", which a touch screen (a coarse primary pointer, no keyboard to press it on) does not show; `null` shows none. */
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
  suggestionsLabel,
  submitLabel,
  cancelLabel,
  errorMessage,
  onCancel,
  actions,
  leading,
  hint: hintProp,
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
  const { t, formatPlural } = useLedgerLocale();
  // Where any pointer is coarse the reader may be on the touch screen, whose keyboard has no
  // Control or Command key to press Enter with: the default keyboard hint is left out there.
  const coarse = useTouch();
  const hint = hintProp === undefined ? (coarse ? null : t("composerSendHint")) : hintProp;
  const [draft, setDraft] = useState(defaultValue);
  const value = controlledValue ?? draft;
  const [acceptedDraft, setAcceptedDraft] = useState<{ value: string } | null>(null);
  const [suggestions, setSuggestions] = useState<(ComposerSuggestions & { source: string }) | null>(
    null,
  );
  const [active, setActive] = useState(0);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<{ error: unknown } | null>(null);
  const submitting = useRef(false);
  const mounted = useRef(true);
  const field = useRef<HTMLTextAreaElement | null>(null);
  const send = useRef<HTMLButtonElement | null>(null);
  // Focus goes back to the field once a fulfilled send clears the draft (Send is then disabled).
  const refocus = useRef(false);
  const uid = useId();
  const listId = `${uid}-options`;
  const open =
    !disabled &&
    !pending &&
    suggestions !== null &&
    suggestions.source === value &&
    suggestions.items.length > 0;
  const count = open ? suggestions.items.length : 0;
  // The last list shown, so the popup keeps its rows while it animates out.
  const shownList = useRef<readonly ComposerSuggestion[]>([]);
  if (open) shownList.current = suggestions.items;
  const failureText = failure
    ? typeof errorMessage === "function"
      ? errorMessage(failure.error)
      : (errorMessage ?? t("composerSendFailed"))
    : null;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, listId]);

  // A list that appears, or changes length, says how many options it has and how to choose.
  useEffect(() => {
    if (!count) return;
    announce(
      formatPlural(count, {
        one: t("composerSuggestionsOne", { count }),
        other: t("composerSuggestionsOther", { count }),
      }),
    );
  }, [count, formatPlural, t]);

  // A rejected send is said at once, while the message stays under the field as its description.
  useEffect(() => {
    if (failureText) announce(failureText, { politeness: "assertive" });
  }, [failureText]);

  // Compare after React commits parent updates, including replacements made synchronously in onSubmit.
  useEffect(() => {
    if (!acceptedDraft) return;
    if (value === acceptedDraft.value) {
      if (controlledValue === undefined) setDraft("");
      onValueChange?.("");
    }
    setAcceptedDraft(null);
    if (!refocus.current) return;
    refocus.current = false;
    const current = document.activeElement;
    if (!current || current === document.body || current === send.current) field.current?.focus();
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
    setFailure(null);
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
    setFailure(null);
    setSuggestions(null);
    try {
      await onSubmit(text);
      // A controlled parent may replace the draft while saving. Never erase that newer value.
      if (mounted.current) {
        refocus.current = true;
        setAcceptedDraft({ value: submittedDraft });
      }
    } catch (error) {
      if (mounted.current) setFailure({ error });
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
        const next = (active + direction + count) % count;
        setActive(next);
        const option = suggestions.items[next];
        if (option)
          announce(
            t("composerSuggestionActive", { label: option.label, position: next + 1, count }),
          );
        return;
      }
      // Shift+Tab goes back out of the field as it always does; leaving closes the list.
      if (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey)) {
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
    <Box
      data-slot="composer"
      className={cn("flex gap-100", className)}
      aria-busy={pending || undefined}
    >
      {leading ? (
        <Box as="span" className="flex h-400 shrink-0 items-center">
          {leading}
        </Box>
      ) : null}
      <Box className="flex min-w-0 flex-1 flex-col gap-100">
        {children}
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
            setFailure(null);
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
            [hint ? `${uid}-hint` : "", failureText ? `${uid}-error` : ""]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-autocomplete={getSuggestions ? "list" : undefined}
          aria-haspopup={getSuggestions ? "listbox" : undefined}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open ? `${listId}-${active}` : undefined}
          autoFocus={autoFocus}
          disabled={disabled}
          readOnly={pending}
          rows={3}
        />
        {/* The options float under the field in the kit's positioner: portaled, so a clipping
            panel or dialog cannot cut them; flipped above the field where the window ends below
            it; capped at the height the window leaves. The field keeps focus throughout. */}
        <Popover
          open={open}
          onOpenChange={(next) => {
            if (!next) setSuggestions(null);
          }}
        >
          <PopoverContent
            anchor={field}
            side="bottom"
            align="start"
            initialFocus={false}
            finalFocus={false}
            render={<ul />}
            id={listId}
            role="listbox"
            aria-label={suggestionsLabel ?? t("composerSuggestions")}
            className="gap-0 overscroll-none p-0 py-050 font-body"
            style={{
              width: token("dimension.part.composerSuggestions"),
              maxHeight: `min(${token("dimension.part.composerSuggestionsHeight")}, var(--available-height))`,
            }}
          >
            {(open ? suggestions.items : shownList.current).map((option, index) => (
              <li
                key={option.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                data-slot="composer-option"
                data-highlighted={index === active ? "" : undefined}
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
              </li>
            ))}
          </PopoverContent>
        </Popover>
        {failureText ? (
          <Box
            id={`${uid}-error`}
            data-slot="composer-error"
            className="font-body-small text-danger"
          >
            {failureText}
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
                {cancelLabel ?? t("cancel")}
              </Button>
            ) : null}
            <Button
              ref={send}
              size="small"
              variant="primary"
              onClick={() => void submit()}
              disabled={disabled || !value.trim()}
              isLoading={pending}
            >
              {submitLabel ?? t("composerSend")}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
