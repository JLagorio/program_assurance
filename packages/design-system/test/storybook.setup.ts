import { afterEach, beforeEach, expect, vi } from "vitest";

let errors: unknown[][];
let restore: (() => void) | undefined;
beforeEach(() => {
  errors = [];
  const original = console.error.bind(console);
  const spy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    errors.push(args);
    original(...args);
  });
  restore = () => spy.mockRestore();
});
afterEach(() => {
  restore?.();
  expect(errors, "Stories must not emit unexpected console errors").toEqual([]);
  const doc = document.documentElement;
  const overflow = doc.scrollWidth - doc.clientWidth;
  if (overflow > 1) {
    // Name the outermost elements past the edge, so the failure says what to fix.
    const past = Array.from(document.body.querySelectorAll<HTMLElement>("*"))
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        const parent = el.parentElement?.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.right > doc.clientWidth + 1 &&
          !(parent && parent.right > doc.clientWidth + 1)
        );
      })
      .slice(0, 5)
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return `<${el.tagName.toLowerCase()}${el.dataset["slot"] ? ` data-slot="${el.dataset["slot"]}"` : ""}> right=${Math.round(rect.right)} of ${doc.clientWidth}`;
      });
    expect.fail(
      `Stories must not scroll the page sideways at the width they render at: ${overflow}px past the edge. ${past.join("; ")}`,
    );
  }
});
