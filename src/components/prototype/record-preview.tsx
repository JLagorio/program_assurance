import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { ArrowLeft } from "lucide-react";
import { Link, linkOptions } from "@tanstack/react-router";
import { createPortal } from "react-dom";
import {
  HeadingLevelProvider,
  IconButton,
  PageHeader,
  Stack,
  PreviewNavigation,
  Shell,
  TextLink,
  displayedRows,
  showRow,
  useLedgerLocale,
  type DataTableInstance,
  type ShellPanelProps,
} from "@ledger/design-system";
import type { TableName } from "@/lib/models";

export type PreviewRecord = { id: string; [key: string]: unknown };

export type RecordPreviewPanelProps = Omit<ShellPanelProps, "title" | "actions"> & {
  /** The record name, rendered once in the body record header. */
  title: ReactNode;
  /**
   * The panel's name: the record type, then "preview" ("Operational issue preview"), or the task
   * for a panel that is not a collection preview. It is drawn in sentence case, and Close and the
   * splitter are named after it.
   */
  label?: string | undefined;
  /** Global record navigation only: previous, next and open full record. */
  navigation: ReactNode;
  /** Record commands in the body header: one primary and an overflow menu. */
  recordActions?: ReactNode;
};
type PreviewFrame = { id: string; parentId: string | null; props: RecordPreviewPanelProps };
const PreviewFrames = createContext<{
  register: (id: string, parentId: string | null, props: RecordPreviewPanelProps) => void;
  remove: (id: string) => void;
  setTarget: (id: string, element: HTMLDivElement | null) => void;
} | null>(null);
const PreviewParent = createContext<string | null>(null);
const PreviewTargets = createContext<ReadonlyMap<string, HTMLDivElement>>(new Map());
/**
 * What the header's navigation knows about the frame it steps through: the frame's name, said with
 * its position, and `show`, where it reports the record it shows so Close can return focus to it.
 */
const PreviewShown = createContext<{
  title: string | undefined;
  show: (id: string) => void;
} | null>(null);

const MAIN = '[data-shell-area="main"]';

/** The words a title renders, for what is said about it; a part that draws its own words says nothing. */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((item: ReactNode) => textOf(item)).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/** A panel's name in sentence case, whatever case its record noun came in. */
const sentence = (label: string) => label.charAt(0).toLocaleUpperCase() + label.slice(1);

/**
 * The shown record's own control in the collection, where Close returns focus: its eye, else its
 * name. A row in a hidden tab is passed over; Main itself may still be covered by a phone's panel,
 * and Shell focuses the control once it shows again.
 */
function recordControl(id: string | null): HTMLElement | null {
  if (!id) return null;
  const rows = document.querySelectorAll<HTMLElement>(
    `${MAIN} tr[data-row-id="${CSS.escape(id)}"]`,
  );
  for (const row of rows) {
    if (row.closest("[hidden]")) continue;
    const control =
      row.querySelector<HTMLElement>("button[aria-pressed]") ??
      row.querySelector<HTMLElement>("a[href]");
    if (control) return control;
  }
  return null;
}

function PreviewFrameSlot({ id, hidden }: { id: string; hidden: boolean }) {
  const host = useContext(PreviewFrames);
  const target = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    host?.setTarget(id, target.current);
    return () => host?.setTarget(id, null);
  }, [host, id]);
  return <div ref={target} hidden={hidden} />;
}

