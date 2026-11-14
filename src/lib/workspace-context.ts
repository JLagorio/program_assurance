import { createContext, useContext } from "react";
import type { Workspace } from "./database";

/**
 * The signed-in workspace as screens and domain hooks read it: who reads, in which tenant, and in
 * what role. The record schema is not part of it: a screen reads a collection through
 * `useCollection(name)`, or the whole schema through `useSchemaCatalog()` (src/lib/collections),
 * which load it on demand.
 *
 * The context lives here, beside the data, so domain code reads the workspace without importing the
 * UI; `WorkspaceProvider` in src/components/app/workspace signs the reader in and provides it.
 */
export type WorkspaceContextValue = Workspace;

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

/** The signed-in workspace; outside `WorkspaceProvider` there is none, and asking for one throws. */
export function useWorkspace(): WorkspaceContextValue {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("A signed-in workspace is required.");
  return workspace;
}
