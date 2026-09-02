import { AlertCircle, Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { DropdownMenu } from "./dropdown-menu";
import { Spinner } from "./spinner";

/* A value you edit where it sits: click, change, and it saves. Commits optimistically, rolls back
   on failure, and shows the save state beside the value. */

type SaveState = "idle" | "saving" | "saved" | "error";

export type EditableProps<T extends string> = {
  /** Committed value shown when not editing. */
  value: T;
  onChange: (next: T) => void;
  /** Return an error message to block the commit, or null when valid. */
  validate?: ((next: string) => string | null) | undefined;
  save: (next: T) => Promise<unknown>;
};

function useOptimisticCommit<T extends string>({ value, onChange, validate, save }: EditableProps<T>) {
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
    onChange(next);
    save(next)
      .then(() => {
        setState("saved");
        timer.current = setTimeout(() => setState("idle"), 1400);
      })
      .catch((e: unknown) => {
        onChange(previous);
        setError(e instanceof Error ? e.message : "Could not save");
        setState("error");
      });
    return true;
  };

  return { state, error, setError, setState, commit };
}

function StateIcon({ state }: { state: SaveState }) {
  if (state === "saving") return <Spinner />;
  if (state === "saved") return <Check className="size-150 icon-success" />;
  if (state === "error") return <AlertCircle className="size-150 icon-danger" />;
  return null;
}

const restingRow = "flex w-full items-center gap-075 rounded-small px-050 py-025 text-left outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered focus-visible:outline-focused";

function EditableText({ placeholder, ...props }: EditableProps<string> & { placeholder?: string | undefined }) {
  const { state, error, setError, setState, commit } = useOptimisticCommit(props);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(props.value);

  useEffect(() => {
    if (!editing) setDraft(props.value);
  }, [props.value, editing]);

  const liveError = editing ? (props.validate?.(draft) ?? null) : error;

  return (
    <div className="flex min-w-0 flex-col gap-025">
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
          className={cn("h-control-xsmall w-full rounded-small border bg-input px-050 font-body text-default outline-none focus-visible:outline-focused", liveError ? "border-danger" : "border-input focus-visible:border-focused")}
        />
      ) : (
        <button type="button" onClick={() => setEditing(true)} className={restingRow}>
          <span className={cn("min-w-0 truncate", !props.value && "text-subtlest")}>{props.value || placeholder || "—"}</span>
          <span className="ms-auto shrink-0">
            <StateIcon state={state} />
          </span>
        </button>
      )}
      {liveError ? <p className="font-body-xsmall text-danger">{liveError}</p> : null}
    </div>
  );
}

function EditableSelect<T extends string>({ label, options, render, ...props }: EditableProps<T> & { label: string; options: readonly T[]; render?: ((value: T) => ReactNode) | undefined }) {
  const { state, error, commit } = useOptimisticCommit(props);
  return (
    <div className="flex min-w-0 flex-col gap-025">
      <DropdownMenu
        align="start"
        width={220}
        trigger={
          <button type="button" className={cn(restingRow, error && "border border-danger")}>
            <span className="min-w-0 truncate">{render ? render(props.value) : props.value}</span>
            <span className="ms-auto flex shrink-0 items-center gap-050">
              <StateIcon state={state} />
              <ChevronDown className="size-150 icon-subtle" />
            </span>
          </button>
        }
      >
        <DropdownMenu.Label>{label}</DropdownMenu.Label>
        {options.map((o) => (
          <DropdownMenu.Item key={o} isSelected={o === props.value} onSelect={() => commit(o)}>
            {render ? render(o) : o}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu>
      {error ? <p className="font-body-xsmall text-danger">{error}</p> : null}
    </div>
  );
}

export const Editable = { Text: EditableText, Select: EditableSelect } as { Text: typeof EditableText; Select: typeof EditableSelect };