/** One application host keeps sibling and linked-record previews in the same shell surface. */
export function RecordPreviewProvider({ children }: { children: ReactNode }) {
  const { t } = useLedgerLocale();
  const [frames, setFrames] = useState<PreviewFrame[]>([]);
  const [targets, setTargets] = useState<ReadonlyMap<string, HTMLDivElement>>(new Map());
  const panel = useRef<HTMLElement>(null);
  // The control inside the panel that opened each nested frame, so Back returns to it.
  const nestedOpeners = useRef(new Map<string, HTMLElement>());
  const returnTo = useRef<HTMLElement | null>(null);
  // The record the root frame shows, as its navigation last reported it, so Close returns focus to
  // that record's row: after previous and next, the reader is on that row, not on the one they opened.
  const rootRecord = useRef<string | null>(null);
  const mountedFrames = useRef(new Set<string>());
  const frameRef = useRef(frames);
  frameRef.current = frames;
  const register = useCallback(
    (id: string, parentId: string | null, props: RecordPreviewPanelProps) => {
      const existing = frameRef.current.find((frame) => frame.id === id);
      const focused = document.activeElement;
      if (!existing && parentId !== null && focused instanceof HTMLElement)
        if (panel.current?.contains(focused)) nestedOpeners.current.set(id, focused);
      if (!existing && parentId === null) {
        rootRecord.current = null;
        // A different register replaces the root preview and clears its selection.
        // Unmounted frames may still be in the queued state during a record-type switch.
        for (const frame of frameRef.current)
          if (frame.parentId === null && mountedFrames.current.has(frame.id)) frame.props.onClose();
      }
      mountedFrames.current.add(id);
      setFrames((previous) => {
        const present = previous.find((frame) => frame.id === id);
        if (present?.props === props) return previous;
        if (present)
          return previous.map((frame) => (frame.id === id ? { id, parentId, props } : frame));
        return [...(parentId === null ? [] : previous), { id, parentId, props }];
      });
    },
    [],
  );
  const remove = useCallback((id: string) => {
    mountedFrames.current.delete(id);
    nestedOpeners.current.delete(id);
    setFrames((previous) => {
      const removed = new Set([id]);
      for (const frame of previous)
        if (frame.parentId && removed.has(frame.parentId)) removed.add(frame.id);
      return previous.some((frame) => removed.has(frame.id))
        ? previous.filter((frame) => !removed.has(frame.id))
        : previous;
    });
  }, []);
  const setTarget = useCallback((id: string, element: HTMLDivElement | null) => {
    setTargets((previous) => {
      if (previous.get(id) === element || (!element && !previous.has(id))) return previous;
      const next = new Map(previous);
      if (element) next.set(id, element);
      else next.delete(id);
      return next;
    });
  }, []);
  const context = useMemo(() => ({ register, remove, setTarget }), [register, remove, setTarget]);
  const current = frames.at(-1);
  const {
    title: _title,
    navigation: _navigation,
    recordActions: _recordActions,
    children: _children,
    label,
    finalFocus,
    ...panelProps
  } = current?.props ?? {};
  // Close and Escape end the whole preview from any frame: the nested frames close first and the
  // root last. Shell.Panel then returns focus to the shown record's row in the collection (below),
  // else to the control the reader last used in Main.
  const close = () => {
    for (const frame of [...frameRef.current].reverse()) frame.props.onClose();
  };
  // Back is the one way to leave a single frame: it shows the parent frame again and returns focus
  // to the control in it that opened the nested one.
  const back = () => {
    if (!current?.parentId) return;
    returnTo.current = nestedOpeners.current.get(current.id) ?? null;
    current.props.onClose();
  };
  const returnFocus = useCallback(() => {
    const id = rootRecord.current;
    const control = recordControl(id);
    if (!id) return true;
    // The row may be drawn a few frames later: a table that was hidden under a phone's panel, or
    // one that draws only the rows in view, draws them again once Main shows, and the control
    // found now may be replaced as it does. Until focus lands somewhere, keep looking for the row's
    // control for a moment and focus it. The first look runs before Shell's own return, so Shell
    // returns to the control the reader last used only when the row is not there.
    let frames = 0;
    const settle = () => {
      const active = document.activeElement;
      if (active && active !== document.body && active.isConnected) return;
      const later = recordControl(id);
      if (later) later.focus();
      else if (++frames < 30) requestAnimationFrame(settle);
    };
    requestAnimationFrame(settle);
    return control ?? true;
  }, []);
  // The header's navigation names the record it announces from the frame's title, and reports the
  // root frame's record for Close.
  const titleText = current ? textOf(current.props.title).trim() || undefined : undefined;
  const isRoot = current !== undefined && current.parentId === null;
  const shown = useMemo(
    () => ({
      title: titleText,
      show: (id: string) => {
        if (isRoot) rootRecord.current = id;
      },
    }),
    [titleText, isRoot],
  );
  const previousFrame = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    if (!current) returnTo.current = null;
    else if (previousFrame.current && previousFrame.current !== current.id) {
      const opener = returnTo.current;
      returnTo.current = null;
      // Previous and Next sit in the panel's header, which stays while a preview swaps its frame:
      // focus stays on the control the reader pressed instead of jumping to the panel.
      const focused = document.activeElement;
      const header = panel.current?.querySelector('[data-slot="shell-panel-header"]');
      const inHeader = focused instanceof HTMLElement && !!header?.contains(focused);
      if (opener?.isConnected && panel.current?.contains(opener)) opener.focus();
      else if (!inHeader) panel.current?.focus();
    }
    previousFrame.current = current?.id;
  }, [current]);
  return (
    <PreviewFrames.Provider value={context}>
      <PreviewTargets.Provider value={targets}>{children}</PreviewTargets.Provider>
      {current && (
        <Shell.Panel
          {...panelProps}
          label={label ? sentence(label) : "Record preview"}
          finalFocus={finalFocus ?? returnFocus}
          ref={panel}
          onClose={close}
        >
          <Shell.Panel.Splitter />
          <Shell.Panel.Header>
            <Shell.Panel.Actions>
              {current.parentId && (
                <IconButton
                  label={t("backToPreviousRecord")}
                  icon={<ArrowLeft className="rtl:rotate-180" />}
                  size="small"
                  variant="subtle"
                  onClick={back}
                />
              )}
              <PreviewShown.Provider value={shown}>
                {current.props.navigation}
              </PreviewShown.Provider>
            </Shell.Panel.Actions>
            <Shell.Panel.Close />
          </Shell.Panel.Header>
          <Shell.Panel.Body>
            {frames.map((frame) => (
              <PreviewFrameSlot key={frame.id} id={frame.id} hidden={frame.id !== current.id} />
            ))}
          </Shell.Panel.Body>
        </Shell.Panel>
      )}
    </PreviewFrames.Provider>
  );
}

