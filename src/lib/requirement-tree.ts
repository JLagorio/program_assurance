type RevisionRow = { id: string; revisionId: string | null };
type Decomposition = {
  parent_requirement_revision_id: string;
  child_requirement_revision_id: string;
};
type RequirementContent = {
  id: string;
  engineering_requirement_id: string;
  version_number: number;
};
export type RequirementTreeNode<T> = T & { parts: RequirementTreeNode<T>[] };

/**
 * Requirements have stable identities, not a user-facing revision workflow. Preserve each recorded
 * parent/child identity pair while resolving legacy content pins to today's display content. This
 * projection changes no stored link and never chooses between distinct parent identities.
 */
export function requirementIdentityLinks(
  links: readonly Decomposition[],
  contents: readonly RequirementContent[],
) {
  const current = new Map<string, RequirementContent>();
  const byContent = new Map(contents.map((content) => [content.id, content]));
  for (const content of contents) {
    const previous = current.get(content.engineering_requirement_id);
    if (!previous || previous.version_number < content.version_number)
      current.set(content.engineering_requirement_id, content);
  }
  const pairs = new Map<
    string,
    Decomposition & { parentRequirementId: string; childRequirementId: string }
  >();
  for (const link of links) {
    const parentIdentity = byContent.get(
      link.parent_requirement_revision_id,
    )?.engineering_requirement_id;
    const childIdentity = byContent.get(
      link.child_requirement_revision_id,
    )?.engineering_requirement_id;
    if (!parentIdentity || !childIdentity) continue;
    const parent = current.get(parentIdentity);
    const child = current.get(childIdentity);
    if (!parent || !child) continue;
    pairs.set(`${parentIdentity}/${childIdentity}`, {
      parentRequirementId: parentIdentity,
      childRequirementId: childIdentity,
      parent_requirement_revision_id: parent.id,
      child_requirement_revision_id: child.id,
    });
  }
  return [...pairs.values()];
}

/** Nest only recorded links between the displayed revisions. Never hide a record to force a tree. */
export function requirementTree<T extends RevisionRow>(
  records: readonly T[],
  decompositions: readonly Decomposition[],
): { rows: RequirementTreeNode<T>[]; unstructuredCount: number } {
  const byRevision = new Map(
    records.flatMap((row) => (row.revisionId ? [[row.revisionId, row.id] as const] : [])),
  );
  const parents = new Map<string, Set<string>>();
  for (const link of decompositions) {
    const parent = byRevision.get(link.parent_requirement_revision_id);
    const child = byRevision.get(link.child_requirement_revision_id);
    if (!parent || !child) continue;
    const ids = parents.get(child) ?? new Set<string>();
    ids.add(parent);
    parents.set(child, ids);
  }
  const unstructured = new Set<string>();
  const parentOf = new Map<string, string>();
  for (const [child, ids] of parents) {
    if (ids.size === 1) parentOf.set(child, [...ids][0]!);
    else unstructured.add(child);
  }
  for (const row of records) {
    const path: string[] = [];
    let cursor: string | undefined = row.id;
    while (cursor) {
      const cycleAt = path.indexOf(cursor);
      if (cycleAt >= 0) {
        for (const id of path.slice(cycleAt)) unstructured.add(id);
        break;
      }
      path.push(cursor);
      cursor = parentOf.get(cursor);
    }
  }
  for (const id of unstructured) parentOf.delete(id);
  const nodes = new Map<string, RequirementTreeNode<T>>(
    records.map((row) => [row.id, { ...row, parts: [] }]),
  );
  const rows: RequirementTreeNode<T>[] = [];
  for (const row of records) {
    const node = nodes.get(row.id)!;
    const parentId = parentOf.get(row.id);
    const parent = parentId ? nodes.get(parentId) : undefined;
    if (parent) parent.parts.push(node);
    else rows.push(node);
  }
  return { rows, unstructuredCount: unstructured.size };
}
