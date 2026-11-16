import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { useEffect, useRef } from "react";

import { useFormatShortcut } from "../components/kbd";
import { RadioGroup, type RadioGroupProps } from "../components/radio-group";
import { Truncate } from "../components/truncate";
import { announce } from "../lib/announce";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { toneClasses, type Tone } from "../lib/status-tone";
import { takesText } from "../lib/text-entry";
import { VisuallyHidden } from "../primitives/visually-hidden";

/* A judgement made from cards that are keys: each card is one answer and carries the one key that
   chooses it, drawn on the card as on a keycap, so the reader learns the key by seeing it. It is a
   RadioGroup: one Tab stop, the arrow keys between cards, Space to choose. The keys answer from
   anywhere in the workspace the cards sit in, the nearest CommandScope (the focus-owned boundary
   a workspace's commands share), and from the cards alone where there is none; never from a field
   that takes text, never with a modifier held, never on a repeat or while text is composed, never
   once another handler has taken the key, and not while the group is read-only or disabled. A key
   is a click on its card, so it chooses exactly as a press does, and leaves focus where it was. */

/** One answer: its value, its key, its words and the tone of the mark it paints. */
export type DecisionKeyOption<Value = string> = {
  /** The answer's value, as RadioGroup's `value`. */
  value: Value;
  /** The one key that chooses it, a letter or a digit with no modifier: "S". Drawn on the card in capitals, and the card's `aria-keyshortcuts`. One key a determination, the same on every record. */
  shortcut: string;
  /** The answer in words, the card's name: "Satisfied". */
  label: string;
  /** The tone of the answer's mark, the colour the record's strip paints it in, and of the card once chosen: `success` for Satisfied, `danger` for Other than satisfied. Without it the card has no mark and is chosen in the neutral fill. */
  tone?: Tone | undefined;
  /** Blocks this answer alone, as RadioGroupItem's `disabled`; its key does nothing. */
  disabled?: boolean | undefined;
};

/** DecisionKeys takes RadioGroup's props (`value`, `defaultValue`, `onValueChange`, `readOnly`, `disabled`, `name`, its name and its ref) besides the options. */
export type DecisionKeysProps<Value = string> = Omit<RadioGroupProps<Value>, "children"> & {
  /** The answers, in the order the cards stand: two to six. */
  options: readonly DecisionKeyOption<Value>[];
  /** The answer also judges this many under the record: a heading's objectives. Each card says "+6", and its name says so ("Satisfied and 6 under it"). */
  covers?: number | undefined;
};

/** How many cards a row holds, by how many there are and the group's own width: all of them where
    they fit, else two a row (four as two by two, never three and one), else one. */
const columnsFor = (count: number) =>
  count === 2
    ? "@3xs/decision-keys:grid-cols-2"
    : count === 3
      ? "@md/decision-keys:grid-cols-3"
      : count === 4
        ? "@3xs/decision-keys:grid-cols-2 @lg/decision-keys:grid-cols-4"
        : "@3xs/decision-keys:grid-cols-2";

/** A chosen card's fill and edge in its tone, and its key and words in the tone's text colour; a
    card with no tone is chosen in the neutral fill. */
const chosenLook: Record<Tone | "none", { card: string; text: string }> = {
  none: {
    card: "data-checked:border-bold data-checked:bg-neutral data-checked:before:border-bold",
    text: "group-data-checked/decision-key:text-default",
  },
  neutral: {
    card: "data-checked:border-bold data-checked:bg-neutral data-checked:before:border-bold",
    text: "group-data-checked/decision-key:text-default",
  },
  information: {
    card: "data-checked:border-information data-checked:bg-information data-checked:before:border-information",
    text: "group-data-checked/decision-key:text-information-bolder",
  },
  success: {
    card: "data-checked:border-success data-checked:bg-success data-checked:before:border-success",
    text: "group-data-checked/decision-key:text-success-bolder",
  },
  warning: {
    card: "data-checked:border-warning data-checked:bg-warning data-checked:before:border-warning",
    text: "group-data-checked/decision-key:text-warning-bolder",
  },
  danger: {
    card: "data-checked:border-danger data-checked:bg-danger data-checked:before:border-danger",
    text: "group-data-checked/decision-key:text-danger-bolder",
  },
};

/**
 * A determination chosen from cards, each carrying the one key that chooses it: Satisfied (S),
 * Partially satisfied (P), Other than satisfied (O), Not assessed (N). For a workspace that judges
 * records one at a time; the keys answer anywhere in it but a text field.
 */
