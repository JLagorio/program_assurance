import { useId, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  KeyValue,
  Stack,
  defineColumns,
  toast,
  useDataTable,
  useLedgerLocale,
} from "@ledger/design-system";
import { causeText } from "@/components/app/sentence";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import {
  useTakeProductVersion,
  useVariantVersionChanges,
  type VariantControlDelta,
  type VariantVersionChanges,
  type VersionElementChange,
} from "@/lib/product-assurance";
import { versionOutcomes } from "@/lib/status";
import { ProductCollection } from "./product-collection";
import { QueryState } from "./work-common";

/*
 * Taking a newer version of its product into a variant. A variant stays at the version it was
 * created from until somebody takes a newer one: the Product delta view says a newer version is
 * published, and Take version reviews what it would do, element by element, before it does it.
 * `variant_version_changes` is the review and `take_product_version` the command.
 */

/** The variant a version is taken into: its identity and the revision the reader saw. */
export type VersionTakeTarget = { id: string; code: string; name: string; revision: number };

type Outcome = keyof typeof versionOutcomes;
type Line = { id: string; element: string; outcome: Outcome; here: string | null };

const outcomeOf = (element: VersionElementChange): Outcome =>
  element.change === "kept" && element.modified ? "kept_modified" : element.change;

// A review in the order the command works: the headings name the columns and do not sort them.
const columns = defineColumns<Line>((c) => [
  c.text("element", { header: "Element", priority: 0, minWidth: 130, sortable: false }),
  // The outcome is what the review is read for: it stays in the row at a phone's width.
  c.status("outcome", {
    header: "Outcome",
    width: 140,
    priority: 1,
    statuses: versionOutcomes,
    sortable: false,
  }),
  c.text("here", { header: "Code in this system", width: 180, priority: 2, sortable: false }),
]);

/** The elements by what becomes of them, what is new first. */
function ElementsTable({ changes }: { changes: VariantVersionChanges }) {
  const lines = useMemo(
    () =>
      changes.elements.map((element) => ({
        id: `${element.change}:${element.code}`,
        element: `${element.code} ${element.name}`,
        outcome: outcomeOf(element),
        here: element.systemCode,
      })),
    [changes.elements],
  );
  const table = useDataTable({
    columns,
    data: lines,
    getRowId: (line) => line.id,
    label: "Elements by outcome",
    // A review inside a dialog has no columns to manage.
    pinnable: false,
    hideable: false,
  });
  return (
    <ProductCollection
      table={table}
      compact
      sort={false}
      keepQuestion={false}
      searchLabel="Find elements"
      empty={{
        illustration: "tree",
        title: "No elements to review",
        description: "This version's configuration holds no element.",
      }}
    />
  );
}

/**
 * Take version: what the newer version does to each element of the variant, then the command. An
 * element the variant kept follows the newer version and keeps what the program changed in it; an
 * element new in the product is created here; one the configuration no longer has becomes the
 * program's own. The variant is saved at the revision the reader saw, and a variant already at the
 * version is left as it is, so taking it again changes nothing.
 */
