import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { defaultMessages, type LedgerMessages } from "../lib/locale-format";

/* A key is a <kbd> drawn as the cap; a chord is several caps in a Group. The glyphs are
   the keyboard's (⌘ ⇧ ⌥ ↵ esc), and a glyph a screen reader would not say is given its name. */

export type KbdProps = ComponentProps<"kbd"> & {
  /**
   * A glyph's spoken name, such as "Command" for ⌘. The glyph is hidden from assistive technology
   * and one visually hidden word says the name in its place, since ARIA does not name a `<kbd>`.
   * An `aria-label` is read the same way and takes precedence.
   */
  label?: string | undefined;
};

const cap =
  "inline-flex h-200 min-w-200 items-center justify-center rounded-xsmall border border-default bg-surface-sunken px-050 font-body-xsmall font-medium text-subtle";

/** A key as it appears on the keyboard: a cap in `elevation.surface.sunken` with a hairline. */
function KbdRoot({ label, "aria-label": ariaLabel, className, children, ...props }: KbdProps) {
  const name = ariaLabel ?? label;
  return (
    <kbd {...props} data-slot="kbd" className={cn(cap, name && "relative", className)}>
      {name ? (
        <>
          <span aria-hidden="true">{children}</span>
          <span className="sr-only">{name}</span>
        </>
      ) : (
        children
      )}
    </kbd>
  );
}

export type KbdGroupProps = ComponentProps<"kbd"> & {
  /**
   * The chord's spoken name, such as "Command K". The caps are hidden from assistive technology
   * and the name is read once in their place. An `aria-label` is read the same way and takes
   * precedence.
   */
  label?: string | undefined;
};

/** Hides a chord's caps from assistive technology, which hears the chord's name instead. */
const hidden = (children: ReactNode) =>
  Children.map(children, (child) =>
    isValidElement<{ "aria-hidden"?: boolean | "true" | "false" | undefined }>(child) ? (
      cloneElement(child, { "aria-hidden": true })
    ) : child === null || child === undefined || typeof child === "boolean" ? (
      child
    ) : (
      <span aria-hidden="true">{child}</span>
    ),
  );

/** A chord: the caps of one shortcut, `space.050` apart. */
export function KbdGroup({
  label,
  "aria-label": ariaLabel,
  className,
  children,
  ...props
}: KbdGroupProps) {
  const name = ariaLabel ?? label;
  return (
    <kbd
      {...props}
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-050", name && "relative", className)}
    >
      {name ? (
        <>
          {hidden(children)}
          <span className="sr-only">{name}</span>
        </>
      ) : (
        children
      )}
    </kbd>
  );
}

export const Kbd = Object.assign(KbdRoot, { Group: KbdGroup });

/* ---------- the platform modifier ---------- */

/** The key a platform's shortcuts hold: Command (`"meta"`) on Apple platforms, Control (`"ctrl"`) elsewhere. */
export type ModifierKey = "meta" | "ctrl";

let detected: ModifierKey | undefined;

/**
 * The platform's shortcut modifier, read from the browser once and kept for the page: `"meta"` on
 * macOS, iOS and iPadOS, `"ctrl"` elsewhere, and `"ctrl"` where there is no browser. For event
 * handlers, which run in the browser; a render reads `useModifierKey`, which is safe to hydrate.
 */
export function getModifierKey(): ModifierKey {
  if (detected) return detected;
  if (typeof navigator === "undefined") return "ctrl";
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } | undefined };
  // iPadOS reports "MacIntel", so the Mac test covers it.
  const platform = nav.userAgentData?.platform || nav.platform || "";
  detected = /^(mac|iphone|ipad|ipod)/i.test(platform) ? "meta" : "ctrl";
  return detected;
}

const subscribe = () => () => {};
const serverModifier = (): ModifierKey => "ctrl";

/**
 * The platform's shortcut modifier for a render. The server and the first client render say
 * `"ctrl"`, so hydration matches; the browser's answer follows straight after, and a render that
 * is not hydrating gets it at once. Every shortcut in the kit reads this one answer.
 */