export function DecisionKeys<Value = string>({
  options,
  covers,
  readOnly,
  disabled,
  className,
  ...props
}: DecisionKeysProps<Value>) {
  const { t, formatNumber } = useLedgerLocale();
  const format = useFormatShortcut();
  const root = useRef<HTMLDivElement>(null);
  const asleep = Boolean(readOnly || disabled);

  // The keys listen on the workspace (the nearest CommandScope), else on the cards' own box. A
  // native listener there hears the key before a CommandScope's own handler, which then finds it
  // taken; the cards' key is a click on the card, the radio's own way to choose.
  useEffect(() => {
    const box = root.current;
    if (!box || asleep) return undefined;
    const scope = box.closest<HTMLElement>('[data-slot="command-scope"]') ?? box;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return;
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (event.key.length !== 1 || takesText(event.target)) return;
      const index = options.findIndex(
        (option) => option.shortcut.toLowerCase() === event.key.toLowerCase(),
      );
      const option = options[index];
      if (!option || option.disabled) return;
      const card = box.querySelectorAll<HTMLElement>('[data-slot="decision-key"]')[index];
      if (!card) return;
      event.preventDefault();
      const wasChosen = card.getAttribute("aria-checked") === "true";
      card.click();
      // A reader whose focus is elsewhere (the list, the evidence) hears what the key chose, once
      // the choice has rendered and only if it held (a controlled group may refuse it); one on the
      // card hears the card itself.
      if (wasChosen) return;
      queueMicrotask(() => {
        if (card.getAttribute("aria-checked") !== "true") return;
        if (card.ownerDocument.activeElement !== card)
          announce(t("decisionKeysChosen", { label: option.label }));
      });
    };
    scope.addEventListener("keydown", onKey);
    return () => scope.removeEventListener("keydown", onKey);
  }, [options, asleep, t]);

  return (
    <div ref={root} data-slot="decision-keys" className="@container/decision-keys w-full min-w-0">
      <RadioGroup<Value>
        {...props}
        readOnly={readOnly}
        disabled={disabled}
        className={cn("grid-cols-1", columnsFor(options.length), className)}
      >
        {options.map((option) => {
          const look = chosenLook[option.tone ?? "none"];
          return (
            <RadioPrimitive.Root<Value>
              key={option.shortcut}
              value={option.value}
              disabled={option.disabled}
              nativeButton
              render={<button type="button" />}
              aria-keyshortcuts={format(option.shortcut, "aria")}
              data-slot="decision-key"
              data-tone={option.tone}
              className={cn(
                // The card: a key on the raised surface with the input's edge. Chosen, it takes its
                // tone's fill and a second line of edge inside the first, drawn by a pseudo-element
                // so the words do not move.
                "group/decision-key relative flex min-w-0 cursor-pointer flex-col justify-between gap-050 rounded-medium border border-input bg-surface-raised px-150 py-100 text-start outline-none transition-colors duration-fast ease-standard motion-reduce:transition-none",
                "before:pointer-events-none before:absolute before:inset-0 before:hidden before:rounded-small before:border before:border-default data-checked:before:block",
                "not-data-checked:not-data-readonly:not-data-disabled:hover:bg-surface-raised-hovered focus-visible:outline-focused",
                look.card,
                "data-readonly:cursor-default data-readonly:not-data-checked:border-default data-readonly:not-data-checked:bg-surface",
                "data-disabled:cursor-not-allowed data-disabled:opacity-disabled",
              )}
            >
              <span className="flex items-start justify-between gap-100">
                <kbd
                  aria-hidden="true"
                  className={cn("font-heading-section text-default", look.text)}
                >
                  {format(option.shortcut)}
                </kbd>
                {option.tone ? (
                  <span
                    aria-hidden="true"
                    data-slot="decision-key-mark"
                    className={cn(
                      "h-200 w-075 shrink-0 rounded-xsmall",
                      toneClasses[option.tone].fill,
                    )}
                  />
                ) : null}
              </span>
              <span
                className={cn(
                  "flex min-w-0 items-baseline justify-between gap-100 font-body-small font-medium text-subtle",
                  look.text,
                )}
              >
                <Truncate>{option.label}</Truncate>
                {covers ? (
                  <>
                    <span aria-hidden="true" className="shrink-0 tabular-nums">
                      +{formatNumber(covers)}
                    </span>
                    <VisuallyHidden>
                      {` ${t("decisionKeysCovers", { count: formatNumber(covers) })}`}
                    </VisuallyHidden>
                  </>
                ) : null}
              </span>
            </RadioPrimitive.Root>
          );
        })}
      </RadioGroup>
    </div>
  );
}
