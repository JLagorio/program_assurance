// A shared component's Findings tab: the offers programs made on the component, across the
// versions of its set, a page at a time from `component_offer_rows` (`componentOfferRead` in
// component-offers), the offers that wait first, then the newest. The tab's only content is the
// collection, so it starts with its toolbar: Find offers and a State filter, no create action
// (a program offers from its own system component). An offer has no page of its own: its name and
// its row open Offer preview beside the record, which says where the offer stands on its dated path
// (found, offered, review, then accepted, returned or withdrawn), what it holds, and, while it
// waits, what accepting it opens: one operational issue in each other program built from the
// version it names (`offerReach` in component-work), the offering program keeping its own; once
// accepted, the issue each program holds for it. Accept is the preview's one small primary and
// Return its overflow menu's item, for a reader who may write: Accept confirms through
// `useConfirmation`, saying what it opens, and Return is a Dialog that asks why; both run
// `review_component_offer` at the revision the reader saw, one request a decision, and once the
// offer is reviewed, here or elsewhere, both keep their place and say why they no longer run. An
// address that names an offer (`offer`, its id) opens its preview as the tab opens.

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { AlertCircle, MoreHorizontal } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Absent,
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ErrorSummary,
  FieldSet,
  IconButton,
  Item,
  KeyValue,
  Person,
  Prose,
  Related,
  Section,
  Stack,
  Stepper,
  Text,
  defineColumns,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { useConfirmation } from "@/components/app/confirmation";
import { TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { causeText } from "@/components/app/sentence";
import { LevelIndicator, StatusBadge } from "@/components/app/status";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useWorkspace } from "@/components/app/workspace";
import { useComponentConsumers } from "@/lib/component-reuse";
import {
  REVIEW_NEEDS_NOTE,
  componentOfferRead,
  useComponentOffer,
  useReviewComponentOffer,
  type ComponentOfferDetail,
  type ComponentOfferRow,
  type ReviewedComponentOffer,
} from "@/lib/component-offers";
import { offerReach, useComponentIdentity } from "@/lib/component-work";
import { controlName } from "@/lib/product-records";
import {
  componentOfferStates,
  componentOfferVerbs,
  determinations,
  severityLevels,
} from "@/lib/status";
import { useServerCollection, vocabularyOptions } from "./collection-question";
import { currentOpener } from "./opener";
import { ProductCollection } from "./product-collection";
import type { TableName } from "@/lib/models";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
  useEndOnHide,
  useOpenRecord,
  type PreviewRecord,
} from "./record-preview";

/** A person the register names: their name, else why there is none. */
const named = (name: string | null, id: string | null, none: string) =>
  name ? <Person name={name} /> : <Absent label={id ? "Not available" : none} />;

/** Who reviewed an offer, else why nobody has: it waits, or it was withdrawn. */
const reviewer = (row: ComponentOfferRow) =>
  named(
    row.reviewed_by_name,
    row.reviewed_by_party_id,
    row.state === "withdrawn" ? "Withdrawn" : "Not reviewed",
  );

/** The columns, built once with the preview's setter, so stepping through it rebuilds none. */
const offerColumns = (open: (row: ComponentOfferRow) => void) =>
  defineColumns<ComponentOfferRow>((c) => [
    c.text("title", {
      header: "Finding",
      minWidth: 220,
      priority: 0,
      hideable: false,
      cell: (row) => (
        <RecordLink table="component_offers" record={row} onPreview={() => open(row)}>
          {row.title}
        </RecordLink>
      ),
    }),
    c.status("state", {
      header: "State",
      statuses: componentOfferStates,
      width: 130,
      priority: 1,
    }),
    c.number("version", { header: "Version", width: 100, priority: 4 }),
    c.text("program_name", { header: "From", width: 220, priority: 2 }),
    c.person("offered_by_name", {
      header: "Offered by",
      priority: 5,
      cell: (row) => named(row.offered_by_name, row.offered_by_party_id, "Not recorded"),
    }),
    c.date("offered_at", { header: "Offered", priority: 6 }),
    c.person("waiting_on_name", {
      header: "Waiting on",
      priority: 3,
      cell: (row) =>
        named(
          row.waiting_on_name,
          row.waiting_on_party_id,
          row.state === "offered" ? "No owner" : "Not waiting",
        ),
    }),
    c.person("reviewed_by_name", { header: "Reviewed by", priority: 7, cell: reviewer }),
  ]);

