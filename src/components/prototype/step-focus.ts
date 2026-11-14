/** How long a step's change may take to show before focus stops waiting for it. */
const WAIT = 15_000;
const POLL = 100;

/** The row a step sits in, which keeps its place when the step in it changes. */
export const stepSlot = (opener: HTMLElement | null) =>
  opener?.closest<HTMLElement>('[data-slot="trace-stage"], [data-slot="key-value"]') ?? null;

/**
 * Where focus goes once a step done in place has made its change. The picker or the form gives
 * focus back to the control that opened it; that control leaves once the reads say the control
 * moved on, and what took its place in the same row (`slot`) takes focus: the next step in the
 * Details, or the record the change put in the trace's stage. A reader who has moved focus
 * elsewhere meanwhile keeps it there.
 */
export function focusWhereStepWas(opener: HTMLElement | null, slot = stepSlot(opener)) {
  if (!opener) return;
  const started = Date.now();
  const settle = () => {
    if (Date.now() - started > WAIT) return;
    const active = document.activeElement;
    // Focus is still the step's, or nobody's since it left: the reader has not moved on.
    if (active && active !== document.body && active !== opener) return;
    if (opener.isConnected) {
      setTimeout(settle, POLL);
      return;
    }
    const next = slot?.isConnected
      ? slot.querySelector<HTMLElement>("a[href], button:not([disabled])")
      : null;
    if (next) next.focus();
    else setTimeout(settle, POLL);
  };
  setTimeout(settle, POLL);
}
