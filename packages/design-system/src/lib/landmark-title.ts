import { useEffect, useId, useState } from "react";

/**
 * A landmark named by a Title part that may or may not be rendered. The root keeps the id and
 * whether a Title is present, and points `aria-labelledby` at the id only while one is, so a
 * composed region without a title never references an element that is not there.
 */
export function useLandmarkTitle() {
  const titleId = useId();
  const [hasTitle, setHasTitle] = useState(false);
  return { titleId, hasTitle, setHasTitle };
}

/** The Title part's half: present while it is mounted. Outside its root (a matrix, a test) it registers with nobody. */
export function useRegisterTitle(setHasTitle: ((present: boolean) => void) | undefined) {
  useEffect(() => {
    setHasTitle?.(true);
    return () => setHasTitle?.(false);
  }, [setHasTitle]);
}
