import { Check, SquareDashed, X } from "lucide-react";
import { useState, type Ref, type FocusEventHandler, type KeyboardEventHandler } from "react";
import { IconButton } from "../../components/button";
import { Input } from "../../components/input";
import { CellTextEditor } from "./text-editor";
import type { SpreadsheetFunction } from "./types";
/** Private formula chrome; editing ownership and commits remain in the grid controller. */
export function FormulaBar({
  address,
  input,
  inputRef,
  readOnly,
  error,
  describedBy,
  functions,
  onNavigate,
  onFocus,
  onInput,
  onBlur,
  onKeyDown,
  onInsert,
  editing,
  busy,
  actionId,
  allowReference,
  referenceArmed,
  onToggleReference,
  onApply,
  onCancel,
}: {
  address: string;
  input: string;
  inputRef: Ref<HTMLTextAreaElement>;
  readOnly: boolean;
  error: boolean;
  describedBy: string;
  functions: readonly SpreadsheetFunction[] | undefined;
  onNavigate: (address: string) => void;
  onFocus: () => void;
  onInput: (value: string) => void;
  onBlur: FocusEventHandler<HTMLTextAreaElement>;
  onKeyDown: KeyboardEventHandler<HTMLTextAreaElement>;
  onInsert: (value: string, caret: number) => void;
  editing: boolean;
  busy: boolean;
  actionId: string;
  allowReference: boolean;
  referenceArmed: boolean;
  onToggleReference: () => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  const [addressDraft, setAddressDraft] = useState<string | null>(null);
  return (
    <div data-slot="spreadsheet-formula">
      <Input
        size="small"
        aria-label="Go to cell"
        value={addressDraft ?? address}
        placeholder="A1"
        onChange={(event) => setAddressDraft(event.target.value)}
        onBlur={() => setAddressDraft(null)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          onNavigate(addressDraft ?? address);
        }}
      />
      <span data-slot="spreadsheet-function" aria-hidden>
        ƒx
      </span>
      <CellTextEditor
        ref={inputRef}
        functions={functions}
        onFormulaInsert={onInsert}
        aria-label={address ? `Value or formula for ${address}` : "Value or formula"}
        value={input}
        readOnly={readOnly}
        aria-invalid={error}
        aria-describedby={describedBy}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(event) => onInput(event.target.value)}
        onKeyDown={onKeyDown}
      />
      {editing && allowReference ? (
        <IconButton
          label="Insert cell reference"
          size="small"
          variant="subtle"
          icon={<SquareDashed />}
          isSelected={referenceArmed}
          disabled={busy}
          data-spreadsheet-edit-action={actionId}
          onPointerDown={(event) => event.preventDefault()}
          onClick={onToggleReference}
        />
      ) : null}
      {editing ? (
        <>
          <IconButton
            label="Apply cell edit"
            size="small"
            variant="subtle"
            disabled={busy}
            data-spreadsheet-edit-action={actionId}
            onPointerDown={(event) => event.preventDefault()}
            onClick={onApply}
            icon={<Check />}
          />
          <IconButton
            label="Cancel cell edit"
            size="small"
            variant="subtle"
            disabled={busy}
            data-spreadsheet-edit-action={actionId}
            onPointerDown={(event) => event.preventDefault()}
            onClick={onCancel}
            icon={<X />}
          />
        </>
      ) : null}
    </div>
  );
}
