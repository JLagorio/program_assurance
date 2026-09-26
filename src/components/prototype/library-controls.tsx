import { StatusBadge } from "@/components/app/status";
import { useRow, useRows, type Row } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { controlPublicationStatuses } from "@/lib/status";
import {
  Absent,
  DataTable,
  Heading,
  HeadingLevelProvider,
  Icon,
  Id,
  Inline,
  Inspector,
  KeyValue,
  List,
  Prose,
  Section,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  TextLink,
  VisuallyHidden,
  defineColumns,
  useDataTable,
  useLedgerLocale,
} from "@ledger/design-system";
import { useNavigate } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { QueryValue } from "./library-shared";
import { ProductCollection } from "./product-collection";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  recordDestination,
  useDisplayedRecords,
} from "./record-preview";
import { EmptyMessage, QueryState } from "./work-common";

/** A profile that selects a control, for the Selected by column. */
export type ControlSelector = { key: string; label: string; meta?: ReactNode | undefined };

/** What a control preview reads from its row; a full `controls` row is one. */
export type ControlSummary = Pick<
  Row<"controls">,
  "id" | "code" | "title" | "source_id" | "status"
>;

export function LibraryControlTable({
  controls,
  onSelect,
  label = "Catalog controls",
  filters,
  showRelease = true,
  selectedBy,
  selectedId,
  onDisplayedRowsChange,
}: {
  controls: Row<"controls">[];
  selectedId?: string | undefined;
  onDisplayedRowsChange?: ((rows: Row<"controls">[]) => void) | undefined;
  onSelect: (control: Row<"controls">) => void;
  label?: string;
  /** Extra toolbar controls after the search: an edition picker, say. */
  filters?: ReactNode;
  /** Hide the Release column when every row is from one edition. */
  showRelease?: boolean;
  /** The published profiles selecting each control, by control id; adds a Selected by column. */
  selectedBy?: Map<string, ControlSelector[]> | undefined;
}) {
  const navigate = useNavigate();
  const groups = useRows("catalog_groups", {}, { columns: ["id", "source_id"] });
  const revisions = useRows("catalog_revisions", {}, { columns: ["id", "version"] });
  const data = useMemo(() => {
    const families = new Map((groups.data ?? []).map((group) => [group.id, group.source_id]));
    const releases = new Map((revisions.data ?? []).map((revision) => [revision.id, revision]));
    return controls
      .map((control) => ({
        ...control,
        // The family reads as its code, "AC", as the catalog prints it beside the control.
        family: (control.group_id && families.get(control.group_id)?.toUpperCase()) || null,
        release: releases.get(control.catalog_revision_id)?.version ?? null,
        selectedBy: selectedBy?.get(control.id) ?? [],
      }))
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [controls, groups.data, revisions.data, selectedBy]);
  const columns = useMemo(
    () =>
      defineColumns<(typeof data)[number]>((c) => [
        // Every family's first control is "Policy and Procedures": the code stays beside the title.
        c.id("code", {
          header: "Control",
          // Wide enough for "AC-2(13)" and its eye, so a narrowed table keeps it beside the title.
          width: 112,
          priority: 1,
          pin: "start",
          hideable: false,
          preview: onSelect,
          active: (row) => row.id === selectedId,
        }),
        c.text("title", {
          header: "Title",
          hideable: false,
          priority: 0,
          minWidth: 200,
          cell: (row) => (
            <RecordLink table="controls" record={row}>
              {row.title}
            </RecordLink>
          ),
        }),
        c.text("family", { header: "Family", width: 100, priority: 2 }),
        ...(showRelease ? [c.text("release", { header: "Release", width: 100, priority: 3 })] : []),
        c.status("status", {
          header: "Status",
          width: 130,
          priority: 2,
          statuses: controlPublicationStatuses,
        }),
        ...(selectedBy
          ? [
              c.list("selectedBy", {
                header: "Selected by",
                width: 240,
                priority: 3,
                items: (row) => row.selectedBy,
                empty: () => <Absent label="None" />,
              }),
            ]
          : []),
      ]),
    [showRelease, selectedBy, onSelect, selectedId],
  );
  const table = useDataTable({
    data,
    columns,
    getRowId: (row) => row.id,
    label,
    view: "live-library-controls-v2",
    resizable: true,
    reorderable: true,
    virtualize: true,
  });
  useDisplayedRecords(table, onDisplayedRowsChange);
  return (
    <ProductCollection
      table={table}
      queries={[groups, revisions]}
      fill
      onRowClick={(row) => void navigate(recordDestination("controls", row))}
      empty={{
        illustration: "shield",
        title: "No controls yet",
        description: "Reference catalogs are loaded by a workspace administrator.",
      }}
      searchLabel="Find a control"
      filters={
        <>
          {filters}
          <DataTable.Filter table={table} column="family" />
          {showRelease && <DataTable.Filter table={table} column="release" />}
          <DataTable.Filter table={table} column="status" />
          {selectedBy && <DataTable.Filter table={table} column="selectedBy" />}
        </>
      }
    />
  );
}

/* ——— A control's text ——————————————————————————————————————————————————————————————————— */

type ParameterText = Pick<
  Row<"parameters">,
  "id" | "source_id" | "label" | "has_selection" | "selection_count" | "props"
>;
type ParameterChoice = Pick<Row<"parameter_choices">, "id" | "parameter_id" | "ordinal" | "value">;
type Placeholders = ReadonlyMap<string, { parameter: ParameterText; choices: string[] }>;

/** OSCAL's parameter insertion in authored prose: `{{ insert: param, ac-1_prm_1 }}`. */
const INSERT = /\{\{\s*insert:\s*param,\s*([^\s}]+)\s*\}\}/g;

