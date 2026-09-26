import { StatusBadge } from "@/components/app/status";
import { discardChanges, useConfirmation } from "@/components/app/confirmation";
import { useFormFeedback } from "@/components/app/form-feedback";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import type { Row } from "@/lib/models";
import type { TailoringDecision } from "@/lib/program-wizard";
import { controlPublicationStatuses } from "@/lib/status";
import {
  Alert,
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Heading,
  HeadingLevelProvider,
  Inline,
  KeyValue,
  Prose,
  SearchField,
  Section,
  Stack,
  Text,
  VisuallyHidden,
  WorkPane,
} from "@ledger/design-system";
import { type ComponentProps, useId, useMemo, useRef, useState, type RefObject } from "react";
import { ChoiceField, TextField } from "../fields";
import { ControlDetail } from "./control-detail";
import { focusAfterConfirmation, useRevealDetail } from "./reveal-detail";
import type { ReferenceData } from "./use-reference-data";

const unrecorded = "The control rationale you entered has not been recorded.";

type ControlFilter = "selected" | "outside" | "all";
const filters: { value: ControlFilter; label: string }[] = [
  { value: "selected", label: "In effective set" },
  { value: "outside", label: "Outside effective set" },
  { value: "all", label: "All catalog controls" },
];

/** Inspect a catalog control and record whether the profile tailors it out of the base or in from the catalog. */
export function ControlPicker({
  open,
  onClose,
  initialControlId,
  finalFocus,
  decisions,
  onChange,
  readOnly = false,
  baseControlIds,
  selectedControlIds,
  catalogRevisionId,
  data,
}: {
  open: boolean;
  onClose: () => void;
  /** Where focus goes when the dialog closes, when the opener may have moved. */
  finalFocus?: ComponentProps<typeof DialogContent>["finalFocus"] | undefined;
  /** The control whose decision to edit: the dialog opens on it, with focus on its heading. */
  initialControlId: string | null;
  decisions: TailoringDecision[];
  onChange: (next: TailoringDecision[]) => void;
  readOnly?: boolean | undefined;
  baseControlIds: string[];
  selectedControlIds: ReadonlySet<string>;
  catalogRevisionId: string;
  data: ReferenceData;
}) {
  const formId = useId();
  const [search, setSearch] = useState("");
  // The effective set first: it is what the profile selects. A control that is tailored out is not
  // in it, so editing one opens on the whole catalog.
  const [filter, setFilter] = useState<ControlFilter>(() =>
    initialControlId && !selectedControlIds.has(initialControlId) ? "all" : "selected",
  );
  const [selected, setSelected] = useState(initialControlId);
  const [editorDirty, setEditorDirty] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { detailRef, headingRef, arm, showRow } = useRevealDetail(selected);
  const guard = useDraftGuard({ dirty: editorDirty, onClose, description: unrecorded });
  const { confirm, confirmation } = useConfirmation();
  const inCatalog = useMemo(
    () =>
      data.controls
        .filter((control) => control.catalog_revision_id === catalogRevisionId)
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    [data.controls, catalogRevisionId],
  );
  const matching = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? inCatalog.filter((control) =>
          `${control.code} ${control.title}`.toLowerCase().includes(query),
        )
      : inCatalog;
  }, [inCatalog, search]);
  const controls = useMemo(
    () =>
      matching.filter(
        (control) =>
          // The open row stays in the list after its decision moves it out of the filter.
          control.id === selected ||
          filter === "all" ||
          (filter === "selected"
            ? selectedControlIds.has(control.id)
            : !selectedControlIds.has(control.id)),
      ),
    [matching, filter, selectedControlIds, selected],
  );
  const control = data.controls.find((item) => item.id === selected);
  async function select(controlId: string) {
    if (controlId === selected) return;
    if (editorDirty && !(await confirm(discardChanges(unrecorded)))) return;
    setEditorDirty(false);
    arm();
    setSelected(controlId);
  }
  async function remove(target: Row<"controls">) {
    if (
      !(await confirm({
        title: "Remove this decision?",
        description: `${target.code} returns to what the base profile selects, and its rationale is discarded from the draft.`,
        confirmLabel: "Remove decision",
        variant: "danger",
      }))
    )
      return false;
    onChange(decisions.filter((item) => item.controlId !== target.id));
    // The Remove button goes with the decision; the control's heading stays.
    focusAfterConfirmation(() => headingRef.current);
    return true;
  }
  const outsideMatches = matching.length - controls.length;
  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (!next) {
          details.cancel();
          void guard.close();
        }
      }}
    >
      <DialogContent
        width="xlarge"
        {...(finalFocus ? { finalFocus } : {})}
        initialFocus={() => {
          if (!initialControlId) return searchRef.current ?? true;
          showRow(controls.findIndex((item) => item.id === initialControlId));
          return headingRef.current ?? true;
        }}
      >
        <DialogHeader>
          <DialogTitle>{readOnly ? "Inspect controls" : "Tailor controls"}</DialogTitle>
          <DialogDescription>
            {readOnly
              ? "Each catalog control with the decision recorded for it."
              : "Choose a control, then record why it is tailored out or in."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Stack space="space.200">
            <Inline space="space.200" alignBlock="end" shouldWrap>
              <div className="w-layout-rail max-w-full">
                <ChoiceField
                  label="Show"
                  value={filter}
                  onChange={(value) => setFilter((value as ControlFilter | null) ?? "selected")}
                  options={filters}
                />
              </div>
              <Text size="small" color="color.text.subtle">
                {controls.length} matching {controls.length === 1 ? "control" : "controls"}
              </Text>
            </Inline>
            <WorkPane
              listWidth={300}
              listLabel={
                <>
                  <VisuallyHidden>Catalog controls</VisuallyHidden>
                  <SearchField
                    ref={searchRef}
                    size="small"
                    aria-label="Search catalog controls"
                    placeholder="Find a control"
                    value={search}
                    onValueChange={setSearch}
                  />
                </>
              }
              list={controls.map((item) => (
                <WorkPane.Row
                  key={item.id}
                  id={item.code}
                  title={
                    <>
                      {item.title}
                      {item.id === selected ? <VisuallyHidden>(selected)</VisuallyHidden> : null}
                    </>
                  }
                  meta={
                    selectedControlIds.has(item.id) ? "In effective set" : "Outside effective set"
                  }
                  isActive={item.id === selected}
                  onSelect={() => void select(item.id)}
                />
              ))}
              detail={
                <div ref={detailRef}>
                  {control ? (
                    <ControlDecisionEditor
                      key={control.id}
                      formId={formId}
                      control={control}
                      decisions={decisions}
                      onChange={onChange}
                      onRemove={remove}
                      readOnly={readOnly}
                      baseIds={baseControlIds}
                      onDirty={setEditorDirty}
                      headingRef={headingRef}
                    />
                  ) : controls.length ? (
                    <Empty size="compact">
                      <EmptyHeader>
                        <EmptyTitle>No control chosen</EmptyTitle>
                        <EmptyDescription>
                          Choose a control to read its statement and record a decision.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <Empty size="compact">
                      <EmptyHeader>
                        <EmptyTitle>No control matches</EmptyTitle>
                        <EmptyDescription>
                          {outsideMatches > 0
                            ? `${outsideMatches} more ${outsideMatches === 1 ? "matches" : "match"} outside what this list shows.`
                            : "Change the search to find a catalog control."}
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        {filter !== "all" && outsideMatches > 0 ? (
                          <Button size="small" onClick={() => setFilter("all")}>
                            Show all catalog controls
                          </Button>
                        ) : search ? (
                          <Button
                            size="small"
                            onClick={() => {
                              setSearch("");
                              searchRef.current?.focus();
                            }}
                          >
                            Clear search
                          </Button>
                        ) : null}
                      </EmptyContent>
                    </Empty>
                  )}
                </div>
              }
            />
          </Stack>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Close</DialogClose>
          {!readOnly && (
            <Button
              variant="primary"
              type="submit"
              form={formId}
              disabledReason={control ? undefined : "Choose a control first."}
            >
              Tailor controls
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
      {confirmation}
    </Dialog>
  );
}

function ControlDecisionEditor({
  formId,
  control,
  decisions,
  onChange,
  onRemove,
  readOnly,
  baseIds,
  onDirty,
  headingRef,
}: {
  formId: string;
  control: Row<"controls">;
  decisions: TailoringDecision[];
  onChange: (next: TailoringDecision[]) => void;
  onRemove: (control: Row<"controls">) => Promise<boolean>;
  readOnly: boolean;
  baseIds: string[];
  onDirty: (dirty: boolean) => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const existing = decisions.find((item) => item.controlId === control.id);
  const inBase = baseIds.includes(control.id);
  const action = inBase ? "exclude" : "include";
  const [rationale, setRationale] = useState(existing?.rationale ?? "");
  const [recorded, setRecorded] = useState<"recorded" | "removed" | null>(null);
  const feedback = useFormFeedback<"rationale">();
  // A removal empties the rationale on purpose: that is not an error until the next attempt.
  const error =
    feedback.submitted && recorded !== "removed" && !rationale.trim()
      ? "Enter a rationale for this control decision."
      : undefined;
  function record() {
    if (readOnly) return;
    setRecorded(null);
    if (
      !feedback.report(
        rationale.trim()
          ? []
          : [{ field: "rationale", message: "Enter a rationale for this control decision." }],
      )
    )
      return;
    onChange([
      ...decisions.filter((item) => item.controlId !== control.id),
      { controlId: control.id, action, rationale: rationale.trim() },
    ]);
    setRecorded("recorded");
    onDirty(false);
  }
  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        record();
      }}
    >
      <Stack space="space.200">
        <Stack space="space.075">
          <Heading size="xsmall" ref={headingRef} tabIndex={-1}>
            {control.code} · {control.title}
          </Heading>
          {control.status === "withdrawn" ? (
            <div>
              <StatusBadge statuses={controlPublicationStatuses} value={control.status} />
            </div>
          ) : null}
        </Stack>
        <HeadingLevelProvider>
          <Stack space="space.200">
            {readOnly ? (
              existing ? (
                <KeyValue.Group>
                  <KeyValue label="Decision">
                    {existing.action === "exclude" ? "Tailored out" : "Tailored in"}
                  </KeyValue>
                  <KeyValue label="Rationale" wrap>
                    <Prose>{existing.rationale || "Not recorded"}</Prose>
                  </KeyValue>
                </KeyValue.Group>
              ) : (
                <Text size="small" color="color.text.subtle">
                  {inBase ? "Selected by the base profile." : "Not selected by this profile."}
                </Text>
              )
            ) : (
              <Section
                title={inBase ? "Tailor out of the base profile" : "Tailor in from the catalog"}
              >
                <Stack space="space.150">
                  <TextField
                    label="Control decision rationale"
                    value={rationale}
                    onChange={(value) => {
                      setRationale(value);
                      setRecorded(null);
                      onDirty(value !== (existing?.rationale ?? ""));
                    }}
                    required
                    multiline
                    error={error}
                    controlRef={feedback.ref("rationale")}
                  />
                  {existing ? (
                    <div>
                      <Button
                        variant="subtle"
                        onClick={() =>
                          void onRemove(control).then((removed) => {
                            if (!removed) return;
                            setRationale("");
                            setRecorded("removed");
                            onDirty(false);
                          })
                        }
                      >
                        Remove decision
                      </Button>
                    </div>
                  ) : null}
                  {recorded === "recorded" ? (
                    <Alert role="status" tone="success">
                      <AlertTitle>Decision recorded in the draft.</AlertTitle>
                    </Alert>
                  ) : recorded === "removed" ? (
                    <Alert role="status">
                      <AlertTitle>Decision removed from the draft.</AlertTitle>
                    </Alert>
                  ) : null}
                </Stack>
              </Section>
            )}
            {/* Its Statement and Discussion head their own sections, at this level. */}
            <ControlDetail control={control} />
          </Stack>
        </HeadingLevelProvider>
      </Stack>
    </form>
  );
}
