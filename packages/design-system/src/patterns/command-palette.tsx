import { useEffect, useState } from "react";

import { Command } from "../components/command";

export type PaletteCommand = {
  id: string;
  /** Commands with the same group, in sequence, share a heading. */
  group: string;
  label: string;
  /** Right-aligned: a shortcut, a count, a hint. */
  hint?: string | undefined;
  run: () => void;
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
}: {
  open: boolean;
  onClose: () => void;
  commands: PaletteCommand[];
  placeholder?: string | undefined;
}) {
  const groups: [string, PaletteCommand[]][] = [];
  for (const c of commands) {
    const last = groups[groups.length - 1];
    if (last && last[0] === c.group) last[1].push(c);
    else groups.push([c.group, [c]]);
  }
  return (
    <Command.Dialog open={open} onClose={onClose} label="Command palette">
      <Command.Input placeholder={placeholder} />
      <Command.List>
        <Command.Empty>No commands match.</Command.Empty>
        {groups.map(([group, items]) => (
          <Command.Group key={group} heading={group}>
            {items.map((c) => (
              <Command.Item
                key={c.id}
                value={`${c.group} ${c.label} ${c.hint ?? ""}`}
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
    </Command.Dialog>
  );
}
