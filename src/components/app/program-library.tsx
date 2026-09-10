import { useId, useState } from "react";
import { Check, ChevronRight, Plus, X } from "lucide-react";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Count,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Grid,
  Id,
  Inline,
  Input,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Stack,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TextLink,
  toast,
} from "@ledger/design-system";
import {
  addLibraryProgramEvidence,
  addLibraryUse,
  assignLibraryOverlay,
  latestLibraryRelease,
  libraryAssignments,
  libraryControlIds,
  libraryDecision,
  libraryEntries,
  libraryEntry,
  libraryProgramEvidence,
  libraryProgramTarget,
  libraryRelease,
  librarySources,
  libraryUses,
  removeLibraryAssignment,
  saveLibraryDecision,
  setLibraryHost,
  setLibraryUseTarget,
  useLibraryVersion,
} from "@/lib/assurance-library";
import type {
  LibraryDecision,
  LibraryEntry,
  LibrarySource,
  LibraryUse,
} from "@/lib/assurance-library-model";
import { currentSession, useWorkVersion } from "@/lib/control-work";
import { useCompositionGraph } from "@/lib/composition";

type Option = { value: string; label: string };
type WorkspaceTab = "Components" | "Overlays" | "Control coverage";

function Choice({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel id={`${id}-label`} htmlFor={id}>
        {label}
      </FieldLabel>
      <Select<string>
        items={options}
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          if (next !== null) onChange(next);
        }}
      >
        <SelectTrigger id={id} aria-labelledby={`${id}-label`} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent aria-labelledby={`${id}-label`}>
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

function Message({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="font-body-small text-danger">
      {error}
    </p>
  ) : null;
}

function releaseOptions(entry: LibraryEntry | undefined): Option[] {
  return (entry?.versions ?? [])
    .filter((version) => version.publishedOn !== null)
    .map((version) => ({ value: version.id, label: version.version }));
}

function recordHref(entry: LibraryEntry, versionId: string): string {
  return `/library/${entry.kind === "Overlay" ? "overlays" : "components"}/${entry.key}?version=${encodeURIComponent(versionId)}`;
}

function assessmentTone(value: string) {
  return value === "Satisfied"
    ? ("success" as const)
    : value === "Other than satisfied"
      ? ("danger" as const)
      : ("neutral" as const);
}

function sourceDecisionTone(value: string) {
  return value === "Confirmed"
    ? ("success" as const)
    : value === "Excluded"
      ? ("neutral" as const)
      : ("warning" as const);
}

function instanceDepth(use: LibraryUse, uses: LibraryUse[]): number {
  let depth = 0;
  let parent = use.parentUseId;
  const seen = new Set([use.id]);
  while (parent && !seen.has(parent)) {
    seen.add(parent);
    const item = uses.find((candidate) => candidate.id === parent);
    if (!item) break;
    depth += 1;
    parent = item.parentUseId;
  }
  return depth;
}

function instanceLabel(use: LibraryUse, uses: LibraryUse[]): string {
  const names = [use.name];
  const seen = new Set([use.id]);
  let parent = use.parentUseId;
  while (parent && !seen.has(parent)) {
    seen.add(parent);
    const item = uses.find((candidate) => candidate.id === parent);
    if (!item) break;
    names.unshift(item.name);
    parent = item.parentUseId;
  }
  return names.join(" / ");
}