const offerNoun = { one: "offer", other: "offers" };

/** The offer an address names, as the Review queue's link to it says it. */
function useAddressedOffer() {
  return useRouterState({
    select: (state) => {
      const offer = ((state.resolvedLocation ?? state.location).search as Record<string, unknown>)[
        "offer"
      ];
      return typeof offer === "string" && offer ? offer : null;
    },
  });
}

/**
 * The offers made on a component, across the versions of its set, with the offer a reader opens
 * beside them. `componentId` is the component version the record shows.
 */
export function ComponentFindingsPanel({ componentId }: { componentId: string }) {
  const { identity, queries: identityQueries } = useComponentIdentity(componentId);
  const openRecord = useOpenRecord();
  const addressed = useAddressedOffer();
  // The offer shown beside the collection. The one the address names opens once the tab is
  // drawn, after the preview's own end-on-hide has settled, so it is never closed as it opens.
  const [shownId, setShownId] = useState<string | null>(null);
  useEndOnHide(() => setShownId(null));
  useEffect(() => {
    if (addressed) setShownId(addressed);
  }, [addressed]);
  const open = useRef((row: ComponentOfferRow) => setShownId(row.id));
  const columns = useMemo(() => offerColumns((row) => open.current(row)), []);
  const read = useMemo(
    () =>
      componentOfferRead(
        identity
          ? {
              component: {
                componentDefinitionId: identity.definitionId,
                componentName: identity.name,
              },
            }
          : { definedComponentId: componentId },
      ),
    [identity, componentId],
  );
  const collection = useServerCollection<ComponentOfferRow>(read, {
    columns,
    enabled: !!identity,
    preview: useMemo(
      () => ({ onPreview: (row: ComponentOfferRow) => setShownId(row.id), activeId: shownId }),
      [shownId],
    ),
    label: "Offers",
    view: "component-offers",
    // One component's question, so a page asked of one component is never asked of the next.
    keepQuestion: `component-offers-${componentId}`,
    resizable: true,
    reorderable: true,
  });
  const { table } = collection;
  const displayed = useDisplayedRecords(table);
  return (
    <>
      <ProductCollection
        {...collection}
        queries={[...identityQueries, ...collection.queries]}
        fill
        noun={offerNoun}
        searchLabel="Find offers"
        // An offer has no page of its own: the row opens its preview.
        onRowClick={(row) => openRecord("component_offers", row, () => setShownId(row.id))}
        empty={{
          illustration: "records",
          title: "No offers yet",
          description: "Programs built from this component offer their findings here.",
        }}
        filters={
          <DataTable.Filter
            table={table}
            column="state"
            options={vocabularyOptions(componentOfferStates)}
          />
        }
      />
      {shownId && (
        <OfferPreview
          offerId={shownId}
          row={displayed.find((row) => row.id === shownId)}
          rows={displayed}
          onSelect={(row) => setShownId(row.id)}
          onClose={() => setShownId(null)}
        />
      )}
    </>
  );
}

/** The words for what an offer holds. */
const kindWords = { finding: "Operational issue", determinations: "Determinations" } as const;

/**
 * An offer beside the collection: where it stands on its path, what it holds, and what accepting
 * it opens or opened. The row is the page's copy once a refresh brings it, else the offer as its
 * own read gives it, for an offer the address named that sits on another page.
 */
