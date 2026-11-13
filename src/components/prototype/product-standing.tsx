import { useCallback, useMemo, type ReactElement, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Absent,
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  DateTime,
  Grid,
  Heading,
  Inline,
  KeyValue,
  LinkButton,
  Section,
  Stack,
  Stat,
  Tally,
  Text,
  TileMap,
  TileMapKey,
  ToggleGroup,
  ToggleGroupItem,
  Tray,
  defineColumns,
  useLedgerLocale,
  type TallySegment,
  type TileMapGroup,
  type TileMapKeyItem,
  type TileMapMark,
} from "@ledger/design-system";
import {
  PRODUCT_CONTROL_STATUS_ORDER,
  controlFamilies,
  productScopeStatus,
  useProductControlStatus,
  type ProductControlCounts,
  type ProductControlStanding,
  type ProductControlStatus,
  type ProductControlStatusAnswer,
} from "@/lib/product-assurance";
import { registerViews } from "@/lib/register-views";
import { productControlStatuses } from "@/lib/status";
import { questionSearch, useCollectionTable } from "./collection-question";
import { RelationName } from "./record-tools";
import { BaselineName } from "./product-assessment";
import { ProductCollection } from "./product-collection";
import { RecordLink, useOpenRecord } from "./record-preview";
import { EmptyMessage, QueryState } from "./work-common";

/*
 * What a product gives off the shelf: each control of the baseline it was assessed against, for
 * its core (the elements every configuration includes) and for each configuration, as
 * `product_control_status` answers it. The product's Overview counts it in one tray; its Assessment
 * tab draws a card a configuration and lists the controls with a status a configuration, so a
 * reader sees what holds whatever a program takes and what depends on the configuration.
 */

/**
 * How each status is drawn, once. An assessor's determinations are the three bold tones; a control
 * an element claims that nobody judged is a pale step; a control nothing of the scope claims is
 * hollow: the program that takes the configuration owes it.
 */
const marks = {
  satisfied: { tone: "success", fill: "solid" },
  partially_satisfied: { tone: "warning", fill: "solid" },
  other_than_satisfied: { tone: "danger", fill: "solid" },
  not_assessed: { tone: "sequential.2", fill: "solid" },
  not_covered: { tone: "neutral", fill: "outline" },
} as const satisfies Record<ProductControlStatus, Pick<TileMapMark, "tone" | "fill">>;

/** The key's order: what an assessor decided first, then what waits and what is not covered. */
const KEY_ORDER = [...PRODUCT_CONTROL_STATUS_ORDER].reverse();

/** A scope of the product: its core, or one configuration by id. */
type Scope = {
  id: "core" | (string & {});
  name: string;
  elements: number;
  counts: ProductControlCounts;
};

const scopesOf = (answer: ProductControlStatusAnswer): Scope[] => [
  { id: "core", name: "Core", elements: answer.core.elements, counts: answer.core.counts },
  ...answer.configurations.map((configuration) => ({
    id: configuration.id,
    name: `${configuration.code} ${configuration.name}`,
    elements: configuration.elements,
    counts: configuration.counts,
  })),
];

const familyName = (code: string | null, title: string | null) =>
  [code ?? "Other", title].filter(Boolean).join(" ");

/** Controls no configuration covers: every program that takes the product owes them. */
const coveredNowhere = (answer: ProductControlStatusAnswer) =>
  answer.controls.filter((control) =>
    answer.configurations.every(
      (configuration) => productScopeStatus(control, configuration.id) === "not_covered",
    ),
  ).length;

/** A scope's controls as one bar, each status its share, in the key's order and the map's marks. */
function ScopeTally({ scope, total }: { scope: Scope; total: number }) {
  const { formatNumber } = useLedgerLocale();
  const segments = KEY_ORDER.map((key): TallySegment => ({
    key,
    value: scope.counts[key],
    label: `${formatNumber(scope.counts[key])} ${productControlStatuses[key].label.toLowerCase()}`,
    ...marks[key],
  }));
  return (
    <Tally
      segments={segments}
      total={total}
      size="large"
      label={`Controls of ${scope.name} by status`}
    />
  );
}

/** What each mark means. The counts differ by scope, so the key names the statuses alone. */
function StatusKey() {
  const items = KEY_ORDER.map((status): TileMapKeyItem => ({
    label: productControlStatuses[status].label,
    ...marks[status],
  }));
  return <TileMapKey aria-label="Product control statuses" items={items} />;
}

type TabLink = ReactElement<{ className?: string | undefined; children?: ReactNode }>;

/** An earlier version of the product that was assessed, for a version that was not. */
export type AssessedVersion = {
  /** The version shown, and the assessed one, by number. */
  shown: number;
  number: number;
  /** A link that shows the assessed version on the same tab. */
  link: TabLink;
};

