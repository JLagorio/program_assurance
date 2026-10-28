import { useId, useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import type { SpreadsheetFunction } from "./types";
import { formulaContext } from "./formula-context";

type Props = ComponentProps<"textarea"> & {
  functions?: readonly SpreadsheetFunction[] | undefined;
  onFormulaInsert?: ((value: string, caret: number) => void) | undefined;
};
/** Shared cell-filling input; assistance never evaluates formulas or commits a cell. */
export function CellTextEditor({
  functions = [],
  onFormulaInsert,
  ref,
  onKeyDown,
  onFocus,
  onBlur,
  onSelect,
  onChange,
  ...props
}: Props) {
  const input = useRef<HTMLTextAreaElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const uid = useId();
  const [focused, setFocused] = useState(false);
  const [caret, setCaret] = useState(0);
  const [choice, setChoice] = useState(0);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const value = String(props.value ?? "");
  const context = formulaContext(value, caret, functions);
  const enabled = focused && !props.disabled && !props.readOnly;
  const suggestions = enabled && dismissed !== value ? context.suggestions : [];
  const current = Math.min(choice, Math.max(0, suggestions.length - 1));
  const shown = enabled && (suggestions.length > 0 || !!context.call);
  useLayoutEffect(() => {
    if (!shown || !input.current) return;
    const place = () => {
      const box = input.current!.getBoundingClientRect();
      const width = Math.min(360, window.innerWidth - 16);
      setPosition({
        left: Math.max(8, Math.min(box.left, window.innerWidth - width - 8)),
        top:
          box.bottom + 4 + (panel.current?.offsetHeight ?? 0) <= window.innerHeight - 8
            ? box.bottom + 4
            : Math.max(8, box.top - (panel.current?.offsetHeight ?? 0) - 4),
        width,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [shown, value, position.width]);
  function insert(item: SpreadsheetFunction) {
    const suffix = value.slice(caret);
    const text = item.name + (suffix.startsWith("(") ? "" : "(");
    const next = value.slice(0, context.start) + text + suffix;
    const nextCaret = context.start + text.length;
    onFormulaInsert?.(next, nextCaret);
    setCaret(nextCaret);
    setChoice(0);
    setDismissed(null);
    requestAnimationFrame(() => {
      input.current?.focus({ preventScroll: true });
      input.current?.setSelectionRange(nextCaret, nextCaret);
    });
  }
  return (
    <>
      <textarea
        rows={1}
        wrap="off"
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        enterKeyHint="done"
        {...props}
        ref={(node) => {
          input.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        aria-autocomplete={functions.length ? "list" : undefined}
        aria-controls={suggestions.length ? `${uid}-list` : undefined}
        aria-activedescendant={suggestions.length ? `${uid}-${current}` : undefined}
        aria-describedby={
          [props["aria-describedby"], shown && context.call && `${uid}-help`]
            .filter(Boolean)
            .join(" ") || undefined
        }
        onFocus={(event) => {
          setFocused(true);
          setCaret(event.currentTarget.selectionStart);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onSelect={(event) => {
          setCaret(event.currentTarget.selectionStart);
          onSelect?.(event);
        }}
        onChange={(event) => {
          setCaret(event.currentTarget.selectionStart);
          setChoice(0);
          setDismissed(null);
          onChange?.(event);
        }}
        onKeyDown={(event) => {
          if (
            !event.nativeEvent.isComposing &&
            suggestions.length &&
            ["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(event.key)
          ) {
            event.preventDefault();
            event.stopPropagation();
            if (event.key === "Escape") setDismissed(value);
            else if (event.key === "Enter" || event.key === "Tab") insert(suggestions[current]!);
            else
              setChoice(
                (current + (event.key === "ArrowDown" ? 1 : -1) + suggestions.length) %
                  suggestions.length,
              );
            return;
          }
          onKeyDown?.(event);
        }}
        data-slot="spreadsheet-text-editor"
      />
      {shown && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panel}
              data-slot="spreadsheet-formula-assistance"
              style={position}
              onPointerDown={(event) => event.preventDefault()}
            >
              {suggestions.length ? (
                <div role="listbox" aria-label="Formula suggestions" id={`${uid}-list`}>
                  {suggestions.map((item, index) => (
                    <div
                      role="option"
                      aria-selected={index === current}
                      id={`${uid}-${index}`}
                      key={item.name}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        insert(item);
                      }}
                      data-slot="spreadsheet-formula-suggestion"
                    >
                      <strong>{item.name}</strong>
                      <span>{item.description}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {context.call ? (
                <div id={`${uid}-help`} data-slot="spreadsheet-formula-hint" role="status">
                  <strong>{context.call.signature}</strong>
                  <span>
                    {context.call.arguments?.[context.argument] ??
                      `Argument ${context.argument + 1}`}
                  </span>
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
