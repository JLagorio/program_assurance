import { productRecordNoun } from "@/lib/product-records";
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import {
  Absent,
  Alert,
  AlertAction,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
  KeyValue,
  LinkButton,
  PageHeader,
  Skeleton,
  Stack,
  Text,
  TextLink,
  VisuallyHidden,
  announce,
  type EmptyIllustrationKind,
} from "@ledger/design-system";
import { ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ProductRecordDialog } from "./product-record-dialog";
import { useWorkspace } from "@/components/app/workspace";
import { VocabularyValue } from "@/components/app/status";
import { type DataRecord, type RecordValue } from "@/lib/records";
import { neutralVocabulary, vocabularyForValue, type StatusVocabulary } from "@/lib/status";
import { useRow, type TableName } from "@/lib/models";

/**
 * A stored status looked up by its value alone.
 *
 * @deprecated Render `<StatusBadge statuses={…} value={…} />` from `@/components/app/status` with
 * the concept's map from `@/lib/status` (`taskStatuses`, `revisionStates`, …): a value two concepts
 * share ("active", "accepted", "closed") can only be told apart there. Until a caller moves, this
 * draws the same badge (or a level's Indicator) from the first vocabulary that knows the value, or
 * from `statuses` when the caller names it.
 */
export function StatusBadge({
  value,
  statuses,
}: {
  value: string | null | undefined;
  statuses?: StatusVocabulary | undefined;
}) {
  const text = value ? value : null;
  return (
    <VocabularyValue
      values={statuses ?? vocabularyForValue(text) ?? neutralVocabulary([text])}
      value={text}
    />
  );
}

export type QueryStatus = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
  data?: unknown;
  /** TanStack's fetch status. A pending query that is not fetching (disabled, or waiting on
   * another) is not loading. */
  fetchStatus?: "fetching" | "paused" | "idle" | undefined;
  /** A refetch is in flight: Retry shows it. */
  isFetching?: boolean | undefined;
};

/**
 * A query is loading while it fetches with nothing to show yet. A disabled query, which TanStack
 * keeps pending with an idle fetch status (one that waits on another that failed), is not.
 */
function isQueryLoading(query: QueryStatus) {
  return query.isPending && query.data === undefined && query.fetchStatus !== "idle";
}

const HEADINGS = "h1, h2, h3, h4, h5, h6";
const CONTROLS = "a[href], button:not([disabled]), input:not([disabled]), [tabindex='0']";

/** The first element after `start`, among its siblings, that matches: where a region begins. */
function firstAfter(start: Element, selector: string) {
  for (let node = start.nextElementSibling; node; node = node.nextElementSibling) {
    const found = node.matches(selector) ? node : node.querySelector(selector);
    if (found instanceof HTMLElement) return found;
  }
  return null;
}

/**
 * Moves focus to an element that is not a control, such as a heading, when the control that had
 * focus goes away: it takes focus once, and leaves the tab order again when focus moves on.
 */
function focusLanding(target: HTMLElement) {
  if (!target.hasAttribute("tabindex")) {
    target.tabIndex = -1;
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
  }
  target.focus();
}

/**
 * Focus a region that came back: a collection's search, or the region's heading, whichever comes
 * first in `order`; else its first control.
 */
function landIn(region: Element, order: "search" | "heading") {
  const search = region.querySelector<HTMLElement>("input[type='search']");
  const heading = region.querySelector<HTMLElement>(HEADINGS);
  if (search && (order === "search" || !heading)) search.focus();
  else if (heading) focusLanding(heading);
  else region.querySelector<HTMLElement>(CONTROLS)?.focus();
}

/**
 * The state of a region's data: skeleton lines while it first loads (a record page's head with
 * `shape="record"`), one alert with Retry when it fails, and the region itself as soon as it has
 * what it needs. A failed refresh keeps the rows the reader already has, under the alert. After a
 * Retry that brings the region back, focus moves to its first heading and the page says "Records
 * loaded.". A collection passes its queries to ProductCollection (or ModelTable, AssessmentTable)
 * instead, which keeps its toolbar and draws skeleton rows.
 */
