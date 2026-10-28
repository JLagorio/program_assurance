import {
  useLayoutEffect,
  useRef,
  useState,
  type FocusEventHandler,
  type KeyboardEventHandler,
  type RefCallback,
} from "react";

export type CollectionSelectionOptions = {
  /** Only visible identities, in visual order. Hidden and disabled items never enter a range. */
  items: readonly string[];
  disabledIds?: readonly string[] | undefined;
  selectedIds?: readonly string[] | undefined;
  defaultSelectedIds?: readonly string[] | undefined;
  onSelectionChange?: ((ids: string[]) => void) | undefined;
  disabled?: boolean | undefined;
};
export type CollectionSelectionItemProps = {
  ref: RefCallback<HTMLElement>;
  onFocusCapture: FocusEventHandler<HTMLElement>;
  onKeyDown: KeyboardEventHandler<HTMLElement>;
};
export type CollectionSelection = {
  selectedIds: readonly string[];
  allSelected: boolean;
  partiallySelected: boolean;
  isSelected: (id: string) => boolean;
  isDisabled: (id: string) => boolean;
  /** Shift selects a contiguous visible range; additive retains selections outside it. */
  toggle: (
    id: string,
    options?: { range?: boolean | undefined; additive?: boolean | undefined },
  ) => void;
  selectAll: () => void;
  clear: () => void;
  /** Attach to the selection checkbox/button, not a row containing other interactive controls. */
  getItemProps: (id: string) => CollectionSelectionItemProps;
};
/** Selection and focus recovery for native checkbox/button collections, without listbox roles. */
export function useCollectionSelection({
  items,
  disabledIds = [],
  selectedIds,
  defaultSelectedIds = [],
  onSelectionChange,
  disabled = false,
}: CollectionSelectionOptions): CollectionSelection {
  const [local, setLocal] = useState<readonly string[]>(defaultSelectedIds);
  const available = items.filter((id) => !disabledIds.includes(id));
  const selected = (selectedIds ?? local).filter((id) => available.includes(id));
  const anchor = useRef<string | null>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const focused = useRef<{ id: string; node: HTMLElement } | null>(null);
  const previous = useRef(items);
  const change = (next: string[]) => {
    if (disabled) return;
    setLocal(next);
    onSelectionChange?.(next);
  };
  useLayoutEffect(() => {
    const last = focused.current;
    const old = previous.current;
    previous.current = items;
    if (!last || (items.includes(last.id) && !disabledIds.includes(last.id))) return;
    // Never steal focus if the host intentionally moved it to a dialog or another control.
    const active = last.node.ownerDocument.activeElement;
    if (active && active !== last.node.ownerDocument.body && active !== last.node) return;
    const index = Math.max(0, old.indexOf(last.id));
    const candidates = [...items.slice(index), ...items.slice(0, index).reverse()];
    const next = candidates.find((id) => !disabledIds.includes(id) && nodes.current.has(id));
    focused.current = null;
    if (next) nodes.current.get(next)?.focus();
  });
  const toggle = (
    id: string,
    options: { range?: boolean | undefined; additive?: boolean | undefined } = {},
  ) => {
    if (disabled || !available.includes(id)) return;
    const from = anchor.current ? available.indexOf(anchor.current) : -1;
    if (options.range && from >= 0) {
      const to = available.indexOf(id);
      const range = available.slice(Math.min(from, to), Math.max(from, to) + 1);
      change(options.additive ? [...new Set([...selected, ...range])] : range);
    } else {
      anchor.current = id;
      change(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
    }
  };
  const selectAll = () => change([...available]);
  const clear = () => {
    anchor.current = null;
    change([]);
  };
  return {
    selectedIds: selected,
    allSelected: available.length > 0 && selected.length === available.length,
    partiallySelected: selected.length > 0 && selected.length < available.length,
    isSelected: (id) => selected.includes(id),
    isDisabled: (id) => disabled || !available.includes(id),
    toggle,
    selectAll,
    clear,
    getItemProps: (id) => ({
      ref: (node) => {
        if (node) nodes.current.set(id, node);
        else nodes.current.delete(id);
      },
      onFocusCapture: (event) => {
        focused.current = { id, node: event.currentTarget };
      },
      onKeyDown: (event) => {
        if (
          disabled ||
          !available.includes(id) ||
          event.defaultPrevented ||
          event.nativeEvent.isComposing ||
          event.nativeEvent.keyCode === 229
        )
          return;
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
          event.preventDefault();
          selectAll();
          return;
        }
        if (!event.shiftKey || !["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const index = available.indexOf(id);
        const to =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? available.length - 1
              : Math.max(
                  0,
                  Math.min(available.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)),
                );
        const next = available[to];
        if (!next) return;
        if (!anchor.current || !available.includes(anchor.current)) anchor.current = id;
        toggle(next, { range: true, additive: event.ctrlKey || event.metaKey });
        nodes.current.get(next)?.focus();
      },
    }),
  };
}
