import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
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
  ErrorSummary,
  FieldSet,
  Stack,
  toast,
} from "@ledger/design-system";
import { ChoiceField, ContextValue, TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { causeText } from "@/components/app/sentence";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import {
  OVERLAY_CODE_TAKEN,
  useSaveControlOverlay,
  type ControlOverlay,
} from "@/lib/control-overlays";
import { useRows } from "@/lib/models";

/**
 * The catalog editions an overlay can decide on, newest first, each named as the Catalog page
 * names it: the catalog's short name and the edition's version.
 */
export function useCatalogEditions() {
  const revisions = useRows("catalog_revisions", undefined, {
    columns: ["id", "catalog_id", "title", "version", "state"],
  });
  const catalogs = useRows("catalogs", undefined, { columns: ["id", "title"] });
  const named = useMemo(() => {
    const titles = new Map((catalogs.data ?? []).map((catalog) => [catalog.id, catalog.title]));
    return (revisions.data ?? []).map((row) => ({
      id: row.id,
      state: row.state,
      version: row.version,
      label: `${titles.get(row.catalog_id) ?? row.title} · ${row.version}`,
    }));
  }, [revisions.data, catalogs.data]);
  /** The published editions, which a new overlay may be created on. */
  const published = useMemo(
    () =>
      named
        .filter((row) => row.state === "published")
        .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true })),
    [named],
  );
  const ready = revisions.data !== undefined && catalogs.data !== undefined;
  return {
    queries: [revisions, catalogs],
    published,
    /** An edition's name in any state, once both reads are in. */
    label: (id: string | null | undefined) =>
      ready ? named.find((row) => row.id === id)?.label : undefined,
  };
}

/** The form's fields in the order they appear, which is the order their issues are listed in. */
type OverlayField = "code" | "title" | "edition" | "description";

/** The longest code and name the server keeps. */
const CODE_LIMIT = 100;
const NAME_LIMIT = 300;

/**
 * Create overlay, and Edit overlay for a draft's code, name and description. The catalog edition
 * is chosen once, when the overlay is created, and shows as labelled text afterwards. The
 * overlay's id is chosen once, so creating it again after a failure never makes a duplicate, and
 * an edit is saved at the revision the reader saw.
 */