export function useModifierKey(): ModifierKey {
  return useSyncExternalStore(subscribe, getModifierKey, serverModifier);
}

type MessageKey = keyof LedgerMessages;
type KeyInfo = {
  /** The cap on an Apple keyboard, or a message key for a word. */
  apple: string | MessageKey;
  other: string | MessageKey;
  /** The spoken name, on an Apple keyboard and elsewhere. */
  name: MessageKey | { apple: MessageKey; other: MessageKey };
  /** The `aria-keyshortcuts` name. */
  aria: string;
  /** Modifiers come first, Control, Option or Alt, Shift, Command or Meta; the other keys keep their order. */
  order?: number | undefined;
};

const KEYS: Record<string, KeyInfo> = {
  ctrl: { apple: "⌃", other: "keyCapControl", name: "keyControl", aria: "Control", order: 0 },
  alt: {
    apple: "⌥",
    other: "keyCapAlt",
    name: { apple: "keyOption", other: "keyAlt" },
    aria: "Alt",
    order: 1,
  },
  shift: { apple: "⇧", other: "keyCapShift", name: "keyShift", aria: "Shift", order: 2 },
  meta: {
    apple: "⌘",
    other: "keyMeta",
    name: { apple: "keyCommand", other: "keyMeta" },
    aria: "Meta",
    order: 3,
  },
  enter: { apple: "↵", other: "↵", name: "keyEnter", aria: "Enter" },
  escape: { apple: "keyCapEscape", other: "keyCapEscape", name: "keyEscape", aria: "Escape" },
  tab: { apple: "⇥", other: "keyCapTab", name: "keyTab", aria: "Tab" },
  space: { apple: "keyCapSpace", other: "keyCapSpace", name: "keySpace", aria: "Space" },
  backspace: { apple: "⌫", other: "keyCapBackspace", name: "keyBackspace", aria: "Backspace" },
  delete: { apple: "⌦", other: "keyCapDelete", name: "keyDelete", aria: "Delete" },
  arrowup: { apple: "↑", other: "↑", name: "keyArrowUp", aria: "ArrowUp" },
  arrowdown: { apple: "↓", other: "↓", name: "keyArrowDown", aria: "ArrowDown" },
  arrowleft: { apple: "←", other: "←", name: "keyArrowLeft", aria: "ArrowLeft" },
  arrowright: { apple: "→", other: "→", name: "keyArrowRight", aria: "ArrowRight" },
};
const ALIASES: Record<string, string> = {
  control: "ctrl",
  option: "alt",
  opt: "alt",
  cmd: "meta",
  command: "meta",
  return: "enter",
  esc: "escape",
  del: "delete",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
  plus: "+",
};

/** One key of a shortcut, as a cap shows it, a screen reader says it and `aria-keyshortcuts` names it. */
export type ShortcutKey = {
  /** What the cap shows: "⌘", "Ctrl", "K". */
  cap: string;
  /** What a screen reader says: "Command", "Control", "K". */
  name: string;
  /** The `aria-keyshortcuts` name: "Meta", "Control", "K". */
  aria: string;
};

export type FormatShortcutOptions = {
  /** What `Mod` stands for. The platform's (`getModifierKey`) by default. */
  modifier?: ModifierKey | undefined;
  /** The copy for key names, a LedgerProvider's `messages`. English by default. */
  messages?: Partial<LedgerMessages> | undefined;
  /**
   * `"text"` (the default) is what a reader sees: "⇧⌘P" on Apple platforms, "Ctrl+Shift+P"
   * elsewhere. `"label"` is what a screen reader says: "Shift Command P". `"aria"` is the value
   * for `aria-keyshortcuts` on the control the shortcut runs: "Shift+Meta+P".
   */
  as?: "text" | "label" | "aria" | undefined;
};

/**
 * The keys of a shortcut written once for every platform: keys joined by `+`, with `Mod` for the
 * platform's modifier ("Mod+K", "Mod+Shift+P", "Ctrl+[", "Escape"). Modifiers are put in the
 * platform's order; a single character is shown in capitals.
 */