export function QueryState({
  queries: many = [],
  query,
  children,
  retryLabel = "Retry loading",
  shape = "region",
}: {
  queries?: QueryStatus[];
  query?: QueryStatus;
  children?: ReactNode;
  /** Retry's name, when a page has more than one region that can fail on its own. */
  retryLabel?: string | undefined;
  /** What loads: a region (two lines), or a record page (its trail, title and a paragraph). */
  shape?: "region" | "record" | undefined;
}) {
  const queries = query ? [...many, query] : many;
  const failed = queries.filter((item) => item.isError);
  const missing = failed.some((item) => item.data === undefined);
  const loading = !missing && queries.some(isQueryLoading);
  const available = !missing && !loading;
  // TanStack keeps isPending false while a failed query refetches; this and isFetching show Retry's.
  const [retrying, setRetrying] = useState(false);
  // Retry leaves with the alert, so a recovered region takes focus at its first heading (or its
  // first control).
  const [restored, setRestored] = useState(false);
  const start = useRef<HTMLSpanElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  // Where the alert stood while a Retry is in flight. A Retry that brings the records back may
  // unmount this state with the alert (a collection that redraws its table): focus then goes to
  // the region's search, or its heading.
  const retryingIn = useRef<HTMLElement | null>(null);
  useEffect(
    () => () => {
      const region = retryingIn.current;
      if (!region) return;
      requestAnimationFrame(() => {
        if (!region.isConnected) return;
        if (document.activeElement && document.activeElement !== document.body) return;
        landIn(region, "search");
      });
    },
    [],
  );
  useEffect(() => {
    // The region's props may catch up after Retry's refetch resolves: wait until it is drawn.
    if (!restored || !available) return;
    setRestored(false);
    retryingIn.current = null;
    if (!start.current) return;
    // The region's own first heading or control; with no children, the region around it.
    const heading = firstAfter(start.current, HEADINGS);
    const control = heading ? null : firstAfter(start.current, CONTROLS);
    if (heading) focusLanding(heading);
    else if (control) control.focus();
    else if (start.current.parentElement) landIn(start.current.parentElement, "heading");
  }, [restored, available]);
  const retry = async () => {
    if (retrying) return;
    setRetrying(true);
    // Set before the refetch: the records can come back, and this state go, before it resolves.
    retryingIn.current = alertRef.current?.parentElement ?? null;
    try {
      const results = await Promise.all(failed.map((item) => item.refetch()));
      const recovered = results.every(
        (result) =>
          !(result && typeof result === "object" && "isError" in result && result.isError),
      );
      if (recovered) {
        announce("Records loaded.");
        setRestored(true);
      } else retryingIn.current = null;
    } finally {
      setRetrying(false);
    }
  };
  const first = failed[0];
  const detail = first?.error instanceof Error ? first.error.message : "Try again in a moment.";
  const stale = failed.length > 0 && !missing;
  return (
    <>
      {first && (
        <Alert ref={alertRef} variant="destructive" role="alert">
          <AlertIcon />
          <AlertTitle>
            {stale ? "Records could not be refreshed" : "Records could not be loaded"}
          </AlertTitle>
          <AlertDescription>
            {stale && "Showing the last loaded records. "}
            {detail}
          </AlertDescription>
          <AlertAction>
            <Button
              size="small"
              isLoading={retrying || failed.some((item) => item.isFetching)}
              onClick={() => void retry()}
            >
              {retryLabel}
            </Button>
          </AlertAction>
        </Alert>
      )}
      {loading &&
        (shape === "record" ? (
          <Stack space="space.150" aria-busy="true">
            <Skeleton width="30%" />
            <Skeleton shape="heading" width="60%" />
            <Skeleton lines={3} />
            <VisuallyHidden role="status">Loading record…</VisuallyHidden>
          </Stack>
        ) : (
          <Stack space="space.100" aria-busy="true">
            <Skeleton lines={2} />
            <VisuallyHidden role="status">Loading records…</VisuallyHidden>
          </Stack>
        ))}
      {available && restored && <span hidden ref={start} />}
      {available && children}
    </>
  );
}

/**
 * A region with nothing in it: a record body's section, a derived list. A collection's empty is its
 * DataTable's; this is for the region that is not a table.
 */