function OfferPreview({
  offerId,
  row,
  rows,
  onSelect,
  onClose,
}: {
  offerId: string;
  row: ComponentOfferRow | undefined;
  rows: ComponentOfferRow[];
  onSelect: (row: ComponentOfferRow) => void;
  onClose: () => void;
}) {
  const detail = useComponentOffer(offerId);
  const offer = row ?? detail.data?.offer;
  const title = offer?.title ?? (detail.data === null ? "Offer not found" : "Offer");
  return (
    <RecordPreviewPanel
      title={title}
      label="Offer preview"
      defaultWidth={560}
      onClose={onClose}
      recordActions={offer ? <OfferActions key={offer.id} offer={offer} /> : undefined}
      navigation={
        <RecordPreviewActions
          table="component_offers"
          record={offer ?? { id: offerId }}
          rows={rows}
          onSelect={onSelect}
          recordLabel={title}
          destination={null}
        />
      }
    >
      {offer ? (
        <OfferBody key={offer.id} offer={offer} detail={detail} />
      ) : detail.isError ? (
        <Text color="color.text.subtle">Could not load the offer.</Text>
      ) : detail.data === null ? (
        <Text color="color.text.subtle">This offer is gone or not visible to you.</Text>
      ) : (
        <Text color="color.text.subtle">Loading the offer…</Text>
      )}
    </RecordPreviewPanel>
  );
}

function OfferBody({
  offer,
  detail,
}: {
  offer: ComponentOfferRow;
  detail: ReturnType<typeof useComponentOffer>;
}) {
  const { formatNumber } = useLedgerLocale();
  const held = detail.data;
  return (
    <Stack space="space.250">
      <OfferPath offer={offer} detail={held ?? undefined} />
      <KeyValue.Group labelWidth="wide">
        <KeyValue label="State">
          <StatusBadge statuses={componentOfferStates} value={offer.state} />
        </KeyValue>
        <KeyValue label="Holds">
          {`${formatNumber(offer.items)} ${
            offer.kind === "finding"
              ? offer.items === 1
                ? "operational issue"
                : "operational issues"
              : offer.items === 1
                ? "determination"
                : "determinations"
          }`}
        </KeyValue>
        <KeyValue label="Component version">{`Version ${formatNumber(offer.version)}`}</KeyValue>
        <KeyValue label="Program" wrap>
          <RecordLink table="programs" record={{ id: offer.program_id }}>
            {offer.program_name}
          </RecordLink>
        </KeyValue>
        <KeyValue label="System component" wrap>
          <RecordLink
            table="system_components"
            record={{ id: offer.system_component_id, program_id: offer.program_id }}
          >
            {`${offer.system_component_code} ${offer.system_component_name}`}
          </RecordLink>
        </KeyValue>
      </KeyValue.Group>
      {offer.note?.trim() ? <Prose label="Note">{offer.note}</Prose> : null}
      {offer.review_note?.trim() ? <Prose label="Review note">{offer.review_note}</Prose> : null}
      <OfferItems offer={offer} detail={detail} />
      {offer.state === "offered" ? (
        <AcceptingOpens offer={offer} />
      ) : offer.state === "accepted" && offer.kind === "finding" ? (
        <OfferOpened detail={detail} />
      ) : null}
    </Stack>
  );
}

/** The offer's path as dated stops: found, offered, review, then what came of it. */
function OfferPath({
  offer,
  detail,
}: {
  offer: ComponentOfferRow;
  detail: ComponentOfferDetail | undefined;
}) {
  const day = (value: string | null | undefined) =>
    value ? <DateTime value={value} format="date" /> : undefined;
  // The issue offered was opened when the program found it; determinations, when they were made.
  const found = detail?.items
    .map((item) => item.issue?.openedAt ?? item.finding?.determinedAt ?? null)
    .filter((moment): moment is string => !!moment)
    .sort()[0];
  const waiting = offer.state === "offered";
  const outcome =
    offer.state === "withdrawn"
      ? { label: "Withdrawn", when: offer.withdrawn_at, who: null }
      : offer.state === "returned"
        ? { label: "Returned", when: offer.reviewed_at, who: offer.reviewed_by_name }
        : { label: "Accepted", when: offer.reviewed_at, who: offer.reviewed_by_name };
  return (
    <Stepper label="Offer path" variant="dated">
      <Stepper.Item
        state="done"
        node="work"
        label="Found"
        when={day(found)}
        end={<Text size="small">{offer.program_name}</Text>}
      />
      <Stepper.Item
        state="done"
        label="Offered"
        when={day(offer.offered_at)}
        end={offer.offered_by_name ? <Person name={offer.offered_by_name} /> : undefined}
      />
      <Stepper.Item
        state={waiting ? "current" : "done"}
        label="Review"
        end={waiting && offer.waiting_on_name ? <Person name={offer.waiting_on_name} /> : undefined}
      />
      <Stepper.Item
        state={waiting ? "upcoming" : offer.state === "accepted" ? "done" : "blocked"}
        node="end"
        signed={offer.state === "accepted"}
        label={waiting ? "Accepted" : outcome.label}
        when={waiting ? undefined : day(outcome.when)}
        end={!waiting && outcome.who ? <Person name={outcome.who} /> : undefined}
      />
    </Stepper>
  );
}

