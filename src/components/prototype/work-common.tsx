import { productRecordNoun } from "@/lib/product-records";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Absent,
  Alert,
  AlertAction,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  DateLabel,
  DateTime,
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
  type KeyValueLabelWidth,
} from "@ledger/design-system";
import { ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ProductRecordDialog } from "./product-record-dialog";
import {
  FailureRegionContext,
  useFailureReports,
  useRegionFailures,
  type FailureRegion,
} from "./failure-region";
import { Page } from "@/components/app/shell";
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
  /** The rows shown are the last question's, kept while this one loads (TanStack's `placeholderData: keepPreviousData`). */
  isPlaceholderData?: boolean | undefined;
};

/**
 * A query is loading while it fetches with nothing to show yet. A disabled query, which TanStack
 * keeps pending with an idle fetch status (one that waits on another that failed), is not.
 */
function isQueryLoading(query: QueryStatus) {
  return query.isPending && query.data === undefined && query.fetchStatus !== "idle";
}

/** Each query once, by its refetch: the same query handed over by two blocks is retried once. */
function onceEach(queries: QueryStatus[]) {
  const seen = new Set<QueryStatus["refetch"]>();
  return queries.filter((query) => {
    if (seen.has(query.refetch)) return false;
    seen.add(query.refetch);
    return true;
  });
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
 *
 * With `region`, it is a failure region: every QueryState and ProductCollection drawn inside it
 * hands its failures to this one alert, whose Retry refetches all of them, so one outage reads as
 * one alert per record page or tab, never one per block. A region inside another says its own.
 */
export function QueryState({
  queries: many = [],
  query,
  children,
  retryLabel = "Retry loading",
  shape = "region",
  region = false,
}: {
  queries?: QueryStatus[];
  query?: QueryStatus;
  children?: ReactNode;
  /** Retry's name, when a page has more than one region that can fail on its own. */
  retryLabel?: string | undefined;
  /** What loads: a region (two lines), or a record page (its trail, title and a paragraph). */
  shape?: "region" | "record" | undefined;
  /** Says the failures of every block inside it, once: a record page's or a tab panel's region. */
  region?: boolean | undefined;
}) {
  const queries = query ? [...many, query] : many;
  const own = queries.filter((item) => item.isError);
  const [reported, report] = useFailureReports();
  const probe = useRef<HTMLSpanElement | null>(null);
  const inRegion = useContext(FailureRegionContext) !== null;
  // A region's own queries are said in its own alert; a block inside a region hands them over.
  const [held, attach] = useRegionFailures(region ? [] : own);
  const probeRef = useCallback(
    (node: HTMLSpanElement | null) => {
      probe.current = node;
      attach(node);
    },
    [attach],
  );
  const regionValue = useMemo<FailureRegion>(
    () => ({ container: () => probe.current?.parentElement ?? null, report }),
    [report],
  );
  // What this alert says: a region's own failures and its blocks', each query once (two blocks
  // may read the same one); a held block's, none.
  const failed = region ? onceEach([...own, ...reported]) : held ? [] : own;
  const missing = own.some((item) => item.data === undefined);
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
  const stale = failed.length > 0 && failed.every((item) => item.data !== undefined);
  const body = (
    <>
      {available && restored && <span hidden ref={start} />}
      {available && children}
    </>
  );
  return (
    <>
      {/* Where this state is drawn: a region's container, and what tells a held block from a
          portaled one. Outside any region there is nothing to tell, so nothing is drawn. */}
      {(region || inRegion) && <span hidden ref={probeRef} />}
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
      {/* A block whose region says its failure keeps its place with a quiet line, not a gap. */}
      {held && !region && missing && <Text color="color.text.subtle">Could not load</Text>}
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
      {region ? (
        <FailureRegionContext.Provider value={regionValue}>{body}</FailureRegionContext.Provider>
      ) : (
        body
      )}
    </>
  );
}

/**
 * Hands the failures of reads whose values say "Could not load" in place (QueryValue) to the
 * failure region it is drawn in, and draws nothing there: the region's one alert says them, and
 * its Retry reloads them. Outside a region, or portaled out of one, it is the alert with Retry.
 */
export function ReportFailures({ queries }: { queries: QueryStatus[] }) {
  const failed = queries.filter((query) => query.isError);
  const [held, probe] = useRegionFailures(failed);
  return (
    <>
      <span hidden ref={probe} />
      {!held && failed.length > 0 && <QueryState queries={failed} />}
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
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>{kind}</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      {empty}
    </Page>
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

/** Past this many characters a label outgrows KeyValue's `default` label column. */
const LONG_LABEL = 14;

/**
 * A record's facts as one definition list: one label width, nothing as a labelled Absent. The
 * width is the kit's `default` unless a label is long, when the whole group takes `wide`.
 */
export function DetailFacts({
  facts,
  labelWidth,
}: {
  facts: [string, ReactNode][];
  labelWidth?: KeyValueLabelWidth | undefined;
}) {
  const width =
    labelWidth ?? (facts.some(([name]) => name.length > LONG_LABEL) ? "wide" : undefined);
  return (
    <KeyValue.Group {...(width === undefined ? {} : { labelWidth: width })}>
      {facts.map(([name, value]) => (
        <KeyValue key={name} label={name} wrap>
          {isNothing(value) ? <Absent /> : value}
        </KeyValue>
      ))}
    </KeyValue.Group>
  );
}
/**
 * A record page's one header menu: "Actions" with a chevron, the record's edit first, its other
 * commands after it, and Inspect record (the schema record) last. A viewer and a read-only record
 * keep the menu with Inspect record alone; `children` are drawn as given, so the caller decides
 * who sees a command (Create version, Publish version, Export OSCAL).
 */
export function RecordActions({
  onEdit,
  table,
  id,
  editLabel,
  readOnly = false,
  children,
}: {
  /** Opens the record's edit; without it the menu has no edit. */
  onEdit?: (() => void) | undefined;
  table: string;
  id: string;
  editLabel?: string | undefined;
  readOnly?: boolean | undefined;
  /** The record's other commands, as DropdownMenuItems, between the edit and Inspect record. */
  children?: ReactNode | undefined;
}) {
  const workspace = useWorkspace();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button iconAfter={<ChevronDown />}>Actions</Button>} />
      <DropdownMenuContent align="end">
        {onEdit && !readOnly && workspace.role !== "viewer" && (
          <DropdownMenuItem onClick={onEdit}>
            {editLabel ?? `Edit ${productRecordNoun(table)}`}
          </DropdownMenuItem>
        )}
        {children}
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
 * When work is due, and where it stands: overdue, due today and due soon say so beside the date
 * (the kit's DateLabel) while the work is open. Done work's date reads plainly, and cancelled work's
 * date has no state at all. A task's due, a POA&M milestone's or commitment's planned date.
 */
export function DueDate({
  value,
  done = false,
  cancelled = false,
}: {
  /** The stored day or moment, as it came: anything but a date string reads as no due date. */
  value: unknown;
  /** The work is finished: the date shows plainly. */
  done?: boolean | undefined;
  /** The work will not happen: the date shows with no state. */
  cancelled?: boolean | undefined;
}) {
  const due = typeof value === "string" && value !== "" ? value : null;
  if (cancelled) return <DateTime value={due} format="date" absentLabel="No due date" />;
  return <DateLabel value={due} complete={done} format="date" absentLabel="No due date" />;
}

/**
 * A related revision by its version ("Version 3"), for the revision tables that carry no name
 * (evidence, risk, POA&M and SSP revisions): a Skeleton while it loads, "Could not load" when the
 * lookup fails, and Absent when there is no relationship ("Not recorded") or the revision is
 * missing or hidden ("Not available").
 */
export function VersionName({ table, id }: { table: TableName; id: string | null | undefined }) {
  const query = useRow(table, id);
  if (!id) return <Absent />;
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
  if (row === null) return <Absent label="Not available" />;
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