const propValue = (props: unknown, name: string): string | undefined => {
  if (!Array.isArray(props)) return undefined;
  for (const prop of props)
    if (prop && typeof prop === "object" && "name" in prop && prop.name === name)
      return "value" in prop && typeof prop.value === "string" ? prop.value : undefined;
  return undefined;
};

/** Every parameter a control's prose may insert, by its id and by the alternative id it carries. */
function placeholderIndex(
  parameters: readonly ParameterText[],
  choices: readonly ParameterChoice[],
): Placeholders {
  const index = new Map<string, { parameter: ParameterText; choices: string[] }>();
  for (const parameter of parameters) {
    const entry = {
      parameter,
      choices: choices
        .filter((choice) => choice.parameter_id === parameter.id)
        .sort((a, b) => a.ordinal - b.ordinal)
        .map((choice) => choice.value),
    };
    index.set(parameter.source_id, entry);
    const alternative = propValue(parameter.props, "alt-identifier");
    if (alternative && !index.has(alternative)) index.set(alternative, entry);
  }
  return index;
}

/** A parameter as the catalog prints it: "[Assignment: organization-defined frequency]". */
function placeholderText(id: string, index: Placeholders, depth = 0): string {
  const entry = index.get(id);
  if (!entry) return `[Assignment: ${id}]`;
  const { parameter, choices } = entry;
  if (parameter.has_selection) {
    const how = parameter.selection_count === "one-or-more" ? " (one or more)" : "";
    const options = choices.map((choice) =>
      // A choice may insert another parameter; the catalog nests them only a level or two deep.
      choice.replace(INSERT, (_, inner: string) =>
        depth < 3 ? placeholderText(inner, index, depth + 1) : "[Assignment]",
      ),
    );
    return `[Selection${how}: ${options.join("; ") || "no choices recorded"}]`;
  }
  return `[Assignment: ${parameter.label ?? id}]`;
}