export function OverlayDialog({
  overlay,
  onClose,
  onSaved,
}: {
  /** The draft to edit; unsaid, the dialog creates an overlay. */
  overlay?: Pick<
    ControlOverlay,
    "id" | "revision" | "code" | "title" | "description" | "catalog_revision_id"
  >;
  /** Called once the dialog has finished closing, after `onSaved` when the overlay was saved. */
  onClose: () => void;
  onSaved?: ((saved: ControlOverlay) => void | Promise<void>) | undefined;
}) {
  const formId = useId();
  const editing = !!overlay;
  const operation = editing ? "Edit overlay" : "Create overlay";
  const [id] = useState(() => overlay?.id ?? crypto.randomUUID());
  const [open, setOpen] = useState(true);
  const [code, setCode] = useState(overlay?.code ?? "");
  const [title, setTitle] = useState(overlay?.title ?? "");
  const [description, setDescription] = useState(overlay?.description ?? "");
  const [chosenEdition, setChosenEdition] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  // The code the server last refused as another overlay's: its field says so until it changes.
  const [takenCode, setTakenCode] = useState<string | null>(null);
  const saved = useRef<ControlOverlay | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const feedback = useFormFeedback<OverlayField>();
  const editions = useCatalogEditions();
  const save = useSaveControlOverlay();
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: editing
      ? "The changes you made to the overlay will be lost."
      : "The overlay details you entered will be lost.",
  });
  const loadError = editions.queries.find((query) => query.error)?.error;
  const ready = editions.queries.every((query) => query.data !== undefined);
  // The only published edition is the answer; with several, the reader chooses.
  const only = editions.published.length === 1 ? editions.published[0] : undefined;
  const edition = overlay?.catalog_revision_id ?? chosenEdition ?? only?.id ?? null;

  const found: FormIssue<OverlayField>[] = [];
  if (!code.trim()) found.push({ field: "code", message: "Enter a code for the overlay." });
  else if (code.trim().length > CODE_LIMIT)
    found.push({
      field: "code",
      message: `Shorten the code to ${CODE_LIMIT} characters or fewer.`,
    });
  else if (code.trim() === takenCode) found.push({ field: "code", message: OVERLAY_CODE_TAKEN });
  if (!title.trim()) found.push({ field: "title", message: "Enter a name for the overlay." });
  else if (title.trim().length > NAME_LIMIT)
    found.push({
      field: "title",
      message: `Shorten the name to ${NAME_LIMIT} characters or fewer.`,
    });
  if (!edition) found.push({ field: "edition", message: "Choose a catalog edition." });
  // Validate on submit, then on change: each field's error follows the value once submitted.
  const errors = new Map(
    feedback.submitted ? found.map((issue) => [issue.field, issue.message] as const) : [],
  );
  const unavailable =
    !editing && loadError
      ? "Load the catalog editions before creating the overlay."
      : !editing && !ready
        ? "The catalog editions are still loading."
        : undefined;

  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);

  function changed() {
    setDirty(true);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || unavailable) return;
    setFailure(null);
    if (!feedback.report(found) || !edition) return;
    // The fields lock while the save runs; the primary stays focusable while it loads.
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      saved.current = await save.mutateAsync({
        id,
        expectedRevision: overlay?.revision ?? null,
        details: { code, title, description, catalogRevisionId: edition },
      });
      setDirty(false);
      guard.finish();
      guard.complete();
    } catch (cause) {
      guard.finish();
      if (cause instanceof Error && cause.message === OVERLAY_CODE_TAKEN) {
        // About one field: its FieldError says it, and focus moves there.
        setTakenCode(code.trim());
        feedback.report([{ field: "code", message: OVERLAY_CODE_TAKEN }]);
        return;
      }
      setFailure(
        `${causeText(cause)} Your details are kept, and ${
          editing
            ? "saving them again will not repeat the change"
            : "creating it again will not make a duplicate"
        }.`,
      );
    }
  }
  async function closed() {
    const result = saved.current;
    try {
      if (result) {
        toast.add({ type: "success", title: editing ? "Overlay saved" : "Overlay created" });
        await onSaved?.(result);
      }
    } catch (cause) {
      toast.add({
        type: "error",
        title: "The overlay could not be opened",
        description: causeText(cause, ""),
      });
    } finally {
      onClose();
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
        if (!next) void closed();
      }}
    >
      <DialogContent width="medium" initialFocus={() => feedback.node("code") ?? true}>
        <DialogHeader>
          <DialogTitle>{operation}</DialogTitle>
          <DialogDescription>
            An overlay is a reusable set of control decisions a program stacks on a baseline.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {loadError ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The catalog editions could not be loaded</AlertTitle>
                  <AlertDescription>{causeText(loadError)}</AlertDescription>
                  <AlertAction>
                    <Button
                      size="small"
                      onClick={() =>
                        void Promise.all(
                          editions.queries
                            .filter((query) => query.error)
                            .map((query) => query.refetch()),
                        )
                      }
                    >
                      Retry loading editions
                    </Button>
                  </AlertAction>
                </Alert>
              ) : null}
              {failure ? (
                <Alert ref={failureRef} variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>
                    {editing ? "The overlay was not saved" : "The overlay was not created"}
                  </AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy}>
                <Stack space="space.200">
                  <TextField
                    label="Code"
                    value={code}
                    onChange={(value) => {
                      setCode(value);
                      changed();
                    }}
                    required
                    characterLimit={CODE_LIMIT}
                    description="A short identifier no other overlay uses."
                    error={errors.get("code")}
                    controlRef={feedback.ref("code")}
                  />
                  <TextField
                    label="Name"
                    value={title}
                    onChange={(value) => {
                      setTitle(value);
                      changed();
                    }}
                    required
                    characterLimit={NAME_LIMIT}
                    error={errors.get("title")}
                    controlRef={feedback.ref("title")}
                  />
                  {editing ? (
                    // The edition is fixed once the overlay exists: its decisions name its controls.
                    <ContextValue
                      label="Catalog edition"
                      value={editions.label(overlay.catalog_revision_id)}
                      query={{
                        isPending: !ready,
                        isError: !!loadError,
                      }}
                      noun="catalog edition"
                    />
                  ) : (
                    <ChoiceField
                      label="Catalog edition"
                      value={edition}
                      options={editions.published.map((row) => ({
                        value: row.id,
                        label: row.label,
                      }))}
                      onChange={(value) => {
                        setChosenEdition(value);
                        changed();
                      }}
                      required
                      placeholder={ready ? "Choose a catalog edition" : "Loading catalog editions…"}
                      description={
                        ready && !editions.published.length
                          ? "No catalog edition is published. Reference catalogs are loaded by a workspace administrator."
                          : "The overlay decides on this edition’s controls. It cannot change later."
                      }
                      error={errors.get("edition")}
                      controlRef={feedback.ref("edition")}
                    />
                  )}
                  <TextField
                    label="Description"
                    value={description}
                    onChange={(value) => {
                      setDescription(value);
                      changed();
                    }}
                    multiline
                    autoResize
                    description="What the overlay is for and when a program should apply it."
                    controlRef={feedback.ref("description")}
                  />
                </Stack>
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
            disabledReason={unavailable}
          >
            {operation}
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