/** A row's link to a record's page, as its name would lead; none for a record with no page. */
function pageLink(table: TableName, record: PreviewRecord) {
  const destination = recordDestination(table, record);
  return destination ? { link: <Link {...destination} /> } : {};
}

/** A list's place while its read loads or after it failed: never an empty list. */
function Pending({ failed, what }: { failed: boolean; what: string }) {
  return <Text color="color.text.subtle">{failed ? `Could not load ${what}.` : "Loading…"}</Text>;
}

/** What the offer holds: the operational issues offered, or the findings whose determinations are. */
function OfferItems({
  offer,
  detail,
}: {
  offer: ComponentOfferRow;
  detail: ReturnType<typeof useComponentOffer>;
}) {
  const items = detail.data?.items;
  const title = offer.kind === "finding" ? "Operational issues offered" : "Determinations offered";
  if (items === undefined)
    return (
      <Section title={title}>
        <Pending failed={detail.isError} what="what the offer holds" />
      </Section>
    );
  return (
    <Related title={title} count={items.length} countMax={9999} layout="list" size="compact">
      {items.map((item) =>
        item.issue ? (
          <Item
            key={item.id}
            title={item.issue.title}
            trailing={<LevelIndicator levels={severityLevels} value={item.issue.severity} />}
            {...pageLink("operational_issues", { id: item.issue.id })}
          />
        ) : item.finding ? (
          <Item
            key={item.id}
            title={item.finding.control ? controlName(item.finding.control) : item.finding.title}
            trailing={<StatusBadge statuses={determinations} value={item.finding.determination} />}
            {...pageLink("assessment_findings", { id: item.finding.id })}
          />
        ) : (
          <Item key={item.id} title={<Absent label="Not available" />} />
        ),
      )}
    </Related>
  );
}

/**
 * What accepting the offer opens, read from where the component is used: an operational issue in
 * each other program built from the version it names, the offering program keeping its own; or,
 * for determinations, one assessment of that version every program built from it inherits.
 */
function AcceptingOpens({ offer }: { offer: ComponentOfferRow }) {
  const { formatNumber, formatPlural } = useLedgerLocale();
  const reaches = offer.kind === "finding";
  const consumers = useComponentConsumers(reaches ? offer.defined_component_id : null);
  const reach = useMemo(
    () =>
      consumers.data
        ? offerReach(
            { programId: offer.program_id, definedComponentId: offer.defined_component_id },
            consumers.data.systems,
          )
        : undefined,
    [consumers.data, offer.program_id, offer.defined_component_id],
  );
  if (!reaches)
    return (
      <Related title="Accepting publishes" layout="list" size="compact">
        <Item
          title={`Version ${formatNumber(offer.version)} assessment`}
          trailing={formatPlural(offer.items, {
            one: "{count} determination",
            other: "{count} determinations",
          })}
        />
      </Related>
    );
  if (reach === undefined)
    return (
      <Section title="Accepting opens">
        <Pending failed={consumers.isError} what="where the component is used" />
      </Section>
    );
  return (
    <Related
      title="Accepting opens"
      layout="list"
      size="compact"
      empty="No program is built from this version"
    >
      {reach.map((program) => (
        <Item
          key={program.programId}
          title={program.programName}
          trailing={program.offering ? "Keeps its own" : "1 operational issue"}
          {...pageLink("programs", { id: program.programId })}
        />
      ))}
    </Related>
  );
}

