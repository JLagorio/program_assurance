import { createContext, useContext, useMemo, useRef, type ComponentPropsWithRef } from "react";
import { getModifierKey } from "../components/kbd";
import { cn } from "../lib/cn";

/** One action shared by a shortcut, menu and palette. The host authorizes its execution. */
export type ScopedCommand = {
  id: string;
  label: string;
  group?: string | undefined;
  shortcut?: string | undefined;
  enabled?: boolean | undefined;
  disabledReason?: string | undefined;
  hidden?: boolean | undefined;
  /** Text fields keep their shortcuts unless this action explicitly opts in. */
  allowInInput?: boolean | undefined;
  run: () => void | Promise<void>;
};

type CommandContextValue = {
  commands: readonly ScopedCommand[];
  run: (id: string) => Promise<boolean>;
};
const CommandContext = createContext<CommandContextValue | null>(null);

export type CommandScopeProps = ComponentPropsWithRef<"div"> & {
  /** Local actions override matching identities and shortcuts inherited from a parent scope. */
  commands: readonly ScopedCommand[];
  /** Receives a failed keyboard command. The host keeps its draft and presents the recovery. */
  onCommandError?: ((error: Error, command: ScopedCommand) => void) | undefined;
};

function matches(event: React.KeyboardEvent, shortcut: string) {
  const pieces = shortcut.toLowerCase().split("+");
  const key = pieces.pop();
  const modifier = getModifierKey();
  const control =
    pieces.includes("ctrl") ||
    pieces.includes("control") ||
    (pieces.includes("mod") && modifier !== "meta");
  const meta =
    pieces.includes("meta") ||
    pieces.includes("cmd") ||
    (pieces.includes("mod") && modifier === "meta");
  return (
    event.ctrlKey === control &&
    event.metaKey === meta &&
    event.altKey === pieces.includes("alt") &&
    event.shiftKey === pieces.includes("shift") &&
    (event.key.toLowerCase() === key ||
      (!!key && /^[a-z]$/.test(key) && event.code === `Key${key.toUpperCase()}`))
  );
}

/**
 * A focus-owned command boundary. Nested scopes receive a key first; composed text and handled
 * events never escape an editor. Registration disappears with the React subtree, without global
 * listeners. Keep application record search outside the workbook's separate command shortcut.
 */
export function CommandScope({
  commands,
  onCommandError,
  onKeyDown,
  children,
  className,
  ref,
  ...props
}: CommandScopeProps) {
  const parent = useContext(CommandContext);
  const running = useRef(new Set<string>());
  const context = useMemo<CommandContextValue>(() => {
    const ids = new Set(commands.map((command) => command.id));
    const shortcuts = new Set(
      commands.map((command) => command.shortcut?.toLowerCase()).filter(Boolean),
    );
    return {
      commands: [
        ...commands,
        ...(parent?.commands ?? []).filter(
          (command) =>
            !ids.has(command.id) &&
            (!command.shortcut || !shortcuts.has(command.shortcut.toLowerCase())),
        ),
      ],
      run: async (id) => {
        const command = commands.find((item) => item.id === id);
        if (!command) return parent?.run(id) ?? false;
        if (command.enabled === false || running.current.has(id)) return false;
        running.current.add(id);
        try {
          await command.run();
          return true;
        } finally {
          running.current.delete(id);
        }
      },
    };
  }, [commands, parent]);
  return (
    <CommandContext.Provider value={context}>
      <div
        {...props}
        ref={ref}
        className={cn("min-w-0", className)}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            event.defaultPrevented ||
            event.repeat ||
            event.nativeEvent.isComposing ||
            event.keyCode === 229
          )
            return;
          const target = event.target as HTMLElement;
          const inInput = !!target.closest(
            "input, textarea, select, [contenteditable='true'], [role='textbox']",
          );
          const command = commands.find((item) => item.shortcut && matches(event, item.shortcut));
          if (!command) return;
          if (inInput && !command.allowInInput) {
            // An editor keeps its native key and the nearest scope still owns the shortcut.
            event.stopPropagation();
            return;
          }
          event.preventDefault();
          void context.run(command.id).catch((error: unknown) => {
            onCommandError?.(error instanceof Error ? error : new Error(String(error)), command);
          });
        }}
        data-slot="command-scope"
      >
        {children}
      </div>
    </CommandContext.Provider>
  );
}

/** The current scope's effective actions. Use the same `run` for buttons and palette entries. */
export function useScopedCommands(): CommandContextValue {
  const context = useContext(CommandContext);
  if (!context) throw new Error("useScopedCommands requires a CommandScope.");
  return context;
}
