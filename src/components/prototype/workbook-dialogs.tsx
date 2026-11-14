import { useMemo, useRef, useState } from "react";
import type { CellValidation } from "@ledger/spreadsheet-core";
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Textarea,
} from "@ledger/design-system";
import {
  mappingRelationships,
  type AssuranceWorkbookSnapshot,
  type MappingWorkbookChange,
  requirementWorkbookFields,
  type RequirementWorkbookField,
  workbookMappingControls,
  workbookMappingPlacement,
} from "@/lib/assurance-workbook";
import { labelFor } from "@/lib/records";

export function WorkbookSheetDialog({
  currentName,
  onSave,
  onClose,
}: {
  currentName?: string | undefined;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(currentName ?? "");
  const [error, setError] = useState("");
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            try {
              onSave(name.trim());
              onClose();
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Invalid sheet name.");
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{currentName ? "Rename sheet" : "Add analysis sheet"}</DialogTitle>
            <DialogDescription>
              Analysis sheets can contain values, formulas and formatting.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Stack space="space.200">
              {error && (
                <Alert tone="danger">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Field required>
                <FieldLabel>Sheet name</FieldLabel>
                <Input value={name} onValueChange={setName} maxLength={31} required />
              </Field>
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {currentName ? "Rename sheet" : "Add sheet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Stage a requirement's mapping of a control, as a control's Map a requirement records one: a
 * mapping of the whole control on each system the requirement is allocated to whose control
 * baseline selects the control, so every one of those systems' SSPs lists it. A requirement
 * allocated to no system is refused, never mapped on no system.
 */
export function WorkbookMappingDialog({
  snapshot,
  staged,
  onStage,
  onClose,
}: {
  snapshot: AssuranceWorkbookSnapshot;
  /** The mapping changes already staged: a system holding a staged mapping is passed over. */
  staged: readonly MappingWorkbookChange[];
  onStage: (changes: readonly MappingWorkbookChange[]) => void;
  onClose: () => void;
}) {
  const [requirementId, setRequirementId] = useState("");
  const [controlId, setControlId] = useState("");
  const [relationship, setRelationship] =
    useState<(typeof mappingRelationships)[number]>("maps_to");
  const [rationale, setRationale] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState("");
  const requirementRef = useRef<HTMLButtonElement>(null);
  const controlRef = useRef<HTMLButtonElement>(null);
  const requirements = useMemo(
    () =>
      snapshot.requirements.flatMap((record) =>
        record.content_id
          ? [{ value: record.id, label: `${record.code} · ${record.title ?? record.code}` }]
          : [],
      ),
    [snapshot.requirements],
  );
  const requirement = snapshot.requirements.find((item) => item.id === requirementId);
  const controls = useMemo(
    () => (requirementId ? workbookMappingControls(snapshot, requirementId) : []),
    [snapshot, requirementId],
  );
  const control = controls.find((item) => item.control_id === controlId);
  const reach = requirementId
    ? workbookMappingPlacement(snapshot, requirementId, control?.control_id ?? "", staged)
    : undefined;
  const placement = control ? reach : undefined;
  const code = requirement?.code ?? "The requirement";
  const systemCode = (id: string) =>
    snapshot.systems.find((system) => system.id === id)?.code ?? id;
  // What stops the requirement: it names no system a mapping could be recorded on.
  const requirementError = !requirementId
    ? attempted
      ? "Choose a requirement."
      : undefined
    : reach?.kind === "unallocated"
      ? `${code} is allocated to no system, so a mapping could name none. Allocate it to a system before mapping its controls.`
      : !controls.length
        ? `No system ${code} is allocated to has a control baseline that selects a control.`
        : undefined;
  const controlError =
    requirementError || !requirementId
      ? undefined
      : !control
        ? attempted
          ? "Choose a control."
          : undefined
        : placement?.kind === "mapped"
          ? `${code} maps ${control.control_code} on each of its systems whose control baseline selects it already.`
          : undefined;
  const controlDescription = !requirementId
    ? "Choose a requirement first. Its systems' control baselines say which controls it can map."
    : placement?.kind === "targets"
      ? `A mapping on ${placement.targets.map((target) => systemCode(target.systemId)).join(", ")}${
          placement.mapped
            ? `; ${placement.mapped} of its ${placement.eligible} systems map it already`
            : ""
        }.`
      : undefined;
  function stage() {
    setAttempted(true);
    setError("");
    if (!requirement?.content_id || requirementError) {
      requirementRef.current?.focus();
      return;
    }
    if (!control || placement?.kind !== "targets") {
      controlRef.current?.focus();
      return;
    }
    const contentId = requirement.content_id;
    try {
      onStage(
        placement.targets.map((target) => ({
          operation: "create" as const,
          id: crypto.randomUUID(),
          contentId,
          controlId: control.control_id,
          systemId: target.systemId,
          selectedControlId: target.selectedControlId,
          relationshipType: relationship,
          rationale: rationale.trim() || null,
        })),
      );
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not stage the mapping.");
    }
  }
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            stage();
          }}
        >
          <DialogHeader>
            <DialogTitle>Stage control mapping</DialogTitle>
            <DialogDescription>
              One mapping of the whole control on each system the requirement is allocated to whose
              control baseline selects it. Review and apply the proposal to record them.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Stack space="space.200">
              {error && (
                <Alert tone="danger" role="alert">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Field required invalid={requirementError ? true : undefined}>
                <FieldLabel>Requirement</FieldLabel>
                <Select<string>
                  items={requirements}
                  value={requirementId || null}
                  onValueChange={(value) => {
                    setRequirementId(value ?? "");
                    setControlId("");
                  }}
                >
                  <SelectTrigger ref={requirementRef}>
                    <SelectValue placeholder="Choose requirement" />
                  </SelectTrigger>
                  <SelectContent>
                    {requirements.map((record) => (
                      <SelectItem key={record.value} value={record.value}>
                        {record.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {requirementError ? <FieldError>{requirementError}</FieldError> : null}
              </Field>
              <Field required invalid={controlError ? true : undefined}>
                <FieldLabel>Control</FieldLabel>
                <Select<string>
                  items={controls.map((record) => ({
                    value: record.control_id,
                    label: `${record.control_code} · ${record.control_title}`,
                  }))}
                  value={controlId || null}
                  onValueChange={(value) => setControlId(value ?? "")}
                  readOnly={!controls.length}
                >
                  <SelectTrigger ref={controlRef}>
                    <SelectValue placeholder="Choose control" />
                  </SelectTrigger>
                  <SelectContent>
                    {controls.map((record) => (
                      <SelectItem key={record.control_id} value={record.control_id}>
                        {record.control_code} · {record.control_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {controlDescription ? (
                  <FieldDescription>{controlDescription}</FieldDescription>
                ) : null}
                {controlError ? <FieldError>{controlError}</FieldError> : null}
              </Field>
              <Field required>
                <FieldLabel>Relationship</FieldLabel>
                <Select
                  items={mappingRelationships.map((value) => ({ value, label: labelFor(value) }))}
                  value={relationship}
                  onValueChange={(value) => value && setRelationship(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mappingRelationships.map((value) => (
                      <SelectItem key={value} value={value}>
                        {labelFor(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Rationale</FieldLabel>
                <Textarea
                  value={rationale}
                  onChange={(event) => setRationale(event.target.value)}
                  maxLength={10000}
                />
              </Field>
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Stage mapping
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function WorkbookTransformDialog({
  count,
  onStage,
  onClose,
}: {
  count: number;
  onStage: (field: RequirementWorkbookField) => void;
  onClose: () => void;
}) {
  const [field, setField] = useState<RequirementWorkbookField>("title");
  const [error, setError] = useState("");
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transform requirements</DialogTitle>
          <DialogDescription>
            Select two columns in an analysis sheet: exact requirement codes on the left, proposed
            values on the right. The {count} selected rows will be validated together and staged for
            review.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Stack space="space.200">
            {error && (
              <Alert tone="danger">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Field>
              <FieldLabel>Destination field</FieldLabel>
              <Select value={field} onValueChange={(value) => value && setField(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {requirementWorkbookFields.map((item) => (
                    <SelectItem key={item.key} value={item.key}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Stack>
        </DialogBody>
        <DialogFooter>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              try {
                onStage(field);
                onClose();
              } catch (cause) {
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "The selected values could not be transformed.",
                );
              }
            }}
          >
            Stage transformation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WorkbookCellDialog({
  kind,
  address,
  comment,
  validation,
  onSave,
  onClose,
}: {
  kind: "comment" | "dropdown";
  address: string;
  comment?: string | undefined;
  validation?: CellValidation | undefined;
  onSave: (value: string | CellValidation | null) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(
    kind === "comment" ? (comment ?? "") : (validation?.options.join("\n") ?? ""),
  );
  const [allowBlank, setAllowBlank] = useState(validation?.allowBlank !== false);
  const [error, setError] = useState("");
  function save(remove = false) {
    try {
      onSave(
        remove
          ? null
          : kind === "comment"
            ? text.trim()
            : {
                type: "list",
                options: text
                  .split(/\r?\n/)
                  .map((value) => value.trim())
                  .filter(Boolean),
                allowBlank,
              },
      );
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The cell could not be updated.");
    }
  }
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <DialogHeader>
            <DialogTitle>{kind === "comment" ? "Cell comment" : "Cell dropdown"}</DialogTitle>
            <DialogDescription>
              {kind === "comment"
                ? `Add a note to ${address}.`
                : `Set the allowed values for ${address}. Enter one choice per line.`}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Stack space="space.200">
              {error && (
                <Alert tone="danger">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Field>
                <FieldLabel>{kind === "comment" ? "Comment" : "Dropdown choices"}</FieldLabel>
                <Textarea
                  value={text}
                  rows={6}
                  maxLength={10000}
                  onChange={(event) => setText(event.target.value)}
                />
              </Field>
              {kind === "dropdown" && (
                <Field>
                  <FieldLabel>Empty cells</FieldLabel>
                  <Select
                    value={allowBlank ? "allow" : "require"}
                    onValueChange={(value) => setAllowBlank(value === "allow")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allow">Allow blank values</SelectItem>
                      <SelectItem value="require">Require a choice</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </Stack>
          </DialogBody>
          <DialogFooter>
            {(comment || validation) && (
              <Button variant="subtle" onClick={() => save(true)}>
                {kind === "comment" ? "Remove comment" : "Remove dropdown"}
              </Button>
            )}
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {kind === "comment" ? "Save comment" : "Apply dropdown"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