/** A preview contributes a frame; linked previews preserve their parent's state for Back. */
export function RecordPreviewPanel(props: RecordPreviewPanelProps) {
  const host = useContext(PreviewFrames);
  const parentId = useContext(PreviewParent);
  const targets = useContext(PreviewTargets);
  const id = useId();
  useLayoutEffect(() => {
    host?.register(id, parentId, props);
  }, [host, id, parentId, props]);
  useLayoutEffect(() => () => host?.remove(id), [host, id]);
  // Standalone examples retain the same behavior without requiring the application's shell host.
  if (!host)
    return (
      <RecordPreviewProvider>
        <RecordPreviewPanel {...props} />
      </RecordPreviewProvider>
    );
  const target = targets.get(id);
  // A portal preserves the originating route and workflow contexts while the shell owns placement.
  return target
    ? createPortal(
        <PreviewParent.Provider value={id}>
          {/* The panel's outline starts at 2 wherever the preview was rendered from: the record's
              name is the h2 and the body's headings sit one level below it. */}
          <HeadingLevelProvider level={2}>
            <Stack space="space.200">
              <PageHeader data-record-preview-header="">
                <PageHeader.Heading>
                  <PageHeader.Title>{props.title}</PageHeader.Title>
                </PageHeader.Heading>
                {props.recordActions && (
                  <PageHeader.Actions>{props.recordActions}</PageHeader.Actions>
                )}
              </PageHeader>
              <HeadingLevelProvider>{props.children}</HeadingLevelProvider>
            </Stack>
          </HeadingLevelProvider>
        </PreviewParent.Provider>,
        target,
      )
    : null;
}

/** Only destinations backed by an existing record route; all other models have a schema record. */
export function recordDestination(table: TableName, record: PreviewRecord) {
  const id = record.id;
  const programId = typeof record["program_id"] === "string" ? record["program_id"] : undefined;
  switch (table) {
    case "programs":
      return linkOptions({ to: "/programs/$programId", params: { programId: id } });
    case "tasks":
      return linkOptions({ to: "/tasks/$taskId", params: { taskId: id } });
    case "workstreams":
      return linkOptions({ to: "/workstreams/$workstreamId", params: { workstreamId: id } });
    case "assessment_campaigns":
      return linkOptions({ to: "/campaigns/$campaignId", params: { campaignId: id } });
    case "assessment_findings":
      return linkOptions({ to: "/findings/$findingId", params: { findingId: id } });
    case "inventory_items":
      return linkOptions({ to: "/findings/assets/$assetId", params: { assetId: id } });
    case "operational_issues":
      return linkOptions({ to: "/issues/$issueId", params: { issueId: id } });
    case "risks":
      return linkOptions({ to: "/register/risks/$riskId", params: { riskId: id } });
    case "poam_items":
      return linkOptions({ to: "/register/poam/$poamId", params: { poamId: id } });
    case "poam_documents":
      return linkOptions({ to: "/poam-documents/$documentId", params: { documentId: id } });
    case "authorization_packages":
      return linkOptions({ to: "/packages/$pkgId", params: { pkgId: id } });
    case "component_definitions":
      return linkOptions({ to: "/library/components/$componentKey", params: { componentKey: id } });
    case "products":
      return linkOptions({ to: "/library/products/$productKey", params: { productKey: id } });
    case "requirement_definitions":
      return linkOptions({
        to: "/library/requirements/$definitionKey",
        params: { definitionKey: id },
      });
    case "profiles":
      return linkOptions({ to: "/profiles/$profileId", params: { profileId: id } });
    case "systems":
      if (programId)
        return linkOptions({
          to: "/programs/$programId/systems/$scopeId",
          params: { programId, scopeId: id },
        });
      break;
    case "system_components":
      if (programId)
        return linkOptions({
          to: "/programs/$programId/components/$componentId",
          params: { programId, componentId: id },
        });
      break;
    case "engineering_requirements":
      if (programId)
        return linkOptions({
          to: "/programs/$programId/requirements/$requirementId",
          params: { programId, requirementId: id },
        });
      break;
    // A control the program has implemented opens its control record, with its narrative.
    case "implemented_requirements":
      if (programId)
        return linkOptions({
          to: "/programs/$programId/controls/$controlId",
          params: { programId, controlId: id },
        });
      break;
  }
  return linkOptions({
    to: "/records/$collection/$recordId",
    params: { collection: table, recordId: id },
  });
}

