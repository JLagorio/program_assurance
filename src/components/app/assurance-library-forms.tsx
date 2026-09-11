import { options, runLibraryAction } from "./assurance-library-actions";
import { useId, useState, type ReactNode } from "react";
import {
  Box,
  Grid,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
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
import type {
  LibraryControl,
  LibraryEntry,
  LibraryEvidence,
  LibraryKind,
  LibraryRequirement,
  LibraryVersion,
} from "@/lib/assurance-library-model";
import { currentSession, useWorkVersion } from "@/lib/control-work";
import { createLibraryEntry, updateLibraryEntry } from "@/lib/assurance-library";

export function LibraryField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </Field>
  );
}
export function LibrarySelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select<string>
        value={value}
        items={options}
        disabled={disabled}
        onValueChange={(next) => {
          if (next !== null) onChange(next);
        }}
      >
        <SelectTrigger id={id} aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
export function LibraryDialog({
  title,
  children,
  onClose,
  onSave,
  saveLabel = "Save",
  disabled = false,
  onRemove,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSave?: () => void;
  saveLabel?: string;
  disabled?: boolean;
  onRemove?: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-layout-measure">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Box className="overflow-y-auto" padding="space.250">
          <Stack space="space.200">{children}</Stack>
        </Box>
        <DialogFooter>
          {onRemove && (
            <Button variant="danger" className="me-auto" onClick={onRemove}>
              Remove
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            {onSave ? "Cancel" : "Close"}
          </Button>
          {onSave && (
            <Button variant="primary" disabled={disabled} onClick={onSave}>
              {saveLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export function LibraryMappings({
  label,
  rows,
  selected,
  onChange,
  disabled = false,
}: {
  label: string;
  rows: { id: string; title: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="font-body-small font-medium text-subtle">{label}</legend>
      <Box paddingBlockStart="space.100">
        {rows.length ? (
          <Box className="rounded-medium border border-default">
            {rows.map((row) => (
              <label
                key={row.id}
                className="flex items-start gap-100 border-b border-default p-100 font-body-small last:border-b-0"
              >
                <Checkbox
                  aria-label={`${row.id} ${row.title}`}
                  checked={selected.includes(row.id)}
                  disabled={disabled}
                  onCheckedChange={(checked) =>
                    onChange(
                      checked ? [...selected, row.id] : selected.filter((id) => id !== row.id),
                    )
                  }
                />
                <span>
                  <span className="font-medium">{row.id}</span> · {row.title}
                </span>
              </label>
            ))}
          </Box>
        ) : (
          <div className="font-body-small text-subtle">None</div>
        )}
      </Box>
    </fieldset>
  );
}
export function LibraryEntryDialog({
  kind: fixedKind,
  entry,
  onClose,
  onCreated,
}: {
  /** Fixed when editing an existing entry; chosen in the dialog when creating. */
  kind?: LibraryKind;
  entry?: LibraryEntry;
  onClose: () => void;
  onCreated: (entry: LibraryEntry) => void;
}) {
  const [kind, setKind] = useState<LibraryKind>(fixedKind ?? entry?.kind ?? "Product");
  const [name, setName] = useState(entry?.name ?? "");
  const [category, setCategory] = useState(
    entry?.category ?? (kind === "Product" ? "System" : "Policy"),
  );
  const [owner, setOwner] = useState(entry?.owner ?? "");
  const [version, setVersion] = useState("1.0");
  const categories =
    kind === "Product"
      ? [
          "System",
          "Subsystem",
          "Component",
          "Hardware",
          "Software",
          "Firmware",
          "Service",
          "Platform",
          "Host platform",
          "Facility",
          "Manufacturing",
        ]
      : ["Policy", "Regional supplement", "Program policy"];
  return (
    <LibraryDialog
      title={entry ? "Edit details" : `New ${kind.toLowerCase()}`}
      onClose={onClose}
      saveLabel={entry ? "Save" : "Create draft"}
      disabled={!name.trim() || !owner.trim() || (!entry && !version.trim())}
      onSave={() => {
        runLibraryAction(
          () => {
            if (entry) {
              updateLibraryEntry(entry.id, { name, category, owner });
              onClose();
            } else onCreated(createLibraryEntry({ kind, name, category, owner, version }));
          },
          entry ? "Details saved" : "Draft created",
        );
      }}
    >
      <LibraryField label="Name">
        <Input aria-label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      </LibraryField>
      {!entry && !fixedKind && (
        <LibrarySelect
          label="Type"
          value={kind}
          options={options(["Product", "Policy"])}
          onChange={(value) => {
            const next = value as LibraryKind;
            setKind(next);
            setCategory(next === "Product" ? "System" : "Policy");
          }}
        />
      )}
      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }} gap="space.200">
        <LibrarySelect
          label="Category"
          value={category}
          options={options([...new Set([...categories, category])])}
          onChange={setCategory}
        />
        <LibraryField label="Owner">
          <Input aria-label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
        </LibraryField>
      </Grid>
      {!entry && (
        <LibraryField label="Version">
          <Input
            aria-label="Version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </LibraryField>
      )}
    </LibraryDialog>
  );
}
export function LibraryControlDialog({
  control,
  version,
  editable,
  onClose,
  onSave,
  onRemove,
}: {
  control: LibraryControl;
  version: LibraryVersion;
  editable: boolean;
  onClose: () => void;
  onRemove?: () => boolean;
  onSave: (control: LibraryControl) => boolean;
}) {
  useWorkVersion();
  const session = currentSession();
  const canAssess = editable && session.role === "Assessor";
  const [draft, setDraft] = useState(() => structuredClone(control));
  const field = <K extends keyof LibraryControl>(key: K, value: LibraryControl[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <LibraryDialog
      title={`${control.id} · ${control.title}`}
      onClose={onClose}
      {...(editable && onRemove
        ? {
            onRemove: () => {
              if (onRemove()) onClose();
            },
          }
        : {})}
      {...(editable
        ? {
            onSave: () => {
              if (onSave(draft)) onClose();
            },
          }
        : {})}
    >
      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }} gap="space.200">
        <LibrarySelect
          label="Applicability"
          value={draft.applicability}
          options={options(["Applicable", "Not applicable"])}
          disabled={!editable}
          onChange={(value) => field("applicability", value as LibraryControl["applicability"])}
        />
        <LibrarySelect
          label={editable && !canAssess ? "Assessment · Assessor only" : "Assessment"}
          value={draft.assessment}
          options={options(["Not assessed", "Satisfied", "Other than satisfied"])}
          disabled={!canAssess}
          onChange={(value) => field("assessment", value as LibraryControl["assessment"])}
        />
      </Grid>
      <LibraryField label="Implementation">
        <Textarea
          aria-label="Implementation"
          rows={5}
          readOnly={!editable}
          value={draft.implementation}
          onChange={(e) => field("implementation", e.target.value)}
        />
      </LibraryField>
      <LibraryField label="Consumer responsibility">
        <Textarea
          aria-label="Consumer responsibility"
          rows={3}
          readOnly={!editable}
          value={draft.consumerResponsibility}
          onChange={(e) => field("consumerResponsibility", e.target.value)}
        />
      </LibraryField>
      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }} gap="space.200">
        <LibraryField label="Assessor">
          <Input
            aria-label="Assessor"
            readOnly
            value={
              draft.assessment !== control.assessment && draft.assessment !== "Not assessed"
                ? session.name
                : draft.assessor
            }
            onChange={(e) => field("assessor", e.target.value)}
          />
        </LibraryField>
        <LibraryField label="Assessment date">
          <Input
            aria-label="Assessment date"
            type="date"
            readOnly
            value={
              draft.assessment !== control.assessment && draft.assessment !== "Not assessed"
                ? new Date().toISOString().slice(0, 10)
                : draft.assessedOn
            }
            onChange={(e) => field("assessedOn", e.target.value)}
          />
        </LibraryField>
      </Grid>
      <LibraryMappings
        label="Requirements"
        rows={version.requirements}
        selected={draft.requirementIds}
        disabled={!editable}
        onChange={(ids) => field("requirementIds", ids)}
      />
      <LibraryMappings
        label="Evidence"
        rows={version.evidence}
        selected={draft.evidenceIds}
        disabled={!editable}
        onChange={(ids) => field("evidenceIds", ids)}
      />
    </LibraryDialog>
  );
}
export function LibraryRequirementDialog({
  requirement,
  version,
  editable,
  onClose,
  onSave,
  onRemove,
}: {
  requirement?: LibraryRequirement;
  version: LibraryVersion;
  editable: boolean;
  onClose: () => void;
  onRemove?: () => boolean;
  onSave: (requirement: LibraryRequirement) => boolean;
}) {
  const [draft, setDraft] = useState<LibraryRequirement>(() =>
    structuredClone(
      requirement ?? {
        id: `REQ-${String(version.requirements.length + 1).padStart(3, "0")}`,
        title: "",
        controlIds: [],
        evidenceIds: [],
        status: "Open",
      },
    ),
  );
  const field = <K extends keyof LibraryRequirement>(key: K, value: LibraryRequirement[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <LibraryDialog
      title={requirement ? requirement.id : "Add requirement"}
      onClose={onClose}
      {...(editable && onRemove
        ? {
            onRemove: () => {
              if (onRemove()) onClose();
            },
          }
        : {})}
      disabled={!draft.id.trim() || !draft.title.trim()}
      {...(editable
        ? {
            onSave: () => {
              if (onSave(draft)) onClose();
            },
          }
        : {})}
    >
      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }} gap="space.200">
        <LibraryField label="Requirement ID">
          <Input
            aria-label="Requirement ID"
            disabled={Boolean(requirement) || !editable}
            value={draft.id}
            onChange={(e) => field("id", e.target.value)}
          />
        </LibraryField>
        <LibrarySelect
          label="Status"
          value={draft.status}
          disabled={!editable}
          options={options(["Open", "Verified"])}
          onChange={(value) => field("status", value as LibraryRequirement["status"])}
        />
      </Grid>
      <LibraryField label="Requirement">
        <Textarea
          aria-label="Requirement"
          rows={3}
          readOnly={!editable}
          value={draft.title}
          onChange={(e) => field("title", e.target.value)}
        />
      </LibraryField>
      <LibraryMappings
        label="Controls"
        rows={version.controls}
        selected={draft.controlIds}
        disabled={!editable}
        onChange={(ids) => field("controlIds", ids)}
      />
      <LibraryMappings
        label="Evidence"
        rows={version.evidence}
        selected={draft.evidenceIds}
        disabled={!editable}
        onChange={(ids) => field("evidenceIds", ids)}
      />
    </LibraryDialog>
  );
}
export function LibraryEvidenceDialog({
  evidence,
  version,
  editable,
  onClose,
  onSave,
  onRemove,
}: {
  evidence?: LibraryEvidence;
  version: LibraryVersion;
  editable: boolean;
  onClose: () => void;
  onRemove?: () => boolean;
  onSave: (evidence: LibraryEvidence) => boolean;
}) {
  const [draft, setDraft] = useState<LibraryEvidence>(() =>
    structuredClone(
      evidence ?? {
        id: `EVD-${String(version.evidence.length + 1).padStart(3, "0")}`,
        title: "",
        kind: "Document",
        date: new Date().toISOString().slice(0, 10),
        reference: "",
      },
    ),
  );
  const field = <K extends keyof LibraryEvidence>(key: K, value: LibraryEvidence[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <LibraryDialog
      title={evidence ? evidence.id : "Add evidence"}
      onClose={onClose}
      {...(editable && onRemove
        ? {
            onRemove: () => {
              if (onRemove()) onClose();
            },
          }
        : {})}
      disabled={!draft.id.trim() || !draft.title.trim() || !draft.reference.trim()}
      {...(editable
        ? {
            onSave: () => {
              if (onSave(draft)) onClose();
            },
          }
        : {})}
    >
      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }} gap="space.200">
        <LibraryField label="Evidence ID">
          <Input
            aria-label="Evidence ID"
            disabled={Boolean(evidence) || !editable}
            value={draft.id}
            onChange={(e) => field("id", e.target.value)}
          />
        </LibraryField>
        <LibrarySelect
          label="Type"
          value={draft.kind}
          disabled={!editable}
          options={options([
            ...new Set([
              "Document",
              "Test report",
              "Configuration",
              "Assessment",
              "Record",
              draft.kind,
            ]),
          ])}
          onChange={(value) => field("kind", value)}
        />
      </Grid>
      <LibraryField label="Title">
        <Input
          aria-label="Title"
          readOnly={!editable}
          value={draft.title}
          onChange={(e) => field("title", e.target.value)}
        />
      </LibraryField>
      <LibraryField label="Reference">
        <Input
          aria-label="Reference"
          readOnly={!editable}
          value={draft.reference}
          onChange={(e) => field("reference", e.target.value)}
        />
      </LibraryField>
      <LibraryField label="Date">
        <Input
          aria-label="Date"
          type="date"
          readOnly={!editable}
          value={draft.date}
          onChange={(e) => field("date", e.target.value)}
        />
      </LibraryField>
    </LibraryDialog>
  );
}
