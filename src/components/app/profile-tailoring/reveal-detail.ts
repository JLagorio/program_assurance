/**
 * When a tailoring dialog opens on a chosen row and its WorkPane lists and details side by side,
 * scroll the list to that row, so the reader sees where the detail sits in the list. Stacked, the
 * pane opens on the detail itself (its view starts at `detail`) and Back returns to the row, so
 * nothing scrolls. Call it once the dialog has drawn, from its `initialFocus`.
 */
export function showOpenRow(within: HTMLElement | null) {
  within
    ?.querySelector('[data-slot="work-pane"][data-layout="split"] [aria-current="true"]')
    ?.scrollIntoView({ block: "nearest" });
}

/**
 * After a confirmed removal in the tailoring screens, the Remove control that asked is gone with
 * the decision (a row menu, a preview's overflow, the button in a dialog). Once the confirmation
 * has let go of focus and `target` is on screen (a preview that covered the collection has
 * closed), `target` takes focus: the record's heading in a dialog, the collection's primary on the
 * page.
 */
export function focusAfterConfirmation(target: () => HTMLElement | null) {
  let tries = 0;
  let settled = 0;
  const settle = () => {
    // The confirmation hands focus back to its opener as it unmounts; wait a frame past that.
    const asking = !!document.querySelector('[role="alertdialog"]');
    settled = asking ? 0 : settled + 1;
    const element = settled > 1 ? target() : null;
    if (element) element.focus();
    else if (tries++ < 120) requestAnimationFrame(settle);
  };
  requestAnimationFrame(settle);
}
