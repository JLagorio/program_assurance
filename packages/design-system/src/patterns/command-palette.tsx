import { useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/command";

import { CommandKeys } from "../lib/command-keys";

/* The ⌘K palette: a field at the top, commands under headings, a shortcut at the end of the ones that have one,
   the chosen command run and the palette gone. The commands are plain objects the caller
   supplies, so the palette stays presentational and every page can reuse it. */

export type PaletteCommand = {
  /** Unique command identity; labels and group headings may repeat. */
  id: string;
  /** Commands with the same group, in sequence, share a heading. */
  group: string;
  /** A verb and its object: "Record an assessment", "Export the SSP". */
  label: string;
  /** Right-aligned: a shortcut, a count, a hint. */
  hint?: string | undefined;
  run: () => void;
};

export type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  /** In the order they show, grouped by `group`. The page's verbs first, the places after. */
  commands: PaletteCommand[];
  /** The field's placeholder. "Type a command…" by default. */
  placeholder?: string | undefined;
};

/** The palette's open state, toggled by ⌘K or Ctrl+K anywhere on the page. */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

/**
 * A ⌘K palette over a page or a record. The commands are plain objects the caller supplies, so
 * the palette stays presentational and every page can reuse it; choosing one closes the palette
 * and runs it.
 */
export function CommandPalette({
  open,
  onClose,
  commands,
  placeholder = "Type a command…",
}: CommandPaletteProps) {
  const groups: [string, PaletteCommand[]][] = [];
  for (const c of commands) {
    const last = groups[groups.length - 1];
    if (last && last[0] === c.group) last[1].push(c);
    else groups.push([c.group, [c]]);
  }
  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Command palette"
    >
      <Command label="Command palette">
        <CommandInput placeholder={placeholder} hint={null}></CommandInput>
        <CommandList>
          {groups.map(([group, items]) => (
            <CommandGroup key={items[0]!.id} value={items[0]!.id} heading={group}>
              {items.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  keywords={[c.group, c.label, c.hint ?? ""]}
                  onSelect={() => {
                    onClose();
                    c.run();
                  }}
                >
                  {c.label}
                  <span className="ms-auto shrink-0 font-body-xsmall text-subtle">{c.hint}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
        <CommandEmpty>No commands match.</CommandEmpty>
        <CommandFooter>
          <CommandKeys choose="to run" />
        </CommandFooter>
      </Command>
    </CommandDialog>
  );
}