function AddComponentDialog({
  programId,
  onClose,
  onCreated,
}: {
  programId: string;
  onClose: () => void;
  onCreated: (use: LibraryUse) => void;
}) {
  const nodes = useCompositionGraph(programId);
  const entries = libraryEntries("Component").filter((entry) => releaseOptions(entry).length > 0);
  const [entryId, setEntryId] = useState(entries[0]?.id ?? "");
  const entry = libraryEntry(entryId);
  const [versionId, setVersionId] = useState(entry ? (latestLibraryRelease(entry)?.id ?? "") : "");
  const [name, setName] = useState(entry?.name ?? "");
  const [target, setTarget] = useState(nodes.find((node) => node.parent === null)?.id ?? "none");
  const [role, setRole] = useState<"Component" | "Host">("Component");
  const [error, setError] = useState("");
  const id = useId();
  const save = () => {
    try {
      const use = addLibraryUse({
        programId,
        entryId,
        versionId,
        name,
        targetNodeId: target === "none" ? null : target,
        role,
      });
      toast.add({ title: `${use.name} added`, type: "success" });
      onCreated(use);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Component could not be added.");
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent aria-describedby={undefined} style={{ maxWidth: 560 }}>
        <DialogHeader>
          <DialogTitle>Add component</DialogTitle>
        </DialogHeader>
        <Box
          as="form"
          id={id}
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="min-h-0 overflow-y-auto px-250 py-200"
        >
          <Stack space="space.200">
            <Message error={error} />
            <Choice
              label="Component"
              value={entryId}
              options={entries.map((item) => ({ value: item.id, label: item.name }))}
              onChange={(value) => {
                const selected = libraryEntry(value);
                setEntryId(value);
                setVersionId(selected ? (latestLibraryRelease(selected)?.id ?? "") : "");
                setName(selected?.name ?? "");
              }}
            />
            <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="space.150">
              <Choice
                label="Version"
                value={versionId}
                options={releaseOptions(entry)}
                onChange={setVersionId}
              />
              <Choice
                label="Role"
                value={role}
                options={[
                  { value: "Component", label: "Component" },
                  { value: "Host", label: "Host platform" },
                ]}
                onChange={(value) => setRole(value as typeof role)}
              />
            </Grid>
            <Field>
              <FieldLabel htmlFor={`${id}-name`}>Instance name</FieldLabel>
              <Input
                id={`${id}-name`}
                value={name}
                required
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Choice
              label="System element"
              value={target}
              options={[
                { value: "none", label: "Unassigned" },
                ...nodes.map((node) => ({ value: node.id, label: `${node.name} · ${node.kind}` })),
              ]}
              onChange={setTarget}
            />
          </Stack>
        </Box>
        <DialogFooter>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form={id}
            disabled={!entryId || !versionId || !name.trim()}
          >
            Add component
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddOverlayDialog({ programId, onClose }: { programId: string; onClose: () => void }) {
  const entries = libraryEntries("Overlay").filter((entry) => releaseOptions(entry).length > 0);
  const uses = libraryUses(programId);
  const [entryId, setEntryId] = useState(entries[0]?.id ?? "");
  const entry = libraryEntry(entryId);
  const [versionId, setVersionId] = useState(entry ? (latestLibraryRelease(entry)?.id ?? "") : "");
  const [targetIds, setTargetIds] = useState<string[]>(["program"]);
  const [error, setError] = useState("");
  const release = libraryRelease(entryId, versionId);
  const base = release?.baseOverlay ? libraryEntry(release.baseOverlay.entryId) : undefined;
  const baseRelease = release?.baseOverlay
    ? libraryRelease(release.baseOverlay.entryId, release.baseOverlay.versionId)
    : undefined;
  const save = () => {
    try {
      assignLibraryOverlay({ programId, entryId, versionId, targetIds });
      toast.add({ title: `${entry?.name ?? "Overlay"} assigned`, type: "success" });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Overlay could not be assigned.");
    }
  };
  const toggle = (targetId: string, checked: boolean) =>
    setTargetIds((previous) =>
      checked ? [...new Set([...previous, targetId])] : previous.filter((id) => id !== targetId),
    );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent aria-describedby={undefined} style={{ maxWidth: 620 }}>
        <DialogHeader>
          <DialogTitle>Assign overlay</DialogTitle>
        </DialogHeader>
        <Box className="min-h-0 overflow-y-auto px-250 py-200">
          <Stack space="space.200">
            <Message error={error} />
            <Grid
              templateColumns={{ base: "minmax(0, 1fr)", sm: "minmax(0, 2fr) minmax(0, 1fr)" }}
              gap="space.150"
            >
              <Choice
                label="Overlay"
                value={entryId}
                options={entries.map((item) => ({ value: item.id, label: item.name }))}
                onChange={(value) => {
                  const selected = libraryEntry(value);
                  setEntryId(value);
                  setVersionId(selected ? (latestLibraryRelease(selected)?.id ?? "") : "");
                }}
              />
              <Choice
                label="Version"
                value={versionId}
                options={releaseOptions(entry)}
                onChange={setVersionId}
              />
            </Grid>
            {base ? (
              <Inline space="space.100">
                <span className="font-body-small text-subtle">Base overlay</span>
                <span className="font-body-small">
                  {base.name} · {baseRelease?.version}
                </span>
              </Inline>
            ) : null}
            <Section title="Applies to">
              <Stack space="space.150" className="pt-100">
                <label className="flex items-center gap-100 font-body">
                  <Checkbox
                    checked={targetIds.includes("program")}
                    onCheckedChange={(checked) => toggle("program", checked)}
                  />
                  Entire program
                </label>
                {uses.map((use) => (
                  <label key={use.id} className="flex items-center gap-100 font-body-small">
                    <Checkbox
                      checked={targetIds.includes(use.id)}
                      disabled={targetIds.includes("program")}
                      onCheckedChange={(checked) => toggle(use.id, checked)}
                    />
                    {instanceLabel(use, uses)}
                    <span className="text-subtle">{use.role}</span>
                  </label>
                ))}
              </Stack>
            </Section>
          </Stack>
        </Box>
        <DialogFooter>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!entryId || !versionId || targetIds.length === 0}
            onClick={save}
          >
            Assign overlay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SourceDetails({
  source,
  error,
  onClose,
  onDecision,
}: {
  source: LibrarySource;
  error: string;
  onClose: () => void;
  onDecision: (decision: "Confirmed" | "Excluded") => void;
}) {
  const requirements = source.version.requirements.filter(
    (requirement) =>
      source.control.requirementIds.includes(requirement.id) ||
      requirement.controlIds.includes(source.control.id),
  );
  const evidenceIds = new Set([
    ...source.control.evidenceIds,
    ...requirements.flatMap((requirement) => requirement.evidenceIds),
  ]);
  const evidence = source.version.evidence.filter((item) => evidenceIds.has(item.id));
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="end" aria-describedby={undefined} style={{ maxWidth: 680 }}>
        <SheetHeader>
          <SheetTitle>
            {source.entry.name} · {source.control.id}
          </SheetTitle>
          <Inline space="space.100" alignBlock="center">
            <span className="font-body-small text-subtle">{source.version.version}</span>
            <Badge variant="secondary" tone={sourceDecisionTone(source.decision)}>
              {source.decision}
            </Badge>
          </Inline>
        </SheetHeader>
        <Stack space="space.300" className="min-h-0 flex-1 overflow-y-auto px-250 py-200">
          <Message error={error} />
          <Section title="Implementation">
            <p className="whitespace-pre-wrap font-body-small pt-100">
              {source.control.implementation || "—"}
            </p>
          </Section>
          <Section title="Program responsibility">
            <p className="whitespace-pre-wrap font-body-small pt-100">
              {source.control.consumerResponsibility || "—"}
            </p>
          </Section>
          {source.version.conditions.length ? (
            <Section title="Conditions">
              <Box as="ul" className="list-disc ps-200 pt-100 font-body-small">
                {source.version.conditions.map((condition, index) => (
                  <li key={index}>{condition}</li>
                ))}
              </Box>
            </Section>
          ) : null}
          <Section title="Source assessment">
            <Inline space="space.150" alignBlock="center" shouldWrap className="pt-100">
              <Badge variant="secondary" tone={assessmentTone(source.control.assessment)}>
                {source.control.assessment}
              </Badge>
              <span className="font-body-small">{source.control.assessor || "Unassigned"}</span>
              <span className="font-body-small text-subtle">
                {source.control.assessedOn || "—"}
              </span>
            </Inline>
          </Section>
          <Section title="Requirements" action={<Count value={requirements.length} />}>
            <Table>
              <thead>
                <tr>
                  <Table.Header>Requirement</Table.Header>
                  <Table.Header>Status</Table.Header>
                </tr>
              </thead>
              <tbody>
                {requirements.map((requirement) => (
                  <tr key={requirement.id}>
                    <Table.Cell className="whitespace-normal">
                      <Id>{requirement.id}</Id>
                      <p className="font-body-small">{requirement.title}</p>
                    </Table.Cell>
                    <Table.Cell>{requirement.status}</Table.Cell>
                  </tr>
                ))}
                {requirements.length === 0 ? (
                  <tr>
                    <Table.Cell colSpan={2}>No linked requirements</Table.Cell>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </Section>
          <Section title="Evidence" action={<Count value={evidence.length} />}>
            <Table>
              <thead>
                <tr>
                  <Table.Header>Evidence</Table.Header>
                  <Table.Header>Date</Table.Header>
                </tr>
              </thead>
              <tbody>
                {evidence.map((item) => (
                  <tr key={item.id}>
                    <Table.Cell className="whitespace-normal">
                      <span className="font-medium">{item.title}</span>
                      <p className="font-body-small text-subtle">{item.reference || item.id}</p>
                    </Table.Cell>
                    <Table.Cell>{item.date || "—"}</Table.Cell>
                  </tr>
                ))}
                {evidence.length === 0 ? (
                  <tr>
                    <Table.Cell colSpan={2}>No linked evidence</Table.Cell>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </Section>
          <TextLink render={<a href={recordHref(source.entry, source.version.id)} />}>
            Open {source.entry.kind.toLowerCase()}
            <ChevronRight aria-hidden className="size-icon-small" />
          </TextLink>
        </Stack>
        <SheetFooter>
          <Button variant="subtle" onClick={() => onDecision("Excluded")} iconBefore={<X />}>
            Exclude source
          </Button>
          <Button variant="primary" onClick={() => onDecision("Confirmed")} iconBefore={<Check />}>
            Confirm source
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EvidenceDialog({
  use,
  controlId,
  onClose,
  onAdded,
}: {
  use: LibraryUse;
  controlId: string;
  onClose: () => void;
  onAdded: (id: string) => void;
}) {
  const id = useId();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("Document");
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const save = () => {
    try {
      const evidence = addLibraryProgramEvidence(use.id, { title, kind, date, reference });
      onAdded(evidence.id);
      toast.add({ title: "Evidence added", type: "success" });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Evidence could not be added.");
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent aria-describedby={undefined} style={{ maxWidth: 540 }}>
        <DialogHeader>
          <DialogTitle>Add evidence · {controlId}</DialogTitle>
        </DialogHeader>
        <Box
          as="form"
          id={id}
          className="px-250 py-200"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <Stack space="space.150">
            <Message error={error} />
            <Field>
              <FieldLabel htmlFor={`${id}-title`}>Title</FieldLabel>
              <Input
                id={`${id}-title`}
                value={title}
                required
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>
            <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="space.150">
              <Choice
                label="Kind"
                value={kind}
                options={["Document", "Test report", "Configuration", "Record", "Log"].map(
                  (value) => ({ value, label: value }),
                )}
                onChange={setKind}
              />
              <Field>
                <FieldLabel htmlFor={`${id}-date`}>Date</FieldLabel>
                <Input
                  id={`${id}-date`}
                  type="date"
                  value={date}
                  required
                  onChange={(event) => setDate(event.target.value)}
                />
              </Field>
            </Grid>
            <Field>
              <FieldLabel htmlFor={`${id}-reference`}>Reference</FieldLabel>
              <Input
                id={`${id}-reference`}
                value={reference}
                required
                onChange={(event) => setReference(event.target.value)}
              />
            </Field>
          </Stack>
        </Box>
        <DialogFooter>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form={id}
            disabled={!title.trim() || !date || !reference.trim()}
          >
            Add evidence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LocalControlWork({ use, controlId }: { use: LibraryUse; controlId: string }) {
  useWorkVersion();
  const saved = libraryDecision(use.id, controlId);
  const [narrative, setNarrative] = useState(saved.narrative);
  const [implementation, setImplementation] = useState(saved.implementation);
  const [assessment, setAssessment] = useState(saved.assessment);
  const [determination, setDetermination] = useState(saved.determination);
  const [assessmentDirty, setAssessmentDirty] = useState(false);
  const [evidenceIds, setEvidenceIds] = useState(saved.evidenceIds);
  const [addingEvidence, setAddingEvidence] = useState(false);
  const [error, setError] = useState("");
  const session = currentSession();
  const isAssessor = session.role === "Assessor";
  const evidence = libraryProgramEvidence(use.id);
  const id = useId();
  const save = () => {
    try {
      saveLibraryDecision(use.id, controlId, {
        narrative,
        implementation,
        evidenceIds,
      });
      setError("");
      toast.add({ title: `${controlId} saved`, type: "success" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Control work could not be saved.");
    }
  };
  const recordAssessment = () => {
    try {
      saveLibraryDecision(use.id, controlId, {
        assessment: assessmentDirty ? assessment : saved.assessment,
        determination: assessmentDirty ? determination : saved.determination,
      });
      setAssessmentDirty(false);
      setError("");
      toast.add({ title: `${controlId} assessment recorded`, type: "success" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Assessment could not be saved.");
    }
  };
  return (
    <Section
      title="Program implementation"
      action={
        <Button size="small" variant="primary" onClick={save}>
          Save implementation
        </Button>
      }
    >
      <Stack space="space.200" className="pt-150">
        <Message error={error} />
        <Field>
          <FieldLabel htmlFor={`${id}-narrative`}>Implementation</FieldLabel>
          <Textarea
            id={`${id}-narrative`}
            value={narrative}
            rows={5}
            onChange={(event) => setNarrative(event.target.value)}
          />
        </Field>
        <Grid
          templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
          gap="space.200"
        >
          <Choice
            label="Implementation status"
            value={implementation}
            options={["Not implemented", "Planned", "Partially implemented", "Implemented"].map(
              (value) => ({ value, label: value }),
            )}
            onChange={(value) => setImplementation(value as LibraryDecision["implementation"])}
          />
          <Choice
            label="Assessment"
            value={isAssessor && assessmentDirty ? assessment : saved.assessment}
            disabled={!isAssessor}
            options={["Not assessed", "Satisfied", "Other than satisfied"].map((value) => ({
              value,
              label: value,
            }))}
            onChange={(value) => {
              setAssessment(value as LibraryDecision["assessment"]);
              if (!assessmentDirty) setDetermination(saved.determination);
              setAssessmentDirty(true);
            }}
          />
        </Grid>
        {isAssessor ? (
          <Stack space="space.150">
            <Field>
              <FieldLabel htmlFor={`${id}-determination`}>Determination</FieldLabel>
              <Textarea
                id={`${id}-determination`}
                value={assessmentDirty ? determination : saved.determination}
                rows={3}
                onChange={(event) => {
                  if (!assessmentDirty) setAssessment(saved.assessment);
                  setDetermination(event.target.value);
                  setAssessmentDirty(true);
                }}
              />
            </Field>
            <Inline>
              <Button size="small" variant="secondary" onClick={recordAssessment}>
                Record assessment
              </Button>
            </Inline>
          </Stack>
        ) : null}
        {saved.assessor ? (
          <Inline space="space.150" shouldWrap>
            <span className="font-body-small">{saved.assessor}</span>
            <span className="font-body-small text-subtle">{saved.assessedOn}</span>
          </Inline>
        ) : null}
        <Section
          title="Program evidence"
          action={
            <Button
              variant="secondary"
              size="small"
              iconBefore={<Plus />}
              onClick={() => setAddingEvidence(true)}
            >
              Add evidence
            </Button>
          }
        >
          <Table>
            <thead>
              <tr>
                <Table.Header width={44}>Link</Table.Header>
                <Table.Header>Evidence</Table.Header>
                <Table.Header>Kind</Table.Header>
                <Table.Header>Date</Table.Header>
              </tr>
            </thead>
            <tbody>
              {evidence.map((item) => (
                <tr key={item.id}>
                  <Table.Cell>
                    <Checkbox
                      aria-label={`Link ${item.title}`}
                      checked={evidenceIds.includes(item.id)}
                      onCheckedChange={(checked) =>
                        setEvidenceIds((previous) =>
                          checked
                            ? [...new Set([...previous, item.id])]
                            : previous.filter((value) => value !== item.id),
                        )
                      }
                    />
                  </Table.Cell>
                  <Table.Cell className="whitespace-normal">
                    <span>{item.title}</span>
                    <p className="font-body-small text-subtle">{item.reference}</p>
                  </Table.Cell>
                  <Table.Cell>{item.kind}</Table.Cell>
                  <Table.Cell>{item.date}</Table.Cell>
                </tr>
              ))}
              {evidence.length === 0 ? (
                <tr>
                  <Table.Cell colSpan={4}>No program evidence</Table.Cell>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </Section>
      </Stack>
      {addingEvidence ? (
        <EvidenceDialog
          use={use}
          controlId={controlId}
          onClose={() => setAddingEvidence(false)}
          onAdded={(evidenceId) =>
            setEvidenceIds((previous) => [...new Set([...previous, evidenceId])])
          }
        />
      ) : null}
    </Section>
  );
}

function ControlCoverage({
  uses,
  selectedId,
  onSelect,
}: {
  uses: LibraryUse[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const selected = uses.find((use) => use.id === selectedId) ?? uses[0];
  const [family, setFamily] = useState("All");
  const [controlId, setControlId] = useState("");
  const [openSourceId, setOpenSourceId] = useState<string | null>(null);
  const [bulkSource, setBulkSource] = useState("");
  const [error, setError] = useState("");
  if (!selected) return <p className="font-body-small py-200 text-subtle">No components added</p>;
  const allControlIds = libraryControlIds(selected.id);
  const families = [...new Set(allControlIds.map((id) => id.split("-")[0]!))].sort();
  const visibleIds = allControlIds.filter((id) => family === "All" || id.startsWith(`${family}-`));
  const selectedControl = visibleIds.includes(controlId) ? controlId : (visibleIds[0] ?? "");
  const sourceRows = selectedControl ? librarySources(selected.id, selectedControl) : [];
  const openSource = sourceRows.find((source) => source.id === openSourceId);
  const sourceChoices = new Map<string, string>();
  for (const id of visibleIds)
    for (const source of librarySources(selected.id, id))
      sourceChoices.set(
        `${source.entry.id}|${source.version.id}|${source.kind}`,
        `${source.entry.name} · ${source.version.version} · ${source.kind}`,
      );
  const activeBulkSource = sourceChoices.has(bulkSource)
    ? bulkSource
    : ([...sourceChoices.keys()][0] ?? "");
  const saveSource = (source: LibrarySource, decision: "Confirmed" | "Excluded") => {
    try {
      const current = libraryDecision(selected.id, selectedControl);
      saveLibraryDecision(selected.id, selectedControl, {
        sourceDecisions: { ...current.sourceDecisions, [source.id]: decision },
      });
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Source decision could not be saved.");
    }
  };
  const bulk = (decision: "Confirmed" | "Excluded") => {
    let changed = 0;
    try {
      for (const id of visibleIds) {
        const matching = librarySources(selected.id, id).filter(
          (source) => `${source.entry.id}|${source.version.id}|${source.kind}` === activeBulkSource,
        );
        if (!matching.length) continue;
        const current = libraryDecision(selected.id, id);
        saveLibraryDecision(selected.id, id, {
          sourceDecisions: {
            ...current.sourceDecisions,
            ...Object.fromEntries(matching.map((source) => [source.id, decision])),
          },
        });
        changed += 1;
      }
      setError("");
      toast.add({ title: `${changed} controls ${decision.toLowerCase()}`, type: "success" });
    } catch (cause) {
      setError(
        `${changed} saved. ${cause instanceof Error ? cause.message : "Source decisions could not be saved."}`,
      );
    }
  };
  return (
    <Stack space="space.250">
      <Message error={error} />
      <Grid
        templateColumns={{ base: "minmax(0, 1fr)", sm: "minmax(0, 2fr) minmax(0, 1fr)" }}
        gap="space.150"
      >
        <Choice
          label="Instance"
          value={selected.id}
          options={uses.map((use) => ({ value: use.id, label: instanceLabel(use, uses) }))}
          onChange={(id) => {
            onSelect(id);
            setControlId("");
            setOpenSourceId(null);
          }}
        />
        <Choice
          label="Control family"
          value={family}
          options={[
            { value: "All", label: "All families" },
            ...families.map((value) => ({ value, label: value })),
          ]}
          onChange={(value) => {
            setFamily(value);
            setOpenSourceId(null);
          }}
        />
      </Grid>
      <Grid
        templateColumns={{ base: "minmax(0, 1fr)", xl: "minmax(0, 1fr) minmax(0, 1fr)" }}
        gap="space.300"
      >
        <Stack space="space.200">
          <Section title="Control coverage" action={<Count value={visibleIds.length} />}>
            <Table label="Library control coverage" style={{ minWidth: 480 }}>
              <thead>
                <tr>
                  <Table.Header>Control</Table.Header>
                  <Table.Header>Sources</Table.Header>
                  <Table.Header>Implementation</Table.Header>
                  <Table.Header>Assessment</Table.Header>
                </tr>
              </thead>
              <tbody>
                {visibleIds.map((id) => {
                  const sources = librarySources(selected.id, id);
                  const decision = libraryDecision(selected.id, id);
                  const confirmed = sources.filter(
                    (source) => source.decision === "Confirmed",
                  ).length;
                  const pending = sources.filter((source) => source.decision === "Pending").length;
                  return (
                    <tr key={id} className={id === selectedControl ? "bg-selected" : undefined}>
                      <Table.Cell>
                        <Button
                          variant="subtle"
                          size="small"
                          onClick={() => {
                            setControlId(id);
                            setOpenSourceId(null);
                          }}
                        >
                          <Id>{id}</Id>
                        </Button>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          variant="secondary"
                          tone={pending ? "warning" : confirmed ? "success" : "neutral"}
                        >
                          {confirmed}/{sources.length}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell className="whitespace-normal">
                        {decision.implementation}
                      </Table.Cell>
                      <Table.Cell className="whitespace-normal">
                        <Badge variant="secondary" tone={assessmentTone(decision.assessment)}>
                          {decision.assessment}
                        </Badge>
                      </Table.Cell>
                    </tr>
                  );
                })}
                {visibleIds.length === 0 ? (
                  <tr>
                    <Table.Cell colSpan={4}>No applicable controls</Table.Cell>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </Section>
          {sourceChoices.size ? (
            <Section title={family === "All" ? "All controls" : `${family} family`}>
              <Stack space="space.150" className="pt-150">
                <Choice
                  label="Source"
                  value={activeBulkSource}
                  options={[...sourceChoices].map(([value, label]) => ({ value, label }))}
                  onChange={setBulkSource}
                />
                <Inline space="space.100" shouldWrap>
                  <Button variant="secondary" size="small" onClick={() => bulk("Confirmed")}>
                    Confirm {family === "All" ? "all" : family}
                  </Button>
                  <Button variant="subtle" size="small" onClick={() => bulk("Excluded")}>
                    Exclude {family === "All" ? "all" : family}
                  </Button>
                </Inline>
              </Stack>
            </Section>
          ) : null}
        </Stack>
        {selectedControl ? (
          <Stack space="space.300">
            <Section title={`${selectedControl} · ${sourceRows[0]?.control.title ?? "Control"}`}>
              <Table>
                <thead>
                  <tr>
                    <Table.Header>Source</Table.Header>
                    <Table.Header>Decision</Table.Header>
                    <Table.Header>Actions</Table.Header>
                  </tr>
                </thead>
                <tbody>
                  {sourceRows.map((source) => (
                    <tr key={source.id}>
                      <Table.Cell className="whitespace-normal">
                        <Button
                          variant="subtle"
                          size="small"
                          className="h-auto whitespace-normal text-left"
                          onClick={() => setOpenSourceId(source.id)}
                        >
                          {source.entry.name}
                        </Button>
                        <p className="font-body-small text-subtle">
                          {source.kind} · {source.version.version}
                        </p>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant="secondary" tone={sourceDecisionTone(source.decision)}>
                          {source.decision}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Inline space="space.050" shouldWrap>
                          <Button
                            size="small"
                            variant="subtle"
                            aria-label={`Confirm ${source.entry.name} for ${selectedControl}`}
                            onClick={() => saveSource(source, "Confirmed")}
                            disabled={source.decision === "Confirmed"}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="small"
                            variant="subtle"
                            aria-label={`Exclude ${source.entry.name} for ${selectedControl}`}
                            onClick={() => saveSource(source, "Excluded")}
                            disabled={source.decision === "Excluded"}
                          >
                            Exclude
                          </Button>
                        </Inline>
                      </Table.Cell>
                    </tr>
                  ))}
                  {sourceRows.length === 0 ? (
                    <tr>
                      <Table.Cell colSpan={3}>No source contributions</Table.Cell>
                    </tr>
                  ) : null}
                </tbody>
              </Table>
            </Section>
            <LocalControlWork
              key={`${selected.id}|${selectedControl}`}
              use={selected}
              controlId={selectedControl}
            />
          </Stack>
        ) : null}
      </Grid>
      {openSource ? (
        <SourceDetails
          source={openSource}
          error={error}
          onClose={() => setOpenSourceId(null)}
          onDecision={(decision) => saveSource(openSource, decision)}
        />
      ) : null}
    </Stack>
  );
}

export function ProgramLibrary({ programId }: { programId: string }) {
  useLibraryVersion();
  const nodes = useCompositionGraph(programId);
  const uses = libraryUses(programId);
  const assignments = libraryAssignments(programId);
  const [tab, setTab] = useState<WorkspaceTab>("Components");
  const [addingComponent, setAddingComponent] = useState(false);
  const [addingOverlay, setAddingOverlay] = useState(false);
  const [selectedId, setSelectedId] = useState(uses[0]?.id ?? "");
  const [error, setError] = useState("");
  const [hostFor, setHostFor] = useState<string | null>(null);
  const [targetFor, setTargetFor] = useState<string | null>(null);
  const hostUse = uses.find((use) => use.id === hostFor);
  const targetUse = uses.find((use) => use.id === targetFor);
  const run = (action: () => void) => {
    try {
      action();
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Change could not be saved.");
    }
  };
  const openCoverage = (useId: string) => {
    setSelectedId(useId);
    setTab("Control coverage");
  };
  return (
    <Stack space="space.200">
      <Message error={error} />
      <Tabs value={tab} onValueChange={(value) => setTab(value as WorkspaceTab)}>
        <Inline space="space.200" alignBlock="center" spread="space-between" shouldWrap>
          <TabsList variant="line" aria-label="Program library">
            <TabsTrigger value="Components">
              Components
              <Count value={uses.length} />
            </TabsTrigger>
            <TabsTrigger value="Overlays">
              Overlays
              <Count value={assignments.length} />
            </TabsTrigger>
            <TabsTrigger value="Control coverage">Control coverage</TabsTrigger>
          </TabsList>
          <Inline space="space.100" shouldWrap>
            <Button size="small" variant="secondary" onClick={() => setAddingOverlay(true)}>
              Assign overlay
            </Button>
            <Button
              size="small"
              variant="primary"
              iconBefore={<Plus />}
              onClick={() => setAddingComponent(true)}
            >
              Add component
            </Button>
          </Inline>
        </Inline>
        <TabsContent value="Components">
          <Table label="Program components" className="table-fixed" style={{ minWidth: 1164 }}>
            <thead>
              <tr>
                <Table.Header width={260}>Instance</Table.Header>
                <Table.Header width={240}>Component</Table.Header>
                <Table.Header width={100}>Version</Table.Header>
                <Table.Header width={200}>System element</Table.Header>
                <Table.Header width={160}>Host</Table.Header>
                <Table.Header width={72}>Controls</Table.Header>
                <Table.Header width={132}>Actions</Table.Header>
              </tr>
            </thead>
            <tbody>
              {uses.map((use) => {
                const entry = libraryEntry(use.entryId);
                const release = libraryRelease(use.entryId, use.versionId);
                const latest = entry ? latestLibraryRelease(entry) : undefined;
                const node = nodes.find((candidate) => candidate.id === use.targetNodeId);
                const host = uses.find((candidate) => candidate.id === use.hostUseId);
                const depth = instanceDepth(use, uses);
                return (
                  <tr key={use.id}>
                    <Table.Cell className="whitespace-normal">
                      <Box
                        className="flex items-center gap-050"
                        style={{ paddingInlineStart: depth * 16 }}
                      >
                        {depth > 0 ? (
                          <ChevronRight aria-hidden className="size-icon-small text-subtle" />
                        ) : null}
                        <Button
                          size="small"
                          variant="subtle"
                          className="h-auto whitespace-normal text-left"
                          onClick={() => openCoverage(use.id)}
                        >
                          {use.name}
                        </Button>
                      </Box>
                      {use.role === "Host" ? (
                        <Badge variant="secondary">Host platform</Badge>
                      ) : null}
                    </Table.Cell>
                    <Table.Cell className="whitespace-normal">
                      {entry ? (
                        <TextLink render={<a href={recordHref(entry, use.versionId)} />}>
                          {entry.name}
                        </TextLink>
                      ) : (
                        use.entryId
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Stack space="space.050">
                        <span>{release?.version ?? use.versionId}</span>
                        {latest && latest.id !== use.versionId ? (
                          <Badge variant="secondary" tone="warning">
                            Update available
                          </Badge>
                        ) : null}
                      </Stack>
                    </Table.Cell>
                    <Table.Cell className="whitespace-normal">
                      <Button
                        size="small"
                        variant="subtle"
                        className="h-auto whitespace-normal text-left"
                        onClick={() => setTargetFor(use.id)}
                      >
                        {node?.name ?? "Assign element"}
                      </Button>
                    </Table.Cell>
                    <Table.Cell className="whitespace-normal">
                      {use.role === "Host" ? (
                        "—"
                      ) : (
                        <Button size="small" variant="subtle" onClick={() => setHostFor(use.id)}>
                          {host?.name ?? "Assign host"}
                        </Button>
                      )}
                    </Table.Cell>
                    <Table.Cell>{libraryControlIds(use.id).length}</Table.Cell>
                    <Table.Cell>
                      <Button size="small" variant="subtle" onClick={() => openCoverage(use.id)}>
                        Review
                      </Button>
                    </Table.Cell>
                  </tr>
                );
              })}
              {uses.length === 0 ? (
                <tr>
                  <Table.Cell colSpan={7}>No components added</Table.Cell>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </TabsContent>
        <TabsContent value="Overlays">
          <Table>
            <thead>
              <tr>
                <Table.Header>Overlay</Table.Header>
                <Table.Header>Version</Table.Header>
                <Table.Header>Applies to</Table.Header>
                <Table.Header>Controls</Table.Header>
                <Table.Header>Actions</Table.Header>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => {
                const entry = libraryEntry(assignment.entryId);
                const release = libraryRelease(assignment.entryId, assignment.versionId);
                const latest = entry ? latestLibraryRelease(entry) : undefined;
                return (
                  <tr key={assignment.id}>
                    <Table.Cell className="whitespace-normal">
                      {entry ? (
                        <TextLink render={<a href={recordHref(entry, assignment.versionId)} />}>
                          {entry.name}
                        </TextLink>
                      ) : (
                        assignment.entryId
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Stack space="space.050">
                        <span>{release?.version ?? assignment.versionId}</span>
                        {latest && latest.id !== assignment.versionId ? (
                          <Badge variant="secondary" tone="warning">
                            Update available
                          </Badge>
                        ) : null}
                      </Stack>
                    </Table.Cell>
                    <Table.Cell className="whitespace-normal">
                      {assignment.targetIds.includes("program")
                        ? "Entire program"
                        : assignment.targetIds
                            .map((id) => uses.find((use) => use.id === id)?.name ?? id)
                            .join(", ")}
                    </Table.Cell>
                    <Table.Cell>
                      {release?.controls.filter((control) => control.applicability === "Applicable")
                        .length ?? 0}
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        size="small"
                        variant="subtle"
                        onClick={() => run(() => removeLibraryAssignment(assignment.id))}
                      >
                        Remove
                      </Button>
                    </Table.Cell>
                  </tr>
                );
              })}
              {assignments.length === 0 ? (
                <tr>
                  <Table.Cell colSpan={5}>No overlays assigned</Table.Cell>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </TabsContent>
        <TabsContent value="Control coverage">
          <Box paddingBlockStart="space.150">
            <ControlCoverage
              uses={[libraryProgramTarget(programId), ...uses]}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </Box>
        </TabsContent>
      </Tabs>
      {addingComponent ? (
        <AddComponentDialog
          programId={programId}
          onClose={() => setAddingComponent(false)}
          onCreated={(use) => {
            setSelectedId(use.id);
            setTab("Components");
          }}
        />
      ) : null}
      {addingOverlay ? (
        <AddOverlayDialog programId={programId} onClose={() => setAddingOverlay(false)} />
      ) : null}
      {hostUse ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setHostFor(null);
          }}
        >
          <DialogContent aria-describedby={undefined} style={{ maxWidth: 480 }}>
            <DialogHeader>
              <DialogTitle>Host · {hostUse.name}</DialogTitle>
            </DialogHeader>
            <Box className="px-250 py-200">
              <Message error={error} />
              <Choice
                label="Host platform"
                value={hostUse.hostUseId ?? "none"}
                options={[
                  { value: "none", label: "None" },
                  ...uses
                    .filter((use) => use.role === "Host" && use.id !== hostUse.id)
                    .map((use) => ({ value: use.id, label: use.name })),
                ]}
                onChange={(value) =>
                  run(() => setLibraryHost(hostUse.id, value === "none" ? null : value))
                }
              />
            </Box>
            <DialogFooter>
              <Button variant="primary" onClick={() => setHostFor(null)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
      {targetUse ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setTargetFor(null);
          }}
        >
          <DialogContent aria-describedby={undefined} style={{ maxWidth: 520 }}>
            <DialogHeader>
              <DialogTitle>System element · {targetUse.name}</DialogTitle>
            </DialogHeader>
            <Box className="px-250 py-200">
              <Message error={error} />
              <Choice
                label="System element"
                value={targetUse.targetNodeId ?? "none"}
                options={[
                  { value: "none", label: "Unassigned" },
                  ...nodes.map((node) => ({
                    value: node.id,
                    label: `${node.name} · ${node.kind}`,
                  })),
                ]}
                onChange={(value) =>
                  run(() => setLibraryUseTarget(targetUse.id, value === "none" ? null : value))
                }
              />
            </Box>
            <DialogFooter>
              <Button variant="primary" onClick={() => setTargetFor(null)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </Stack>
  );
}
