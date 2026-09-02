/**
 * Record-scoped ⌘K palette. Commands are plain objects supplied by the caller
 * so the palette stays presentational and every record page can reuse it.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";

import { Kbd } from "@/ds/primitives";
import { cn } from "@/lib/utils";

export type Command = {
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
  commands: Command[];
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((c) =>
      `${c.group} ${c.label} ${c.hint ?? ""}`.toLowerCase().includes(needle),
    );
  }, [commands, q]);

  if (!open || typeof document === "undefined") return null;

  const grouped: [string, Command[]][] = [];
  for (const c of results) {
    const last = grouped[grouped.length - 1];
    if (last && last[0] === c.group) last[1].push(c);
    else grouped.push([c.group, [c]]);
  }
  let index = -1;

  const runAt = (i: number) => {
    const c = results[i];
    if (!c) return;
    onClose();
    c.run();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="fixed inset-0 bg-foreground/25 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative z-10 w-full max-w-[560px] overflow-hidden rounded-xl border border-border bg-popover shadow-pop"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setCursor((c) => Math.min(c + 1, results.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setCursor((c) => Math.max(c - 1, 0));
          }
          if (e.key === "Enter") {
            e.preventDefault();
            runAt(cursor);
          }
        }}
      >
        <div className="flex h-11 items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCursor(0);
            }}
            placeholder={placeholder}
            className="h-full w-full bg-transparent text-13 outline-none placeholder:text-muted-foreground"
          />
          <Kbd>esc</Kbd>
        </div>

        <div className="max-h-[340px] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-2 py-6 text-center text-12 text-muted-foreground">
              No commands match “{q}”.
            </p>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group}>
                <div className="px-2 pb-1 pt-2 text-11 font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  {group}
                </div>
                {items.map((c) => {
                  index += 1;
                  const i = index;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => runAt(i)}
                      className={cn(
                        "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-13 transition-colors duration-100",
                        cursor === i ? "bg-primary-soft text-primary" : "text-foreground",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{c.label}</span>
                      {c.hint ? (
                        <span className="shrink-0 text-11 text-muted-foreground">{c.hint}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
