import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  Button,
  Count,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Field,
  FieldLabel,
  Grid,
  NumberField,
  Separator,
  Text,
  token,
  IconButton,
  Input,
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
} from "@ledger/design-system";
import type { BorderPreset, CellBorder, CellStyle } from "@ledger/spreadsheet-core";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ArrowDownWideNarrow,
  ArrowUpDown,
  Bold,
  Filter,
  DollarSign,
  Percent,
  DecimalsArrowLeft,
  DecimalsArrowRight,
  Italic,
  Underline,
  Strikethrough,
  Baseline,
  PaintBucket,
  Grid2X2,
  Square,
  SquareDashed,
  PanelTop,
  PanelBottom,
  PanelLeft,
  PanelRight,
  WrapText,
  Plus,
} from "lucide-react";
import { labelFor } from "@/lib/records";

export type WorkbookQuestion = {
  search: string;
  filterColumn: string;
  sort: string;
  descending: boolean;
};

/** Presentation controls share one toolbar with the grid's editing commands. */
export function WorkbookViewControls({
  name,
  columns,
  question,
  onQuestion,
  view,
  onView,
  disabled,
  filterOpen,
  onFilterOpenChange,
}: {
  name: string;
  columns: readonly { id: string; name: string }[];
  question: WorkbookQuestion;
  onQuestion: (patch: Partial<WorkbookQuestion>) => void;
  view: string;
  onView: (view: string) => void;
  disabled: boolean;
  filterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      {view !== "matrix" && (
        <>
          <Popover open={filterOpen} onOpenChange={onFilterOpenChange}>
            <PopoverTrigger
              render={
                <Button size="small" variant="subtle" iconBefore={<Filter />} disabled={disabled}>
                  Filter{question.search && <Count value={1} />}
                </Button>
              }
            />
            <PopoverContent align="start">
              <PopoverTitle>Filter rows</PopoverTitle>
              <Stack space="space.150">
                <Field>
                  <FieldLabel>Filter column</FieldLabel>
                  <Select
                    value={question.filterColumn || "all-columns"}
                    onValueChange={(value) =>
                      onQuestion({ filterColumn: value === "all-columns" ? "" : (value ?? "") })
                    }
                  >
                    <SelectTrigger size="small">
                      <SelectValue>
                        {columns.find((column) => column.id === question.filterColumn)?.name ??
                          "All columns"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-columns">All columns</SelectItem>
                      {columns.map((column) => (
                        <SelectItem key={column.id} value={column.id}>
                          {column.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Find in {name}</FieldLabel>
                  <Input
                    size="small"
                    value={question.search}
                    onValueChange={(search) => onQuestion({ search })}
                    placeholder={question.filterColumn ? "Contains…" : "Filter all rows"}
                  />
                </Field>
                <Button
                  size="small"
                  variant="subtle"
                  disabled={!question.search && !question.filterColumn}
                  onClick={() => onQuestion({ search: "", filterColumn: "" })}
                >
                  Clear filter
                </Button>
              </Stack>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  size="small"
                  variant="subtle"
                  iconBefore={<ArrowUpDown />}
                  disabled={disabled}
                >
                  Sort{question.sort && <Count value={1} />}
                </Button>
              }
            />
            <PopoverContent align="start">
              <PopoverTitle>Sort view</PopoverTitle>
              <Stack space="space.150">
                <Field>
                  <FieldLabel>Sort view by</FieldLabel>
                  <Select
                    value={question.sort || "source-order"}
                    onValueChange={(value) =>
                      onQuestion({ sort: value === "source-order" ? "" : (value ?? "") })
                    }
                  >
                    <SelectTrigger size="small">
                      <SelectValue>
                        {columns.find((column) => column.id === question.sort)?.name ??
                          "Sheet order"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="source-order">Sheet order</SelectItem>
                      {columns.map((column) => (
                        <SelectItem key={column.id} value={column.id}>
                          {column.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Button
                  size="small"
                  iconBefore={<ArrowDownWideNarrow />}
                  disabled={!question.sort}
                  onClick={() => onQuestion({ descending: !question.descending })}
                >
                  {question.descending ? "Descending" : "Ascending"}
                </Button>
                <Button
                  size="small"
                  variant="subtle"
                  disabled={!question.sort}
                  onClick={() => onQuestion({ sort: "", descending: false })}
                >
                  Clear sort
                </Button>
              </Stack>
            </PopoverContent>
          </Popover>
        </>
      )}
      <Select value={view} onValueChange={(value) => value && onView(value)} disabled={disabled}>
        <SelectTrigger size="small" aria-label="View">
          <SelectValue>
            {view === "grid"
              ? "Spreadsheet"
              : view === "matrix"
                ? "Traceability matrix"
                : "Pivot & chart"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="grid">Spreadsheet</SelectItem>
          <SelectItem value="matrix">Traceability matrix</SelectItem>
          <SelectItem value="analysis">Pivot & chart</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}

/** These styles are supported by the workbook model and applied to the selected range. */
export function WorkbookFormatting({
  style,
  disabled,
  numberFormatDisabled = false,
  selectionKey,
  onFormat,
  onBorders,
}: {
  style?: CellStyle | undefined;
  disabled: boolean;
  /** Source records permit visual styles while retaining their field-defined value types. */
  numberFormatDisabled?: boolean | undefined;
  /** Reset unfinished toolbar input when the selected cell changes. */
  selectionKey?: string | undefined;
  onFormat: (style: CellStyle) => void;
  onBorders: (preset: BorderPreset, border: CellBorder) => void;
}) {
  const decimals = style?.decimals ?? (style?.format === "percent" ? 1 : 2);
  return (
    <>
      <IconButton
        label="Format as currency"
        icon={<DollarSign />}
        size="small"
        variant="subtle"
        isSelected={style?.format === "currency"}
        disabled={disabled || numberFormatDisabled}
        onClick={() => onFormat({ format: "currency" })}
      />
      <IconButton
        label="Format as percent"
        icon={<Percent />}
        size="small"
        variant="subtle"
        isSelected={style?.format === "percent"}
        disabled={disabled || numberFormatDisabled}
        onClick={() => onFormat({ format: "percent" })}
      />
      <IconButton
        label="Decrease decimal places"
        icon={<DecimalsArrowLeft />}
        size="small"
        variant="subtle"
        disabled={disabled || numberFormatDisabled || decimals === 0}
        onClick={() =>
          onFormat({
            decimals: Math.max(0, decimals - 1),
            format:
              style?.format === "currency" || style?.format === "percent" ? style.format : "number",
          })
        }
      />
      <IconButton
        label="Increase decimal places"
        icon={<DecimalsArrowRight />}
        size="small"
        variant="subtle"
        disabled={disabled || numberFormatDisabled || decimals === 10}
        onClick={() =>
          onFormat({
            decimals: Math.min(10, decimals + 1),
            format:
              style?.format === "currency" || style?.format === "percent" ? style.format : "number",
          })
        }
      />
      <Select
        value={style?.format ?? "general"}
        onValueChange={(value) =>
          value && onFormat({ format: value as NonNullable<CellStyle["format"]> })
        }
        disabled={disabled || numberFormatDisabled}
      >
        <SelectTrigger
          size="small"
          aria-label="Number format"
          aria-description={`Current format: ${labelFor(style?.format ?? "general")}`}
          title={`Number format: ${labelFor(style?.format ?? "general")}`}
        >
          <SelectValue>123</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {[
            { value: "general", example: "1234.56" },
            { value: "number", example: "1,234.56" },
            { value: "currency", example: "$1,234.56" },
            { value: "percent", example: "12.3%" },
            { value: "date", example: "2026-10-14" },
            { value: "text", example: "Plain text" },
          ].map(({ value, example }) => (
            <SelectItem key={value} value={value} description={example}>
              {labelFor(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Separator orientation="vertical" isDecorative />
      <Select
        value={style?.fontFamily ?? "sans-serif"}
        disabled={disabled}
        onValueChange={(value) => value && onFormat({ fontFamily: value })}
      >
        <SelectTrigger
          size="small"
          aria-label="Font family"
          style={{ width: `calc(${token("space.1000")} + ${token("space.400")})` }}
        >
          <SelectValue>
            {style?.fontFamily === "serif"
              ? "Serif"
              : style?.fontFamily === "monospace"
                ? "Monospace"
                : !style?.fontFamily || style.fontFamily === "sans-serif"
                  ? "Sans serif"
                  : style.fontFamily}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sans-serif">Sans serif</SelectItem>
          <SelectItem value="serif">Serif</SelectItem>
          <SelectItem value="monospace">Monospace</SelectItem>
          <SelectItem value="Arial">Arial</SelectItem>
          <SelectItem value="Georgia">Georgia</SelectItem>
        </SelectContent>
      </Select>
      <WorkbookFontSize
        key={selectionKey}
        value={style?.fontSize ?? 10}
        disabled={disabled}
        onChange={(fontSize) => onFormat({ fontSize })}
      />
      <Separator orientation="vertical" isDecorative />
      <IconButton
        label="Bold"
        icon={<Bold />}
        size="small"
        variant="subtle"
        isSelected={Boolean(style?.bold)}
        disabled={disabled}
        onClick={() => onFormat({ bold: !style?.bold })}
      />
      <IconButton
        label="Italic"
        icon={<Italic />}
        size="small"
        variant="subtle"
        isSelected={Boolean(style?.italic)}
        disabled={disabled}
        onClick={() => onFormat({ italic: !style?.italic })}
      />
      <IconButton
        label="Underline"
        icon={<Underline />}
        size="small"
        variant="subtle"
        isSelected={Boolean(style?.underline)}
        disabled={disabled}
        onClick={() => onFormat({ underline: !style?.underline })}
      />
      <IconButton
        label="Strikethrough"
        icon={<Strikethrough />}
        size="small"
        variant="subtle"
        isSelected={Boolean(style?.strikethrough)}
        disabled={disabled}
        onClick={() => onFormat({ strikethrough: !style?.strikethrough })}
      />
      <WorkbookColorControl
        label="Text color"
        value={style?.color ?? "#172B4D"}
        disabled={disabled}
        icon={<Baseline />}
        onChange={(color) => onFormat({ color })}
      />
      <WorkbookColorControl
        label="Fill color"
        value={style?.background ?? "#FFFFFF"}
        disabled={disabled}
        icon={<PaintBucket />}
        onChange={(background) => onFormat({ background })}
      />
      <Separator orientation="vertical" isDecorative />
      <WorkbookBorders color={style?.color ?? "#172B4D"} disabled={disabled} onApply={onBorders} />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              label="Text alignment"
              size="small"
              variant="subtle"
              disabled={disabled}
              icon={
                style?.align === "center" ? (
                  <AlignCenter />
                ) : style?.align === "right" ? (
                  <AlignRight />
                ) : (
                  <AlignLeft />
                )
              }
            />
          }
        />
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value={style?.align ?? "left"}
            onValueChange={(value) => onFormat({ align: value as NonNullable<CellStyle["align"]> })}
          >
            <DropdownMenuRadioItem value="left">Align left</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="center">Align center</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="right">Align right</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              label="Vertical alignment"
              size="small"
              variant="subtle"
              disabled={disabled}
              icon={
                (style?.verticalAlign ?? (style?.wrap ? "top" : "middle")) === "top" ? (
                  <AlignVerticalJustifyStart />
                ) : style?.verticalAlign === "bottom" ? (
                  <AlignVerticalJustifyEnd />
                ) : (
                  <AlignVerticalJustifyCenter />
                )
              }
            />
          }
        />
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value={style?.verticalAlign ?? (style?.wrap ? "top" : "middle")}
            onValueChange={(value) =>
              onFormat({ verticalAlign: value as NonNullable<CellStyle["verticalAlign"]> })
            }
          >
            <DropdownMenuRadioItem value="top">
              <AlignVerticalJustifyStart />
              Align top
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="middle">
              <AlignVerticalJustifyCenter />
              Align middle
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="bottom">
              <AlignVerticalJustifyEnd />
              Align bottom
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <IconButton
        label="Wrap text"
        icon={<WrapText />}
        size="small"
        variant="subtle"
        isSelected={Boolean(style?.wrap)}
        disabled={disabled}
        onClick={() => onFormat({ wrap: !style?.wrap })}
      />
    </>
  );
}

function WorkbookFontSize({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<number | null>(value);
  const cancelCommit = useRef(false);
  useEffect(() => setDraft(value), [value]);
  return (
    <NumberField
      aria-label="Font size"
      size="small"
      stepperPlacement="around"
      min={8}
      max={72}
      step={1}
      smallStep={1}
      largeStep={4}
      value={draft}
      disabled={disabled}
      style={{ width: `calc(${token("space.1000")} + ${token("space.200")})` }}
      onValueChange={setDraft}
      onFocus={(event) => {
        // Replacing the current font size is the common action. Run after the input's own
        // focus handler so its initial caret placement cannot discard this selection.
        if (event.target instanceof HTMLInputElement) event.target.select();
      }}
      onValueCommitted={(next) => {
        if (cancelCommit.current) {
          cancelCommit.current = false;
          setDraft(value);
          return;
        }
        setDraft(next ?? value);
        if (next !== null && Number.isFinite(next) && next !== value) onChange(next);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        if (event.key === "Escape") {
          cancelCommit.current = true;
          setDraft(value);
        }
        if (event.target instanceof HTMLInputElement) event.target.blur();
        if (event.key === "Escape")
          queueMicrotask(() => {
            cancelCommit.current = false;
          });
      }}
    />
  );
}

const borderPresets: readonly {
  id: BorderPreset;
  label: string;
  icon: ReactElement;
}[] = [
  { id: "all", label: "All borders", icon: <Grid2X2 /> },
  { id: "outside", label: "Outside borders", icon: <Square /> },
  { id: "inside", label: "Inside borders", icon: <Plus /> },
  { id: "none", label: "No borders", icon: <SquareDashed /> },
  { id: "top", label: "Top border", icon: <PanelTop /> },
  { id: "bottom", label: "Bottom border", icon: <PanelBottom /> },
  { id: "left", label: "Left border", icon: <PanelLeft /> },
  { id: "right", label: "Right border", icon: <PanelRight /> },
];

function WorkbookBorders({
  color,
  disabled,
  onApply,
}: {
  color: string;
  disabled: boolean;
  onApply: (preset: BorderPreset, border: CellBorder) => void;
}) {
  const [open, setOpen] = useState(false);
  const [chosenColor, setChosenColor] = useState<string>();
  const [lineStyle, setLineStyle] = useState<CellBorder["style"]>("solid");
  const [lineWidth, setLineWidth] = useState<CellBorder["width"]>(1);
  function apply(preset: BorderPreset, width = lineWidth) {
    const supportedWidth = (
      lineStyle === "dotted" ? 1 : lineStyle === "dashed" ? Math.min(width, 2) : width
    ) as CellBorder["width"];
    onApply(preset, { color: chosenColor ?? color, style: lineStyle, width: supportedWidth });
    setOpen(false);
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <IconButton
            label="Cell borders"
            size="small"
            variant="subtle"
            icon={<Grid2X2 />}
            disabled={disabled}
          />
        }
      />
      <PopoverContent align="start">
        <PopoverTitle>Cell borders</PopoverTitle>
        <Stack space="space.150">
          <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="space.050">
            {borderPresets.map((preset) => (
              <Button
                key={preset.id}
                size="small"
                variant="subtle"
                iconBefore={preset.icon}
                disabled={disabled}
                onClick={() => apply(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
          </Grid>
          <Separator isDecorative />
          <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="space.100">
            <Field>
              <FieldLabel>Border style</FieldLabel>
              <Select
                value={lineStyle}
                disabled={disabled}
                onValueChange={(value) => {
                  if (!value) return;
                  const next = value as CellBorder["style"];
                  setLineStyle(next);
                  setLineWidth(
                    (previous) =>
                      (next === "dotted"
                        ? 1
                        : next === "dashed"
                          ? Math.min(previous, 2)
                          : previous) as CellBorder["width"],
                  );
                }}
              >
                <SelectTrigger size="small">
                  <SelectValue>
                    {lineStyle === "dashed"
                      ? "Dashed"
                      : lineStyle === "dotted"
                        ? "Dotted"
                        : "Solid"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Border width</FieldLabel>
              <Select
                value={String(lineWidth)}
                disabled={disabled}
                onValueChange={(value) =>
                  value && setLineWidth(Number(value) as CellBorder["width"])
                }
              >
                <SelectTrigger size="small">
                  <SelectValue>
                    {lineWidth === 3 ? "Thick" : lineWidth === 2 ? "Medium" : "Thin"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Thin</SelectItem>
                  {lineStyle !== "dotted" ? <SelectItem value="2">Medium</SelectItem> : null}
                  {lineStyle === "solid" ? <SelectItem value="3">Thick</SelectItem> : null}
                </SelectContent>
              </Select>
            </Field>
          </Grid>
          <Field>
            <FieldLabel>Border color</FieldLabel>
            <Input
              type="color"
              size="small"
              value={chosenColor ?? color}
              onValueChange={setChosenColor}
              disabled={disabled}
            />
          </Field>
          <Text size="small" color="color.text.subtle">
            Choose line settings, then apply a border.
          </Text>
          <Button
            size="small"
            variant="subtle"
            iconBefore={<PanelBottom />}
            disabled={disabled}
            disabledReason={lineStyle === "dotted" ? "Dotted borders use a thin line." : undefined}
            onClick={() => apply("bottom", 2)}
          >
            Thick bottom border
          </Button>
        </Stack>
      </PopoverContent>
    </Popover>
  );
}

function WorkbookColorControl({
  label,
  value,
  disabled,
  icon,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  icon: ReactElement;
  onChange: (value: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <IconButton label={label} icon={icon} size="small" variant="subtle" disabled={disabled} />
        }
      />
      <PopoverContent>
        <PopoverTitle>{label}</PopoverTitle>
        <Field>
          <FieldLabel>{label}</FieldLabel>
          <Input type="color" value={value} onValueChange={onChange} />
        </Field>
      </PopoverContent>
    </Popover>
  );
}