/** Once a finding is accepted: the operational issue each program holds for it, the source last. */
function OfferOpened({ detail }: { detail: ReturnType<typeof useComponentOffer> }) {
  const issues = detail.data?.issues;
  if (issues === undefined)
    return (
      <Section title="Opened">
        <Pending failed={detail.isError} what="the issues it opened" />
      </Section>
    );
  const shown = [...issues].sort((a, b) => Number(a.source) - Number(b.source));
  return (
    <Related
      title="Opened"
      count={issues.filter((issue) => !issue.source).length}
      countMax={9999}
      layout="list"
      size="compact"
    >
      {shown.map((issue) => {
        const program = issue.programName ?? issue.programCode ?? "Unnamed program";
        return issue.source || !issue.issue ? (
          <Item
            key={issue.id}
            title={program}
            trailing={issue.source ? "Keeps its own" : <Absent label="Not available" />}
            {...pageLink("programs", { id: issue.programId })}
          />
        ) : (
          <Item
            key={issue.id}
            title={issue.issue.title}
            meta={program}
            trailing={<LevelIndicator levels={severityLevels} value={issue.issue.severity} />}
            {...pageLink("operational_issues", { id: issue.issue.id })}
          />
        );
      })}
    </Related>
  );
}

/** Why a decision on the offer no longer runs, else nothing. */
function waitsFor(offer: ComponentOfferRow, decided: boolean): string | undefined {
  if (decided || offer.state === "accepted") return "This offer is accepted.";
  if (offer.state === "returned") return "This offer was returned.";
  if (offer.state === "withdrawn") return "This offer was withdrawn.";
  return undefined;
}

/**
 * Accept, the preview's one small primary, and Return in its overflow menu, for a reader who may
 * write. Each keeps its place once the offer is reviewed, here or in another session, and says
 * why it no longer runs, so focus stays on it. Accept confirms first, saying what it opens.
 */
function OfferActions({ offer }: { offer: ComponentOfferRow }) {
  const workspace = useWorkspace();
  const { locale, formatNumber, formatPlural } = useLedgerLocale();
  const review = useReviewComponentOffer();
  // Who accepting reaches, read only while a finding waits: the confirmation names them.
  const reaches = offer.state === "offered" && offer.kind === "finding";
  const consumers = useComponentConsumers(reaches ? offer.defined_component_id : null);
  const { confirm, confirmation } = useConfirmation();
  const [decided, setDecided] = useState(false);
  const [returning, setReturning] = useState(false);
  if (workspace.role === "viewer") return null;
  const waits = waitsFor(offer, decided);
  const acceptWaits =
    waits ??
    (reaches && consumers.data === undefined
      ? consumers.isError
        ? "Could not read which programs accepting reaches."
        : "Reading which programs accepting reaches…"
      : undefined);
  const accept = async () => {
    if (acceptWaits) return;
    const reach = consumers.data
      ? offerReach(
          { programId: offer.program_id, definedComponentId: offer.defined_component_id },
          consumers.data.systems,
        )
      : [];
    const others = reach.filter((program) => !program.offering).map((p) => p.programName);
    const version = formatNumber(offer.version);
    const opens =
      offer.kind === "determinations"
        ? `Accepting publishes its ${formatPlural(offer.items, { one: "{count} determination", other: "{count} determinations" })} as an assessment of version ${version}, which every program built from it inherits.`
        : others.length
          ? `Accepting opens an operational issue in each of the ${formatPlural(others.length, { one: "{count} other program", other: "{count} other programs" })} built from version ${version} that holds none for it: ${new Intl.ListFormat(locale, { type: "conjunction" }).format(others)}. ${offer.program_name} keeps its own.`
          : `No other program is built from version ${version}, so accepting opens no issue. ${offer.program_name} keeps its own.`;
    const requestId = crypto.randomUUID();
    const answered: { review?: ReviewedComponentOffer } = {};
    const accepted = await confirm({
      title: "Accept offer?",
      description: opens,
      confirmLabel: componentOfferVerbs.accept,
      variant: "primary",
      failureTitle: "The offer was not accepted",
      action: async () => {
        answered.review = await review.mutateAsync({
          offerId: offer.id,
          expectedRevision: offer.revision,
          decision: "accepted",
          requestId,
        });
      },
    });
    if (!accepted) return;
    setDecided(true);
    toast.add({
      type: "success",
      title: "Offer accepted",
      description:
        offer.kind === "determinations"
          ? `${formatPlural(answered.review?.determinations ?? offer.items, { one: "{count} determination", other: "{count} determinations" })} published.`
          : `${formatPlural(answered.review?.issues.length ?? 0, { one: "{count} operational issue", other: "{count} operational issues" })} opened.`,
    });
  };
  return (
    <>
      <Button
        size="small"
        variant="primary"
        onClick={() => void accept()}
        {...(acceptWaits ? { disabledReason: acceptWaits } : {})}
      >
        {componentOfferVerbs.accept}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              icon={<MoreHorizontal />}
              label="More actions"
              size="small"
              variant="subtle"
            />
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              if (!waits) setReturning(true);
            }}
            {...(waits ? { disabledReason: waits } : {})}
          >
            Return offer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {returning && (
        <ReturnOfferDialog
          offer={offer}
          onReturned={() => setDecided(true)}
          onClose={() => setReturning(false)}
        />
      )}
      {confirmation}
    </>
  );
}

