/**
 * Search-and-link dialog for attaching a related record.
 *
 * This replaces a bare `<select>` full of `EVD-` identifiers — an affordance
 * that assumes the user already knows the id of the thing they want, which is
 * exactly backwards. Nobody links evidence by remembering that the STIG
 * checklist output is EVD-8841. They search for "STIG", or "AC-4", or "the
 * thing from the August test run".
 *
 * Keyboard-first for the same reason the command palette is: linking records is
 * repetitive work, and repetitive work should not require the mouse.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";

import { Badge, Mono } from "@/components/app/ui";
import { cn } from "@/lib/utils";

export type PickerRecord = {
  id: string;
  /** The line a person actually reads. */
  title: string;
  /** Secondary line: kind, source, date. */
  meta?: string;
  /** Right-aligned chip: state, freshness, severity. */
  badge?: { label: string; tone?: "neutral" | "success" | "warning" | "danger" | "info" };
  /** Extra text matched against the query but not displayed. */
  keywords?: string;
};

export function RecordPicker({
  open,
  onClose,
  onPick,
  records,
  title,
  placeholder,
  emptyHint,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (record: PickerRecord) => void;
  records: PickerRecord[];
  title: string;
  placeholder: string;
  emptyHint?: string;
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      // The dialog is useless without focus; a picker you have to click into
      // is a dropdown with extra steps.
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
    return;
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records.slice(0, 40);
    const terms = q.split(/\s+/);
    return records
      .map((r) => {
        const hay = `${r.id} ${r.title} ${r.meta ?? ""} ${r.keywords ?? ""}`.toLowerCase();
        const hits = terms.filter((t) => hay.includes(t)).length;
        // An id prefix match is what someone typing "EVD-88" means.
        const idBoost = r.id.toLowerCase().startsWith(q) ? 10 : 0;
        return { r, score: hits === terms.length ? terms.length + idBoost : 0 };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((x) => x.r);
  }, [query, records]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  if (!open || typeof document === "undefined") return null;

  const choose = (r: PickerRecord) => {
    onPick(r);
    onClose();
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
        aria-label={title}
        className="relative z-10 w-full max-w-[620px] overflow-hidden rounded-xl bg-card shadow-pop"
        onKeyDown={(e) => {
          if (e.key === "Escape") return onClose();
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
            const hit = results[cursor];
            if (hit) choose(hit);
          }
        }}
      >
        <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="h-7 w-full bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
          />
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {results.length} {results.length === 1 ? "match" : "matches"}
          </span>
        </div>

        <div className="max-h-[46vh] overflow-y-auto py-1">
          {results.length === 0 ? (
            <p className="px-3.5 py-6 text-center text-[13px] text-muted-foreground">
              {emptyHint ?? "Nothing matches."}
            </p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onMouseEnter={() => setCursor(i)}
                onClick={() => choose(r)}
                className={cn(
                  "flex w-full items-center gap-3 px-3.5 py-2 text-left",
                  i === cursor ? "bg-primary-soft" : "hover:bg-surface-hover",
                )}
              >
                <Mono className={i === cursor ? "text-primary" : "text-muted-foreground"}>
                  {r.id}
                </Mono>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px]">{r.title}</span>
                  {r.meta ? (
                    <span className="block truncate text-[11.5px] text-muted-foreground">
                      {r.meta}
                    </span>
                  ) : null}
                </span>
                {r.badge ? (
                  <Badge size="xs" tone={r.badge.tone ?? "neutral"}>
                    {r.badge.label}
                  </Badge>
                ) : null}
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-border bg-subtle px-3.5 py-2 text-[11px] text-muted-foreground">
          <span>↑↓ navigate</span>
          <span>↵ link</span>
          <span>esc close</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
