/**
 * The peek stack, kept in the `?peek=` search param as comma-joined record ids, so a peek is linkable,
 * the panel's back chevron and the browser's back button are the same history step, and close drops the
 * whole stack. Any route that declares `peek` in its validateSearch can host one.
 */

import { useNavigate, useRouter, useSearch, type RouterHistory } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo } from "react";

type PeekSearch = { peek?: string | undefined };

const split = (peek: string | undefined) => (peek ? peek.split(",").filter(Boolean) : []);
const join = (stack: string[]) => (stack.length ? stack.join(",") : undefined);

// Frames pushed on top of the entry this tab arrived at. The chevron pops one with history.back() only
// while there is one to pop, so a stack reached by link still steps back by navigation instead of
// leaving the page.
let pushed = 0;
let own = false;
const watched = new WeakSet<RouterHistory>();
function watch(history: RouterHistory) {
  if (watched.has(history)) return;
  watched.add(history);
  history.subscribe(({ action }) => {
    if (action.type === "BACK") pushed = Math.max(0, pushed - 1);
    else if (action.type === "PUSH") pushed = own ? pushed + 1 : 0;
    else if (action.type === "REPLACE") pushed = own ? pushed : 0;
    own = false;
  });
}

export function usePeekStack() {
  const peek = useSearch({ strict: false, select: (s) => (s as PeekSearch).peek });
  const navigate = useNavigate();
  const router = useRouter();
  useEffect(() => watch(router.history), [router]);

  const stack = useMemo(() => split(peek), [peek]);
  const write = useCallback(
    (next: string[], replace = false) => {
      own = true;
      void navigate({
        to: ".",
        search: (prev: PeekSearch) => ({ ...prev, peek: join(next) }),
        replace,
      });
    },
    [navigate],
  );

  return useMemo(
    () => ({
      stack,
      /** The frame on top, or null when nothing is peeked. */
      current: stack.at(-1) ?? null,
      /** A new stack of one frame: a row clicked in the list behind. */
      open: (id: string) => write([id]),
      /** One frame deeper: a record clicked inside the peek. */
      push: (id: string) => write([...stack, id]),
      /** One frame back: the browser's back when that is where the frame came from. */
      back: () => {
        if (pushed > 0) router.history.back();
        else write(stack.slice(0, -1));
      },
      /** Drops the whole stack. */
      close: () => write([]),
    }),
    [stack, write, router],
  );
}
