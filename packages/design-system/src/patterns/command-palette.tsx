import { useEffect, useState } from "react";

import { Command } from "../components/command";
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
    <Command.Dialog open={open} onClose={onClose} label="Command palette">
      <Command.Input placeholder={placeholder} hint={null} />
      <Command.List>
        {groups.map(([group, items]) => (
          <Command.Group key={items[0]!.id} value={items[0]!.id} heading={group}>
            {items.map((c) => (
              <Command.Item
                key={c.id}
                value={c.id}
                keywords={[c.group, c.label, c.hint ?? ""]}
                trailing={c.hint}
                onSelect={() => {
                  onClose();
                  c.run();
                }}
              >
                {c.label}
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>
      <Command.Empty>No commands match.</Command.Empty>
      <Command.Footer>
        <CommandKeys choose="to run" />
      </Command.Footer>
    </Command.Dialog>
  );
}
