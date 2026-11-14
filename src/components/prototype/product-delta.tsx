import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Link, getRouteApi, useNavigate, useRouterState } from "@tanstack/react-router";
import { AlertCircle, Plus } from "lucide-react";
import {
  Absent,
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  DateTime,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldSet,
  Grid,
  Heading,
  HeadingLevelProvider,
  Inline,
  Item,
  KeyValue,
  Related,
  Section,
  Skeleton,
  Stack,
  Stat,
  Text,
  TextLink,
  TileMap,
  TileMapKey,
  ToggleGroup,
  ToggleGroupItem,
  Tray,
  defineColumns,
  toast,
  useLedgerLocale,
  type TileMapGroup,
  type TileMapKeyItem,
  type TileMapLayout,
  type TileMapMark,
} from "@ledger/design-system";
import { TextField } from "@/components/app/fields";
import { causeText } from "@/components/app/sentence";
import { StatusBadge } from "@/components/app/status";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useWorkspace } from "@/components/app/workspace";
import {
  VARIANT_DELTA_ORDER,
  controlFamilies,
  controlsCarried,
  controlsOwed,
  useDeltaAssessmentObjectives,
  useDeltaAssessments,
  usePlanDeltaAssessment,
  useProgramVariants,
  useVariantControlDelta,
  variantElementChanges,
  type ControlFamily,
  type VariantControl,
  type VariantControlDelta,
  type VariantDelta,
  type VariantElementChange,
} from "@/lib/product-assurance";
import { registerViews } from "@/lib/register-views";
import { campaignStatuses, productControlStatuses, variantDeltas } from "@/lib/status";
import { useCollectionTable } from "./collection-question";
import { LibrarySelect } from "./library-shared";
import { ProductCollection } from "./product-collection";
import { productDeltaSearch } from "./product-delta-link";
import {
  NewerVersionNote,
  TakeProductVersionDialog,
  type VersionTakeTarget,
} from "./product-version-take";
import { RecordLink, useOpenRecord } from "./record-preview";
import { EmptyMessage, QueryState, ReportFailures } from "./work-common";

/*
 * What a program's variant takes from its product, and what it owes. A variant is a system created
 * from a product configuration; each control of its control baseline is inherited, shared, changed
 * here or the program's only, as `variant_control_delta` answers it. The Overview's tray says the
 * count and draws the baseline as one strip; the focused Product delta view says why (the elements
 * the program changed), lists the controls and plans the assessment of what is owed.
 */

/** The view's route: its address keeps the variant, how the controls are shown and the List's question. */
const deltaRoute = getRouteApi("/programs/$programId_/product-delta");

/**
 * How each delta is drawn, once: the map's marks and its key read the same entry. What the product
 * stands behind is solid in a calm tone; what the program changed is the one warm colour on the
 * map, since it is the work; what the product never covered is hollow, not there yet.
 */
const marks = {
  inherited: { tone: "success", fill: "solid" },
  shared: { tone: "information", fill: "solid" },
  changed_here: { tone: "warning", fill: "solid" },
  program_only: { tone: "neutral", fill: "outline" },
} as const satisfies Record<VariantDelta, Pick<TileMapMark, "tone" | "fill">>;

/** The key's order: what the product gives first, then what the program owes. */
const KEY_ORDER = [...VARIANT_DELTA_ORDER].reverse();

type LinkElement = ReactElement<{ className?: string | undefined; children?: ReactNode }>;

/** How the view shows the controls. The families are what an address shows unasked. */
type DeltaShow = "families" | "list";
const shows: { value: DeltaShow; label: string }[] = [
  { value: "families", label: "Families" },
  { value: "list", label: "List" },
];

const familyName = (code: string | null, title: string | null) =>
  [code ?? "Other", title].filter(Boolean).join(" ");
const elementName = (element: { code: string; name: string }) => `${element.code} ${element.name}`;
const kindLabel = (kind: string) => kind.charAt(0).toUpperCase() + kind.slice(1);

const deltaLink = (programId: string, system: string) => (delta: VariantDelta) => (
  <Link
    to="/programs/$programId/product-delta"
    params={{ programId }}
    search={productDeltaSearch({ system, delta })}
  />
);

