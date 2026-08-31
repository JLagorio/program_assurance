/**
 * Inline property editing for the record rail: click a value, edit in place,
 * commit optimistically, and show a per-field validation / save state.
 */

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, ChevronDown, Loader2 } from "lucide-react";

import { Menu, MenuItem, MenuLabel } from "@/components/app/ui";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "saving" | "saved" | "error";

export type InlineFieldProps<T extends string> = {
  /** Committed value shown when not editing. */
  value: T;
  onChange: (next: T) => void;
  /** Return an error message to block the commit, or null when valid. */
  validate?: (next: string) => string | null;
  save: (next: T) => Promise<unknown>;
};

function useOptimisticCommit<T extends string>({
  value,
  onChange,
  validate,
  save,
}: InlineFieldProps<T>) {
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const commit = (next: T) => {
    const message = validate?.(next) ?? null;
    if (message) {
      setError(message);
      setState("error");
      return false;
    }
    if (next === value) {
      setError(null);
      setState("idle");
      return true;
    }
    const previous = value;
    setError(null);
    setState("saving");
    onChange(next); // optimistic
    save(next)
      .then(() => {
        setState("saved");
        timer.current = setTimeout(() => setState("idle"), 1400);
      })
      .catch((e: unknown) => {
        onChange(previous); // rollback
        setError(e instanceof Error ? e.message : "Could not save");
        setState("error");
      });
    return true;
  };

  return { state, error, setError, setState, commit };
}

function StateIcon({ state }: { state: SaveState }) {
  if (state === "saving") return <Loader2 className="size-3 animate-spin text-muted-foreground" />;
  if (state === "saved") return <Check className="size-3 text-success" />;
  if (state === "error") return <AlertCircle className="size-3 text-danger" />;
  return null;
}

/* ------------------------------------------------------------- Inline text */

export function InlineText({
  placeholder,
  ...props
}: InlineFieldProps<string> & { placeholder?: string }) {
  const { state, error, setError, setState, commit } = useOptimisticCommit(props);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(props.value);

  useEffect(() => {
    if (!editing) setDraft(props.value);
  }, [props.value, editing]);

  const liveError = editing ? (props.validate?.(draft) ?? null) : error;

  return (
    <div className="min-w-0">
      {editing ? (
        <input
          autoFocus
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (commit(draft)) setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (commit(draft)) setEditing(false);
            }
            if (e.key === "Escape") {
              setDraft(props.value);
              setError(null);
              setState("idle");
              setEditing(false);
            }
          }}
          aria-invalid={liveError ? true : undefined}
          className={cn(
            "-mx-1 h-6 w-[calc(100%+8px)] rounded border bg-card px-1 text-[12.5px] outline-none",
            liveError
              ? "border-danger focus:ring-2 focus:ring-danger/25"
              : "border-input focus:border-primary/60 focus:ring-2 focus:ring-ring/20",
          )}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="-mx-1 flex w-[calc(100%+8px)] items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:bg-muted"
        >
          <span className={cn("min-w-0 truncate", !props.value && "text-muted-foreground")}>
            {props.value || placeholder || "—"}
          </span>
          <span className="ml-auto shrink-0">
            <StateIcon state={state} />
          </span>
        </button>
      )}
      {liveError ? <p className="mt-0.5 text-11 text-danger">{liveError}</p> : null}
    </div>
  );
}

/* ----------------------------------------------------------- Inline select */

export function InlineSelect<T extends string>({
  label,
  options,
  render,
  ...props
}: InlineFieldProps<T> & {
  label: string;
  options: readonly T[];
  render?: (v: T) => React.ReactNode;
}) {
  const { state, error, commit } = useOptimisticCommit(props);

  return (
    <div className="min-w-0">
      <Menu
        align="start"
        width={220}
        trigger={({ toggle }) => (
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "-mx-1 flex w-[calc(100%+8px)] items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:bg-muted",
              error && "ring-1 ring-danger/50",
            )}
          >
            <span className="min-w-0 truncate">{render ? render(props.value) : props.value}</span>
            <span className="ml-auto flex shrink-0 items-center gap-1">
              <StateIcon state={state} />
              <ChevronDown className="size-3 text-muted-foreground" />
            </span>
          </button>
        )}
      >
        {(close) => (
          <>
            <MenuLabel>{label}</MenuLabel>
            {options.map((o) => (
              <MenuItem
                key={o}
                selected={o === props.value}
                onSelect={() => {
                  commit(o);
                  close();
                }}
              >
                {render ? render(o) : o}
              </MenuItem>
            ))}
          </>
        )}
      </Menu>
      {error ? <p className="mt-0.5 text-11 text-danger">{error}</p> : null}
    </div>
  );
}
