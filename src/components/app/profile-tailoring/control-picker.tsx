import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Inline,
  Input,
  KeyValue,
  Section,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Stack,
  WorkPane,
} from "@ledger/design-system";
import type { Row } from "@/lib/models";
import type { TailoringDecision } from "@/lib/program-wizard";
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
  function close() {
    if (!editorDirty || window.confirm("Discard the unrecorded control rationale?")) {
      setEditorDirty(false);
      onClose();
    }
  }
  function select(controlId: string) {
    if (editorDirty && !window.confirm("Discard the unrecorded control rationale?")) return;
    setEditorDirty(false);
    setSelected(controlId);
  }
  return (
    <Sheet
      open={open}
      onOpenChange={(next, details) => {
        if (!next) {
          if (editorDirty && !window.confirm("Discard the unrecorded control rationale?")) {
            details.cancel();
            return;
          }
          setEditorDirty(false);
          onClose();
        }
      }}
    >
      <SheetContent side="end" style={{ maxWidth: 1040 }}>
        <SheetHeader>
          <SheetTitle>
            {readOnly ? "Controls" : "Tailor controls"} · {title}
          </SheetTitle>
          <SheetDescription>
            {readOnly
              ? "Inspect the source control and the decision recorded for it."
              : "Inspect the source control, then record an inclusion or exclusion with its rationale."}
          </SheetDescription>
        </SheetHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto px-200 py-150">
          <WorkPane
            listWidth={300}
            listLabel={
              <Stack space="space.100">
                <Input
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
        <SheetFooter>
          <Button variant="primary" onClick={close}>
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ControlDecisionEditor({
  control,
  decisions,
  onChange,
  readOnly,
  baseIds,
  onDirty,
}: {
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
  return (
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
              <Button
                variant="primary"
                disabled={!rationale.trim()}
                onClick={() => {
                  onChange([
                    ...decisions.filter((item) => item.controlId !== control.id),
                    { controlId: control.id, action, rationale: rationale.trim() },
                  ]);
                  setRecorded(true);
                  onDirty(false);
                }}
              >
                {action === "exclude" ? "Record exclusion" : "Record inclusion"}
              </Button>
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
  );
}