/**
 * A version nobody assessed says so, and where the assessment is: what it shows is only what its
 * elements claim, and a reader who came for what the product gives is one step from it.
 */
function UnassessedNote({ assessed }: { assessed: AssessedVersion }) {
  return (
    <Alert role="status">
      <AlertTitle>Version {assessed.shown} has no published assessment</AlertTitle>
      <AlertDescription>
        Version {assessed.number} was assessed. This version shows what its elements claim, none of
        it judged.
      </AlertDescription>
      <AlertAction>
        <LinkButton size="small" render={assessed.link}>
          Open version {assessed.number}
        </LinkButton>
      </AlertAction>
    </Alert>
  );
}

/**
 * The product version on its Overview: a Tray whose heading counts the controls satisfied in every
 * configuration and opens the Assessment tab, over a card a scope (the core, then each
 * configuration) with how many of its controls are satisfied and one bar of its statuses.
 */
export function ProductStandingTray({
  revisionId,
  assessmentTab,
  assessed,
}: {
  revisionId: string;
  /** A link to the product's Assessment tab. */
  assessmentTab: TabLink;
  /** The assessed version, when this one has no published assessment and an earlier one has. */
  assessed?: AssessedVersion | undefined;
}) {
  const { formatNumber } = useLedgerLocale();
  const status = useProductControlStatus(revisionId);
  const data = status.data;
  // A version nobody assessed and whose elements claim nothing has nothing to count.
  if (data && !data.total) return null;
  return (
    <QueryState queries={[status]}>
      {assessed && data && !data.assessment && <UnassessedNote assessed={assessed} />}
      <Tray
        title="controls satisfied in every configuration"
        link={assessmentTab}
        {...(data
          ? {
              value: data.satisfiedEverywhere,
              action: data.assessment
                ? `of ${formatNumber(data.total)} assessed`
                : "No published assessment",
            }
          : { isLoading: true })}
      >
        {data && (
          <Grid templateColumns="repeat(auto-fit, minmax(min(100%, 208px), 1fr))" gap="space.150">
            {scopesOf(data).map((scope) => (
              <Card key={scope.id} size="small">
                <CardContent>
                  <Stack space="space.075">
                    <Text weight="medium">{scope.name}</Text>
                    <Text size="small" color="color.text.subtle" numeric>
                      {formatNumber(scope.counts.satisfied)} / {formatNumber(data.total)} satisfied
                    </Text>
                    <ScopeTally scope={scope} total={data.total} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Grid>
        )}
      </Tray>
    </QueryState>
  );
}

/* ——— The Assessment tab ———————————————————————————————————————————————————————————————————————— */

/** How the tab shows the controls. The configurations are what an address shows unasked. */
type StandingShow = "configurations" | "list";
const shows: { value: StandingShow; label: string }[] = [
  { value: "configurations", label: "Configurations" },
  { value: "list", label: "List" },
];

const SAME = "Same in every configuration";
const DIFFERS = "Differs by configuration";

/** The search that opens the Assessment tab's List on a question, beside the tab and the version. */
function listSearch(question: { standing?: string | undefined }): Record<string, unknown> {
  return {
    tab: "Assessment",
    show: "list",
    ...questionSearch(registerViews.productAssessment, {
      search: "",
      filters: question.standing ? [{ id: "standing", value: [question.standing] }] : [],
    }),
  };
}

/** One scope as a card: how many controls it satisfies and covers, over a mark a control. */
function ScopeCard({ scope, answer }: { scope: Scope; answer: ProductControlStatusAnswer }) {
  const { formatNumber } = useLedgerLocale();
  const openRecord = useOpenRecord();
  const groups = useMemo(() => {
    const mark = (control: ProductControlStanding): TileMapMark => {
      const status = productScopeStatus(control, scope.id);
      return {
        id: control.id,
        label: `${control.code} ${control.title}`,
        description: productControlStatuses[status].label,
        ...marks[status],
      };
    };
    return controlFamilies(answer.controls, PRODUCT_CONTROL_STATUS_ORDER, (control) =>
      productScopeStatus(control, scope.id),
    ).map((family): TileMapGroup => ({
      id: family.code,
      label: family.code,
      title: family.title ?? "Unnamed family",
      value: formatNumber(family.total),
      marks: family.controls.map(({ enhancements, ...control }) => ({
        ...mark(control as ProductControlStanding),
        parts: enhancements.map(mark),
      })),
    }));
  }, [answer.controls, scope.id, formatNumber]);
  const open = useCallback(
    (mark: TileMapMark) => openRecord("controls", { id: mark.id }),
    [openRecord],
  );
  const covered = answer.total - scope.counts.not_covered;
  return (
    <Card size="small">
      <CardHeader>
        <CardTitle render={<h3 />}>{scope.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Stack space="space.100">
          <Inline space="space.150" spread="space-between" shouldWrap>
            <Text size="small" color="color.text.subtle" numeric>
              {formatNumber(scope.counts.satisfied)} / {formatNumber(answer.total)} satisfied
            </Text>
            <Text size="small" color="color.text.subtle" numeric>
              {formatNumber(covered)} covered by {formatNumber(scope.elements)}{" "}
              {scope.elements === 1 ? "element" : "elements"}
            </Text>
          </Inline>
          <TileMap
            label={`Controls of ${scope.name}, each coloured by what the product gives for it`}
            layout="strip"
            groups={groups}
            onSelect={open}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

/** A row of the List: a control with its status in the core and in each configuration. */
type StandingRow = {
  id: string;
  name: string;
  family: string;
  core: ProductControlStatus;
  standing: string;
  [scope: `scope:${string}`]: ProductControlStatus;
};

/** The product's controls as a register, a status a configuration, asked by any of them. */
function StandingList({ answer }: { answer: ProductControlStatusAnswer }) {
  const rows = useMemo<StandingRow[]>(
    () =>
      answer.controls.map((control) => ({
        id: control.id,
        name: `${control.code} ${control.title}`,
        family: familyName(control.family, control.familyTitle),
        core: control.core,
        standing: control.differs ? DIFFERS : SAME,
        ...Object.fromEntries(
          answer.configurations.map((configuration) => [
            `scope:${configuration.id}`,
            productScopeStatus(control, configuration.id),
          ]),
        ),
      })),
    [answer.controls, answer.configurations],
  );
  const columns = useMemo(
    () =>
      defineColumns<StandingRow>((c) => [
        c.text("name", {
          header: "Control",
          priority: 0,
          minWidth: 240,
          hideable: false,
          cell: (row) => (
            <RecordLink table="controls" record={{ id: row.id }}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.status("core", {
          header: "Core",
          width: 180,
          priority: 2,
          statuses: productControlStatuses,
        }),
        ...answer.configurations.map((configuration, index) =>
          c.status(`scope:${configuration.id}`, {
            header: `${configuration.code} ${configuration.name}`,
            width: 190,
            priority: 1 + index,
            statuses: productControlStatuses,
          }),
        ),
        c.text("standing", { header: "Across configurations", width: 220, priority: 5 }),
        c.text("family", { header: "Control family", width: 240, priority: 6 }),
      ]),
    [answer.configurations],
  );
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Controls of the product by configuration",
    view: registerViews.productAssessment,
  });
  const openRecord = useOpenRecord();
  return (
    <ProductCollection
      table={table}
      onRowClick={(row) => openRecord("controls", { id: row.id })}
      searchLabel="Find controls"
      filters={
        <>
          <DataTable.Filter table={table} column="standing" />
          <DataTable.Filter table={table} column="core" />
          {answer.configurations.map((configuration) => (
            <DataTable.Filter
              key={configuration.id}
              table={table}
              column={`scope:${configuration.id}`}
            />
          ))}
          <DataTable.Filter table={table} column="family" />
        </>
      }
      empty={{
        title: "No controls to show",
        description: "The product's elements claim no control, and no assessment is published.",
      }}
    />
  );
}

/** The assessment the standing is read from, folded until asked for. */
function AssessmentFacts({ answer }: { answer: ProductControlStatusAnswer }) {
  const { formatNumber } = useLedgerLocale();
  const assessment = answer.assessment;
  return (
    <Section title="Details" isCollapsible defaultOpen={false}>
      <KeyValue.Group labelWidth="auto">
        <KeyValue label="Product assessment">
          {assessment ? assessment.title : <Absent label="No published assessment" />}
        </KeyValue>
        {assessment && (
          <>
            <KeyValue label="Published">
              <DateTime value={assessment.publishedAt} format="date" />
            </KeyValue>
            <KeyValue label="Completed">
              <DateTime value={assessment.completedOn} format="date" absentLabel="Not recorded" />
            </KeyValue>
            <KeyValue label="Assessor">
              {assessment.assessorPartyId ? (
                <RelationName table="parties" id={assessment.assessorPartyId} />
              ) : (
                <Absent />
              )}
            </KeyValue>
            <KeyValue label="Control baseline">
              <BaselineName id={assessment.profileResolutionId} />
            </KeyValue>
          </>
        )}
        <KeyValue label="Core elements">{formatNumber(answer.core.elements)}</KeyValue>
      </KeyValue.Group>
    </Section>
  );
}

/**
 * The product's Assessment tab: what the version gives for each control, by configuration. A band
 * says what holds whatever a program takes and what depends on the configuration; Configurations
 * draws a card a scope with a mark a control, and List is the same controls as a register with a
 * status a configuration. One read answers it, `product_control_status`.
 */
export function ProductAssessmentTab({
  revisionId,
  navigate,
  assessed,
  assessments,
}: {
  revisionId: string;
  /** The assessed version, when this one has no published assessment and an earlier one has. */
  assessed?: AssessedVersion | undefined;
  /** The version's assessments, listed under what they found: where a reader authors one. */
  assessments?: ReactNode;
  /** Merges over the address's search, as the record's own tab change does. */
  navigate: (search: (current: Record<string, unknown>) => Record<string, unknown>) => void;
}) {
  const { formatNumber } = useLedgerLocale();
  const status = useProductControlStatus(revisionId);
  const show = useRouterState({
    select: (state): StandingShow =>
      (state.resolvedLocation ?? state.location).search["show" as never] === "list"
        ? "list"
        : "configurations",
  });
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const data = status.data;
  const scopes = useMemo(() => (data ? scopesOf(data) : []), [data]);
  const loading = !data && !status.isError;
  const unread = status.isError ? "Could not load" : undefined;
  const count = (value: number | undefined) =>
    value === undefined ? status.isError ? <Absent label="Could not load" /> : null : value;
  return (
    <QueryState queries={[status]}>
      {data && !data.total ? (
        <Stack space="space.300" className="min-w-0">
          <EmptyMessage
            illustration="document"
            title="Nothing assessed yet"
            description="Pin library components to this version's elements, then publish a product assessment to say what the product gives."
          />
          {assessments}
        </Stack>
      ) : (
        <Stack space="space.300" className="min-w-0">
          {assessed && data && !data.assessment && <UnassessedNote assessed={assessed} />}
          <Stat.Grid frame="band" cols={4} aria-label="What the product gives">
            <Stat.Tile
              label="Controls"
              value={count(data?.total)}
              note={
                data
                  ? data.assessment
                    ? "In the assessed baseline"
                    : "Claimed by its elements"
                  : unread
              }
              isLoading={loading}
            />
            <Stat.Tile
              label="Satisfied in every configuration"
              value={count(data?.satisfiedEverywhere)}
              note={data ? "Whatever configuration a program takes" : unread}
              isLoading={loading}
            />
            <Stat.Tile
              label="Differ by configuration"
              value={count(data?.differs)}
              note={data ? "Read the configuration a program takes" : unread}
              isLoading={loading}
              {...(data?.differs
                ? {
                    link: (
                      <Link
                        to={pathname}
                        search={(current) => ({ ...current, ...listSearch({ standing: DIFFERS }) })}
                      />
                    ),
                  }
                : {})}
            />
            <Stat.Tile
              label="Covered by no configuration"
              value={count(data ? coveredNowhere(data) : undefined)}
              note={data ? "Every program owes these" : unread}
              isLoading={loading}
            />
          </Stat.Grid>
          {data && (
            <>
              <Stack space="space.200" className="min-w-0">
                <Inline space="space.150" alignBlock="center" spread="space-between" shouldWrap>
                  <Heading as="h2" size="section">
                    {formatNumber(data.total)} controls in{" "}
                    {formatNumber(data.configurations.length)}{" "}
                    {data.configurations.length === 1 ? "configuration" : "configurations"}
                  </Heading>
                  <ToggleGroup
                    size="small"
                    spacing={0}
                    variant="outline"
                    aria-label="Show as"
                    value={[show]}
                    onValueChange={(value) => {
                      const next = value[0] as StandingShow | undefined;
                      if (!next || next === show) return;
                      navigate((current) => ({
                        ...current,
                        show: next === "list" ? "list" : undefined,
                      }));
                    }}
                  >
                    {shows.map((item) => (
                      <ToggleGroupItem key={item.value} value={item.value}>
                        {item.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Inline>
                {show === "list" ? (
                  <StandingList answer={data} />
                ) : (
                  <Stack space="space.150" className="min-w-0">
                    <StatusKey />
                    <Grid
                      templateColumns="repeat(auto-fill, minmax(min(100%, 440px), 1fr))"
                      gap="space.200"
                    >
                      {scopes.map((scope) => (
                        <ScopeCard key={scope.id} scope={scope} answer={data} />
                      ))}
                    </Grid>
                  </Stack>
                )}
              </Stack>
              {assessments}
              <AssessmentFacts answer={data} />
            </>
          )}
        </Stack>
      )}
    </QueryState>
  );
}