type ReturnField = "note";

/**
 * Return offer: a Dialog that asks why, at the revision the reader saw. A dirty close asks first,
 * a pending return holds the Dialog, and a refusal (an offer reviewed or withdrawn elsewhere,
 * changed since) is said inside it with the note kept; sending it again answers as it first did.
 */
function ReturnOfferDialog({
  offer,
  onReturned,
  onClose,
}: {
  offer: ComponentOfferRow;
  onReturned: () => void;
  onClose: () => void;
}) {
  const formId = useId();
  const [open, setOpen] = useState(true);
  const [opener] = useState(currentOpener);
  const [note, setNote] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [requestId] = useState(() => crypto.randomUUID());
  const returned = useRef(false);
  const submitRef = useRef<HTMLButtonElement>(null);
  const feedback = useFormFeedback<ReturnField>();
  const review = useReviewComponentOffer();
  const guard = useDraftGuard({
    dirty: note.trim() !== "",
    onClose: () => setOpen(false),
    description: "The reason you wrote will be lost.",
  });
  const issues: FormIssue<ReturnField>[] = note.trim()
    ? []
    : [{ field: "note", message: REVIEW_NEEDS_NOTE }];
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy) return;
    setFailure(null);
    if (!feedback.report(issues)) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      await review.mutateAsync({
        offerId: offer.id,
        expectedRevision: offer.revision,
        decision: "returned",
        note,
        requestId,
      });
      returned.current = true;
      onReturned();
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(`${causeText(cause)} Your reason is kept, and returning again sends it once.`);
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
        if (returned.current)
          toast.add({ type: "success", title: "Offer returned", description: offer.title });
        onClose();
      }}
    >
      <DialogContent
        width="medium"
        initialFocus={() => feedback.node("note") ?? true}
        finalFocus={() => (opener?.isConnected ? opener : true)}
      >
        <DialogHeader>
          <DialogTitle>Return offer</DialogTitle>
          <DialogDescription>{offer.title}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {failure ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The offer was not returned</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy}>
                <TextField
                  label="Why it is returned"
                  value={note}
                  onChange={setNote}
                  required
                  multiline
                  autoResize
                  rows={4}
                  description={`${offer.program_name} reads this, and may offer it again.`}
                  error={errors.get("note")}
                  controlRef={feedback.ref("note")}
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
          >
            Return offer
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