export function shortcutKeys(
  shortcut: string,
  { modifier, messages }: Omit<FormatShortcutOptions, "as"> = {},
): ShortcutKey[] {
  const copy: LedgerMessages = { ...defaultMessages, ...messages };
  const apple = (modifier ?? getModifierKey()) === "meta";
  const word = (value: string) => (value in copy ? copy[value as MessageKey] : value);
  const parts = shortcut
    .split(/\+(?!$)/)
    .map((part) => part.trim())
    .filter(Boolean);
  const keys = parts.map((part, index) => {
    const lower = part.toLowerCase();
    const alias = Object.hasOwn(ALIASES, lower) ? ALIASES[lower]! : lower;
    const id = lower === "mod" ? (apple ? "meta" : "ctrl") : alias;
    const info = Object.hasOwn(KEYS, id) ? KEYS[id] : undefined;
    if (info) {
      const shown = apple ? info.apple : info.other;
      const name = typeof info.name === "string" ? info.name : info.name[apple ? "apple" : "other"];
      return {
        key: { cap: word(shown), name: copy[name], aria: info.aria },
        order: info.order ?? 10 + index,
      };
    }
    // A single character in capitals ("K"); a named key as written, its first letter raised ("F2").
    const text = id.length === 1 ? id.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1);
    return { key: { cap: text, name: text, aria: text }, order: 10 + index };
  });
  return keys.sort((a, b) => a.order - b.order).map(({ key }) => key);
}

/**
 * A shortcut as a string, for a tooltip, a hint or an attribute: the text a reader sees, the
 * words a screen reader says, or the `aria-keyshortcuts` value. Pure and synchronous. In a render,
 * use `useFormatShortcut`, which follows the locale and hydrates safely; this function reads the
 * browser's platform unless `modifier` says otherwise.
 */
export function formatShortcut(shortcut: string, options: FormatShortcutOptions = {}): string {
  const keys = shortcutKeys(shortcut, options);
  const as = options.as ?? "text";
  if (as === "label") return keys.map((k) => k.name).join(" ");
  if (as === "aria") return keys.map((k) => k.aria).join("+");
  const apple = (options.modifier ?? getModifierKey()) === "meta";
  return keys.map((k) => k.cap).join(apple ? "" : "+");
}

/** `formatShortcut` bound to the closest LedgerProvider's copy and to `useModifierKey`. */
export function useFormatShortcut() {
  const modifier = useModifierKey();
  const { messages } = useLedgerLocale();
  return useCallback(
    (shortcut: string, as?: FormatShortcutOptions["as"]) =>
      formatShortcut(shortcut, { modifier, messages, as }),
    [modifier, messages],
  );
}

export type KbdShortcutProps = Omit<ComponentProps<"kbd">, "children"> & {
  /** The shortcut, written once for every platform: "Mod+K", "Mod+Shift+P", "Ctrl+[", "Escape". `Mod` is Command on Apple platforms and Control elsewhere. */
  keys: string;
  /** What `Mod` stands for. The platform's by default; set it to show one platform's keys, as documentation does. */
  modifier?: ModifierKey | undefined;
};

/**
 * A shortcut drawn as caps in the platform's glyphs: ⌘ K on a Mac, Ctrl K elsewhere. The caps are
 * hidden from assistive technology and one visually hidden line says the keys ("Command K"), so a
 * screen reader never reads "place of interest sign".
 */
export function KbdShortcut({ keys, modifier, className, ...props }: KbdShortcutProps) {
  const platform = useModifierKey();
  const { messages } = useLedgerLocale();
  const chosen = modifier ?? platform;
  const parsed = shortcutKeys(keys, { modifier: chosen, messages });
  return (
    <kbd
      {...props}
      data-slot="kbd-shortcut"
      data-modifier={chosen}
      className={cn("relative inline-flex items-center gap-050", className)}
    >
      {parsed.map((key, index) => (
        <kbd key={`${index}-${key.aria}`} data-slot="kbd" aria-hidden="true" className={cap}>
          {key.cap}
        </kbd>
      ))}
      <span className="sr-only">{parsed.map((key) => key.name).join(" ")}</span>
    </kbd>
  );
}
