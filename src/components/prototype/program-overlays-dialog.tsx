import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { AlertCircle, ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  announce,
  Button,
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
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet,
  Heading,
  IconButton,
  Inline,
  KeyValue,
  Stack,
  Text,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { causeText } from "@/components/app/sentence";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { usePublishedOverlays, type ProgramBaseline } from "@/lib/baseline-reads";
import { idSet, useRows } from "@/lib/models";
import {
  OVERLAY_LIMIT,
  ProgramOverlaysError,
  newerVersion,
  newestVersions,
  restackPreview,
  stackShape,
  tailoringDecisions,
  useSetProgramBaselineOverlays,
  type ProgramOverlaysAnswer,
  type StackOverlay,
} from "@/lib/program-overlays";
import { BaselineStackTable } from "./baseline-stack";
import { QueryState } from "./work-common";

/** An overlay's name in the stack: a version after the first says which it is, since versions share a name. */
const versionTitle = (overlay: { title: string; version: number }) =>
  overlay.version > 1 ? `${overlay.title} · version ${overlay.version}` : overlay.title;

/** How many control codes a line of the summary names before it counts the rest. */
const NAMED = 6;
const plural = (count: number, one: string, other = `${one}s`) => (count === 1 ? one : other);

/*
 * Edit overlays: the overlays of one program profile's control baseline, added, removed and moved,
 * with the program's tailoring kept last. The stack table reads the draft as the command will
 * author it, and What changes says, before anything is sent, how the baseline moves against the
 * one the program has now, which systems move with it and which SSP revisions keep theirs. The
 * change is confirmed, then applied in one request (`set_program_baseline_overlays`).
 */
export function ProgramOverlaysDialog({
  programId,
  baseline,
  onChanged,
  onClose,
}: {
  programId: string;
  baseline: ProgramBaseline;
  /** Called as the dialog closes on a stack it changed, before `onClose`. */
  onChanged?: (() => void) | undefined;
  /** Called once the dialog has finished closing. */
  onClose: () => void;
}) {
  const { formatNumber } = useLedgerLocale();
  const formId = useId();
  // The control baseline as the dialog opened on it: the draft, the preview and the revision the
  // change is made at all read it, whatever refreshes behind the dialog. Another session's change
  // in the meantime is the command's to refuse.
  const [opened] = useState(baseline);
  const [shape] = useState(() => stackShape(opened.derivation));
  const [overlayIds, setOverlayIds] = useState<string[]>(shape.overlayIds);
  // One request a choice: the same overlays sent again are the same request, so a retry after a
  // lost answer applies nothing twice; another choice is another request.
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [open, setOpen] = useState(true);
  const [failure, setFailure] = useState<string | null>(null);
  const applied = useRef<ProgramOverlaysAnswer | null>(null);
  const submitRef = useRef<HTMLButtonElement | null>(null);
  const addRef = useRef<HTMLButtonElement | null>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const feedback = useFormFeedback<string>();
  const save = useSetProgramBaselineOverlays();
  const dirty = overlayIds.join("|") !== shape.overlayIds.join("|");
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: "The overlays you added, removed or moved will be lost.",
  });

  // The overlays the stack can take, and what the summary says beside it: the tailoring's
  // parameter values, the systems that adopt the baseline and the SSP revisions written against it.
  const published = usePublishedOverlays();
  const tailoringHop = shape.tailoring ? opened.hops[0] : undefined;
  const settings = useRows(
    "profile_parameter_settings",
    { profile_revision_id: tailoringHop?.profileRevisionId ?? "" },
    { columns: ["id", "parameter_id", "parameter_source_id"], enabled: !!tailoringHop },
  );
  const parameterIds = idSet(settings.data?.map((setting) => setting.parameter_id));
  const parameters = useRows(
    "parameters",
    { id: parameterIds },
    { columns: ["id", "control_id"], enabled: parameterIds.length > 0 },
  );
  const systems = useRows(
    "systems",
    { program_id: programId, adopted_profile_resolution_id: opened.resolutionId },
    { columns: ["id", "code"] },
  );
  const ssps = useRows(
    "ssp_revisions",
    { profile_resolution_id: opened.resolutionId },
    { columns: ["id", "system_id", "version_number", "state"] },
  );
  const summaryReads = [
    systems,
    ssps,
    ...(tailoringHop ? [settings] : []),
    ...(parameterIds.length ? [parameters] : []),
  ];

  const catalogId = opened.catalog?.id;
  const byId = useMemo(
    () =>
      new Map(
        published.overlays
          .filter((overlay) => overlay.catalogRevisionId === catalogId)
          .map((overlay) => [overlay.id, overlay]),
      ),
    [published.overlays, catalogId],
  );
  // An overlay of the stack now that is not on offer (a published overlay is never withdrawn, so
  // this is a read still on its way) keeps its saved title and decisions.
  const savedTitles = useMemo(
    () =>
      new Map(
        opened.derivation.layers.flatMap((layer) =>
          layer.overlayId ? [[layer.overlayId, layer.title] as const] : [],
        ),
      ),
    [opened.derivation],
  );
  const chosen = useMemo(
    (): StackOverlay[] =>
      overlayIds.map((id) => {
        const overlay = byId.get(id);
        return {
          id,
          title: overlay ? versionTitle(overlay) : (savedTitles.get(id) ?? "Overlay"),
          decisions: overlay?.decisions ?? [],
          parameters: overlay?.parameters ?? [],
        };
      }),
    [overlayIds, byId, savedTitles],
  );
  const tailoring = useMemo(() => {
    const decisions = tailoringDecisions(opened.derivation);
    if (!decisions) return null;
    const controls = new Map((parameters.data ?? []).map((row) => [row.id, row.control_id]));
    return {
      decisions,
      parameters: (settings.data ?? []).map((setting) => ({
        sourceId: setting.parameter_source_id,
        controlId: (setting.parameter_id && controls.get(setting.parameter_id)) ?? null,
      })),
    };
  }, [opened.derivation, settings.data, parameters.data]);
  const preview = useMemo(
    () => restackPreview(opened.derivation, chosen, tailoring),
    [opened.derivation, chosen, tailoring],
  );
  // Add overlay offers each overlay at its newest published version, and none the stack holds in
  // any version: a newer version of one it holds is taken in its place (below).
  const held = new Set(overlayIds.flatMap((id) => byId.get(id)?.code ?? []));
  const available = newestVersions([...byId.values()]).filter((overlay) => !held.has(overlay.code));
  // The overlays of the stack a newer version of which is published: each can take it in its place.
  const newer = overlayIds.flatMap((id) => {
    const version = newerVersion([...byId.values()], { id });
    const overlay = byId.get(id);
    return version && overlay ? [{ id, overlay, version }] : [];
  });
  const take = (item: (typeof newer)[number]) =>
    change(
      overlayIds.map((id) => (id === item.id ? item.version.id : id)),
      `${item.overlay.title} version ${item.version.version} takes the place of version ${item.overlay.version}.`,
    );
  const code = (id: string) => opened.controls.get(id)?.code ?? "A control";
  const named = (ids: readonly string[]) => {
    const codes = ids.map(code).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
    const shown = codes.slice(0, NAMED).join(", ");
    return codes.length > NAMED ? `${shown} and ${formatNumber(codes.length - NAMED)} more` : shown;
  };

  const found: FormIssue<string>[] = [];
  if (!dirty)
    found.push({
      field: "stack",
      message: "Add, remove or move an overlay, or cancel to keep the control baseline as it is.",
    });
  for (const id of preview.idle)
    found.push({
      field: `overlay:${id}`,
      message: `${chosen.find((overlay) => overlay.id === id)?.title ?? "An overlay"} changes nothing where it is in the stack. Remove it, or move it earlier.`,
    });
  const errors = feedback.submitted ? found : [];
  const loading = [...published.queries, ...summaryReads].some(
    (query) => query.data === undefined && !query.isError,
  );
  const unreadable = [...published.queries, ...summaryReads].some(
    (query) => query.data === undefined && query.isError,
  );
  const unavailable = unreadable
    ? "What the change needs could not be loaded."
    : loading
      ? "What the change needs is still loading."
      : undefined;
  const addUnavailable =
    overlayIds.length >= OVERLAY_LIMIT
      ? `A control baseline stacks at most ${formatNumber(OVERLAY_LIMIT)} overlays.`
      : available.length
        ? undefined
        : byId.size
          ? "Every published overlay for this catalog edition is in the stack."
          : "No overlay is published for this catalog edition. Overlays are created and published under Libraries, Overlays.";

  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);

  /**
   * A change of the draft: a new request, and focus kept in the dialog. A move keeps focus on the
   * control the reader pressed, on its row's new line (`keep`, its name); a control the change
   * takes away (a removed overlay's buttons, a menu with nothing left to add) hands focus to Add
   * overlay.
   */
  function change(next: string[], said: string, keep?: string) {
    // A control about to go hands focus on first, so the dialog never holds it with nothing in it.
    if (!keep) (addRef.current ?? submitRef.current)?.focus();
    setOverlayIds(next);
    setRequestId(crypto.randomUUID());
    setFailure(null);
    announce(said);
    // Then, for a few frames, focus that still ends on nothing or on the dialog itself (where its
    // focus manager puts it when the focused control goes) is handed on again.
    let frames = 0;
    const settle = () => {
      const active = document.activeElement;
      if (!active || active === document.body || active.getAttribute("role") === "dialog") {
        const root = submitRef.current?.closest('[role="dialog"]');
        const kept = keep
          ? root?.querySelector<HTMLElement>(`[aria-label="${CSS.escape(keep)}"]`)
          : null;
        (kept ?? (addRef.current?.isConnected ? addRef.current : submitRef.current))?.focus();
      }
      if (frames++ < 20) requestAnimationFrame(settle);
    };
    requestAnimationFrame(settle);
  }
  const move = (index: number, by: -1 | 1) => {
    const next = [...overlayIds];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(index + by, 0, item);
    const title = chosen[index]?.title ?? "The overlay";
    change(
      next,
      `${title} now applies as layer ${index + by + 1}.`,
      `Move ${title} ${by < 0 ? "earlier" : "later"}`,
    );
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || unavailable) return;
    setFailure(null);
    if (!feedback.report(found)) return;
    const before = opened.derivation.selected.size;
    const after = preview.derivation.selected.size;
    const moving = systems.data?.length ?? 0;
    const kept = ssps.data?.length ?? 0;
    const confirmed = await guard.confirm({
      title: "Change the control baseline?",
      description: [
        `It goes from ${formatNumber(before)} to ${formatNumber(after)} controls: ${formatNumber(preview.added.length)} added and ${formatNumber(preview.removed.length)} removed, which changes what the program owes.`,
        moving
          ? `${formatNumber(moving)} ${plural(moving, "system")} that ${moving === 1 ? "adopts" : "adopt"} it ${moving === 1 ? "moves" : "move"} with it.`
          : "",
        kept
          ? `${formatNumber(kept)} SSP ${plural(kept, "revision")} ${kept === 1 ? "keeps" : "keep"} the baseline ${kept === 1 ? "it was" : "they were"} written against.`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
      confirmLabel: "Edit overlays",
      variant: "primary",
    });
    if (!confirmed) return;
    // The fields lock while the change runs; the primary stays focusable while it loads.
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      applied.current = await save.mutateAsync({
        choiceId: opened.choiceId,
        expectedRevision: opened.revision,
        requestId,
        overlayIds,
      });
      guard.finish();
      guard.complete();
    } catch (cause) {
      guard.finish();
      setFailure(
        cause instanceof ProgramOverlaysError && cause.conflict
          ? "The control baseline changed in another session. Nothing was changed here: cancel, then open Edit overlays again to start from the stack as it is now."
          : `${causeText(cause)} Nothing was changed, and applying it again will not apply it twice.`,
      );
    }
  }
  function closed() {
    const answer = applied.current;
    if (answer) {
      const { after, added, removed } = answer.controls;
      toast.add({
        type: "success",
        title: answer.changed ? "Overlays changed" : "Overlays unchanged",
        description: answer.changed
          ? [
              `The control baseline has ${formatNumber(after)} controls: ${formatNumber(added)} added, ${formatNumber(removed)} removed.`,
              answer.systems.length
                ? `${answer.systems.map((system) => system.code).join(", ")} ${answer.systems.length === 1 ? "adopts" : "adopt"} it now.`
                : "",
            ]
              .filter(Boolean)
              .join(" ")
          : "The stack already held these overlays in this order.",
      });
      if (answer.changed) onChanged?.();
    }
    onClose();
  }

  const reference = opened.reference?.title ?? "the reference baseline";
  const carry = preview.tailoring;
  const leftOut = carry
    ? [
        ...(carry.alreadySelected.length
          ? [`Its adds the overlays now make: ${named(carry.alreadySelected)}.`]
          : []),
        ...(carry.notInBaseline.length
          ? [`Its removals the overlays now make: ${named(carry.notInBaseline)}.`]
          : []),
        ...(carry.parametersDropped.length
          ? [
              `Its parameter values for controls the new stack leaves out: ${carry.parametersDropped.join(", ")}.`,
            ]
          : []),
      ]
    : [];
  const sspRevisions = (ssps.data ?? [])
    .map((row) => {
      const system = systems.data?.find((item) => item.id === row.system_id)?.code;
      return `${system ? `${system} ` : ""}SSP ${formatNumber(row.version_number)}`;
    })
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
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
        if (!next) closed();
      }}
    >
      <DialogContent width="large" initialFocus={() => addRef.current ?? true}>
        <DialogHeader>
          <DialogTitle>Edit overlays</DialogTitle>
          <DialogDescription>
            The overlays stack on {reference} in the order they apply. The program’s tailoring stays
            last.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.300">
              {failure ? (
                <Alert ref={failureRef} variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The overlays were not changed</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              {newer.length > 0 && (
                <Alert tone="information">
                  <AlertTitle>
                    {newer.length === 1
                      ? `A newer version of ${newer[0]!.overlay.title} is published`
                      : "Newer versions of overlays in the stack are published"}
                  </AlertTitle>
                  <AlertDescription>
                    {newer
                      .map(
                        (item) =>
                          `${item.overlay.title}: the stack applies version ${formatNumber(item.overlay.version)}, and version ${formatNumber(item.version.version)} is published.`,
                      )
                      .join(" ")}{" "}
                    Taking one applies it in the older one&rsquo;s place, and the layers above it
                    again.
                  </AlertDescription>
                  <AlertAction>
                    {newer.map((item) => (
                      <Button
                        key={item.id}
                        size="small"
                        variant="secondary"
                        disabled={guard.busy}
                        onClick={() => take(item)}
                      >
                        {newer.length === 1
                          ? `Take version ${formatNumber(item.version.version)}`
                          : `Take version ${formatNumber(item.version.version)} of ${item.overlay.title}`}
                      </Button>
                    ))}
                  </AlertAction>
                </Alert>
              )}
              <QueryState queries={published.queries}>
                <FieldSet disabled={guard.busy}>
                  <FieldLegend variant="label">Overlays</FieldLegend>
                  <FieldDescription>
                    Each overlay applies to the baseline beneath it. Move one to change what it
                    finds there.
                  </FieldDescription>
                  <BaselineStackTable
                    label={`How ${reference} becomes the program's control baseline`}
                    reference={{ name: reference, count: opened.derivation.baselineCount }}
                    layers={preview.derivation.layers}
                    resultLabel="Program control baseline"
                    actions={(layer) => {
                      // The overlay's place among the overlays: a second baseline may come before them.
                      const index = overlayIds.indexOf(layer.key);
                      return layer.kind === "overlay" ? (
                        <Inline space="space.050" alignInline="end">
                          <IconButton
                            size="small"
                            variant="subtle"
                            icon={<ArrowUp />}
                            label={`Move ${layer.title} earlier`}
                            {...(index === 0 ? { disabledReason: "It is the first overlay." } : {})}
                            onClick={() => move(index, -1)}
                          />
                          <IconButton
                            size="small"
                            variant="subtle"
                            icon={<ArrowDown />}
                            label={`Move ${layer.title} later`}
                            {...(index === overlayIds.length - 1
                              ? { disabledReason: "It is the last overlay." }
                              : {})}
                            onClick={() => move(index, 1)}
                          />
                          <IconButton
                            ref={feedback.ref(`overlay:${layer.key}`)}
                            size="small"
                            variant="subtle"
                            icon={<X />}
                            label={`Remove ${layer.title} from the stack`}
                            onClick={() =>
                              change(
                                overlayIds.filter((id) => id !== layer.key),
                                `${layer.title} removed from the stack.`,
                              )
                            }
                          />
                        </Inline>
                      ) : null;
                    }}
                  />
                  <Inline>
                    {addUnavailable ? (
                      <Button
                        ref={(node: HTMLButtonElement | null) => {
                          addRef.current = node;
                          feedback.ref("stack")(node);
                        }}
                        size="small"
                        variant="secondary"
                        iconBefore={<Plus />}
                        disabledReason={addUnavailable}
                      >
                        Add overlay
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              ref={(node: HTMLButtonElement | null) => {
                                addRef.current = node;
                                feedback.ref("stack")(node);
                              }}
                              size="small"
                              variant="secondary"
                              iconBefore={<Plus />}
                            >
                              Add overlay
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="start">
                          {available.map((overlay) => (
                            <DropdownMenuItem
                              key={overlay.id}
                              onClick={() =>
                                change(
                                  [...overlayIds, overlay.id],
                                  `${overlay.title} added as layer ${overlayIds.length + 1}.`,
                                )
                              }
                            >
                              {overlay.code} · {overlay.title}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </Inline>
                  {errors.map((issue) => (
                    <FieldError key={issue.field}>{issue.message}</FieldError>
                  ))}
                </FieldSet>
              </QueryState>
              <Stack space="space.150">
                <Heading size="overlay">What changes</Heading>
                <QueryState queries={summaryReads}>
                  <Stack space="space.150">
                    <KeyValue.Group labelWidth="wide">
                      <KeyValue label="Controls now">
                        {formatNumber(opened.derivation.selected.size)}
                      </KeyValue>
                      <KeyValue label="Controls after">
                        {formatNumber(preview.derivation.selected.size)}
                      </KeyValue>
                      <KeyValue label="Added">
                        {formatNumber(preview.added.length)}
                        {preview.added.length ? ` · ${named(preview.added)}` : ""}
                      </KeyValue>
                      <KeyValue label="Removed">
                        {formatNumber(preview.removed.length)}
                        {preview.removed.length ? ` · ${named(preview.removed)}` : ""}
                      </KeyValue>
                      {carry ? (
                        <KeyValue label="Program tailoring">
                          {carry.authored
                            ? `${formatNumber(carry.decisions)} ${plural(carry.decisions, "decision")}, ${formatNumber(carry.parameters)} parameter ${plural(carry.parameters, "value")}`
                            : "Nothing left to change"}
                        </KeyValue>
                      ) : null}
                      <KeyValue label="Systems that move">
                        {formatNumber(systems.data?.length ?? 0)}
                        {systems.data?.length
                          ? ` · ${systems.data
                              .map((system) => system.code)
                              .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
                              .join(", ")}`
                          : ""}
                      </KeyValue>
                      <KeyValue label="SSP revisions kept">
                        {formatNumber(sspRevisions.length)}
                        {sspRevisions.length ? ` · ${sspRevisions.join(", ")}` : ""}
                      </KeyValue>
                    </KeyValue.Group>
                    {leftOut.length ? (
                      <Alert role="note">
                        <AlertTitle>
                          Part of the program’s tailoring no longer changes the baseline
                        </AlertTitle>
                        <AlertDescription>
                          {leftOut.join(" ")} The tailoring is carried onto the new stack without
                          them, and a later change does not bring them back.
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    <Text as="p" size="small" color="color.text.subtle">
                      An SSP revision keeps the baseline it was written against. Each system’s next
                      SSP revision takes the new one.
                    </Text>
                  </Stack>
                </QueryState>
              </Stack>
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
            Edit overlays
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
