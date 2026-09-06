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
  expect(errors, "Contract stories must not emit unexpected console errors").toEqual([]);
});
