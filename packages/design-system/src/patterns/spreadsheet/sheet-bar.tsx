import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "../../components/context-menu";
import { Reorder, ReorderItem, ReorderHandle, type ReorderChange } from "../reorder";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { ArrowLeft, ArrowRight, ChevronDown, Copy, List, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { Button, IconButton } from "../../components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/dropdown-menu";
import { Scroller, ScrollerArrow, ScrollerViewport } from "../../components/scroller";
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";
import type { SpreadsheetSheet, SpreadsheetSheetAction } from "./types";

export type SpreadsheetSheetBarProps = ComponentProps<"div"> & {
  sheets: readonly SpreadsheetSheet[];
  activeSheetId?: string | undefined;
  onSheetChange?: ((sheetId: string) => void) | undefined;
  onAddSheet?: (() => void) | undefined;
  /** The host determines which actions each sheet permits; absent actions are not shown. */
  getSheetActions?: ((sheetId: string) => readonly SpreadsheetSheetAction[]) | undefined;
  onSheetAction?: ((sheetId: string, actionId: string) => void) | undefined;
  /** Reordering is controlled; the host keeps source sheets and pending drafts protected. */
  onSheetReorder?: ((ids: string[], change: ReorderChange) => void) | undefined;
  isSheetReorderDisabled?: ((sheetId: string) => boolean) | undefined;
  rowCount: number;
  columnCount: number;
  onAddRows?: (() => void) | undefined;
  onAddColumns?: (() => void) | undefined;
  disabled?: boolean | undefined;
  /** Selection summary or pending status, kept beside the dimensions and sheet tools. */
  status?: ReactNode;
};

const actionIcons: Record<string, ReactNode> = {
  rename: <Pencil />,
  duplicate: <Copy />,
  left: <ArrowLeft />,
  "move-left": <ArrowLeft />,
  right: <ArrowRight />,
  "move-right": <ArrowRight />,
  delete: <Trash2 />,
};

function SheetEntry({
  sheet,
  active,
  disabled,
  actions,
  onSelect,
  onAction,
  onKeyDown,
  reorderable,
}: {
  sheet: SpreadsheetSheet;
  reorderable: boolean;
  active: boolean;
  disabled: boolean;
  actions: readonly SpreadsheetSheetAction[];
  onSelect?: (() => void) | undefined;
  onAction?: ((actionId: string) => void) | undefined;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const chosen = useRef(false);
  const [open, setOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const menuItems = () =>
    actions.map((action, index) => (
      <div key={action.id} role="none">
        {action.destructive && index > 0 ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem
          disabled={disabled || action.disabled || !onAction}
          variant={action.destructive ? "danger" : "default"}
          onClick={() => {
            chosen.current = true;
            // Let the menu close before a host opens its rename/delete dialog.
            queueMicrotask(() => onAction?.(action.id));
          }}
        >
          {actionIcons[action.id]}
          {action.label}
        </DropdownMenuItem>
      </div>
    ));
  const finalFocus = () => (chosen.current ? false : button.current);
  const tab = (
    <div
      data-slot="spreadsheet-sheet"
      data-active={active || undefined}
      data-menu-open={open || contextOpen || undefined}
    >
      {reorderable && <ReorderHandle size="xsmall" />}
      <Button
        ref={button}
        data-sheet-id={sheet.id}
        size="small"
        variant="subtle"
        isSelected={active}
        disabled={disabled || !onSelect}
        onClick={onSelect}
        onDoubleClick={() => {
          if (!disabled && actions.some((action) => action.id === "rename" && !action.disabled)) {
            onAction?.("rename");
          }
        }}
        onKeyDown={(event) => {
          if (
            actions.length &&
            (event.key === "ContextMenu" ||
              (event.shiftKey && event.key === "F10") ||
              (event.altKey && event.key === "ArrowDown"))
          ) {
            event.preventDefault();
            event.stopPropagation();
            chosen.current = false;
            setOpen(true);
            return;
          }
          onKeyDown(event);
        }}
        truncate
      >
        {sheet.label}
      </Button>
      {actions.length ? (
        <DropdownMenu
          open={open}
          onOpenChange={(next) => {
            if (next) chosen.current = false;
            setOpen(next);
          }}
        >
          <DropdownMenuTrigger
            render={
              <IconButton
                label={`Sheet actions for ${sheet.label}`}
                icon={<ChevronDown />}
                variant="subtle"
                size="xsmall"
                disabled={disabled}
              />
            }
          />
          <DropdownMenuContent side="top" align="start" finalFocus={finalFocus}>
            {menuItems()}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
  if (!actions.length) return tab;
  return (
    <ContextMenu
      open={!disabled && contextOpen}
      onOpenChange={(next) => {
        if (next) chosen.current = false;
        setContextOpen(next);
      }}
    >
      <ContextMenuTrigger tabIndex={-1} data-slot="spreadsheet-sheet-context">
        {tab}
      </ContextMenuTrigger>
      <ContextMenuContent finalFocus={finalFocus}>{menuItems()}</ContextMenuContent>
    </ContextMenu>
  );
}

/** Pinned workbook controls, scrolling sheet tabs and a compact dimensions/status lane. */
export function SpreadsheetSheetBar({
  sheets,
  activeSheetId,
  onSheetChange,
  onAddSheet,
  getSheetActions,
  onSheetAction,
  onSheetReorder,
  isSheetReorderDisabled,
  rowCount,
  columnCount,
  onAddRows,
  onAddColumns,
  disabled = false,
  status,
  children,
  className,
  ...props
}: SpreadsheetSheetBarProps) {
  const locale = useLedgerLocale();
  const list = useRef<HTMLDivElement>(null);
  function moveFocus(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || event.altKey) return;
    const buttons = Array.from(
      list.current?.querySelectorAll<HTMLButtonElement>("button[data-sheet-id]:not(:disabled)") ??
        [],
    );
    const current = buttons.indexOf(event.currentTarget);
    if (current < 0 || !buttons.length) return;
    event.preventDefault();
    event.stopPropagation();
    const step = (event.key === "ArrowRight" ? 1 : -1) * (locale.direction === "rtl" ? -1 : 1);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (current + step + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }
  return (
    <DirectionProvider direction={locale.direction}>
      <div {...props} data-slot="spreadsheet-sheet-bar" className={cn(className)}>
        <div data-slot="spreadsheet-sheet-controls">
          {onAddSheet ? (
            <IconButton
              label="Add sheet"
              icon={<Plus />}
              size="small"
              variant="subtle"
              disabled={disabled}
              onClick={onAddSheet}
            />
          ) : null}
          {sheets.length ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <IconButton
                    label="All sheets"
                    icon={<List />}
                    size="small"
                    variant="subtle"
                    disabled={disabled || !onSheetChange}
                  />
                }
              />
              <DropdownMenuContent side="top" align="start">
                <DropdownMenuRadioGroup
                  value={activeSheetId ?? ""}
                  onValueChange={(id) => onSheetChange?.(id)}
                >
                  {sheets.map((sheet) => (
                    <DropdownMenuRadioItem key={sheet.id} value={sheet.id}>
                      {sheet.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
        <Scroller orientation="horizontal" scrollOn="click" data-sheet-lane="tabs">
          <ScrollerViewport>
            <Reorder
              items={sheets.map((sheet) => sheet.id)}
              getItemLabel={(id) => sheets.find((sheet) => sheet.id === id)?.label ?? id}
              onReorder={(ids, change) => onSheetReorder?.(ids, change)}
              disabled={disabled || !onSheetReorder}
              orientation="horizontal"
            >
              <div
                ref={list}
                role="group"
                aria-label="Workbook sheets"
                data-slot="spreadsheet-sheets"
              >
                {sheets.map((sheet) => (
                  <ReorderItem
                    key={sheet.id}
                    itemId={sheet.id}
                    disabled={isSheetReorderDisabled?.(sheet.id)}
                  >
                    <SheetEntry
                      reorderable={!!onSheetReorder && !isSheetReorderDisabled?.(sheet.id)}
                      sheet={sheet}
                      active={sheet.id === activeSheetId}
                      disabled={disabled}
                      actions={getSheetActions?.(sheet.id) ?? []}
                      onSelect={onSheetChange ? () => onSheetChange(sheet.id) : undefined}
                      onAction={onSheetAction ? (id) => onSheetAction(sheet.id, id) : undefined}
                      onKeyDown={moveFocus}
                    />
                  </ReorderItem>
                ))}
              </div>
            </Reorder>
          </ScrollerViewport>
          <ScrollerArrow edge="start" aria-label="Scroll sheets toward start" />
          <ScrollerArrow edge="end" aria-label="Scroll sheets toward end" />
        </Scroller>
        <Scroller orientation="horizontal" scrollOn="click" data-sheet-lane="details">
          <ScrollerViewport>
            <div data-slot="spreadsheet-sheet-strip">
              <span data-slot="spreadsheet-dimensions">
                {locale.formatNumber(rowCount)} rows × {locale.formatNumber(columnCount)} columns
              </span>
              {onAddRows ? (
                <Button
                  size="small"
                  variant="subtle"
                  disabled={disabled}
                  onClick={onAddRows}
                  iconBefore={<Plus />}
                >
                  Add rows
                </Button>
              ) : null}
              {onAddColumns ? (
                <Button
                  size="small"
                  variant="subtle"
                  disabled={disabled}
                  onClick={onAddColumns}
                  iconBefore={<Plus />}
                >
                  Add columns
                </Button>
              ) : null}
              {children}
              {status ? <div data-slot="spreadsheet-sheet-status">{status}</div> : null}
            </div>
          </ScrollerViewport>
          <ScrollerArrow edge="start" aria-label="Scroll sheet details toward start" />
          <ScrollerArrow edge="end" aria-label="Scroll sheet details toward end" />
        </Scroller>
      </div>
    </DirectionProvider>
  );
}
