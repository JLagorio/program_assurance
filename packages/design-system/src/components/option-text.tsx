import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  type JSXElementConstructor,
  type ReactElement,
  type ReactNode,
} from "react";

/* Package-internal helpers for the option rows of Select and Combobox. Not exported from the
   package. */

/** A row's children flattened through fragments, each element keyed by its path. */
function flatten(children: ReactNode, path = ""): ReactNode[] {
  return Children.toArray(children).flatMap((node, index) => {
    if (isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment)
      return flatten(node.props.children, `${path}${index}.`);
    return isValidElement(node)
      ? [cloneElement(node, { key: `${path}${node.key ?? index}` })]
      : [node];
  });
}

/**
 * Puts each run of text in its own shrinkable span. In a flex row the bare text is an anonymous
 * item as wide as its longest word, which `overflow-wrap: break-word` does not narrow, so a long
 * identifier or URL runs out of the row; in a `min-w-0` span it wraps. Elements (a Dot, an icon, a
 * Badge) keep their own size.
 */
export function wrapText(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  let run: ReactNode[] = [];
  const flush = () => {
    if (run.length === 0) return;
    out.push(
      <span key={`text-${out.length}`} data-slot="option-text" className="min-w-0">
        {run}
      </span>,
    );
    run = [];
  };
  for (const node of flatten(children)) {
    if (typeof node === "string" || typeof node === "number") run.push(node);
    else {
      flush();
      out.push(node);
    }
  }
  flush();
  return out;
}

/** The words in a node, skipping elements of the `skip` type (a chip's own remove button). */
export function textOf(node: ReactNode, skip?: JSXElementConstructor<never>): string {
  const walk = (value: ReactNode): string => {
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (Array.isArray(value)) return value.map(walk).join("");
    if (isValidElement<{ children?: ReactNode }>(value)) {
      if (skip && (value as ReactElement).type === skip) return "";
      return walk(value.props.children);
    }
    return "";
  };
  return walk(node).replace(/\s+/g, " ").trim();
}

/** The number of options in Base UI's filtered items, counting inside groups. */
export function countOptions(items: readonly unknown[] | undefined): number {
  if (!items) return 0;
  let count = 0;
  for (const item of items) {
    const group = item as { items?: unknown } | null;
    count +=
      group && typeof group === "object" && Array.isArray(group.items) ? group.items.length : 1;
  }
  return count;
}

/** Space-separated ids, without empties. */
export const joinIds = (...ids: (string | undefined)[]) =>
  ids.filter(Boolean).join(" ") || undefined;