/** Authored control prose with each insertion shown as its labelled placeholder. */
function withPlaceholders(text: string, index: Placeholders): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INSERT)) {
    const at = match.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    out.push(
      <Text key={at} weight="medium" color="color.text.subtle">
        {placeholderText(match[1] ?? "", index)}
      </Text>,
    );
    last = at + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const HAS_INSERT = /\{\{\s*insert:\s*param,/;

function PartProse({ text, index }: { text: string; index: Placeholders }) {
  // Plain text keeps Prose's paragraphs; text with insertions is composed inline, breaks kept.
  return HAS_INSERT.test(text) ? (
    <Prose>{withPlaceholders(text, index)}</Prose>
  ) : (
    <Prose>{text}</Prose>
  );
}

const rootTitles: Record<string, string> = {
  statement: "Statement",
  guidance: "Discussion",
  "assessment-objective": "Assessment objective",
  overview: "Overview",
};
function rootTitle(part: Row<"control_parts">) {
  if (part.title) return part.title;
  const method = propValue(part.props, "method");
  if (part.name === "assessment-method" && method) return labelFor(method.toLowerCase());
  return rootTitles[part.name] ?? labelFor(part.name);
}

/** A part's children in order, each under its catalog label ("a.", "1.", "(a)"), nested inset. */
function PartList({
  parts,
  parentId,
  index,
  nested = false,
}: {
  parts: readonly Row<"control_parts">[];
  parentId: string;
  index: Placeholders;
  nested?: boolean;
}) {
  const children = parts
    .filter((part) => part.parent_part_id === parentId)
    .sort((a, b) => a.ordinal - b.ordinal);
  if (!children.length) return null;
  return (
    <Stack space="space.100" className={nested ? "border-s ps-150" : ""}>
      {children.map((part) => {
        const label = propValue(part.props, "label");
        return (
          <Stack key={part.id} space="space.075">
            {(label || part.title || part.prose) && (
              <Inline space="space.100" alignBlock="baseline">
                {label && (
                  <Text color="color.text.subtle" className="shrink-0 tabular-nums">
                    {label}
                  </Text>
                )}
                <Stack space="space.050" className="min-w-0 flex-1">
                  {part.title && <Text weight="medium">{part.title}</Text>}
                  {part.prose && <PartProse text={part.prose} index={index} />}
                </Stack>
              </Inline>
            )}
            <PartList parts={parts} parentId={part.id} index={index} nested />
          </Stack>
        );
      })}
    </Stack>
  );
}

/**
 * A control's text as the catalog prints it: each root part (Statement, Discussion, an assessment
 * objective or method) under a heading at the contextual level, its items under their labels, and
 * every parameter insertion as a labelled placeholder. The one composition of a control's parts.
 */
export function ControlStatement({
  parts,
  parameters,
  choices,
  roots,
}: {
  parts: readonly Row<"control_parts">[];
  parameters: readonly ParameterText[];
  choices: readonly ParameterChoice[];
  /** The root part names to show, in catalog order: ["statement", "guidance"], say. */
  roots: readonly string[];
}) {
  const index = useMemo(() => placeholderIndex(parameters, choices), [parameters, choices]);
  const shown = parts
    .filter((part) => part.parent_part_id === null && roots.includes(part.name))
    .sort((a, b) => a.ordinal - b.ordinal);
  return (
    <Stack space="space.300">
      {shown.map((part) => (
        <Stack key={part.id} space="space.100">
          <Heading size="xsmall">{rootTitle(part)}</Heading>
          <HeadingLevelProvider>
            {part.prose && <PartProse text={part.prose} index={index} />}
            <PartList parts={parts} parentId={part.id} index={index} />
          </HeadingLevelProvider>
        </Stack>
      ))}
    </Stack>
  );
}

/* ——— The control preview ——————————————————————————————————————————————————————————————— */

const tabRoots = {
  Statements: ["overview", "statement", "guidance"],
  Objectives: ["assessment-objective", "assessment-method"],
} as const;

export function ControlInspector<C extends ControlSummary>({
  control,
  onClose,
  selectionId,
  records,
  onSelect,
  task,
}: {
  control: C;
  onClose: () => void;
  selectionId?: string;
} & (
  | { records: C[]; onSelect: (row: C) => void; task?: never }
  | { task: string; records?: never; onSelect?: never }
)) {
  const locale = useLedgerLocale();
  const [tab, setTab] = useState<"Statements" | "Objectives" | "Parameters" | "Links">(
    "Statements",
  );
  const parts = useRows("control_parts", { control_id: control.id });
  const parameters = useRows("parameters", { control_id: control.id });
  const choices = useRows(
    "parameter_choices",
    {},
    { columns: ["id", "parameter_id", "ordinal", "value"] },
  );
  const links = useRows("control_links", { control_id: control.id });
  const selected = useRows(
    "selected_controls",
    { control_id: control.id },
    { columns: ["id", "profile_resolution_id"] },
  );
  const resolutions = useRows(
    "profile_resolutions",
    {},
    { columns: ["id", "profile_revision_id"] },
  );
  const profileRevisions = useRows(
    "profile_revisions",
    {},
    { columns: ["id", "profile_id", "title", "version"] },
  );
  const profiles = useRows("profiles", {}, { columns: ["id", "title", "tenant_id"] });
  const provenance = useRows(
    "selection_provenance",
    selectionId ? { selected_control_id: selectionId } : {},
    { enabled: !!selectionId },
  );
  const selectionQueries = [selected, resolutions, profileRevisions, profiles];
  // The profiles selecting this control, one line each: the shared baselines first, then the
  // workspace's own, each alphabetical.
  const selecting = useMemo(() => {
    const resolutionById = new Map((resolutions.data ?? []).map((row) => [row.id, row]));
    const revisionById = new Map((profileRevisions.data ?? []).map((row) => [row.id, row]));
    const profileById = new Map((profiles.data ?? []).map((row) => [row.id, row]));
    const lines = new Map<string, { title: string; version: string; shared: boolean }>();
    for (const selection of selected.data ?? []) {
      const resolution = resolutionById.get(selection.profile_resolution_id);
      const revision = resolution && revisionById.get(resolution.profile_revision_id);
      if (!revision) continue;
      const profile = profileById.get(revision.profile_id);
      lines.set(revision.id, {
        title: profile?.title ?? revision.title,
        version: revision.version,
        shared: profile?.tenant_id === null,
      });
    }
    return [...lines.entries()]
      .map(([key, line]) => ({ key, ...line }))
      .sort(
        (a, b) =>
          Number(b.shared) - Number(a.shared) ||
          a.title.localeCompare(b.title, undefined, { numeric: true }),
      );
  }, [selected.data, resolutions.data, profileRevisions.data, profiles.data]);
  const profileCount = (count: number) =>
    locale.formatPlural(count, { one: "{count} profile", other: "{count} profiles" });
  return (
    <RecordPreviewPanel
      title={control.title}
      label={task ?? "Control preview"}
      defaultWidth={640}
      onClose={onClose}
      navigation={
        records && onSelect ? (
          <RecordPreviewActions
            table="controls"
            record={control}
            rows={records}
            onSelect={onSelect}
          />
        ) : undefined
      }
    >
      {/* The preview's outline starts under its h2 record title, wherever it is rendered from. */}
      <HeadingLevelProvider level={3}>
        <Stack space="space.300">
          <KeyValue.Group>
            <KeyValue label="Control">
              <Id>{control.code}</Id>
            </KeyValue>
            <KeyValue label="Source identifier">
              <Id>{control.source_id}</Id>
            </KeyValue>
            <KeyValue label="Status">
              <StatusBadge statuses={controlPublicationStatuses} value={control.status} />
            </KeyValue>
            <KeyValue label="Selected by">
              <QueryValue queries={selectionQueries}>
                {() =>
                  selecting.length ? profileCount(selecting.length) : <Absent label="No profile" />
                }
              </QueryValue>
            </KeyValue>
          </KeyValue.Group>
          {selecting.length > 0 && (
            <Section title="Selecting profiles" count={String(selecting.length)} isCollapsible>
              <List>
                {selecting.map((line) => (
                  <List.Item key={line.key}>
                    {line.title}{" "}
                    <Text size="small" color="color.text.subtle">
                      · {line.version}
                    </Text>
                  </List.Item>
                ))}
              </List>
            </Section>
          )}
          {selectionId && (
            <Section title="Selection trail" isCollapsible>
              <QueryState queries={[provenance]}>
                {provenance.data?.length ? (
                  <Stack space="space.200">
                    {provenance.data.map((entry) => (
                      <KeyValue.Group key={entry.id}>
                        <KeyValue label="Source">
                          <Id>{entry.source_pointer}</Id>
                        </KeyValue>
                        <KeyValue label="Imported from" wrap>
                          <ImportSource id={entry.profile_import_id} />
                        </KeyValue>
                        {entry.rationale && (
                          <KeyValue label="Rationale" wrap>
                            {entry.rationale}
                          </KeyValue>
                        )}
                      </KeyValue.Group>
                    ))}
                  </Stack>
                ) : (
                  <EmptyMessage compact title="No selection trail recorded" />
                )}
              </QueryState>
            </Section>
          )}
          <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
            <TabsList variant="line" aria-label="Control sections">
              {(["Statements", "Objectives", "Parameters", "Links"] as const).map((name) => (
                <TabsTrigger key={name} value={name}>
                  {name}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={tab}>
              {(tab === "Statements" || tab === "Objectives") && (
                <QueryState queries={[parts, parameters, choices]}>
                  {(parts.data ?? []).some(
                    (part) =>
                      part.parent_part_id === null &&
                      (tabRoots[tab] as readonly string[]).includes(part.name),
                  ) ? (
                    <ControlStatement
                      parts={parts.data ?? []}
                      parameters={parameters.data ?? []}
                      choices={choices.data ?? []}
                      roots={tabRoots[tab]}
                    />
                  ) : (
                    <EmptyMessage
                      compact
                      title={
                        tab === "Statements" ? "No statement recorded" : "No objectives recorded"
                      }
                      description="The catalog records none for this control."
                    />
                  )}
                </QueryState>
              )}
              {tab === "Parameters" && (
                <QueryState queries={[parameters, choices]}>
                  {parameters.data?.length ? (
                    <Stack space="space.150">
                      {[...parameters.data]
                        .sort((a, b) => a.ordinal - b.ordinal)
                        .map((parameter) => (
                          <ParameterGroup
                            key={parameter.id}
                            parameter={parameter}
                            parameters={parameters.data ?? []}
                            choices={choices.data ?? []}
                          />
                        ))}
                    </Stack>
                  ) : (
                    <EmptyMessage
                      compact
                      title="No parameters declared"
                      description="This control's text has no values to assign."
                    />
                  )}
                </QueryState>
              )}
              {tab === "Links" && (
                <QueryState queries={[links]}>
                  <ControlLinks links={links.data ?? []} />
                </QueryState>
              )}
            </TabsContent>
          </Tabs>
        </Stack>
      </HeadingLevelProvider>
    </RecordPreviewPanel>
  );
}

/** Where a selection was imported from: the imported profile or catalog, by its title. */
function ImportSource({ id }: { id: string | null }) {
  const source = useRow("profile_imports", id);
  const profile = useRow("profile_revisions", source.data?.imported_profile_revision_id);
  const catalog = useRow("catalog_revisions", source.data?.catalog_revision_id);
  if (!id) return <Absent label="Not recorded" />;
  const pending = [source, ...(source.data?.imported_profile_revision_id ? [profile] : [])];
  return (
    <QueryValue queries={source.data?.catalog_revision_id ? [...pending, catalog] : pending}>
      {() =>
        profile.data?.title ??
        catalog.data?.title ??
        (source.data?.href ? <Id>{source.data.href}</Id> : <Absent label="Not recorded" />)
      }
    </QueryValue>
  );
}

function ParameterGroup({
  parameter,
  parameters,
  choices,
}: {
  parameter: Row<"parameters">;
  parameters: readonly ParameterText[];
  choices: readonly ParameterChoice[];
}) {
  const index = useMemo(() => placeholderIndex(parameters, choices), [parameters, choices]);
  const values = useRows("parameter_values", { parameter_id: parameter.id });
  const guidelines = useRows("parameter_guidelines", { parameter_id: parameter.id });
  const own = index.get(parameter.source_id)?.choices ?? [];
  return (
    <Inspector.Group title={propValue(parameter.props, "label") ?? parameter.source_id}>
      <KeyValue.Group>
        <KeyValue label="Label" wrap>
          {parameter.label ?? <Absent label="Not recorded" />}
        </KeyValue>
        {parameter.usage && (
          <KeyValue label="Usage" wrap>
            {parameter.usage}
          </KeyValue>
        )}
        <KeyValue label="Kind">
          {parameter.has_selection
            ? parameter.selection_count === "one-or-more"
              ? "Selection, one or more"
              : "Selection, one"
            : "Assignment"}
        </KeyValue>
        {own.length > 0 && (
          <KeyValue label="Choices" wrap>
            <List>
              {own.map((choice, position) => (
                <List.Item key={position}>
                  {choice.split(INSERT).map((piece, at) =>
                    // split keeps the captured id at odd positions.
                    at % 2 ? (
                      <Text key={at} weight="medium" color="color.text.subtle">
                        {placeholderText(piece, index)}
                      </Text>
                    ) : (
                      <Fragment key={at}>{piece}</Fragment>
                    ),
                  )}
                </List.Item>
              ))}
            </List>
          </KeyValue>
        )}
        <KeyValue label="Catalog value" wrap>
          <QueryValue queries={[values]}>
            {() =>
              values.data?.length ? (
                values.data.map((value) => value.value).join("; ")
              ) : (
                <Absent label="Not assigned in the catalog" />
              )
            }
          </QueryValue>
        </KeyValue>
      </KeyValue.Group>
      <QueryState queries={[guidelines]}>
        {guidelines.data?.map((guideline) => (
          <Prose key={guideline.id} label="Guideline">
            {guideline.prose}
          </Prose>
        ))}
      </QueryState>
    </Inspector.Group>
  );
}

/** The control's links: related controls, which open their records, and cited references. */
function ControlLinks({ links }: { links: readonly Row<"control_links">[] }) {
  const related = links.filter((link) => link.target_control_id);
  const references = links.filter((link) => link.resource_id);
  const other = links.filter((link) => !link.target_control_id && !link.resource_id);
  if (!links.length)
    return (
      <EmptyMessage
        compact
        title="No links recorded"
        description="The catalog relates this control to no other control or reference."
      />
    );
  return (
    <Stack space="space.300">
      {related.length > 0 && (
        <Section title="Related controls" count={String(related.length)}>
          <List>
            {related.map((link) => (
              <List.Item key={link.id}>
                <RelatedControl id={link.target_control_id!} />
              </List.Item>
            ))}
          </List>
        </Section>
      )}
      {references.length > 0 && (
        <Section title="References" count={String(references.length)}>
          <List spacing="loose">
            {references.map((link) => (
              <List.Item key={link.id}>
                <Reference id={link.resource_id!} />
              </List.Item>
            ))}
          </List>
        </Section>
      )}
      {other.length > 0 && (
        <Section title="Other links" count={String(other.length)}>
          <List>
            {other.map((link) => (
              <List.Item key={link.id}>
                {link.text ?? <Id>{link.href}</Id>}
                {link.relation && (
                  <Text size="small" color="color.text.subtle">
                    {" "}
                    · {labelFor(link.relation)}
                  </Text>
                )}
              </List.Item>
            ))}
          </List>
        </Section>
      )}
    </Stack>
  );
}

function RelatedControl({ id }: { id: string }) {
  const control = useRow("controls", id);
  return (
    <QueryValue queries={[control]}>
      {() =>
        control.data ? (
          <RecordLink table="controls" record={control.data}>
            {control.data.code} · {control.data.title}
          </RecordLink>
        ) : (
          <Text color="color.text.subtle">Not available</Text>
        )
      }
    </QueryValue>
  );
}

/** A cited reference: its title, a link to where it is published, in a new tab, and its citation. */
function Reference({ id }: { id: string }) {
  const resource = useRow("oscal_document_resources", id);
  return (
    <QueryValue queries={[resource]}>
      {() => {
        const row = resource.data;
        if (!row) return <Text color="color.text.subtle">Not available</Text>;
        const content = row.source_content as { rlinks?: { href?: unknown }[] } | null;
        const href = content?.rlinks?.find((link) => typeof link.href === "string")?.href as
          string | undefined;
        const title = row.title ?? "Untitled reference";
        return (
          <Stack space="space.025">
            {href && /^https?:\/\//.test(href) ? (
              <TextLink href={href} target="_blank" rel="noopener noreferrer">
                {title}{" "}
                <Icon>
                  <ExternalLink />
                </Icon>
                <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
              </TextLink>
            ) : (
              <Text>{title}</Text>
            )}
            {row.citation && (
              <Text size="small" color="color.text.subtle">
                {row.citation}
              </Text>
            )}
          </Stack>
        );
      }}
    </QueryValue>
  );
}