/** What each mark of a delta map means, with how many controls stand there; a count opens them. */
function DeltaKey({
  counts,
  link,
}: {
  counts: Record<VariantDelta, number>;
  link?: ((delta: VariantDelta) => LinkElement) | undefined;
}) {
  const { formatNumber } = useLedgerLocale();
  const items = KEY_ORDER.map((delta): TileMapKeyItem => ({
    label: variantDeltas[delta].label,
    value: formatNumber(counts[delta]),
    ...marks[delta],
    ...(link && counts[delta] > 0 ? { link: link(delta) } : {}),
  }));
  return <TileMapKey aria-label="Where each control stands against the product" items={items} />;
}

/** Every control of a variant's control baseline as one mark, coloured by its delta. */
function DeltaMap({
  families,
  layout = "strip",
  label,
  onSelect,
}: {
  families: readonly ControlFamily<VariantControl, VariantDelta>[];
  layout?: TileMapLayout | undefined;
  label: string;
  onSelect?: ((controlId: string) => void) | undefined;
}) {
  const { formatNumber } = useLedgerLocale();
  const groups = useMemo(() => {
    const mark = (control: VariantControl): TileMapMark => ({
      id: control.id,
      label: `${control.code} ${control.title}`,
      description: control.changedElements.length
        ? `${variantDeltas[control.delta].label} · ${control.changedElements.map((element) => element.code).join(", ")}`
        : variantDeltas[control.delta].label,
      ...marks[control.delta],
    });
    return families.map((family): TileMapGroup => ({
      id: family.code,
      label: family.code,
      title: family.title ?? "Unnamed family",
      value: formatNumber(family.total),
      marks: family.controls.map(({ enhancements, ...control }) => ({
        ...mark(control as VariantControl),
        parts: enhancements.map(mark),
      })),
    }));
  }, [families, formatNumber]);
  const choose = useMemo(
    () => (onSelect ? (mark: TileMapMark) => onSelect(mark.id) : undefined),
    [onSelect],
  );
  return <TileMap label={label} layout={layout} groups={groups} onSelect={choose} />;
}

const deltaFamilies = (controls: readonly VariantControl[]) =>
  controlFamilies(controls, VARIANT_DELTA_ORDER, (control) => control.delta);

/* ——— The Overview's tray ——————————————————————————————————————————————————————————————————————— */

/**
 * One variant on the program's Overview: a Tray whose heading counts the controls the program owes
 * an assessment on and opens the Product delta view, over the whole baseline as one strip of
 * marks, each coloured by its delta, under a key that counts each. A count of the key opens the
 * view's List at that delta, and a mark opens its control.
 */
function VariantDeltaTray({
  programId,
  system,
}: {
  programId: string;
  system: { id: string; name: string };
}) {
  const { formatNumber } = useLedgerLocale();
  const delta = useVariantControlDelta(system.id);
  const openRecord = useOpenRecord();
  const link = useMemo(() => deltaLink(programId, system.id), [programId, system.id]);
  const families = useMemo(() => deltaFamilies(delta.data?.controls ?? []), [delta.data?.controls]);
  const openControl = useCallback(
    (controlId: string) => openRecord("controls", { id: controlId, program_id: programId }),
    [openRecord, programId],
  );
  // A system that was not created from a product has no delta: it draws nothing.
  if (delta.data === null) return null;
  const data = delta.data;
  return (
    <QueryState queries={[delta]}>
      <Tray
        title={data ? `controls to assess in ${system.name}` : "controls to assess"}
        link={
          <Link
            to="/programs/$programId/product-delta"
            params={{ programId }}
            search={{ system: system.id }}
          />
        }
        {...(data
          ? {
              value: controlsOwed(data),
              action: `${formatNumber(controlsCarried(data))} of ${formatNumber(data.total)} stand on ${data.product.name}`,
            }
          : { isLoading: true })}
      >
        <Card size="small">
          <CardContent>
            {data ? (
              <Stack space="space.150">
                <DeltaKey counts={data.counts} link={link} />
                <DeltaMap
                  families={families}
                  label={`Controls in the control baseline of ${system.name}, each coloured by where it stands against ${data.product.name}`}
                  onSelect={openControl}
                />
              </Stack>
            ) : (
              <Skeleton shape="block" height={96} />
            )}
          </CardContent>
        </Card>
      </Tray>
    </QueryState>
  );
}

/**
 * What the program's variants take from their products, on its Overview: one tray a variant. A
 * program with no system created from a product draws nothing here.
 */
