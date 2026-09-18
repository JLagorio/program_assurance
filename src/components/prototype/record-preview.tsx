import {
  createContext,
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
  IconButton,
  PageHeader,
  Stack,
  PreviewNavigation,
  Shell,
  TextLink,
  type DataTableInstance,
  type ShellPanelProps,
} from "@ledger/design-system";
import type { TableName } from "@/lib/models";

export type PreviewRecord = { id: string; [key: string]: unknown };

export type RecordPreviewPanelProps = Omit<ShellPanelProps, "title" | "actions"> & {
  /** The record name, rendered once in the body record header. */
  title: ReactNode;
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
  const [frames, setFrames] = useState<PreviewFrame[]>([]);
  const [targets, setTargets] = useState<ReadonlyMap<string, HTMLDivElement>>(new Map());
  const rootOpener = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLElement>(null);
  const mountedFrames = useRef(new Set<string>());
  const frameRef = useRef(frames);
  frameRef.current = frames;
  const register = useCallback(
    (id: string, parentId: string | null, props: RecordPreviewPanelProps) => {
      const existing = frameRef.current.find((frame) => frame.id === id);
      if (!existing && parentId === null) {
        if (!panel.current?.contains(document.activeElement))
          rootOpener.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
    ...panelProps
  } = current?.props ?? {};
  const close = () => {
    const surface = panel.current;
    const opener = rootOpener.current;
    const restore = current?.parentId === null && surface?.contains(document.activeElement);
    current?.props.onClose();
    // The shell stays mounted across sibling previews, so its original opener may be outdated.
    if (restore)
      requestAnimationFrame(() => {
        if (
          opener?.isConnected &&
          (document.activeElement === document.body || surface?.contains(document.activeElement))
        )
          opener.focus();
      });
  };
  const previousFrame = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    if (previousFrame.current && previousFrame.current !== current?.id) panel.current?.focus();
    previousFrame.current = current?.id;
  }, [current?.id]);
  return (
    <PreviewFrames.Provider value={context}>
      <PreviewTargets.Provider value={targets}>{children}</PreviewTargets.Provider>
      {current && (
        <Shell.Panel {...panelProps} ref={panel} onClose={close}>
          <Shell.Panel.Splitter />
          <Shell.Panel.Header>
            <Shell.Panel.Actions>
              {current.parentId && (
                <IconButton
                  label="Back to previous record"
                  icon={<ArrowLeft />}
                  size="small"
                  variant="subtle"
                  onClick={close}
                />
              )}
              {current.props.navigation}
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
          <Stack space="space.200">
            <PageHeader data-record-preview-header="">
              <PageHeader.Heading>
                <h2 className="min-w-0 break-words font-heading-small font-semibold text-default">
                  {props.title}
                </h2>
              </PageHeader.Heading>
              {props.recordActions && (
                <PageHeader.Actions>{props.recordActions}</PageHeader.Actions>
              )}
            </PageHeader>
            {props.children}
          </Stack>
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

export function RecordPreviewActions<T extends { id: string }>({
  table,
  record,
  rows,
  onSelect,
  destination,
  openLink,
}: {
  table: TableName;
  record: PreviewRecord;
  destination?: ReturnType<typeof recordDestination> | undefined;
  openLink?: ComponentProps<typeof PreviewNavigation>["openLink"] | undefined;
  rows: readonly T[];
  onSelect: (row: T) => void;
}) {
  const index = rows.findIndex((row) => row.id === record.id);
  return (
    <PreviewNavigation
      position={index + 1}
      total={rows.length}
      onPrevious={index > 0 ? () => onSelect(rows[index - 1]!) : undefined}
      onNext={index >= 0 && index < rows.length - 1 ? () => onSelect(rows[index + 1]!) : undefined}
      openLink={
        openLink ?? (
          <Link
            {...(destination ?? recordDestination(table, record))}
            target="_blank"
            rel="noopener noreferrer"
          />
        )
      }
    />
  );
}

/** Publish exactly the table's rendered order, including filters, sorting, paging and tree expansion. */
export function useDisplayedRecords<T extends { id: string }>(
  table: DataTableInstance<T>,
  onChange?: ((rows: T[]) => void) | undefined,
  originals?: ReadonlyMap<string, T>,
) {
  const visible = table
    .getRowModel()
    .rows.filter((row) => !row.getIsGrouped())
    .map((row) => originals?.get(row.id) ?? row.original);
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
