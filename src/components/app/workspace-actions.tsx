import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ScopedCommand } from "@ledger/design-system";
type Entry = { id: string; read: () => readonly ScopedCommand[] };
const Actions = createContext<{ entries: Entry[]; register: (entry: Entry) => () => void } | null>(
  null,
);
/** Route-owned commands share authorization and execution with their own menus. */
export function WorkspaceActionsProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const register = useCallback((entry: Entry) => {
    setEntries((current) => [...current.filter((item) => item.id !== entry.id), entry]);
    return () => setEntries((current) => current.filter((item) => item.id !== entry.id));
  }, []);
  return <Actions.Provider value={{ entries, register }}>{children}</Actions.Provider>;
}
export function useWorkspaceActions(commands: readonly ScopedCommand[]) {
  const host = useContext(Actions);
  const register = host?.register;
  const id = useId();
  const current = useRef(commands);
  current.current = commands;
  useLayoutEffect(() => register?.({ id, read: () => current.current }), [id, register]);
}
export function useRegisteredWorkspaceActions() {
  const host = useContext(Actions);
  return () => [
    ...new Map(
      (host?.entries ?? [])
        .flatMap((entry) => entry.read())
        .filter((command) => !command.hidden)
        .map((command) => [command.id, command]),
    ).values(),
  ];
}
