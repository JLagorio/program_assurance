/**
 * Record-scoped ⌘K palette. Commands are plain objects supplied by the caller
 * so the palette stays presentational and every record page can reuse it.
 */

import { useEffect, useState } from "react";

import { Command } from "@/ds/primitives";

export type PaletteCommand = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  run: () => void;
};

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

export function CommandPalette({
  open,
  onClose,
  commands,
  placeholder = "Type a command…",
}: {
  open: boolean;
  onClose: () => void;
  commands: PaletteCommand[];
  placeholder?: string;
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
