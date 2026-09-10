import { options, runLibraryAction } from "./assurance-library-actions";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Search, Trash2 } from "lucide-react";
import {
  Box,
  Grid,
  Inline,
  Badge,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Id,
  IndexPage,
  Input,
  Inspector,
  KeyValue,
  PageHeader,
  RecordHeader,
  Section,
  ShowPage,
  Table,
  TabsList,
  TabsTrigger,
  Textarea,
  TextLink,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { downloadText } from "@/components/app/export";
import { nistControls, nistFamilies } from "@/lib/nist-catalog";
import { programs } from "@/lib/grc-data";
import {
  libraryAssignments,
  libraryEntries,
  libraryEntry,
  libraryRelease,
  libraryUses,
  latestLibraryRelease,
  publishLibraryDraft,
  saveLibraryDraft,
  startLibraryDraft,
  useLibraryVersion,
} from "@/lib/assurance-library";
import type {
  LibraryChild,
  LibraryControl,
  LibraryEntry,
  LibraryEvidence,
  LibraryKind,
  LibraryRequirement,
  LibraryVersion,
} from "@/lib/assurance-library-model";
import {
  LibraryControlDialog,
  LibraryDialog,
  LibraryEntryDialog,
  LibraryEvidenceDialog,
  LibraryField,
  LibraryMappings,
  LibraryRequirementDialog,
  LibrarySelect,
} from "./assurance-library-forms";

const plural = (kind: LibraryKind) => (kind === "Component" ? "Components" : "Overlays");
const displayedVersion = (entry: LibraryEntry) => entry.draft ?? latestLibraryRelease(entry);
const tone = (status: string) =>
  status === "Satisfied" || status === "Verified"
    ? ("success" as const)
    : status === "Other than satisfied"
      ? ("danger" as const)
      : ("neutral" as const);
const unique = (ids: string[]) => [...new Set(ids)];
function LibraryRecordLink({
  entry,
  children,
  versionId,
}: {
  entry: LibraryEntry;
  versionId?: string;
  children?: React.ReactNode;
}) {
  return entry.kind === "Component" ? (
    <TextLink
      render={
        <Link
          to="/library/components/$componentKey"
          params={{ componentKey: entry.key }}
          search={versionId ? { version: versionId } : {}}
        />
      }
    >
      {children ?? entry.name}
    </TextLink>
  ) : (
    <TextLink
      render={
        <Link
          to="/library/overlays/$overlayKey"
          params={{ overlayKey: entry.key }}
          search={versionId ? { version: versionId } : {}}
        />
      }
    >
      {children ?? entry.name}
    </TextLink>
  );
}
function EmptyRow({ columns, children }: { columns: number; children: React.ReactNode }) {
  return (
    <tr>
      <Table.Cell colSpan={columns} className="py-500 text-center">
        {children}
      </Table.Cell>
    </tr>
  );
}
export function AssuranceLibraryIndex({ kind }: { kind: LibraryKind }) {
  useLibraryVersion();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [creating, setCreating] = useState(false);
  const entries = libraryEntries(kind);
  const visible = entries.filter(
    (entry) =>
      (category === "All categories" || entry.category === category) &&
      `${entry.id} ${entry.name} ${entry.owner}`.toLowerCase().includes(search.toLowerCase()),
  );
  const openEntry = (entry: LibraryEntry) =>
    entry.kind === "Component"
      ? navigate({ to: "/library/components/$componentKey", params: { componentKey: entry.key } })
      : navigate({ to: "/library/overlays/$overlayKey", params: { overlayKey: entry.key } });
  return (
    <Shell>
      <IndexPage
        header={
          <PageHeader
            title={plural(kind)}
            actions={
              <>
                <Button
                  variant="secondary"
                  onClick={() =>
                    downloadText(
                      `${plural(kind).toLowerCase()}.json`,
                      JSON.stringify(entries, null, 2),
                      "application/json",
                    )
                  }
                >
                  Export
                </Button>
                <Button variant="primary" iconBefore={<Plus />} onClick={() => setCreating(true)}>
                  New {kind.toLowerCase()}
                </Button>
              </>
            }
          />
        }
        filters={
          <>
            <Box className="relative w-layout-rail max-w-full">
              <Search
                aria-hidden
                className="pointer-events-none absolute start-100 top-100 size-icon-small text-subtle"
              />
              <Input
                aria-label={`Search ${plural(kind).toLowerCase()}`}
                placeholder={`Search ${plural(kind).toLowerCase()}`}
                className="ps-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Box>
            <Box className="w-layout-rail">
              <LibrarySelect
                label="Category"
                value={category}
                options={options([
                  "All categories",
                  ...unique(entries.map((entry) => entry.category)),
                ])}
                onChange={setCategory}
              />
            </Box>
          </>
        }
      >
        <Table style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <Table.Header width={116}>ID</Table.Header>
              <Table.Header>{kind}</Table.Header>
              <Table.Header width={166}>Category</Table.Header>
              <Table.Header width={150}>Owner</Table.Header>
              <Table.Header width={88}>Version</Table.Header>
              <Table.Header width={80} className="text-right">
                Controls
              </Table.Header>
              <Table.Header width={92} className="text-right">
                Assessed
              </Table.Header>
              <Table.Header width={80} className="text-right">
                Programs
              </Table.Header>
              <Table.Header width={90}>Status</Table.Header>
            </tr>
          </thead>
          <tbody>
            {visible.map((entry) => {
              const version = displayedVersion(entry);
              const assessed =
                version?.controls.filter(
                  (control) =>
                    control.applicability === "Applicable" && control.assessment !== "Not assessed",
                ).length ?? 0;
              const used = unique(
                [
                  ...(kind === "Component"
                    ? libraryUses().filter((use) => use.entryId === entry.id)
                    : libraryAssignments().filter((assignment) => assignment.entryId === entry.id)),
                ].map((use) => use.programId),
              );
              return (
                <Table.Row
                  key={entry.id}
                  onClick={() => void openEntry(entry)}
                  className="cursor-pointer"
                >
                  <Table.Cell>
                    <Id>{entry.id}</Id>
                  </Table.Cell>
                  <Table.Cell>
                    <LibraryRecordLink entry={entry} />
                  </Table.Cell>
                  <Table.Cell>{entry.category}</Table.Cell>
                  <Table.Cell>{entry.owner}</Table.Cell>
                  <Table.Cell>{version?.version ?? "—"}</Table.Cell>
                  <Table.Cell className="text-right tabular-nums">
                    {version?.controls.length ?? 0}
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">{assessed}</Table.Cell>
                  <Table.Cell className="text-right tabular-nums">{used.length}</Table.Cell>
                  <Table.Cell>
                    <Badge variant="secondary" tone={entry.draft ? "warning" : "neutral"}>
                      {entry.draft ? "Draft" : "Published"}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              );
            })}
            {!visible.length && <EmptyRow columns={9}>No {plural(kind).toLowerCase()}</EmptyRow>}
          </tbody>
        </Table>
      </IndexPage>
      {creating && (
        <LibraryEntryDialog
          kind={kind}
          onClose={() => setCreating(false)}
          onCreated={(entry) => {
            setCreating(false);
            void openEntry(entry);
          }}
        />
      )}
    </Shell>
  );
}

export function AssuranceLibraryRecord({
  entryKey,
  kind,
  initialVersion = "",
}: {
  entryKey: string;
  kind: LibraryKind;
  initialVersion?: string | undefined;
}) {
  useLibraryVersion();
  const entry = libraryEntry(entryKey);
  const [tab, setTab] = useState("Controls");
  const [selectedVersion, setSelectedVersion] = useState(initialVersion);
  const [search, setSearch] = useState("");
  const [controlId, setControlId] = useState<string | null>(null);
  const [requirementId, setRequirementId] = useState<string | null>(null);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"details" | "draft" | "controls" | "child" | "scope" | null>(
    null,
  );
  if (!entry || entry.kind !== kind)
    return (
      <Shell>
        <PageHeader title={`${kind} not found`} />
      </Shell>
    );
  const current =
    selectedVersion === "draft"
      ? (entry.draft ?? latestLibraryRelease(entry))
      : selectedVersion
        ? entry.versions.find((version) => version.id === selectedVersion)
        : displayedVersion(entry);
  if (!current)
    return (
      <Shell>
        <PageHeader title={`${entry.name} · Version not found`} />
      </Shell>
    );
  const editable = entry.draft?.id === current.id;
  const versionValue = editable ? "draft" : current.id;
  const controls = current.controls.filter((control) =>
    `${control.id} ${control.title} ${control.family}`.toLowerCase().includes(search.toLowerCase()),
  );
  const uses = libraryUses().filter(
    (use) => use.entryId === entry.id && use.versionId === current.id,
  );
  const assignments = libraryAssignments().filter(
    (assignment) => assignment.entryId === entry.id && assignment.versionId === current.id,
  );
  const tabs = [
    "Controls",
    kind === "Component" ? "Structure" : "Scope",
    "Requirements",
    "Evidence",
    "Versions",
    "Programs",
  ];
  const save = (version: LibraryVersion) =>
    runLibraryAction(() => saveLibraryDraft(entry.id, version), "Draft saved");
  const saveControl = (control: LibraryControl) =>
    save({
      ...current,
      controls: current.controls.map((row) => (row.id === control.id ? control : row)),
      requirements: current.requirements.map((requirement) => ({
        ...requirement,
        controlIds: control.requirementIds.includes(requirement.id)
          ? unique([...requirement.controlIds, control.id])
          : requirement.controlIds.filter((id) => id !== control.id),
      })),
    });
  const saveRequirement = (requirement: LibraryRequirement) => {
    if (requirementId === "new" && current.requirements.some((row) => row.id === requirement.id))
      return runLibraryAction(() => {
        throw new Error("Requirement ID already exists");
      });
    return save({
      ...current,
      requirements:
        requirementId === "new"
          ? [...current.requirements, requirement]
          : current.requirements.map((row) => (row.id === requirement.id ? requirement : row)),
      controls: current.controls.map((control) => ({
        ...control,
        requirementIds: requirement.controlIds.includes(control.id)
          ? unique([...control.requirementIds, requirement.id])
          : control.requirementIds.filter((id) => id !== requirement.id),
      })),
    });
  };
  const saveEvidence = (evidence: LibraryEvidence) => {
    if (evidenceId === "new" && current.evidence.some((row) => row.id === evidence.id))
      return runLibraryAction(() => {
        throw new Error("Evidence ID already exists");
      });
    return save({
      ...current,
      evidence:
        evidenceId === "new"
          ? [...current.evidence, evidence]
          : current.evidence.map((row) => (row.id === evidence.id ? evidence : row)),
    });
  };
  const selectTab = (next: string) => {
    setTab(next);
    setSearch("");
  };
  return (
    <Shell>
      <ShowPage
        tab={tab}
        onTabChange={selectTab}
        header={
          <RecordHeader
            id={entry.id}
            title={entry.name}
            meta={`${entry.category} · ${current.version} · ${entry.owner}`}
            crumbs={
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={
                    kind === "Component" ? (
                      <Link to="/library/components" />
                    ) : (
                      <Link to="/library/overlays" />
                    )
                  }
                >
                  {plural(kind)}
                </BreadcrumbLink>
              </BreadcrumbItem>
            }
            actions={
              <>
                <Badge variant="secondary" tone={editable ? "warning" : "neutral"}>
                  {editable ? "Draft" : "Published"}
                </Badge>
                <Button variant="secondary" onClick={() => setDialog("details")}>
                  Edit details
                </Button>
                {editable ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      const publishedId = current.id;
                      if (
                        runLibraryAction(() => publishLibraryDraft(entry.id), "Version published")
                      )
                        setSelectedVersion(publishedId);
                    }}
                  >
                    Publish {current.version}
                  </Button>
                ) : entry.draft ? (
                  <Button variant="primary" onClick={() => setSelectedVersion("draft")}>
                    Open draft
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => setDialog("draft")}>
                    New version
                  </Button>
                )}
              </>
            }
          />
        }
        tabs={
          <TabsList variant="line" className="w-full justify-start">
            {tabs.map((value) => (
              <TabsTrigger value={value} key={value}>
                {value}
                {["Controls", "Requirements", "Evidence"].includes(value)
                  ? ` ${value === "Controls" ? current.controls.length : value === "Requirements" ? current.requirements.length : current.evidence.length}`
                  : ""}
              </TabsTrigger>
            ))}
          </TabsList>
        }
        rail={
          tab === "Controls" ? (
            <>
              <Inspector.Group title="Details">
                <KeyValue label="Category">{entry.category}</KeyValue>
                <KeyValue label="Owner">{entry.owner}</KeyValue>
                <KeyValue label="Published">{current.publishedOn ?? "—"}</KeyValue>
                <LibrarySelect
                  label="Version"
                  value={versionValue}
                  options={[
                    ...(entry.draft
                      ? [{ value: "draft", label: `${entry.draft.version} · Draft` }]
                      : []),
                    ...entry.versions.map((version) => ({
                      value: version.id,
                      label: `${version.version} · Published`,
                    })),
                  ]}
                  onChange={setSelectedVersion}
                />
              </Inspector.Group>
              <Inspector.Group title="Coverage">
                <KeyValue label="Applicable">
                  {
                    current.controls.filter((control) => control.applicability === "Applicable")
                      .length
                  }
                </KeyValue>
                <KeyValue label="Satisfied">
                  {
                    current.controls.filter(
                      (control) =>
                        control.applicability === "Applicable" &&
                        control.assessment === "Satisfied",
                    ).length
                  }
                </KeyValue>
                <KeyValue label="Deficient">
                  {
                    current.controls.filter(
                      (control) =>
                        control.applicability === "Applicable" &&
                        control.assessment === "Other than satisfied",
                    ).length
                  }
                </KeyValue>
                <KeyValue label="Not assessed">
                  {
                    current.controls.filter(
                      (control) =>
                        control.applicability === "Applicable" &&
                        control.assessment === "Not assessed",
                    ).length
                  }
                </KeyValue>
                <KeyValue label="Not applicable">
                  {
                    current.controls.filter((control) => control.applicability === "Not applicable")
                      .length
                  }
                </KeyValue>
              </Inspector.Group>
            </>
          ) : undefined
        }
      >
        {tab === "Controls" && (
          <Section
            title="Controls"
            action={
              editable ? (
                <Button
                  variant="secondary"
                  size="small"
                  iconBefore={<Plus />}
                  onClick={() => setDialog("controls")}
                >
                  Add controls
                </Button>
              ) : undefined
            }
          >
            <Box paddingBlockEnd="space.150">
              <Input
                aria-label="Search controls"
                placeholder="Search controls"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Box>
            <Table style={{ minWidth: 770 }}>
              <thead>
                <tr>
                  <Table.Header width={100}>Control</Table.Header>
                  <Table.Header>Title</Table.Header>
                  <Table.Header width={122}>Applicability</Table.Header>
                  <Table.Header width={104} className="text-right">
                    Requirements
                  </Table.Header>
                  <Table.Header width={76} className="text-right">
                    Evidence
                  </Table.Header>
                  <Table.Header width={166}>Assessment</Table.Header>
                </tr>
              </thead>
              <tbody>
                {controls.map((control) => (
                  <Table.Row
                    key={control.id}
                    className="cursor-pointer"
                    onClick={() => setControlId(control.id)}
                  >
                    <Table.Cell>
                      <Button variant="link" size="small" onClick={() => setControlId(control.id)}>
                        <Id>{control.id}</Id>
                      </Button>
                    </Table.Cell>
                    <Table.Cell>{control.title}</Table.Cell>
                    <Table.Cell>{control.applicability}</Table.Cell>
                    <Table.Cell className="text-right tabular-nums">
                      {control.requirementIds.length}
                    </Table.Cell>
                    <Table.Cell className="text-right tabular-nums">
                      {control.evidenceIds.length}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant="secondary" tone={tone(control.assessment)}>
                        {control.assessment}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {!controls.length && <EmptyRow columns={6}>No controls</EmptyRow>}
              </tbody>
            </Table>
          </Section>
        )}
        {tab === "Structure" && (
          <Section
            title="Components"
            action={
              editable ? (
                <Button
                  variant="secondary"
                  size="small"
                  iconBefore={<Plus />}
                  onClick={() => setDialog("child")}
                >
                  Add component
                </Button>
              ) : undefined
            }
          >
            <Table style={{ minWidth: 650 }}>
              <thead>
                <tr>
                  <Table.Header width={120}>Slot</Table.Header>
                  <Table.Header>Name</Table.Header>
                  <Table.Header>Component</Table.Header>
                  <Table.Header width={100}>Version</Table.Header>
                  <Table.Header width={88}>Controls</Table.Header>
                  {editable && <Table.Header width={64} aria-label="Actions" />}
                </tr>
              </thead>
              <tbody>
                {current.children.map((child) => {
                  const target = libraryEntry(child.entryId);
                  const release = libraryRelease(child.entryId, child.versionId);
                  return (
                    <Table.Row key={child.slot}>
                      <Table.Cell>
                        <Id>{child.slot}</Id>
                      </Table.Cell>
                      <Table.Cell>{child.name}</Table.Cell>
                      <Table.Cell>
                        {target ? (
                          <LibraryRecordLink entry={target} versionId={child.versionId} />
                        ) : (
                          child.entryId
                        )}
                      </Table.Cell>
                      <Table.Cell>{release?.version ?? "Unavailable"}</Table.Cell>
                      <Table.Cell>{release?.controls.length ?? "—"}</Table.Cell>
                      {editable && (
                        <Table.Cell>
                          <Button
                            variant="subtle"
                            size="small"
                            aria-label={`Remove ${child.name}`}
                            iconBefore={<Trash2 />}
                            onClick={() =>
                              save({
                                ...current,
                                children: current.children.filter((row) => row.slot !== child.slot),
                              })
                            }
                          />
                        </Table.Cell>
                      )}
                    </Table.Row>
                  );
                })}
                {!current.children.length && (
                  <EmptyRow columns={editable ? 6 : 5}>No nested components</EmptyRow>
                )}
              </tbody>
            </Table>
          </Section>
        )}
        {tab === "Scope" && (
          <Section
            title="Scope"
            action={
              editable ? (
                <Button variant="secondary" size="small" onClick={() => setDialog("scope")}>
                  Edit scope
                </Button>
              ) : undefined
            }
          >
            <Table>
              <thead>
                <tr>
                  <Table.Header width={180}>Field</Table.Header>
                  <Table.Header>Value</Table.Header>
                </tr>
              </thead>
              <tbody>
                <Table.Row>
                  <Table.Cell>Base overlay</Table.Cell>
                  <Table.Cell>
                    {current.baseOverlay ? (
                      <>
                        {libraryEntry(current.baseOverlay.entryId) ? (
                          <LibraryRecordLink
                            entry={libraryEntry(current.baseOverlay.entryId)!}
                            versionId={current.baseOverlay.versionId}
                          />
                        ) : (
                          current.baseOverlay.entryId
                        )}{" "}
                        ·{" "}
                        {
                          libraryRelease(current.baseOverlay.entryId, current.baseOverlay.versionId)
                            ?.version
                        }
                      </>
                    ) : (
                      "None"
                    )}
                  </Table.Cell>
                </Table.Row>
                {current.conditions.map((condition, index) => (
                  <Table.Row key={index}>
                    <Table.Cell>Condition {index + 1}</Table.Cell>
                    <Table.Cell className="whitespace-normal">{condition}</Table.Cell>
                  </Table.Row>
                ))}
              </tbody>
            </Table>
          </Section>
        )}
        {tab === "Requirements" && (
          <Section
            title="Requirements"
            action={
              editable ? (
                <Button
                  variant="secondary"
                  size="small"
                  iconBefore={<Plus />}
                  onClick={() => setRequirementId("new")}
                >
                  Add requirement
                </Button>
              ) : undefined
            }
          >
            <Table style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <Table.Header width={130}>Requirement</Table.Header>
                  <Table.Header>Title</Table.Header>
                  <Table.Header width={190}>Controls</Table.Header>
                  <Table.Header width={88} className="text-right">
                    Evidence
                  </Table.Header>
                  <Table.Header width={100}>Status</Table.Header>
                </tr>
              </thead>
              <tbody>
                {current.requirements.map((requirement) => (
                  <Table.Row
                    className="cursor-pointer"
                    key={requirement.id}
                    onClick={() => setRequirementId(requirement.id)}
                  >
                    <Table.Cell>
                      <Button
                        variant="link"
                        size="small"
                        onClick={() => setRequirementId(requirement.id)}
                      >
                        <Id>{requirement.id}</Id>
                      </Button>
                    </Table.Cell>
                    <Table.Cell className="whitespace-normal">{requirement.title}</Table.Cell>
                    <Table.Cell className="whitespace-normal">
                      {requirement.controlIds.join(", ") || "—"}
                    </Table.Cell>
                    <Table.Cell className="text-right">{requirement.evidenceIds.length}</Table.Cell>
                    <Table.Cell>
                      <Badge variant="secondary" tone={tone(requirement.status)}>
                        {requirement.status}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {!current.requirements.length && <EmptyRow columns={5}>No requirements</EmptyRow>}
              </tbody>
            </Table>
          </Section>
        )}
        {tab === "Evidence" && (
          <Section
            title="Evidence"
            action={
              editable ? (
                <Button
                  variant="secondary"
                  size="small"
                  iconBefore={<Plus />}
                  onClick={() => setEvidenceId("new")}
                >
                  Add evidence
                </Button>
              ) : undefined
            }
          >
            <Table style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <Table.Header width={130}>Evidence</Table.Header>
                  <Table.Header>Title</Table.Header>
                  <Table.Header width={120}>Type</Table.Header>
                  <Table.Header width={120}>Date</Table.Header>
                  <Table.Header>Reference</Table.Header>
                </tr>
              </thead>
              <tbody>
                {current.evidence.map((evidence) => (
                  <Table.Row
                    className="cursor-pointer"
                    key={evidence.id}
                    onClick={() => setEvidenceId(evidence.id)}
                  >
                    <Table.Cell>
                      <Button
                        variant="link"
                        size="small"
                        onClick={() => setEvidenceId(evidence.id)}
                      >
                        <Id>{evidence.id}</Id>
                      </Button>
                    </Table.Cell>
                    <Table.Cell>{evidence.title}</Table.Cell>
                    <Table.Cell>{evidence.kind}</Table.Cell>
                    <Table.Cell>{evidence.date}</Table.Cell>
                    <Table.Cell className="whitespace-normal break-all">
                      {evidence.reference}
                    </Table.Cell>
                  </Table.Row>
                ))}
                {!current.evidence.length && <EmptyRow columns={5}>No evidence</EmptyRow>}
              </tbody>
            </Table>
          </Section>
        )}
        {tab === "Versions" && (
          <Section title="Versions">
            <Table style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <Table.Header width={110}>Version</Table.Header>
                  <Table.Header width={120}>Status</Table.Header>
                  <Table.Header>Published</Table.Header>
                  <Table.Header width={100}>Controls</Table.Header>
                  <Table.Header width={100}>Components</Table.Header>
                  <Table.Header width={90} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {[...(entry.draft ? [entry.draft] : []), ...[...entry.versions].reverse()].map(
                  (version) => (
                    <Table.Row key={version.id}>
                      <Table.Cell>{version.version}</Table.Cell>
                      <Table.Cell>
                        <Badge
                          variant="secondary"
                          tone={version.publishedOn ? "neutral" : "warning"}
                        >
                          {version.publishedOn ? "Published" : "Draft"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>{version.publishedOn ?? "—"}</Table.Cell>
                      <Table.Cell>{version.controls.length}</Table.Cell>
                      <Table.Cell>{version.children.length}</Table.Cell>
                      <Table.Cell>
                        <Button
                          variant="link"
                          size="small"
                          onClick={() => {
                            setSelectedVersion(version.publishedOn ? version.id : "draft");
                            setTab("Controls");
                          }}
                        >
                          Open
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ),
                )}
              </tbody>
            </Table>
          </Section>
        )}
        {tab === "Programs" && (
          <Section title={`Programs · ${current.version}`}>
            <Table style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <Table.Header width={130}>Program</Table.Header>
                  <Table.Header>Name</Table.Header>
                  <Table.Header>{kind === "Component" ? "Instance" : "Targets"}</Table.Header>
                  <Table.Header width={100}>Version</Table.Header>
                </tr>
              </thead>
              <tbody>
                {uses.map((use) => (
                  <Table.Row key={use.id}>
                    <Table.Cell>
                      <TextLink
                        render={
                          <Link
                            to="/programs/$programId"
                            search={{ tab: "Library" }}
                            params={{ programId: use.programId }}
                          />
                        }
                      >
                        <Id>{use.programId}</Id>
                      </TextLink>
                    </Table.Cell>
                    <Table.Cell>
                      {programs.find((program) => program.id === use.programId)?.name ??
                        use.programId}
                    </Table.Cell>
                    <Table.Cell>{use.name}</Table.Cell>
                    <Table.Cell>{current.version}</Table.Cell>
                  </Table.Row>
                ))}
                {assignments.map((assignment) => (
                  <Table.Row key={assignment.id}>
                    <Table.Cell>
                      <TextLink
                        render={
                          <Link
                            to="/programs/$programId"
                            search={{ tab: "Library" }}
                            params={{ programId: assignment.programId }}
                          />
                        }
                      >
                        <Id>{assignment.programId}</Id>
                      </TextLink>
                    </Table.Cell>
                    <Table.Cell>
                      {programs.find((program) => program.id === assignment.programId)?.name ??
                        assignment.programId}
                    </Table.Cell>
                    <Table.Cell>{assignment.targetIds.length}</Table.Cell>
                    <Table.Cell>{current.version}</Table.Cell>
                  </Table.Row>
                ))}
                {!uses.length && !assignments.length && (
                  <EmptyRow columns={4}>No programs</EmptyRow>
                )}
              </tbody>
            </Table>
          </Section>
        )}
      </ShowPage>
      {dialog === "details" && (
        <LibraryEntryDialog
          kind={kind}
          entry={entry}
          onClose={() => setDialog(null)}
          onCreated={() => setDialog(null)}
        />
      )}
      {dialog === "draft" && (
        <NewVersionDialog
          entry={entry}
          onClose={() => setDialog(null)}
          onCreated={() => {
            setDialog(null);
            setSelectedVersion("draft");
          }}
        />
      )}
      {dialog === "controls" && (
        <AddControlsDialog
          version={current}
          onClose={() => setDialog(null)}
          onSave={(ids) =>
            save({
              ...current,
              controls: [
                ...current.controls,
                ...nistControls
                  .filter((control) => ids.includes(control.id))
                  .map((control): LibraryControl => ({
                    id: control.id,
                    title: control.title,
                    family: control.family,
                    applicability: "Applicable",
                    implementation: "",
                    consumerResponsibility: "",
                    assessment: "Not assessed",
                    assessor: "",
                    assessedOn: "",
                    requirementIds: [],
                    evidenceIds: [],
                  })),
              ],
            })
          }
        />
      )}
      {dialog === "child" && (
        <AddChildDialog
          entry={entry}
          version={current}
          onClose={() => setDialog(null)}
          onSave={(child) => save({ ...current, children: [...current.children, child] })}
        />
      )}
      {dialog === "scope" && (
        <OverlayScopeDialog
          entry={entry}
          version={current}
          onClose={() => setDialog(null)}
          onSave={save}
        />
      )}
      {controlId && current.controls.find((control) => control.id === controlId) && (
        <LibraryControlDialog
          key={`${current.id}-${controlId}`}
          control={current.controls.find((control) => control.id === controlId)!}
          version={current}
          editable={editable}
          onClose={() => setControlId(null)}
          onSave={saveControl}
          onRemove={() =>
            save({
              ...current,
              controls: current.controls.filter((control) => control.id !== controlId),
              requirements: current.requirements.map((requirement) => ({
                ...requirement,
                controlIds: requirement.controlIds.filter((id) => id !== controlId),
              })),
            })
          }
        />
      )}
      {requirementId && (
        <LibraryRequirementDialog
          key={`${current.id}-${requirementId}`}
          {...(requirementId === "new"
            ? {}
            : { requirement: current.requirements.find((row) => row.id === requirementId)! })}
          version={current}
          editable={editable}
          onClose={() => setRequirementId(null)}
          onSave={saveRequirement}
          {...(requirementId !== "new"
            ? {
                onRemove: () =>
                  save({
                    ...current,
                    requirements: current.requirements.filter(
                      (requirement) => requirement.id !== requirementId,
                    ),
                    controls: current.controls.map((control) => ({
                      ...control,
                      requirementIds: control.requirementIds.filter((id) => id !== requirementId),
                    })),
                  }),
              }
            : {})}
        />
      )}
      {evidenceId && (
        <LibraryEvidenceDialog
          key={`${current.id}-${evidenceId}`}
          {...(evidenceId === "new"
            ? {}
            : { evidence: current.evidence.find((row) => row.id === evidenceId)! })}
          version={current}
          editable={editable}
          onClose={() => setEvidenceId(null)}
          onSave={saveEvidence}
          {...(evidenceId !== "new"
            ? {
                onRemove: () =>
                  save({
                    ...current,
                    evidence: current.evidence.filter((evidence) => evidence.id !== evidenceId),
                    controls: current.controls.map((control) => ({
                      ...control,
                      evidenceIds: control.evidenceIds.filter((id) => id !== evidenceId),
                    })),
                    requirements: current.requirements.map((requirement) => ({
                      ...requirement,
                      evidenceIds: requirement.evidenceIds.filter((id) => id !== evidenceId),
                    })),
                  }),
              }
            : {})}
        />
      )}
    </Shell>
  );
}

function NewVersionDialog({
  entry,
  onClose,
  onCreated,
}: {
  entry: LibraryEntry;
  onClose: () => void;
  onCreated: () => void;
}) {
  const previous = latestLibraryRelease(entry)?.version ?? "1.0";
  const parts = previous.split(".");
  const [version, setVersion] = useState(
    /^\d+$/.test(parts.at(-1) ?? "")
      ? [...parts.slice(0, -1), String(Number(parts.at(-1)) + 1)].join(".")
      : "",
  );
  return (
    <LibraryDialog
      title="New version"
      onClose={onClose}
      saveLabel="Create draft"
      disabled={!version.trim()}
      onSave={() => {
        if (runLibraryAction(() => startLibraryDraft(entry.id, version), "Draft created"))
          onCreated();
      }}
    >
      <LibraryField label="Version">
        <Input aria-label="Version" value={version} onChange={(e) => setVersion(e.target.value)} />
      </LibraryField>
    </LibraryDialog>
  );
}
function AddControlsDialog({
  version,
  onClose,
  onSave,
}: {
  version: LibraryVersion;
  onClose: () => void;
  onSave: (ids: string[]) => boolean;
}) {
  const [family, setFamily] = useState("AU");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const rows = nistControls.filter(
    (control) =>
      !control.withdrawn &&
      control.family === family &&
      !version.controls.some((row) => row.id === control.id) &&
      `${control.id} ${control.title}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <LibraryDialog
      title="Add controls"
      onClose={onClose}
      saveLabel={`Add ${selected.length} controls`}
      disabled={!selected.length}
      onSave={() => {
        if (onSave(selected)) onClose();
      }}
    >
      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }} gap="space.200">
        <LibrarySelect
          label="Family"
          value={family}
          options={nistFamilies.map((item) => ({
            value: item.id,
            label: `${item.id} · ${item.name}`,
          }))}
          onChange={setFamily}
        />
        <LibraryField label="Search">
          <Input
            aria-label="Search available controls"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </LibraryField>
      </Grid>
      <Inline alignBlock="center" spread="space-between">
        <span className="font-body-small text-subtle">{selected.length} selected</span>
        <Button
          variant="link"
          size="small"
          onClick={() => setSelected(unique([...selected, ...rows.map((row) => row.id)]))}
        >
          Select {search ? "matching controls" : `${family} family`}
        </Button>
      </Inline>
      <LibraryMappings label="Controls" rows={rows} selected={selected} onChange={setSelected} />
    </LibraryDialog>
  );
}
function AddChildDialog({
  entry,
  version,
  onClose,
  onSave,
}: {
  entry: LibraryEntry;
  version: LibraryVersion;
  onClose: () => void;
  onSave: (child: LibraryChild) => boolean;
}) {
  const candidates = libraryEntries("Component").filter(
    (candidate) => candidate.id !== entry.id && candidate.versions.length,
  );
  const [entryId, setEntryId] = useState(candidates[0]?.id ?? "");
  const target = candidates.find((candidate) => candidate.id === entryId);
  const [versionId, setVersionId] = useState(
    target ? (latestLibraryRelease(target)?.id ?? "") : "",
  );
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  return (
    <LibraryDialog
      title="Add component"
      onClose={onClose}
      saveLabel="Add component"
      disabled={!entryId || !versionId || !slot.trim() || !name.trim()}
      onSave={() => {
        if (version.children.some((child) => child.slot === slot.trim())) {
          runLibraryAction(() => {
            throw new Error("Slot already exists");
          });
          return;
        }
        if (onSave({ entryId, versionId, slot: slot.trim(), name: name.trim() })) onClose();
      }}
    >
      <LibrarySelect
        label="Component"
        value={entryId}
        options={candidates.map((candidate) => ({ value: candidate.id, label: candidate.name }))}
        onChange={(id) => {
          setEntryId(id);
          const next = libraryEntry(id);
          setVersionId(next ? (latestLibraryRelease(next)?.id ?? "") : "");
          if (!name) setName(next?.name ?? "");
        }}
      />
      <LibrarySelect
        label="Version"
        value={versionId}
        options={(target?.versions ?? []).map((release) => ({
          value: release.id,
          label: release.version,
        }))}
        onChange={setVersionId}
      />
      <Grid templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }} gap="space.200">
        <LibraryField label="Slot">
          <Input aria-label="Slot" value={slot} onChange={(e) => setSlot(e.target.value)} />
        </LibraryField>
        <LibraryField label="Instance name">
          <Input
            aria-label="Instance name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </LibraryField>
      </Grid>
    </LibraryDialog>
  );
}
function OverlayScopeDialog({
  entry,
  version,
  onClose,
  onSave,
}: {
  entry: LibraryEntry;
  version: LibraryVersion;
  onClose: () => void;
  onSave: (version: LibraryVersion) => boolean;
}) {
  const candidates = libraryEntries("Overlay").filter(
    (candidate) => candidate.id !== entry.id && candidate.versions.length,
  );
  const [entryId, setEntryId] = useState(version.baseOverlay?.entryId ?? "none");
  const target = libraryEntry(entryId);
  const [versionId, setVersionId] = useState(version.baseOverlay?.versionId ?? "");
  const [conditions, setConditions] = useState(version.conditions.join("\n"));
  return (
    <LibraryDialog
      title="Edit scope"
      onClose={onClose}
      disabled={entryId !== "none" && !versionId}
      onSave={() => {
        if (
          onSave({
            ...version,
            baseOverlay: entryId === "none" ? null : { entryId, versionId },
            conditions: conditions
              .split("\n")
              .map((condition) => condition.trim())
              .filter(Boolean),
          })
        )
          onClose();
      }}
    >
      <LibrarySelect
        label="Base overlay"
        value={entryId}
        options={[
          { value: "none", label: "None" },
          ...candidates.map((candidate) => ({ value: candidate.id, label: candidate.name })),
        ]}
        onChange={(id) => {
          setEntryId(id);
          const next = libraryEntry(id);
          setVersionId(next ? (latestLibraryRelease(next)?.id ?? "") : "");
        }}
      />
      {entryId !== "none" && (
        <LibrarySelect
          label="Base version"
          value={versionId}
          options={(target?.versions ?? []).map((release) => ({
            value: release.id,
            label: release.version,
          }))}
          onChange={setVersionId}
        />
      )}
      <LibraryField label="Conditions">
        <Textarea
          aria-label="Conditions"
          rows={5}
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
        />
      </LibraryField>
    </LibraryDialog>
  );
}