export function ProgramProductDeltaTrays({ programId }: { programId: string }) {
  const { query, variants } = useProgramVariants(programId);
  return (
    <>
      <ReportFailures queries={[query]} />
      {variants?.map((system) => (
        <VariantDeltaTray key={system.id} programId={programId} system={system} />
      ))}
    </>
  );
}

/* ——— The focused view ——————————————————————————————————————————————————————————————————————————— */

type ControlRow = VariantControl & { name: string; family: string; changed: string[] };

const listColumns = (programId: string) =>
  defineColumns<ControlRow>((c) => [
    c.text("name", {
      header: "Control",
      priority: 0,
      minWidth: 240,
      hideable: false,
      cell: (row) => (
        <RecordLink table="controls" record={{ id: row.id, program_id: programId }}>
          {row.name}
        </RecordLink>
      ),
    }),
    c.status("delta", { header: "Delta", width: 150, priority: 1, statuses: variantDeltas }),
    c.status("productStatus", {
      header: "Product status",
      width: 190,
      priority: 3,
      statuses: productControlStatuses,
    }),
    c.list("changed", {
      header: "Changed elements",
      width: 260,
      priority: 2,
      searchable: true,
      items: (row) => row.changed.map((label) => ({ key: label, label })),
      empty: () => <Absent label="No element changed" />,
    }),
    c.text("family", { header: "Control family", width: 240, priority: 4 }),
  ]);

/** The variant's controls as a register, asked by delta, by family or by a changed element. */
function DeltaList({ programId, delta }: { programId: string; delta: VariantControlDelta }) {
  const rows = useMemo<ControlRow[]>(
    () =>
      delta.controls.map((control) => ({
        ...control,
        name: `${control.code} ${control.title}`,
        family: familyName(control.family, control.familyTitle),
        changed: control.changedElements.map(elementName),
      })),
    [delta.controls],
  );
  const columns = useMemo(() => listColumns(programId), [programId]);
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Controls of the variant against its product",
    view: registerViews.productDelta,
  });
  const openRecord = useOpenRecord();
  return (
    <ProductCollection
      table={table}
      onRowClick={(row) => openRecord("controls", { id: row.id, program_id: programId })}
      searchLabel="Find controls"
      filters={
        <>
          <DataTable.Filter table={table} column="delta" />
          <DataTable.Filter table={table} column="changed" />
          <DataTable.Filter table={table} column="family" />
          <DataTable.Filter table={table} column="productStatus" />
        </>
      }
      empty={{
        title: "No controls to show",
        description: "The variant's control baseline selects no control.",
      }}
    />
  );
}

