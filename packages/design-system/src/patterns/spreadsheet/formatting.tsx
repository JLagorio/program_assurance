import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Bold,
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
import { Button, IconButton } from "../../components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../../components/dropdown-menu";
import { Field, FieldLabel } from "../../components/field";
import { NumberField } from "../../components/number-field";
import { Separator } from "../../components/separator";
import { Input } from "../../components/input";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "../../components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/select";
import { Grid } from "../../primitives/grid";
import { Inline } from "../../primitives/inline";
import { cn } from "../../lib/cn";
import { Stack } from "../../primitives/stack";
import { Text } from "../../primitives/text";
import { token } from "../../generated/tokens";
import type {
  SpreadsheetFormat,
  SpreadsheetBorder,
  SpreadsheetBorderPreset,
  SpreadsheetFormattingProps,
} from "./types";

const formatLabel = (value: string) => value.slice(0, 1).toUpperCase() + value.slice(1);

/** These styles are supported by the workbook model and applied to the selected range. */
export function SpreadsheetFormatting({
  style,
  disabled = false,
  mixed = [],
  numberFormatDisabled = false,
  selectionKey,
  onFormat,
  onBorders,
  className,
  ...props
}: SpreadsheetFormattingProps) {
  const decimals = style?.decimals ?? (style?.format === "percent" ? 1 : 2);
  return (
    <Inline
      {...props}
      className={cn("shrink-0", className)}
      space="space.050"
      alignBlock="center"
      data-slot="spreadsheet-formatting"
    >
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
        value={mixed.includes("format") ? null : (style?.format ?? "general")}
        onValueChange={(value) =>
          value && onFormat({ format: value as NonNullable<SpreadsheetFormat["format"]> })
        }
        disabled={disabled || numberFormatDisabled}
      >
        <SelectTrigger
          size="small"
          aria-label="Number format"
          aria-description={`Current format: ${formatLabel(style?.format ?? "general")}`}
          title={`Number format: ${formatLabel(style?.format ?? "general")}`}
        >
          <SelectValue>{mixed.includes("format") ? "Mixed" : "123"}</SelectValue>
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
              {formatLabel(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Separator orientation="vertical" isDecorative />
      <Select
        value={mixed.includes("fontFamily") ? null : (style?.fontFamily ?? "sans-serif")}
        disabled={disabled}
        onValueChange={(value) => value && onFormat({ fontFamily: value })}
      >
        <SelectTrigger
          size="small"
          aria-label="Font family"
          style={{ width: `calc(${token("space.1000")} + ${token("space.400")})` }}
        >
          <SelectValue>
            {mixed.includes("fontFamily")
              ? "Mixed"
              : style?.fontFamily === "serif"
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
      <FormattingFontSize
        key={selectionKey}
        value={mixed.includes("fontSize") ? null : (style?.fontSize ?? 10)}
        disabled={disabled}
        onChange={(fontSize) => onFormat({ fontSize })}
      />
      <Separator orientation="vertical" isDecorative />
      <IconButton
        label="Bold"
        icon={<Bold />}
        size="small"
        variant="subtle"
        isSelected={!mixed.includes("bold") && Boolean(style?.bold)}
        aria-pressed={mixed.includes("bold") ? "mixed" : Boolean(style?.bold)}
        aria-description={mixed.includes("bold") ? "Mixed selection" : undefined}
        disabled={disabled}
        onClick={() => onFormat({ bold: mixed.includes("bold") || !style?.bold })}
      />
      <IconButton
        label="Italic"
        icon={<Italic />}
        size="small"
        variant="subtle"
        isSelected={!mixed.includes("italic") && Boolean(style?.italic)}
        aria-pressed={mixed.includes("italic") ? "mixed" : Boolean(style?.italic)}
        aria-description={mixed.includes("italic") ? "Mixed selection" : undefined}
        disabled={disabled}
        onClick={() => onFormat({ italic: mixed.includes("italic") || !style?.italic })}
      />
      <IconButton
        label="Underline"
        icon={<Underline />}
        size="small"
        variant="subtle"
        isSelected={!mixed.includes("underline") && Boolean(style?.underline)}
        aria-pressed={mixed.includes("underline") ? "mixed" : Boolean(style?.underline)}
        aria-description={mixed.includes("underline") ? "Mixed selection" : undefined}
        disabled={disabled}
        onClick={() => onFormat({ underline: mixed.includes("underline") || !style?.underline })}
      />
      <IconButton
        label="Strikethrough"
        icon={<Strikethrough />}
        size="small"
        variant="subtle"
        isSelected={!mixed.includes("strikethrough") && Boolean(style?.strikethrough)}
        aria-pressed={mixed.includes("strikethrough") ? "mixed" : Boolean(style?.strikethrough)}
        aria-description={mixed.includes("strikethrough") ? "Mixed selection" : undefined}
        disabled={disabled}
        onClick={() =>
          onFormat({ strikethrough: mixed.includes("strikethrough") || !style?.strikethrough })
        }
      />
      <FormattingColorControl
        label="Text color"
        value={style?.color ?? "#172B4D"}
        disabled={disabled}
        icon={<Baseline />}
        onChange={(color) => onFormat({ color })}
      />
      <FormattingColorControl
        label="Fill color"
        value={style?.background ?? "#FFFFFF"}
        disabled={disabled}
        icon={<PaintBucket />}
        onChange={(background) => onFormat({ background })}
      />
      <Separator orientation="vertical" isDecorative />
      <FormattingBorders
        color={style?.color ?? "#172B4D"}
        disabled={disabled}
        onApply={onBorders}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              label="Text alignment"
              aria-description={mixed.includes("align") ? "Mixed selection" : undefined}
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
            value={mixed.includes("align") ? "" : (style?.align ?? "left")}
            onValueChange={(value) =>
              onFormat({ align: value as NonNullable<SpreadsheetFormat["align"]> })
            }
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
              aria-description={mixed.includes("verticalAlign") ? "Mixed selection" : undefined}
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
            value={
              mixed.includes("verticalAlign")
                ? ""
                : (style?.verticalAlign ?? (style?.wrap ? "top" : "middle"))
            }
            onValueChange={(value) =>
              onFormat({ verticalAlign: value as NonNullable<SpreadsheetFormat["verticalAlign"]> })
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
        isSelected={!mixed.includes("wrap") && Boolean(style?.wrap)}
        aria-pressed={mixed.includes("wrap") ? "mixed" : Boolean(style?.wrap)}
        aria-description={mixed.includes("wrap") ? "Mixed selection" : undefined}
        disabled={disabled}
        onClick={() => onFormat({ wrap: mixed.includes("wrap") || !style?.wrap })}
      />
    </Inline>
  );
}

function FormattingFontSize({
  value,
  disabled,
  onChange,
}: {
  value: number | null;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<number | null>(value);
  const cancelCommit = useRef(false);
  useEffect(() => setDraft(value), [value]);
  return (
    <NumberField
      aria-label="Font size"
      aria-description={value === null ? "Mixed selection" : "Font size in points"}
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
  id: SpreadsheetBorderPreset;
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

function FormattingBorders({
  color,
  disabled,
  onApply,
}: {
  color: string;
  disabled: boolean;
  onApply: (preset: SpreadsheetBorderPreset, border: SpreadsheetBorder) => void;
}) {
  const [open, setOpen] = useState(false);
  const [chosenColor, setChosenColor] = useState<string>();
  const [lineStyle, setLineStyle] = useState<SpreadsheetBorder["style"]>("solid");
  const [lineWidth, setLineWidth] = useState<SpreadsheetBorder["width"]>(1);
  function apply(preset: SpreadsheetBorderPreset, width = lineWidth) {
    const supportedWidth = (
      lineStyle === "dotted" ? 1 : lineStyle === "dashed" ? Math.min(width, 2) : width
    ) as SpreadsheetBorder["width"];
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
                  const next = value as SpreadsheetBorder["style"];
                  setLineStyle(next);
                  setLineWidth(
                    (previous) =>
                      (next === "dotted"
                        ? 1
                        : next === "dashed"
                          ? Math.min(previous, 2)
                          : previous) as SpreadsheetBorder["width"],
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
                  value && setLineWidth(Number(value) as SpreadsheetBorder["width"])
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

function FormattingColorControl({
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