export function EmptyMessage({
  title,
  description,
  compact = false,
  illustration,
  action,
}: {
  title: string;
  description?: string;
  compact?: boolean;
  /** The picture, on a region large enough for one. */
  illustration?: EmptyIllustrationKind | undefined;
  /** The one way to fill it, when the reader can. */
  action?: ReactNode;
}) {
  return (
    <Empty size={compact ? "compact" : "default"} frame="none">
      {illustration && (
        <EmptyMedia aria-hidden>
          <EmptyIllustration kind={illustration} />
        </EmptyMedia>
      )}
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}

const missingRecordDestinations = {
  "/": "Open workspace",
  "/work": "Open my work",
  "/programs": "Open programs",
  "/campaigns": "Open assessment campaigns",
  "/findings": "Open findings and assets",
  "/register": "Open POA&M and risk register",
  "/packages": "Open authorization packages",
  "/profiles": "Open profiles",
  "/library/components": "Open components",
  "/library/products": "Open products",
  "/library/requirements": "Open requirements",
} as const;

export function MissingRecord({
  kind,
  description = "This record is unavailable in the current workspace.",
  backTo = "/",
  back,
  inline = false,
}: {
  kind: string;
  description?: string;
  backTo?: keyof typeof missingRecordDestinations;
  /**
   * A way back the fixed list does not hold, in place of `backTo`: the record the missing one
   * belongs to, such as a program's System tab for a missing system. Its words, and the router
   * Link that goes there: `{ label: "Open the program’s systems", link: <Link to=… params=… /> }`.
   */
  back?: { label: string; link: ReactElement } | undefined;
  /** Inside a tab or a panel that already has its heading: the Empty alone, at the outline's level. */
  inline?: boolean;
}) {
  const empty = (
    <Empty>
      <EmptyMedia aria-hidden>
        <EmptyIllustration kind="search" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{kind} not found</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <LinkButton variant="primary" render={back?.link ?? <Link to={backTo} />}>
          {back?.label ?? missingRecordDestinations[backTo]}
        </LinkButton>
      </EmptyContent>
    </Empty>
  );
  if (inline) return empty;
  return (
    <Stack space="space.200">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>{kind}</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      {empty}
    </Stack>
  );
}
export type FormTarget = {
  table: TableName;
  operationLabel?: string | undefined;
  existing?: DataRecord;
  initialValues?: Record<string, RecordValue>;
};
export function ModelForm({
  target,
  onClose,
  onSaved,
}: {
  target: FormTarget;
  onClose: () => void;
  onSaved?: (record: DataRecord) => void | Promise<void>;
}) {
  return (
    <ProductRecordDialog
      table={target.table}
      operationLabel={target.operationLabel}
      existing={target.existing}
      initialValues={target.initialValues}
      onSaved={onSaved}
      onClose={onClose}
    />
  );
}

export function SchemaLink({
  table,
  id,
  children = "Inspect record",
}: {
  table: string;
  id: string;
  children?: ReactNode;
}) {
  return (
    <TextLink
      size="small"
      render={
        <Link to="/records/$collection/$recordId" params={{ collection: table, recordId: id }} />
      }
    >
      {children}
    </TextLink>
  );
}

const isNothing = (value: ReactNode) =>
  value === null || value === undefined || value === false || value === "";

/** A label the kit's 104px column cuts ("Acceptance criterion", "Configuration baseline"). */
const LONG_LABEL = 14;

/**
 * A record's facts as one definition list: one label width, nothing as a labelled Absent. The
 * width is the kit's unless a label is long, when the whole group takes 160 so no label is cut.
 */
export function DetailFacts({
  facts,
  labelWidth,
}: {
  facts: [string, ReactNode][];
  labelWidth?: number | undefined;
}) {
  const width = labelWidth ?? (facts.some(([name]) => name.length > LONG_LABEL) ? 160 : undefined);
  return (
    <KeyValue.Group {...(width === undefined ? {} : { labelWidth: width })}>
      {facts.map(([name, value]) => (
        <KeyValue key={name} label={name} wrap>
          {isNothing(value) ? <Absent label="Not recorded" /> : value}
        </KeyValue>
      ))}
    </KeyValue.Group>
  );
}
export function RecordActions({
  onEdit,
  table,
  id,
  editLabel,
  readOnly = false,
}: {
  onEdit: () => void;
  table: string;
  id: string;
  editLabel?: string;
  readOnly?: boolean;
}) {
  const workspace = useWorkspace();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button iconAfter={<ChevronDown />}>Actions</Button>} />
      <DropdownMenuContent align="end">
        {!readOnly && workspace.role !== "viewer" && (
          <DropdownMenuItem onClick={onEdit}>
            {editLabel ?? `Edit ${productRecordNoun(table)}`}
          </DropdownMenuItem>
        )}
        <DropdownMenuLinkItem
          closeOnClick
          render={
            <Link
              to="/records/$collection/$recordId"
              params={{ collection: table, recordId: id }}
            />
          }
        >
          Inspect record
        </DropdownMenuLinkItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * A related revision by its version ("Version 3"), for the revision tables that carry no name
 * (evidence, risk, POA&M and SSP revisions): a Skeleton while it loads, "Could not load" when the
 * lookup fails, "Not available" when it is missing, and Absent when there is no relationship.
 */
export function VersionName({ table, id }: { table: TableName; id: string | null | undefined }) {
  const query = useRow(table, id);
  if (!id) return <Absent label="Not recorded" />;
  const row = query.data as unknown as DataRecord | null | undefined;
  if (row === undefined && query.isError)
    return <Text color="color.text.subtle">Could not load</Text>;
  if (row === undefined)
    return (
      <>
        <Skeleton shape="line" width={64} />
        <VisuallyHidden>Loading</VisuallyHidden>
      </>
    );
  if (row === null) return <Text color="color.text.subtle">Not available</Text>;
  const version = row["version_number"];
  const name = row["title"] ?? row["name"];
  return (
    <>
      {typeof version === "number"
        ? `Version ${version}`
        : typeof name === "string"
          ? name
          : "Revision"}
    </>
  );
}