/** One control family as a card: how many of its controls the program owes, over a mark a control. */
function FamilyCard({
  programId,
  system,
  family,
}: {
  programId: string;
  system: string;
  family: ControlFamily<VariantControl, VariantDelta>;
}) {
  const { formatNumber } = useLedgerLocale();
  const openRecord = useOpenRecord();
  const name = familyName(family.code === "Other" ? null : family.code, family.title);
  const one = useMemo(() => [family], [family]);
  const owed = family.counts.changed_here + family.counts.program_only;
  const open = useCallback(
    (controlId: string) => openRecord("controls", { id: controlId, program_id: programId }),
    [openRecord, programId],
  );
  return (
    <Card size="small">
      <CardHeader>
        <CardTitle render={<h3 />}>
          <TextLink
            tone="neutral"
            render={
              <Link
                to="/programs/$programId/product-delta"
                params={{ programId }}
                search={productDeltaSearch({ system, family: name })}
              />
            }
          >
            {name}
          </TextLink>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Stack space="space.100">
          <Inline space="space.150" spread="space-between" shouldWrap>
            <Text size="small" color="color.text.subtle" numeric>
              {formatNumber(owed)} / {formatNumber(family.total)} to assess
            </Text>
            <Text size="small" color="color.text.subtle" numeric>
              {formatNumber(family.counts.changed_here)} changed here
            </Text>
          </Inline>
          <DeltaMap
            families={one}
            label={`Controls of ${name}, each coloured by where it stands against the product`}
            onSelect={open}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

type ChangeRow = VariantElementChange & { id: string; element: string; what: string[] };

/**
 * The elements of the product the program modified or left out: the reason a control is changed
 * here. Each says what changed and how many controls stand on it, a link that lists them.
 */
function ChangedElements({ programId, delta }: { programId: string; delta: VariantControlDelta }) {
  const rows = useMemo<ChangeRow[]>(
    () =>
      variantElementChanges(delta).map((change) => ({
        ...change,
        id: change.productElementId,
        element: elementName(change),
        what: change.change === "removed" ? [] : change.kinds.map(kindLabel),
      })),
    [delta],
  );
  const columns = useMemo(
    () =>
      defineColumns<ChangeRow>((c) => [
        c.text("element", {
          header: "Element",
          priority: 0,
          minWidth: 220,
          hideable: false,
          cell: (row) =>
            row.systemId ? (
              <RecordLink table="systems" record={{ id: row.systemId, program_id: programId }}>
                {row.element}
              </RecordLink>
            ) : (
              // An element the variant left out has no record in the program to open.
              row.element
            ),
        }),
        c.status("change", {
          header: "Change",
          width: 130,
          priority: 1,
          statuses: elementChanges,
        }),
        c.list("what", {
          header: "What changed",
          width: 220,
          priority: 3,
          items: (row) => row.what.map((label) => ({ key: label, label })),
          empty: () => <Absent label="Left out of the variant" />,
        }),
        c.number("controls", {
          header: "Controls",
          width: 120,
          priority: 2,
          cell: (row) => (
            <TextLink
              render={
                <Link
                  to="/programs/$programId/product-delta"
                  params={{ programId }}
                  search={productDeltaSearch({ system: delta.systemId, element: row.element })}
                />
              }
            >
              {row.controls}
            </TextLink>
          ),
        }),
      ]),
    [programId, delta.systemId],
  );
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Elements the program changed",
    view: "program-product-delta-elements",
    pinnable: false,
    hideable: false,
  });
  return (
    <Section title="Changed elements" count={rows.length} countMax={9999}>
      <ProductCollection
        table={table}
        compact
        search={false}
        sort={false}
        keepQuestion={false}
        empty={{
          title: "No element changed",
          description:
            "Every element is as the product delivers it. Mark an element as modified on the System tab when the program changes it.",
        }}
      />
    </Section>
  );
}

/** A changed element's standing, as the Changed elements table badges it. */
const elementChanges = {
  modified: { label: "Modified", tone: "warning", rank: 0 },
  removed: { label: "Removed", tone: "neutral", rank: 1 },
} as const;

/**
 * Plan delta assessment: one assessment campaign over the controls the variant owes, each as the
 * assessment objectives it counts, as Add to assessment campaign writes a control. The Dialog says
 * how many objectives the plan will hold before the command runs. The command needs the variant's
 * published SSP and says so when it is a draft; a request sent again answers the campaign it made.
 */
