import { useConfirmation, discardChanges } from "@/components/app/confirmation";
import { useId, useState } from "react";
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
import type { ParameterOverride, TailoringDecision } from "@/lib/program-wizard";
import {
  previewProgramTailoring,
  type ProgramTailoringPreview,
  type WizardParameterPreview,
} from "@/lib/program-wizard-reference";
import { TextField } from "../fields";
import type { ReferenceData } from "./use-reference-data";

/** Set values for a parameter used by the effective control set, with the source's choices and guidance beside it. */
export function ParameterPicker({
  open,
  onClose,
  title,
  decisions,
  parameters,
  onChange,
  readOnly = false,
  catalogRevisionId,
  baseResolutionId,
  data,
  preview,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  decisions: TailoringDecision[];
  parameters: ParameterOverride[];
  onChange: (next: ParameterOverride[]) => void;
  readOnly?: boolean | undefined;
  catalogRevisionId: string;
  baseResolutionId: string;
  data: ReferenceData;
  preview: ProgramTailoringPreview;
}) {
  const { confirm, confirmation } = useConfirmation();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const shown = preview.parameters.filter((item) =>
    `${item.parameter.source_id} ${item.parameter.label ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const parameter = preview.parameters.find((item) => item.parameter.id === selected);
  async function canLeave() {
    return !dirty || (await confirm(discardChanges("Discard the unrecorded parameter override?")));
  }
  async function close() {
    if (await canLeave()) {
      setDirty(false);
      onClose();
    }
  }
  return (
    <Sheet
      open={open}
      onOpenChange={(next, details) => {
        if (!next) {
          details.cancel();
          void close();
        }
      }}
    >
      <SheetContent side="end" style={{ maxWidth: 1040 }}>
        <SheetHeader>
          <SheetTitle>
            {readOnly ? "Parameters" : "Set parameter values"} · {title}
          </SheetTitle>
          <SheetDescription>
            {readOnly
              ? "Each parameter of the effective control set with its recorded value and where it comes from."
              : "Override a parameter used by the effective control set. Each override records its values and rationale."}
          </SheetDescription>
        </SheetHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto px-200 py-150">
          <WorkPane
            listWidth={300}
            listLabel={
              <Input
                aria-label="Search parameters"
                placeholder="Find a parameter"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            }
            list={
              <>
                {shown.map((item) => (
                  <WorkPane.Row
                    key={item.parameter.id}
                    id={item.parameter.source_id}
                    title={item.parameter.label || "Parameter"}
                    meta={
                      item.origin === "unset"
                        ? "No recorded value"
                        : `${item.origin} · ${item.values.join("; ")}`
                    }
                    isActive={item.parameter.id === selected}
                    onSelect={async () => {
                      if (await canLeave()) {
                        setDirty(false);
                        setSelected(item.parameter.id);
                      }
                    }}
                  />
                ))}
              </>
            }
            detail={
              parameter ? (
                <ParameterEditor
                  key={parameter.parameter.id}
                  item={parameter}
                  decisions={decisions}
                  parameters={parameters}
                  onChange={onChange}
                  readOnly={readOnly}
                  data={data}
                  catalogRevisionId={catalogRevisionId}
                  baseResolutionId={baseResolutionId}
                  onDirty={setDirty}
                />
              ) : (
                <p className="font-body-small text-subtle">
                  Select a parameter to inspect its source definition and set values.
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
      {confirmation}
    </Sheet>
  );
}

function ParameterEditor({
  item,
  decisions,
  parameters,
  onChange,
  readOnly,
  data,
  catalogRevisionId,
  baseResolutionId,
  onDirty,
}: {
  item: WizardParameterPreview;
  decisions: TailoringDecision[];
  parameters: ParameterOverride[];
  onChange: (next: ParameterOverride[]) => void;
  readOnly: boolean;
  data: ReferenceData;
  catalogRevisionId: string;
  baseResolutionId: string;
  onDirty: (dirty: boolean) => void;
}) {
  const id = useId();
  const existing = parameters.find((override) => override.parameterId === item.parameter.id);
  const [values, setValues] = useState(item.values.join("\n"));
  const [rationale, setRationale] = useState(existing?.rationale ?? "");
  const [error, setError] = useState("");
  const [recorded, setRecorded] = useState(false);
  const parameter = item.parameter;
  const control = data.controls.find((control) => control.id === parameter.control_id);
  function record() {
    const next = [
      ...parameters.filter((override) => override.parameterId !== parameter.id),
      {
        parameterId: parameter.id,
        values: values
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        rationale: rationale.trim(),
      },
    ];
    const result = previewProgramTailoring(
      { catalogRevisionId, baseResolutionId, tailoring: decisions, parameters: next },
      data,
    );
    if (result.errors.length) {
      setError(result.errors.join(" "));
      return;
    }
    onChange(next);
    setError("");
    setRecorded(true);
    onDirty(false);
  }
  return (
    <Stack space="space.200">
      <div>
        <h3 id={id} className="font-body-large font-semibold">
          {parameter.source_id}
        </h3>
        <p className="font-body-small text-subtle">{parameter.label}</p>
        {control ? (
          <p className="font-body-small text-subtle">
            {control.code} · {control.title}
          </p>
        ) : null}
      </div>
      {parameter.usage ? (
        <p className="font-body-small whitespace-pre-wrap">{parameter.usage}</p>
      ) : null}
      <KeyValue label="Current source">
        {item.origin === "unset" ? "No recorded value" : item.origin}
      </KeyValue>
      {readOnly ? (
        <KeyValue label="Values" wrap>
          {item.values.length ? item.values.join("; ") : "No recorded value"}
        </KeyValue>
      ) : null}
      {readOnly && item.rationale ? (
        <KeyValue label="Rationale" wrap>
          {item.rationale}
        </KeyValue>
      ) : null}
      {item.choices.length ? (
        <Section
          title={`Source choices${parameter.selection_count ? ` · ${parameter.selection_count.replaceAll("_", " ")}` : ""}`}
        >
          <Box as="ul" className="list-disc ps-200 font-body-small">
            {item.choices.map((choice) => (
              <li key={choice}>{choice}</li>
            ))}
          </Box>
        </Section>
      ) : null}
      {item.constraints.length ? (
        <Section title="Source constraints">
          <Stack space="space.100">
            {item.constraints.map((constraint) => (
              <p key={constraint} className="font-body-small whitespace-pre-wrap">
                {constraint}
              </p>
            ))}
          </Stack>
        </Section>
      ) : null}
      {item.guidelines.length ? (
        <Section title="Guidance">
          <Stack space="space.100">
            {item.guidelines.map((guideline) => (
              <p key={guideline} className="font-body-small whitespace-pre-wrap">
                {guideline}
              </p>
            ))}
          </Stack>
        </Section>
      ) : null}
      {readOnly ? null : (
        <>
          <TextField
            label="Parameter values"
            value={values}
            onChange={(value) => {
              setValues(value);
              setRecorded(false);
              onDirty(true);
            }}
            required
            multiline
            description="One value per line. Literal choices, when declared, must match the source."
          />
          <TextField
            label="Parameter override rationale"
            value={rationale}
            onChange={(value) => {
              setRationale(value);
              setRecorded(false);
              onDirty(true);
            }}
            required
            multiline
          />
          <Inline space="space.100">
            <Button
              variant="primary"
              disabled={!values.trim() || !rationale.trim()}
              onClick={record}
            >
              Record parameter override
            </Button>
            {existing ? (
              <Button
                variant="subtle"
                onClick={() => {
                  onChange(parameters.filter((override) => override.parameterId !== parameter.id));
                  setRecorded(false);
                  onDirty(false);
                  setError("");
                }}
              >
                Remove override
              </Button>
            ) : null}
          </Inline>
          {error ? (
            <p role="alert" className="font-body-small text-danger">
              {error}
            </p>
          ) : null}
          {recorded ? (
            <p role="status" className="font-body-small text-success">
              Parameter override recorded in the draft.
            </p>
          ) : null}
        </>
      )}
    </Stack>
  );
}
