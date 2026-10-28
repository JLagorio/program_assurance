import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { SpreadsheetCell, SpreadsheetSelection } from "./types";
export type CellDraft = { cell: SpreadsheetCell; value: string };
type Pick = {
  original: CellDraft;
  start: number;
  end: number;
  selection: SpreadsheetSelection;
  control: HTMLTextAreaElement;
  caret: number;
  formula: boolean;
  pointerId: number;
};
/** Owns temporary reference selection independently of the active edited cell and range selection. */
export function useFormulaPicking({
  draft,
  formulaDraft,
  setDraft,
  setFormulaDraft,
  editor,
  formula,
  encode,
  resolve,
  onError,
}: {
  draft: RefObject<CellDraft | null>;
  formulaDraft: RefObject<CellDraft | null>;
  setDraft: Dispatch<SetStateAction<CellDraft | null>>;
  setFormulaDraft: Dispatch<SetStateAction<CellDraft | null>>;
  editor: RefObject<HTMLDivElement | null>;
  formula: RefObject<HTMLTextAreaElement | null>;
  encode: (selection: SpreadsheetSelection) => string;
  resolve: (x: number, y: number) => SpreadsheetCell | undefined;
  onError: (message: string) => void;
}) {
  const [armed, setArmed] = useState(false);
  const pick = useRef<Pick | null>(null);
  const callbacks = useRef({ cancel: () => {}, end: () => {}, move: (_event: PointerEvent) => {} });
  function update(next: CellDraft, isFormula: boolean) {
    if (isFormula) {
      formulaDraft.current = next;
      setFormulaDraft(next);
    } else {
      draft.current = next;
      setDraft(next);
    }
  }
  function end() {
    const current = pick.current;
    pick.current = null;
    setArmed(false);
    if (current)
      requestAnimationFrame(() => {
        current.control.focus({ preventScroll: true });
        current.control.setSelectionRange(current.caret, current.caret);
      });
  }
  function cancel() {
    const current = pick.current;
    if (current) update(current.original, current.formula);
    end();
  }
  callbacks.current = {
    cancel,
    end,
    move: (event) => {
      if (pick.current?.pointerId !== event.pointerId) return;
      const cell = resolve(event.clientX, event.clientY);
      if (cell) extend(cell);
    },
  };
  useEffect(() => {
    const move = (event: PointerEvent) => callbacks.current.move(event);
    const up = (event: PointerEvent) => {
      if (pick.current?.pointerId === event.pointerId) callbacks.current.end();
    };
    const pointerCancel = (event: PointerEvent) => {
      if (pick.current?.pointerId === event.pointerId) callbacks.current.cancel();
    };
    const cancel = () => callbacks.current.cancel();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && pick.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        callbacks.current.cancel();
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", pointerCancel);
    window.addEventListener("blur", cancel);
    window.addEventListener("keydown", key, true);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", pointerCancel);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("keydown", key, true);
    };
  }, []);
  function extend(cell: SpreadsheetCell) {
    const current = pick.current;
    if (!current) return;
    current.selection = { ...current.selection, focus: cell };
    try {
      const reference = encode(current.selection);
      const text = current.original.value;
      const value = text.slice(0, current.start) + reference + text.slice(current.end);
      current.caret = current.start + reference.length;
      update({ ...current.original, value }, current.formula);
    } catch (reason) {
      onError(
        reason instanceof Error
          ? reason.message
          : "This range cannot be inserted into the formula.",
      );
    }
  }
  function begin(cell: SpreadsheetCell, pointerId: number) {
    const current = draft.current ?? formulaDraft.current;
    const control = formulaDraft.current
      ? formula.current
      : editor.current?.querySelector<HTMLTextAreaElement>("textarea");
    if (!current?.value.startsWith("=") || !control) return false;
    const start = control.selectionStart,
      end = control.selectionEnd;
    if (!armed && start === end && !/[=+\-*/^&(,:;]\s*$/.test(current.value.slice(0, start)))
      return false;
    pick.current = {
      original: { ...current },
      start,
      end,
      selection: { anchor: cell, focus: cell },
      control,
      caret: end,
      formula: !!formulaDraft.current,
      pointerId,
    };
    extend(cell);
    return true;
  }
  const reset = useCallback(() => {
    pick.current = null;
    setArmed(false);
  }, []);
  return {
    begin,
    extend,
    armed,
    active: () => !!pick.current,
    toggle: () => setArmed((value) => !value),
    cancel,
    reset,
  };
}
