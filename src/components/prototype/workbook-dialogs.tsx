import { useState } from "react";
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

export function WorkbookMappingDialog({
  snapshot,
  onStage,
  onClose,
}: {
  snapshot: AssuranceWorkbookSnapshot;
  onStage: (change: MappingWorkbookChange) => void;
  onClose: () => void;
}) {
  const [requirementId, setRequirementId] = useState("");
  const [systemId, setSystemId] = useState("");
  const [controlId, setControlId] = useState("");
  const [relationship, setRelationship] =
    useState<(typeof mappingRelationships)[number]>("maps_to");
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState("");
  const resolutionId = snapshot.systems.find(
    (system) => system.id === systemId,
  )?.profile_resolution_id;
  const controls = snapshot.selectedControls.filter(
    (control) => control.profile_resolution_id === resolutionId,
  );
  function stage() {
    const requirement = snapshot.requirements.find((item) => item.id === requirementId);
    const selected = controls.find((item) => item.id === controlId);
    if (!requirement?.content_id || !selected) {
      setError("Choose a requirement, system and selected control.");
      return;
    }
    if (
      snapshot.mappings.some(
        (mapping) =>
          mapping.content_id === requirement.content_id &&
          mapping.control_id === selected.control_id &&
          mapping.system_id === systemId &&
          !mapping.control_part_id,
      )
    ) {
      setError("That requirement is already mapped to this system’s control.");
      return;
    }
    try {
      onStage({
        operation: "create",
        id: crypto.randomUUID(),
        contentId: requirement.content_id,
        controlId: selected.control_id,
        systemId,
        selectedControlId: selected.id,
        relationshipType: relationship,
        rationale: rationale.trim() || null,
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not stage the mapping.");
    }
  }
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            stage();
          }}
        >
          <DialogHeader>
            <DialogTitle>Stage control mapping</DialogTitle>
            <DialogDescription>
              The control must belong to the system’s resolved baseline. Review and apply the
              proposal to record it.
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
                <FieldLabel>Requirement</FieldLabel>
                <Select
                  value={requirementId}
                  onValueChange={(value) => setRequirementId(value ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose requirement" />
                  </SelectTrigger>
                  <SelectContent>
                    {snapshot.requirements
                      .filter((record) => record.content_id)
                      .map((record) => (
                        <SelectItem key={record.id} value={record.id}>
                          {record.code} · {record.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field required>
                <FieldLabel>System</FieldLabel>
                <Select
                  value={systemId}
                  onValueChange={(value) => {
                    setSystemId(value ?? "");
                    setControlId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose system" />
                  </SelectTrigger>
                  <SelectContent>
                    {snapshot.systems.map((record) => (
                      <SelectItem key={record.id} value={record.id}>
                        {record.code} · {record.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field required>
                <FieldLabel>Selected control</FieldLabel>
                <Select
                  value={controlId}
                  onValueChange={(value) => setControlId(value ?? "")}
                  disabled={!controls.length}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        systemId && !controls.length
                          ? "No controls in this baseline"
                          : "Choose control"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {controls.map((record) => (
                      <SelectItem key={record.id} value={record.id}>
                        {record.control_code} · {record.control_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field required>
                <FieldLabel>Relationship</FieldLabel>
                <Select
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
