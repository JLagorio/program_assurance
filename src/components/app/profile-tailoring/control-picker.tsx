import { discardChanges, useConfirmation } from "@/components/app/confirmation";
import type { Row } from "@/lib/models";
import type { TailoringDecision } from "@/lib/program-wizard";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Inline,
  Input,
  KeyValue,
  Section,
  Stack,
  WorkPane,
} from "@ledger/design-system";
import { useBlocker } from "@tanstack/react-router";
import { useId, useMemo, useState } from "react";
import { ChoiceField, TextField } from "../fields";
import { ControlDetail } from "./control-detail";
import type { ReferenceData } from "./use-reference-data";

/** Inspect a catalog control and record whether the profile tailors it out of the base or in from the catalog. */
export function ControlPicker({
  open,
  onClose,
  initialControlId,
  title,
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
  initialControlId: string | null;
  title: string;
  decisions: TailoringDecision[];
  onChange: (next: TailoringDecision[]) => void;
  readOnly?: boolean | undefined;
  baseControlIds: string[];
  selectedControlIds: ReadonlySet<string>;
  catalogRevisionId: string;
  data: ReferenceData;
}) {
  const formId = useId();
  const { confirm, confirmation } = useConfirmation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>("all");
  const [selected, setSelected] = useState(initialControlId);
  const [editorDirty, setEditorDirty] = useState(false);
  const controls = useMemo(
    () =>
      data.controls
        .filter((control) => control.catalog_revision_id === catalogRevisionId)
        .filter((control) =>
          `${control.code} ${control.title}`.toLowerCase().includes(search.toLowerCase()),
        )
        .filter(
          (control) =>
            filter === "all" ||
            (filter === "selected"
              ? selectedControlIds.has(control.id)
              : !selectedControlIds.has(control.id)),
        )
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    [data.controls, catalogRevisionId, search, filter, selectedControlIds],
  );
  const control = data.controls.find((item) => item.id === selected);
  async function close() {
    if (
      !editorDirty ||
      (await confirm(discardChanges("Discard the unrecorded control rationale?")))
    ) {
      setEditorDirty(false);
      onClose();
    }
  }
  async function select(controlId: string) {
    if (
      editorDirty &&
      !(await confirm(discardChanges("Discard the unrecorded control rationale?")))
    )
      return;
    setEditorDirty(false);
    setSelected(controlId);
  }
  useBlocker({
    shouldBlockFn: async () =>
      open &&
      editorDirty &&
      !(await confirm(discardChanges("Your control rationale has not been recorded."))),
    enableBeforeUnload: () => open && editorDirty,
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (!next) {
          details.cancel();
          void close();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 1040 }}>
        <DialogHeader>
          <DialogTitle>{readOnly ? "Inspect controls" : "Tailor controls"}</DialogTitle>
          <DialogDescription>
            {title}.{" "}
            {readOnly
              ? "Inspect the source control and the decision recorded for it."
              : "Inspect the source control, then record an inclusion or exclusion with its rationale."}
          </DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto px-200 py-150">
          <WorkPane
            listWidth={300}
            listLabel={
              <Stack space="space.100">
                <Input
                  autoFocus
                  aria-label="Search catalog controls"
                  placeholder="Find a control"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <ChoiceField
                  label="Control set filter"
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: "all", label: "All catalog controls" },
                    { value: "selected", label: "In effective set" },
                    { value: "outside", label: "Outside effective set" },
                  ]}
                />
                <span className="font-body-small text-subtle">
                  {controls.length} matching controls
                </span>
              </Stack>
            }
            list={
              <>
                {controls.map((item) => (
                  <WorkPane.Row
                    key={item.id}
                    id={item.code}
                    title={item.title}
                    meta={
                      selectedControlIds.has(item.id) ? "In effective set" : "Outside effective set"
                    }
                    isActive={item.id === selected}
                    onSelect={() => select(item.id)}
                  />
                ))}
              </>
            }
            detail={
              control ? (
                <ControlDecisionEditor
                  key={control.id}
                  formId={formId}
                  control={control}
                  decisions={decisions}
                  onChange={onChange}
                  readOnly={readOnly}
                  baseIds={baseControlIds}
                  onDirty={setEditorDirty}
                />
              ) : (
                <p className="font-body-small text-subtle">
                  Select a control to inspect its statement and tailor its selection.
                </p>
              )
            }
          />
        </Box>
        <DialogFooter>
          <Button variant="subtle" onClick={close}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button variant="primary" type="submit" form={formId} disabled={!control}>
              Tailor controls
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      {confirmation}
    </Dialog>
  );
}

function ControlDecisionEditor({
  formId,
  control,
  decisions,
  onChange,
  readOnly,
  baseIds,
  onDirty,
}: {
  formId: string;
  control: Row<"controls">;
  decisions: TailoringDecision[];
  onChange: (next: TailoringDecision[]) => void;
  readOnly: boolean;
  baseIds: string[];
  onDirty: (dirty: boolean) => void;
}) {
  const existing = decisions.find((item) => item.controlId === control.id);
  const action = baseIds.includes(control.id) ? "exclude" : "include";
  const [rationale, setRationale] = useState(existing?.rationale ?? "");
  const [recorded, setRecorded] = useState(false);
  const [error, setError] = useState("");
  function record() {
    if (readOnly) return;
    if (!rationale.trim()) {
      setError("Enter a rationale for this control decision.");
      return;
    }
    onChange([
      ...decisions.filter((item) => item.controlId !== control.id),
      { controlId: control.id, action, rationale: rationale.trim() },
    ]);
    setError("");
    setRecorded(true);
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
        {readOnly ? (
          existing ? (
            <Section title={existing.action === "exclude" ? "Tailored out" : "Tailored in"}>
              <KeyValue label="Rationale" wrap>
                {existing.rationale || "Not recorded"}
              </KeyValue>
            </Section>
          ) : (
            <p className="font-body-small text-subtle">
              {baseIds.includes(control.id)
                ? "Selected by the base profile."
                : "Not selected by this profile."}
            </p>
          )
        ) : (
          <Section
            title={
              action === "exclude" ? "Tailor out of the base profile" : "Tailor in from the catalog"
            }
          >
            <Stack space="space.150">
              <TextField
                label="Control decision rationale"
                value={rationale}
                onChange={(value) => {
                  setRationale(value);
                  setRecorded(false);
                  onDirty(value !== (existing?.rationale ?? ""));
                }}
                required
                multiline
              />
              <Inline space="space.100" shouldWrap>
                {existing ? (
                  <Button
                    variant="subtle"
                    onClick={() => {
                      onChange(decisions.filter((item) => item.controlId !== control.id));
                      setRationale("");
                      setRecorded(false);
                      onDirty(false);
                    }}
                  >
                    Remove decision
                  </Button>
                ) : null}
              </Inline>
              {error && (
                <p role="alert" className="font-body-small text-danger">
                  {error}
                </p>
              )}
              {recorded ? (
                <p role="status" className="font-body-small text-success">
                  Decision recorded in the draft.
                </p>
              ) : null}
            </Stack>
          </Section>
        )}
        <ControlDetail control={control} />
      </Stack>
    </form>
  );
}