export function TakeProductVersionDialog({
  system,
  delta,
  version,
  finalFocus,
  onClose,
}: {
  system: VersionTakeTarget;
  delta: VariantControlDelta;
  /** The newer version, as the view offered it when the dialog opened. */
  version: { revisionId: string; version: number };
  /** Where focus goes once the version is taken and the note that offered it has left. */
  finalFocus: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const { formatNumber } = useLedgerLocale();
  const formId = useId();
  const [requestId] = useState(() => crypto.randomUUID());
  // The revision the review was opened on: a refetch after the take must not move it.
  const [expectedRevision] = useState(system.revision);
  const [open, setOpen] = useState(true);
  const [failure, setFailure] = useState<string | null>(null);
  const taken = useRef(false);
  const submitRef = useRef<HTMLButtonElement>(null);
  const changes = useVariantVersionChanges(system.id, version.revisionId);
  const take = useTakeProductVersion();
  const guard = useDraftGuard({ dirty: false, onClose: () => setOpen(false) });
  const data = changes.data;
  const label = `Take version ${formatNumber(version.version)}`;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || !data) return;
    setFailure(null);
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      const result = await take.mutateAsync({
        systemId: system.id,
        expectedRevision,
        revisionId: version.revisionId,
        requestId,
      });
      taken.current = true;
      const parts = [
        `${formatNumber(result.kept)} kept`,
        `${formatNumber(result.added)} added`,
        ...(result.released ? [`${formatNumber(result.released)} now the program's own`] : []),
      ];
      toast.add({
        type: "success",
        title: `${system.code} is on version ${formatNumber(result.version)}`,
        description: result.changed ? `${parts.join(", ")}.` : "It was at this version already.",
      });
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(
        `${causeText(cause)} Nothing was changed, and taking it again will not apply it twice.`,
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
        if (!next) onClose();
      }}
    >
      <DialogContent
        width="large"
        finalFocus={() => (taken.current ? (finalFocus.current ?? true) : true)}
      >
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            {delta.product.name} · {delta.product.configuration}, in {system.code}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {failure ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The version was not taken</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <QueryState queries={[changes]}>
                {data && (
                  <Stack space="space.200">
                    <KeyValue.Group labelWidth="wide">
                      <KeyValue label="Version now">{formatNumber(data.from.version)}</KeyValue>
                      <KeyValue label="Elements kept">{formatNumber(data.counts.kept)}</KeyValue>
                      <KeyValue label="Elements added">{formatNumber(data.counts.added)}</KeyValue>
                      <KeyValue label="Become the program's own">
                        {formatNumber(data.counts.released)}
                      </KeyValue>
                      <KeyValue label="Stay removed">
                        {formatNumber(data.counts.stays_removed)}
                      </KeyValue>
                      {data.counts.skipped > 0 && (
                        <KeyValue label="Not added">{formatNumber(data.counts.skipped)}</KeyValue>
                      )}
                    </KeyValue.Group>
                    {!data.assessment && (
                      <Alert role="note">
                        <AlertTitle>
                          Version {formatNumber(data.to.version)} has no published product
                          assessment
                        </AlertTitle>
                        <AlertDescription>
                          Until one is published, every control this system takes from the product
                          reads Not assessed.
                        </AlertDescription>
                      </Alert>
                    )}
                    {data.pinChanged > 0 && (
                      <Alert role="note">
                        <AlertTitle>
                          {formatNumber(data.pinChanged)}{" "}
                          {data.pinChanged === 1 ? "element uses" : "elements use"} a newer library
                          version
                        </AlertTitle>
                        <AlertDescription>
                          The components applied here stay as they are. Take the library version on
                          each element's Library tab.
                        </AlertDescription>
                      </Alert>
                    )}
                    <ElementsTable changes={data} />
                  </Stack>
                )}
              </QueryState>
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
              data
                ? undefined
                : changes.isError
                  ? "What the version changes could not be read."
                  : "What the version changes is still loading."
            }
          >
            {label}
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}

/**
 * A newer version of the variant's product is published: what the view reads is the version the
 * variant is at. A reader who may edit takes it from here.
 */
export function NewerVersionNote({
  delta,
  canTake,
  onTake,
}: {
  delta: VariantControlDelta;
  canTake: boolean;
  onTake: () => void;
}) {
  const { formatNumber } = useLedgerLocale();
  const update = delta.updateAvailable;
  if (!update) return null;
  return (
    <Alert role="status">
      <AlertTitle>
        Version {formatNumber(update.version)} of {delta.product.name} is published
      </AlertTitle>
      <AlertDescription>
        This system is at version {formatNumber(delta.product.version)}. Taking the newer version
        keeps what the program changed.
      </AlertDescription>
      {canTake && (
        <AlertAction>
          <Button size="small" variant="secondary" onClick={onTake}>
            Take version {formatNumber(update.version)}
          </Button>
        </AlertAction>
      )}
    </Alert>
  );
}