export function RecordLink({
  table,
  record,
  children,
}: {
  table: TableName;
  record: PreviewRecord;
  children: ReactNode;
}) {
  return (
    <TextLink
      render={
        <Link {...recordDestination(table, record)} onClick={(event) => event.stopPropagation()} />
      }
    >
      {children}
    </TextLink>
  );
}

/** A record's own name, for what is said about it when its frame's title draws no plain words. */
function recordName(record: PreviewRecord): string | undefined {
  for (const key of ["name", "title", "code"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  if (typeof record["version_number"] === "number") return `Version ${record["version_number"]}`;
  return undefined;
}

/**
 * Previous, next, the announced record and position, and the full record in a new tab. `rows` are
 * the collection's displayed rows from `useDisplayedRecords`, across every page, so a step can
 * cross a page and the table turns to it.
 */
export function RecordPreviewActions<T extends { id: string }>({
  table,
  record,
  rows,
  onSelect,
  destination,
  openLink,
  recordLabel,
}: {
  table: TableName;
  record: PreviewRecord;
  destination?: ReturnType<typeof recordDestination> | undefined;
  /** The full-record link; `false` for a preview inside a selection task, which opens no record. */
  openLink?: ComponentProps<typeof PreviewNavigation>["openLink"] | false | undefined;
  rows: readonly T[];
  onSelect: (row: T) => void;
  /** What is announced with the position; by default the frame's title, else the record's name. */
  recordLabel?: string | undefined;
}) {
  const shown = useContext(PreviewShown);
  const show = shown?.show;
  useLayoutEffect(() => {
    show?.(record.id);
  }, [show, record.id]);
  const index = rows.findIndex((row) => row.id === record.id);
  return (
    <PreviewNavigation
      position={index + 1}
      total={rows.length}
      recordLabel={recordLabel ?? shown?.title ?? recordName(record)}
      onPrevious={index > 0 ? () => onSelect(rows[index - 1]!) : undefined}
      onNext={index >= 0 && index < rows.length - 1 ? () => onSelect(rows[index + 1]!) : undefined}
      openLink={
        openLink === false
          ? undefined
          : (openLink ?? (
              <Link
                {...(destination ?? recordDestination(table, record))}
                target="_blank"
                rel="noopener noreferrer"
              />
            ))
      }
    />
  );
}

/**
 * Ends what a collection has open beside it (its preview) when a retained tab hides it, so the
 * preview never comes back over another tab, or takes focus from the tab strip when the reader
 * returns. Call it with the setter that closes the preview: `useEndOnHide(() => setPreview(null))`.
 */
export function useEndOnHide(end: () => void) {
  const latest = useRef(end);
  latest.current = end;
  useEffect(() => () => latest.current(), []);
}

/**
 * A confirmed removal takes the row, and the menu that asked, out of the table, and focus would
 * fall to the page. Call `removed(id)` when the removal succeeds; once `rows` no longer holds that
 * row and the confirmation has let go of focus, `target` (the collection's primary) takes it.
 */
export function useRemovalFocus(rows: readonly { id: string }[]) {
  const target = useRef<HTMLElement | null>(null);
  const pending = useRef<string | null>(null);
  const signature = rows.map((row) => row.id).join("|");
  const current = useRef(rows);
  current.current = rows;
  useEffect(() => {
    const id = pending.current;
    if (!id || current.current.some((row) => row.id === id)) return;
    pending.current = null;
    let tries = 0;
    let frame = 0;
    // Wait for the confirmation to let go of focus and for a preview covering the collection (a
    // phone's full-screen panel) to close: until then the target is inert and focus() does nothing.
    const settle = () => {
      const active = document.activeElement;
      if (active && active !== document.body && !active.closest('[role="alertdialog"]')) return;
      if (!active || active === document.body) {
        target.current?.focus();
        if (target.current && document.activeElement === target.current) return;
      }
      if (tries++ < 60) frame = requestAnimationFrame(settle);
    };
    frame = requestAnimationFrame(settle);
    return () => cancelAnimationFrame(frame);
  }, [signature]);
  return {
    target,
    removed: (id: string) => {
      pending.current = id;
    },
  };
}

/**
 * Brings the shown record's row into view in each scroller that holds it, clear of the scroller's
 * padding (a table frame's sticky header, Main's top nav). Up and down only: a wide row's sideways
 * scroll stays where the reader left it. A row in a hidden tab, or under a phone's panel, is left.
 */
function revealRow(id: string) {
  const rows = [
    ...document.querySelectorAll<HTMLElement>(`tr[data-row-id="${CSS.escape(id)}"]`),
  ].filter((row) => row.getClientRects().length > 0);
  const row = rows.find((item) => item.querySelector('button[aria-pressed="true"]')) ?? rows[0];
  if (!row) return;
  const root = document.scrollingElement;
  for (let node = row.parentElement; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (node !== root && !/auto|scroll/.test(style.overflowY)) continue;
    if (node.scrollHeight <= node.clientHeight + 1) continue;
    const box =
      node === root ? { top: 0, bottom: window.innerHeight } : node.getBoundingClientRect();
    const rect = row.getBoundingClientRect();
    const top = box.top + (parseFloat(style.scrollPaddingTop) || 0);
    const bottom = box.bottom - (parseFloat(style.scrollPaddingBottom) || 0);
    if (rect.top < top) node.scrollTop -= top - rect.top;
    else if (rect.bottom > bottom) node.scrollTop += Math.min(rect.bottom - bottom, rect.top - top);
  }
}

/**
 * Publish the rows the reader can reach, in the table's order, on every page: the search, filters,
 * sort and tree expansion decide, the page does not. When the table's active row (the preview's
 * record) changes, as Next or Previous steps, the table turns to the page that holds it and the
 * row scrolls into view, so it stays on screen and marked; paging by hand leaves the preview where
 * it is. The table keeps its page only while its `data` keeps its identity: a caller that rebuilds
 * it on every render (inline columns into ModelTable) sends the table back to page 1, so keep
 * `data` memoized.
 */
export function useDisplayedRecords<T extends { id: string }>(
  table: DataTableInstance<T>,
  onChange?: ((rows: T[]) => void) | undefined,
  originals?: ReadonlyMap<string, T>,
) {
  const rows = displayedRows(table);
  const visible = rows.map((row) => originals?.get(row.id) ?? row.original);
  // The active row, from the table's `preview` or its id column's `active`, as the eye reads it.
  const own = table.options.meta?.preview;
  const isActive = own
    ? undefined
    : table.getAllLeafColumns().find((column) => column.columnDef.meta?.preview)?.columnDef.meta
        ?.active;
  const activeId = own
    ? (own.activeId ?? null)
    : isActive
      ? (rows.find((row) => isActive(row.original as never))?.id ?? null)
      : null;
  // Keyed on the record alone: the table object is new on every render, and a page the reader
  // turns while the preview is open must stay turned.
  const latestTable = useRef(table);
  latestTable.current = table;
  useLayoutEffect(() => {
    if (!activeId) return;
    showRow(latestTable.current, activeId);
    // The page turn draws before the next frame; the row is on the page by then.
    const frame = requestAnimationFrame(() => revealRow(activeId));
    return () => cancelAnimationFrame(frame);
  }, [activeId]);
  const signature = JSON.stringify(
    visible.map((row) => [row.id, "revision" in row ? row.revision : null]),
  );
  const callback = useRef(onChange);
  callback.current = onChange;
  const current = useRef(visible);
  current.current = visible;
  useEffect(() => {
    callback.current?.(current.current);
  }, [signature]);
  return visible;
}
