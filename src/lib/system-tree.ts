import type { Row } from "./models";

export type SystemElement = Row<"systems"> & {
  parent_system_id: string | null;
  boundary_system_id: string;
  is_authorization_boundary: boolean;
};
export type SystemTreeNode<T> = T & { children: SystemTreeNode<T>[] };

/** Containment follows recorded parent identities. Missing/cyclic parents never hide a record. */
export function systemTree<T extends { id: string; parent_system_id: string | null }>(
  records: readonly T[],
  rootId?: string,
): SystemTreeNode<T>[] {
  const byId = new Map(records.map((row) => [row.id, row]));
  const parentOf = new Map<string, string>();
  for (const row of records) {
    if (row.parent_system_id && byId.has(row.parent_system_id))
      parentOf.set(row.id, row.parent_system_id);
  }
  const cycles = new Set<string>();
  for (const row of records) {
    const path: string[] = [];
    let cursor: string | undefined = row.id;
    while (cursor) {
      const at = path.indexOf(cursor);
      if (at >= 0) {
        path.slice(at).forEach((id) => cycles.add(id));
        break;
      }
      path.push(cursor);
      cursor = parentOf.get(cursor);
    }
  }
  cycles.forEach((id) => parentOf.delete(id));
  const nodes = new Map(
    records.map((row) => [row.id, { ...row, children: [] } as SystemTreeNode<T>]),
  );
  const roots: SystemTreeNode<T>[] = [];
  for (const row of records) {
    const node = nodes.get(row.id)!;
    const parent = nodes.get(parentOf.get(row.id) ?? "");
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return rootId ? (nodes.has(rootId) ? [nodes.get(rootId)!] : []) : roots;
}

export function systemPath(records: readonly SystemElement[], id: string): string {
  const byId = new Map(records.map((row) => [row.id, row]));
  const names: string[] = [];
  const seen = new Set<string>();
  let current = byId.get(id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    names.unshift(`${current.code} · ${current.name}`);
    current = byId.get(current.parent_system_id ?? "");
  }
  return names.join(" / ");
}