function PlanDeltaAssessmentDialog({
  delta,
  systemName,
  onClose,
}: {
  delta: VariantControlDelta;
  systemName: string;
  onClose: () => void;
}) {
  const { formatNumber, formatPlural } = useLedgerLocale();
  const navigate = useNavigate();
  const formId = useId();
  const [requestId] = useState(() => crypto.randomUUID());
  const [open, setOpen] = useState(true);
  const initialTitle = `${systemName} delta assessment`;
  const [title, setTitle] = useState(initialTitle);
  const [failure, setFailure] = useState<string | null>(null);
  const planned = useRef<string | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLElement | null>(null);
  const plan = usePlanDeltaAssessment();
  // What the plan will hold: each owed control's objectives, one for a control that counts none.
  const holds = useDeltaAssessmentObjectives(delta.systemId);
  const guard = useDraftGuard({
    dirty: title !== initialTitle,
    onClose: () => setOpen(false),
    description: "The title you entered will be lost.",
  });
  const missing = !title.trim() ? "Give the assessment campaign a title." : undefined;
  const [submitted, setSubmitted] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || !holds.data) return;
    setFailure(null);
    setSubmitted(true);
    if (missing) {
      titleRef.current?.focus();
      return;
    }
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      const result = await plan.mutateAsync({ systemId: delta.systemId, requestId, title });
      planned.current = result.campaignId;
      const objectives = formatPlural(result.objectives, {
        one: "{count} objective",
        other: "{count} objectives",
      });
      const controls = formatPlural(result.controls, {
        one: "{count} control",
        other: "{count} controls",
      });
      toast.add({
        type: "success",
        title: "Delta assessment planned",
        description: `${objectives} over ${controls}.`,
      });
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(
        `${causeText(cause)} Your title is kept, and planning it again will not make a second campaign.`,
      );
      guard.finish();
    }
  }
  return (
    <Dialog
      open={open}
      pending={guard.busy}
      onOpenChange={(next, details) => {
        if (next) return;
        details.cancel();
        void guard.close();
      }}
      onOpenChangeComplete={(next) => {
        if (next) return;
        const campaignId = planned.current;
        onClose();
        if (campaignId) void navigate({ to: "/campaigns/$campaignId", params: { campaignId } });
      }}
    >
      <DialogContent width="medium" initialFocus={() => titleRef.current ?? true}>
        <DialogHeader>
          <DialogTitle>Plan delta assessment</DialogTitle>
          <DialogDescription>
            An assessment campaign over the controls {systemName} owes, each as the assessment
            objectives it counts, on its published SSP.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {failure ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The delta assessment was not planned</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              {/* The objectives the plan will hold, then the controls they are of and those it
                  leaves to the product. */}
              <QueryState queries={[holds]}>
                {holds.data && (
                  <KeyValue.Group labelWidth="wide">
                    <KeyValue label="Objectives">{formatNumber(holds.data.objectives)}</KeyValue>
                    <KeyValue label="Changed here">
                      {formatNumber(delta.counts.changed_here)}
                    </KeyValue>
                    <KeyValue label="Program only">
                      {formatNumber(delta.counts.program_only)}
                    </KeyValue>
                    <KeyValue label="Not assessed again">
                      {formatNumber(controlsCarried(delta))}
                    </KeyValue>
                  </KeyValue.Group>
                )}
              </QueryState>
              <FieldSet disabled={guard.busy}>
                <TextField
                  label="Campaign title"
                  value={title}
                  onChange={setTitle}
                  required
                  error={submitted ? missing : undefined}
                  controlRef={titleRef}
                />
              </FieldSet>
            </Stack>
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          <Button
            ref={submitRef}
            type="submit"
            form={formId}
            variant="primary"
            isLoading={guard.busy}
            disabledReason={
              holds.data
                ? undefined
                : holds.isError
                  ? "The objectives the plan will hold could not be counted."
                  : "The objectives the plan will hold are still being counted."
            }
          >
            Plan delta assessment
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}

/** The campaigns Plan delta assessment made for the variant, and the action that plans one. */
function DeltaAssessments({
  delta,
  systemName,
}: {
  delta: VariantControlDelta;
  systemName: string;
}) {
  const workspace = useWorkspace();
  const campaigns = useDeltaAssessments(delta.systemId);
  const [planning, setPlanning] = useState(false);
  const canPlan = workspace.role !== "viewer" && controlsOwed(delta) > 0;
  const action = canPlan ? (
    <Button
      size="small"
      variant="secondary"
      iconBefore={<Plus />}
      onClick={() => setPlanning(true)}
    >
      Plan delta assessment
    </Button>
  ) : undefined;
  return (
    <QueryState queries={[campaigns]}>
      <HeadingLevelProvider level={2}>
        <Related
          title="Delta assessments"
          count={campaigns.data?.length}
          countMax={9999}
          size="default"
          action={action}
          empty={{
            title: "No delta assessment planned",
            description: "Plan one to assess only the controls this variant owes.",
          }}
        >
          {(campaigns.data ?? []).map((campaign) => (
            <Item
              key={campaign.id}
              title={campaign.title}
              link={<Link to="/campaigns/$campaignId" params={{ campaignId: campaign.id }} />}
              trailing={
                <StatusBadge statuses={campaignStatuses} value={campaign.status} size="xsmall" />
              }
            />
          ))}
        </Related>
      </HeadingLevelProvider>
      {planning && (
        <PlanDeltaAssessmentDialog
          delta={delta}
          systemName={systemName}
          onClose={() => setPlanning(false)}
        />
      )}
    </QueryState>
  );
}

/** Where the variant's standing is read from: the product, its version, configuration and assessment. */
function ProductFacts({ delta }: { delta: VariantControlDelta }) {
  const { formatNumber } = useLedgerLocale();
  const product = delta.product;
  return (
    <Section title="Details" isCollapsible defaultOpen={false}>
      <KeyValue.Group labelWidth="auto">
        <KeyValue label="Product">
          <TextLink
            render={
              <Link
                to="/library/products/$productKey"
                params={{ productKey: product.id }}
                search={{ version: product.revisionId, tab: "Assessment" }}
              />
            }
          >
            {product.name}
          </TextLink>
        </KeyValue>
        <KeyValue label="Version">{formatNumber(product.version)}</KeyValue>
        {delta.updateAvailable && (
          <KeyValue label="Newer version">
            <TextLink
              render={
                <Link
                  to="/library/products/$productKey"
                  params={{ productKey: product.id }}
                  search={{ version: delta.updateAvailable.revisionId }}
                />
              }
            >
              Version {formatNumber(delta.updateAvailable.version)}
            </TextLink>
          </KeyValue>
        )}
        <KeyValue label="Configuration">
          {product.configurationCode} {product.configuration}
        </KeyValue>
        <KeyValue label="Product assessment">
          {delta.assessment ? delta.assessment.title : <Absent label="Not assessed" />}
        </KeyValue>
        {delta.assessment && (
          <KeyValue label="Assessment published">
            <DateTime value={delta.assessment.publishedAt} format="date" />
          </KeyValue>
        )}
        <KeyValue label="Elements inherited">{formatNumber(delta.elements.inherited)}</KeyValue>
        <KeyValue label="Elements modified">{formatNumber(delta.elements.modified)}</KeyValue>
        <KeyValue label="Elements removed">{formatNumber(delta.elements.removed)}</KeyValue>
        <KeyValue label="Elements added">{formatNumber(delta.elements.added)}</KeyValue>
      </KeyValue.Group>
    </Section>
  );
}

/** One variant's delta: the band, the changed elements, the controls and the assessments. */
function VariantDeltaBody({
  programId,
  system,
  show,
  chooser,
}: {
  programId: string;
  system: VersionTakeTarget;
  show: DeltaShow;
  /** The variant chooser, where the program has more than one. */
  chooser: ReactNode;
}) {
  const { formatNumber } = useLedgerLocale();
  const workspace = useWorkspace();
  const navigate = deltaRoute.useNavigate();
  const delta = useVariantControlDelta(system.id);
  // The version being taken, kept while its review is open: once it is taken the view offers none.
  const [taking, setTaking] = useState<{ revisionId: string; version: number } | null>(null);
  const headingRef = useRef<HTMLElement>(null);
  const families = useMemo(() => deltaFamilies(delta.data?.controls ?? []), [delta.data?.controls]);
  const link = useMemo(() => deltaLink(programId, system.id), [programId, system.id]);
  const data = delta.data;
  const loading = !data && !delta.isError;
  const unread = delta.isError ? "Could not load" : undefined;
  const count = (value: number | undefined) =>
    value === undefined ? delta.isError ? <Absent label="Could not load" /> : null : value;
  const changes = data ? variantElementChanges(data) : [];
  const modified = changes.filter((change) => change.change === "modified").length;
  const removed = changes.length - modified;
  return (
    <Stack space="space.300" className="min-w-0">
      <ReportFailures queries={[delta]} />
      {data && (
        <NewerVersionNote
          delta={data}
          canTake={workspace.role !== "viewer"}
          onTake={() => setTaking(data.updateAvailable)}
        />
      )}
      <Stat.Grid frame="band" cols={4} aria-label="Where the variant stands against its product">
        <Stat.Tile
          label="Inherited"
          value={count(data?.counts.inherited)}
          note={data ? `As ${data.product.name} delivers them` : unread}
          isLoading={loading}
          {...(data?.counts.inherited ? { link: link("inherited") } : {})}
        />
        <Stat.Tile
          label="Shared"
          value={count(data?.counts.shared)}
          note={data ? "The product covers part" : unread}
          isLoading={loading}
          {...(data?.counts.shared ? { link: link("shared") } : {})}
        />
        <Stat.Tile
          label="Changed here"
          value={count(data?.counts.changed_here)}
          note={
            data
              ? `${formatNumber(modified)} ${modified === 1 ? "element" : "elements"} modified, ${formatNumber(removed)} removed`
              : unread
          }
          tone={data?.counts.changed_here ? "warning" : "neutral"}
          isLoading={loading}
          {...(data?.counts.changed_here ? { link: link("changed_here") } : {})}
        />
        <Stat.Tile
          label="Program only"
          value={count(data?.counts.program_only)}
          note={data ? "The product gives nothing for them" : unread}
          isLoading={loading}
          {...(data?.counts.program_only ? { link: link("program_only") } : {})}
        />
      </Stat.Grid>
      {data && (
        <>
          <ChangedElements programId={programId} delta={data} />
          <Stack space="space.200" className="min-w-0">
            <Inline space="space.150" alignBlock="center" spread="space-between" shouldWrap>
              <Heading as="h2" size="section" ref={headingRef} tabIndex={-1}>
                {formatNumber(controlsOwed(data))} of {formatNumber(data.total)} controls to assess
              </Heading>
              <Inline space="space.150" alignBlock="center" shouldWrap>
                {chooser}
                <ToggleGroup
                  size="small"
                  spacing={0}
                  variant="outline"
                  aria-label="Show as"
                  value={[show]}
                  onValueChange={(value) => {
                    const next = value[0] as DeltaShow | undefined;
                    if (!next || next === show) return;
                    void navigate({
                      search: (current) => ({
                        ...current,
                        show: next === "list" ? "list" : undefined,
                      }),
                      resetScroll: false,
                    });
                  }}
                >
                  {shows.map((item) => (
                    <ToggleGroupItem key={item.value} value={item.value}>
                      {item.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Inline>
            </Inline>
            {show === "list" ? (
              <DeltaList programId={programId} delta={data} />
            ) : (
              <Stack space="space.150" className="min-w-0">
                <DeltaKey counts={data.counts} link={link} />
                <Grid
                  templateColumns="repeat(auto-fill, minmax(min(100%, 320px), 1fr))"
                  gap="space.200"
                >
                  {families.map((family) => (
                    <FamilyCard
                      key={family.code}
                      programId={programId}
                      system={system.id}
                      family={family}
                    />
                  ))}
                </Grid>
              </Stack>
            )}
          </Stack>
          <DeltaAssessments delta={data} systemName={system.name} />
          <ProductFacts delta={data} />
        </>
      )}
      {data && taking && (
        <TakeProductVersionDialog
          system={system}
          delta={data}
          version={taking}
          finalFocus={headingRef}
          onClose={() => setTaking(null)}
        />
      )}
    </Stack>
  );
}

/**
 * The program's focused Product delta view: what a variant takes from its product and what the
 * program owes. A band counts the four deltas; Changed elements says why a control is changed
 * here; Families draws a card a control family and List the same controls as a register; Delta
 * assessments plans a campaign over only what is owed. One read answers it, `variant_control_delta`.
 */
export function ProgramProductDeltaView({ programId }: { programId: string }) {
  const { query, variants } = useProgramVariants(programId);
  const navigate = deltaRoute.useNavigate();
  // Read from the address the page is drawn on, as the List's question is, so a link that asks for
  // a variant, the List and its question in one step mounts the List on that question.
  const askedSystem = useRouterState({
    select: (state) => {
      const system = (state.resolvedLocation ?? state.location).search["system" as never];
      return typeof system === "string" ? system : undefined;
    },
  });
  const show = useRouterState({
    select: (state): DeltaShow =>
      (state.resolvedLocation ?? state.location).search["show" as never] === "list"
        ? "list"
        : "families",
  });
  const system = variants?.find((variant) => variant.id === askedSystem) ?? variants?.[0];
  const chooser =
    variants && variants.length > 1 && system ? (
      <LibrarySelect
        inline
        label="Variant"
        value={system.id}
        options={variants.map((variant) => ({
          value: variant.id,
          label: `${variant.code} · ${variant.name}`,
        }))}
        onChange={(id) =>
          void navigate({ search: (current) => ({ ...current, system: id }), resetScroll: false })
        }
      />
    ) : null;
  return (
    <QueryState queries={[query]}>
      {!variants ? null : !system ? (
        <EmptyMessage
          illustration="tree"
          title="No system created from a product"
          description="Create a system from a product on the System tab to see what the program inherits and what it owes."
        />
      ) : (
        <VariantDeltaBody
          key={system.id}
          programId={programId}
          system={system}
          show={show}
          chooser={chooser}
        />
      )}
    </QueryState>
  );
}
