import { useMemo, useState } from "react";
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FindBar,
  MatchText,
  Field,
  FieldLabel,
  FieldSet,
  Inline,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
} from "@ledger/design-system";
import {
  findCells,
  replaceMatches,
  type CalculationResult,
  type ConditionalCondition,
  type ConditionalFormatRule,
  type FindMatch,
  type Sheet,
  type Workbook,
} from "@ledger/spreadsheet-core";

/** Search uses authored input for replacement and preserves protected source fields. */
export function WorkbookFind({
  workbook,
  sheetId,
  results,
  readonly,
  canEditRecords,
  onUpdate,
  onSelect,
  onClose,
}: {
  workbook: Workbook;
  sheetId: string;
  results?: CalculationResult | undefined;
  readonly: boolean;
  canEditRecords: boolean;
  onUpdate: (workbook: Workbook) => void;
  onSelect: (match: FindMatch) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [wholeCell, setWholeCell] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [scope, setScope] = useState("sheet");
  const [searchIn, setSearchIn] = useState<"input" | "display">("input");
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string>();
  const found = useMemo(
    () =>
      findCells(
        workbook,
        {
          query,
          wholeCell,
          matchCase,
          searchIn,
          ...(scope === "sheet" ? { sheetIds: [sheetId] } : {}),
        },
        results,
      ),
    [workbook, query, wholeCell, matchCase, searchIn, scope, sheetId, results],
  );
  const selected = found.matches[Math.min(index, Math.max(0, found.matches.length - 1))];
  const canReplace = (match: FindMatch) =>
    !match.readonly &&
    (canEditRecords ||
      workbook.sheets.find((sheet) => sheet.id === match.sheetId)?.mode === "freeform");
  const editable = found.matches.filter(canReplace);
  const replace = (all: boolean) => {
    setError(undefined);
    try {
      const targets = all ? editable : selected ? [selected] : [];
      if (!targets.length) return;
      onUpdate(replaceMatches(workbook, targets, query, replacement, { wholeCell, matchCase }));
      setStatus(`Replaced ${targets.length} cells. Source edits remain staged for review.`);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "The replacement could not be applied.",
      );
    }
  };
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Find and replace</DialogTitle>
          <DialogDescription>
            Search the workbook. Replacements change editable inputs in one undo step.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Stack space="space.200">
            {error && (
              <Alert tone="danger">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FindBar
              label="Find"
              query={query}
              onQueryChange={(value) => {
                setQuery(value);
                setIndex(0);
                setStatus("");
              }}
              count={found.matches.length}
              index={selected ? Math.min(index, found.matches.length - 1) : null}
              onNavigate={setIndex}
              truncated={found.truncated}
            />
            <Inline space="space.100" rowSpace="space.100" shouldWrap>
              <Field>
                <FieldLabel>Search scope</FieldLabel>
                <Select value={scope} onValueChange={(value) => value && setScope(value)}>
                  <SelectTrigger>
                    <SelectValue>{scope === "sheet" ? "Current sheet" : "All sheets"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sheet">Current sheet</SelectItem>
                    <SelectItem value="workbook">All sheets</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Search values</FieldLabel>
                <Select
                  value={searchIn}
                  onValueChange={(value) => setSearchIn(value === "display" ? "display" : "input")}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {searchIn === "input" ? "Authored inputs" : "Displayed results"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="input">Authored inputs</SelectItem>
                    <SelectItem value="display">Displayed results</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </Inline>
            <Inline space="space.100" rowSpace="space.100" shouldWrap>
              <Field orientation="horizontal">
                <Checkbox
                  checked={matchCase}
                  onCheckedChange={(value) => setMatchCase(value === true)}
                />
                <FieldLabel>Match case</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  checked={wholeCell}
                  onCheckedChange={(value) => setWholeCell(value === true)}
                />
                <FieldLabel>Whole cell</FieldLabel>
              </Field>
            </Inline>
            <Text role="status">
              {found.matches.length}
              {found.truncated ? "+" : ""} matches · {editable.length} editable
              {query && !found.matches.length ? " · No matching cells" : ""}
            </Text>
            {selected && (
              <Stack space="space.100">
                <Text>
                  {workbook.sheets.find((sheet) => sheet.id === selected.sheetId)?.name} ·{" "}
                  {selected.address}
                  {selected.readonly ? " · Read only" : ""}
                </Text>
                <Text>
                  <MatchText
                    text={selected.text.slice(0, 240)}
                    query={query}
                    matchCase={matchCase}
                  />
                </Text>
                <Inline space="space.100" rowSpace="space.100" shouldWrap>
                  <Button
                    size="small"
                    onClick={() => {
                      onSelect(selected);
                      onClose();
                    }}
                  >
                    Go to cell
                  </Button>
                </Inline>
              </Stack>
            )}
            <FieldSet disabled={readonly || searchIn === "display"}>
              <Stack space="space.200">
                <Field>
                  <FieldLabel>Replace with</FieldLabel>
                  <Input value={replacement} onValueChange={setReplacement} />
                </Field>
                <Inline space="space.100" rowSpace="space.100" shouldWrap>
                  <Button
                    disabled={!selected || !canReplace(selected)}
                    onClick={() => replace(false)}
                  >
                    Replace match
                  </Button>
                  <Button
                    disabled={!editable.length || found.truncated}
                    onClick={() => replace(true)}
                  >
                    Replace all editable matches
                  </Button>
                </Inline>
              </Stack>
            </FieldSet>
            {found.truncated && <Text>Refine the search before replacing all matches.</Text>}
            {searchIn === "display" && (
              <Text color="color.text.subtle">
                Use authored inputs to replace text. Calculated results are read only.
              </Text>
            )}
            {status && <Text role="status">{status}</Text>}
          </Stack>
        </DialogBody>
        <DialogFooter>
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const operators = {
  gt: "Greater than",
  gte: "At least",
  lt: "Less than",
  lte: "At most",
  eq: "Equal to",
  neq: "Not equal to",
} as const;
const conditionLabels = { number: "Number", text: "Text", blank: "Blank cells" } as const;
const comparisonLabels: Record<string, string> = {
  ...operators,
  contains: "Contains",
  equals: "Equals",
  blank: "Is blank",
  "not-blank": "Is not blank",
};
function ruleDescription(condition: ConditionalCondition) {
  if (condition.kind === "blank") return condition.isBlank ? "Is blank" : "Is not blank";
  return `${comparisonLabels[condition.operator]} ${condition.value}`;
}
/** Authored rule colors are document data, independent of the application theme. */
export function WorkbookConditionalFormatting({
  sheet,
  rowIds,
  columnIds,
  readonly,
  onSave,
  onClose,
}: {
  sheet: Sheet;
  rowIds: string[];
  columnIds: string[];
  readonly: boolean;
  onSave: (rules: ConditionalFormatRule[]) => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<ConditionalFormatRule | null>(null);
  const [kind, setKind] = useState<"number" | "text" | "blank">("number");
  const [operator, setOperator] = useState("gt");
  const [value, setValue] = useState("0");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [color, setColor] = useState("#fff2cc");
  const [bold, setBold] = useState<boolean | undefined>();
  const [error, setError] = useState<string>();
  const rules = sheet.conditionalFormats ?? [];
  const targetRows = editing?.rowIds ?? rowIds.filter((id) => id !== "headers");
  const targetColumns = editing?.columnIds ?? columnIds;
  function reset() {
    setEditing(null);
    setBold(undefined);
    setError(undefined);
  }
  function load(rule: ConditionalFormatRule) {
    setEditing(rule);
    setKind(rule.condition.kind);
    setColor(rule.style.background ?? "#fff2cc");
    setBold(rule.style.bold);
    setOperator(
      rule.condition.kind === "blank"
        ? rule.condition.isBlank
          ? "blank"
          : "not-blank"
        : rule.condition.operator,
    );
    setValue(rule.condition.kind === "blank" ? "" : String(rule.condition.value));
    setCaseSensitive(rule.condition.kind === "text" && !!rule.condition.caseSensitive);
    setError(undefined);
  }
  function save() {
    try {
      let condition: ConditionalCondition;
      if (kind === "number") {
        if (!value.trim() || !Number.isFinite(Number(value)))
          throw new Error("Enter a finite number.");
        condition = { kind, operator: operator as keyof typeof operators, value: Number(value) };
      } else if (kind === "text")
        condition = {
          kind,
          operator: operator === "equals" ? "equals" : "contains",
          value,
          caseSensitive,
        };
      else condition = { kind, isBlank: operator !== "not-blank" };
      const style = { ...(editing?.style ?? {}), background: color };
      if (bold === undefined) delete style.bold;
      else style.bold = bold;
      const rule: ConditionalFormatRule = {
        id: editing?.id ?? crypto.randomUUID(),
        rowIds: targetRows,
        columnIds: targetColumns,
        condition,
        style,
      };
      onSave(editing ? rules.map((old) => (old.id === rule.id ? rule : old)) : [...rules, rule]);
      reset();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The rule could not be saved.");
    }
  }
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conditional formatting</DialogTitle>
          <DialogDescription>
            Apply visual rules to selected cells. Later matching rules take precedence.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Stack space="space.200">
            {error && (
              <Alert tone="danger">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {rules.map((rule, index) => (
              <Inline
                key={rule.id}
                space="space.100"
                rowSpace="space.100"
                spread="space-between"
                shouldWrap
              >
                <Text>
                  Rule {index + 1}: {ruleDescription(rule.condition)} · {rule.rowIds.length}{" "}
                  {rule.rowIds.length === 1 ? "row" : "rows"} × {rule.columnIds.length}{" "}
                  {rule.columnIds.length === 1 ? "column" : "columns"}
                </Text>
                <Inline space="space.100">
                  <Button size="small" disabled={readonly} onClick={() => load(rule)}>
                    Edit rule {index + 1}
                  </Button>
                  <Button
                    size="small"
                    disabled={readonly}
                    onClick={() => {
                      try {
                        onSave(rules.filter((old) => old.id !== rule.id));
                        if (editing?.id === rule.id) reset();
                      } catch (failure) {
                        setError(String(failure));
                      }
                    }}
                  >
                    Remove rule {index + 1}
                  </Button>
                </Inline>
              </Inline>
            ))}
            {!rules.length && <Text color="color.text.subtle">No rules on this sheet.</Text>}
            <FieldSet disabled={readonly}>
              <Stack space="space.200">
                <Text weight="semibold">
                  {editing ? "Edit rule" : "New rule"} · {targetRows.length * targetColumns.length}{" "}
                  cells
                </Text>
                {!targetRows.length || !targetColumns.length ? (
                  <Text>Select cells before adding a rule.</Text>
                ) : null}
                <Field>
                  <FieldLabel>Condition type</FieldLabel>
                  <Select
                    value={kind}
                    onValueChange={(next) => {
                      const nextKind = next === "text" || next === "blank" ? next : "number";
                      setKind(nextKind);
                      setOperator(
                        nextKind === "number" ? "gt" : nextKind === "text" ? "contains" : "blank",
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>{conditionLabels[kind]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="blank">Blank cells</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Comparison</FieldLabel>
                  <Select value={operator} onValueChange={(next) => next && setOperator(next)}>
                    <SelectTrigger>
                      <SelectValue>{comparisonLabels[operator]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {kind === "number" ? (
                        Object.entries(operators).map(([id, name]) => (
                          <SelectItem key={id} value={id}>
                            {name}
                          </SelectItem>
                        ))
                      ) : kind === "text" ? (
                        <>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="equals">Equals</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="blank">Is blank</SelectItem>
                          <SelectItem value="not-blank">Is not blank</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </Field>
                {kind !== "blank" && (
                  <Field>
                    <FieldLabel>Compare with</FieldLabel>
                    <Input value={value} onValueChange={setValue} />
                  </Field>
                )}
                {kind === "text" && (
                  <Field orientation="horizontal">
                    <Checkbox
                      checked={caseSensitive}
                      onCheckedChange={(next) => setCaseSensitive(next === true)}
                    />
                    <FieldLabel>Match case</FieldLabel>
                  </Field>
                )}
                <Field>
                  <FieldLabel>Fill color</FieldLabel>
                  <Input type="color" value={color} onValueChange={setColor} />
                </Field>
                <Field orientation="horizontal">
                  <Checkbox
                    checked={bold === true}
                    onCheckedChange={(next) => setBold(next === true ? true : undefined)}
                  />
                  <FieldLabel>Bold text</FieldLabel>
                </Field>
                <Inline space="space.100" rowSpace="space.100" shouldWrap>
                  <Button disabled={!targetRows.length || !targetColumns.length} onClick={save}>
                    {editing ? "Update rule" : "Add rule"}
                  </Button>
                  {editing && (
                    <Button variant="subtle" onClick={reset}>
                      Cancel edit
                    </Button>
                  )}
                </Inline>
              </Stack>
            </FieldSet>
          </Stack>
        </DialogBody>
        <DialogFooter>
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
