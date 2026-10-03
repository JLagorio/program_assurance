import { ProductRecordDialog } from "./product-record-dialog";
import { MissingRecord, RecordActions, ReportFailures } from "./work-common";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Link, useBlocker } from "@tanstack/react-router";
import { useConfirmation, discardChanges } from "@/components/app/confirmation";
import {
  Absent,
  Diff,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
  Inspector,
  Shell,
  Skeleton,
  Id,
  Button,
  KeyValue,
  PageHeader,
  Section,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  TextLink,
  Timeline,
  VisuallyHidden,
  useLedgerLocale,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { Page } from "@/components/app/shell";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { idSet, useRow, useRows, type Row } from "@/lib/models";
import { programRequirementScope } from "@/lib/requirement-reads";
import { labelFor, type DataRecord } from "@/lib/records";
import { requirementIdentityLinks } from "@/lib/requirement-tree";
import { revisionStates } from "@/lib/status";
import { RelationName } from "./record-tools";
import { RecordTrail, TrailLink } from "./record-trail";
import { RequirementEvidence } from "./requirement-evidence";
import { RequirementControlMappings } from "./requirement-control-mappings";
import { RequirementAllocations } from "./requirement-allocations";
import { RequirementForm, type RequirementEditState } from "./requirement-form";
import { AddRequirementDetailsDialog } from "./add-requirement-details-dialog";
import { ProgramCollection, ProgramQueryState, RetainedTabPanels } from "./program-shared";

export const REQUIREMENT_TABS = [
  "Overview",
  "Control mappings",
  "Allocation",
  "Verification",
  "Evidence",
  "Edit history",
] as const;
export type RequirementTab = (typeof REQUIREMENT_TABS)[number];
/** The tabs drawn as retained panels; Overview, which holds the inline editor, has its own. */
const RETAINED_TABS: readonly RequirementTab[] = REQUIREMENT_TABS.filter(
  (value) => value !== "Overview",
);

export function requirementTab(value: unknown): RequirementTab | undefined {
  if (value === "Statement") return "Overview";
  if (value === "History") return "Edit history";
  return REQUIREMENT_TABS.find((tab) => tab === value);
}

export type RequirementRecordFrame = {
  content: ReactNode;
  title: string;
  /** The preview's record actions: the identity's edit as one small primary, or none. */
  actions: ReactNode;
  /** Opens the identity's edit, where the reader may make it; the page's Actions menu offers it. */
  onEdit: (() => void) | undefined;
};

type RequirementRecordProps = {
  programId: string;
  requirementId: string;
  tab?: RequirementTab | undefined;
  onTabChange?: ((tab: RequirementTab) => void) | undefined;
};

/** The page and the table preview render the same current requirement and its edit history. */
export function RequirementRecordContent({
  programId,
  requirementId,
  tab,
  onTabChange,
  preview = false,
  renderFrame,
}: RequirementRecordProps & {
  preview?: boolean;
  renderFrame?: (frame: RequirementRecordFrame) => ReactNode;
}) {
  const requirement = useRow("engineering_requirements", requirementId);
  const revisions = useRows("requirement_revisions", {
    engineering_requirement_id: requirementId,
  });
  const workspace = useWorkspace();
  const [localTab, setLocalTab] = useState<RequirementTab>("Overview");
  const [lockedRecord, setLockedRecord] = useState<Row<"requirement_revisions"> | null>(null);
  const activeRef = useRef<Row<"requirement_revisions"> | undefined>(undefined);
  const editState = useRef<RequirementEditState | null>(null);
  const onEditStateChange = useCallback((state: RequirementEditState) => {
    editState.current = state;
    setLockedRecord(state.dirty || state.busy ? (activeRef.current ?? null) : null);
  }, []);
  // The record guards the form's unsaved change rather than the form: the Overview panel stays
  // mounted while another tab shows, and the change it keeps is asked about from any tab.
  const { confirm, confirmation } = useConfirmation();
  // Set while a tab change is on its way through the router, which is not leaving the record.
  const switchingTab = useRef(false);
  useBlocker({
    shouldBlockFn: async ({ current, next }) => {
      if (switchingTab.current && current.pathname === next.pathname) {
        switchingTab.current = false;
        return false;
      }
      const state = editState.current;
      if (!state || (!state.busy && !state.dirty)) return false;
      if (state.busy) return true;
      if (!(await confirm(discardChanges("Your unsaved change to this requirement will be lost."))))
        return true;
      state.discard();
      return false;
    },
    enableBeforeUnload: () => !!editState.current?.busy || !!editState.current?.dirty,
  });
  const [creating, setCreating] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const ordered = [...(revisions.data ?? [])].sort((a, b) => b.version_number - a.version_number);
  const active = lockedRecord ?? ordered[0];
  activeRef.current = active;
  // Where the caller keeps the tab (the address, or the table's preview), it owns it: Back to an
  // address without one shows Overview again.
  const currentTab = onTabChange ? (requirementTab(tab) ?? "Overview") : localTab;
  // Overview is drawn the first time it is chosen, as the retained panels are.
  const [overviewShown, setOverviewShown] = useState(currentTab === "Overview");
  if (!overviewShown && currentTab === "Overview") setOverviewShown(true);
  const changeTab = (next: RequirementTab) => {
    // The panels are retained, so a change kept on Overview survives the switch: no prompt.
    switchingTab.current = true;
    if (onTabChange) onTabChange(next);
    else setLocalTab(next);
    requestAnimationFrame(() => {
      switchingTab.current = false;
    });
  };
  // Every member but a viewer writes the workspace's own requirements and their revisions, and
  // row-level security decides each write: the role says it, so the record and its preview do not
  // load the record schema, which is the schema inspector's.
  const canWrite =
    workspace.role !== "viewer" && requirement.data?.tenant_id === workspace.tenantId;
  const canCreate = canWrite;
  const canEdit = canWrite;
  // One rule for the page and the preview: the identity is edited where the revisions are.
  const canEditIdentity = canWrite;
  const onEdit = canEditIdentity ? () => setEditingIdentity(true) : undefined;
  // The preview's inner header takes the edit as its one small primary; the page puts it in its
  // Actions menu, before Inspect record.
  const actions = onEdit ? (
    <Button size="small" variant="primary" onClick={onEdit}>
      Edit engineering requirement
    </Button>
  ) : null;
  const frame = (content: ReactNode) =>
    renderFrame
      ? renderFrame({
          content,
          title: active?.title ?? requirement.data?.code ?? "Requirement",
          actions,
          onEdit,
        })
      : content;

  if (
    (requirement.data === undefined || revisions.data === undefined) &&
    (requirement.isPending || requirement.error || revisions.isPending || revisions.error)
  )
    return frame(<ProgramQueryState queries={[requirement, revisions]} />);
  if (!requirement.data || requirement.data.program_id !== programId)
    return frame(
      <MissingRecord
        inline
        backTo="/programs"
        kind="Requirement"
        description="This requirement is unavailable in this program."
      />,
    );
  const code = requirement.data.code;
  const content = (
    <Stack space="space.250">
      <ProgramQueryState queries={[requirement, revisions]} />
      {active ? (
        // Keyed by the revision row, not its revision number: a save must not remount the form,
        // which would drop the focus on the row that saved. The form takes a newer revision itself
        // once nothing is unsaved.
        <RequirementForm
          key={active.id}
          requirementId={requirementId}
          source={active}
          readOnly={!canEdit}
          onStateChange={onEditStateChange}
        >
          {({ body, properties }) => {
            // The requirement's properties, its type and owner editable where the reader may.
            const details = (
              <KeyValue.Group>
                <KeyValue label="Code" wrap>
                  <Id>{code}</Id>
                </KeyValue>
                <KeyValue label="Version" wrap>
                  {active.version_number}
                </KeyValue>
                <KeyValue label="State" wrap>
                  <StatusBadge statuses={revisionStates} value={active.state} />
                </KeyValue>
                {properties}
              </KeyValue.Group>
            );
            return (
              <>
                {/* A preview has no rail: its properties sit under its header. */}
                {preview ? details : null}
                <Tabs
                  value={currentTab}
                  onValueChange={(value) => changeTab(requirementTab(value) ?? "Overview")}
                >
                  <TabsList variant="line" aria-label="Requirement sections">
                    {REQUIREMENT_TABS.map((value) => (
                      <TabsTrigger key={value} value={value}>
                        {value}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {/* Overview is kept mounted and its effects keep running while another tab
                      shows: a save sent as the reader leaves the row for another tab settles on
                      that row, and a draft kept there is still reported to the guard above. The
                      retained panels below pause their effects while hidden, which a row's save
                      cannot survive. */}
                  {overviewShown ? (
                    <TabsContent value="Overview" keepMounted>
                      <Stack space="space.250" className="min-w-0">
                        {/* A failure region, as the retained panels are: its blocks' failures
                            read as one alert at its top. */}
                        <ProgramQueryState region>
                          {/* The page's Details, first on Overview: the rail beside the body, or
                            on a phone a closed disclosure above it that says the state. */}
                          {!preview && currentTab === "Overview" && (
                            <Shell.Aside
                              label="Requirement details"
                              summary={
                                <StatusBadge statuses={revisionStates} value={active.state} />
                              }
                            >
                              <Inspector.Group title="Details">{details}</Inspector.Group>
                            </Shell.Aside>
                          )}
                          {body}
                          <RequirementHierarchy revisionId={active.id} programId={programId} />
                        </ProgramQueryState>
                      </Stack>
                    </TabsContent>
                  ) : null}
                  {/* A panel per tab, kept once visited: a tab's search, filters and page survive
                      a round trip through the others. */}
                  <RetainedTabPanels tabs={RETAINED_TABS} value={currentTab} space="space.250">
                    {(value) => {
                      switch (value) {
                        case "Overview":
                          return null;
                        case "Control mappings":
                          return (
                            <RequirementControlMappings
                              programId={programId}
                              requirementId={requirementId}
                              contentId={active.id}
                              readOnly={!canEdit}
                            />
                          );
                        case "Allocation":
                          return (
                            <RequirementAllocations
                              programId={programId}
                              requirementId={requirementId}
                              contentId={active.id}
                              readOnly={!canEdit}
                            />
                          );
                        case "Verification":
                          return (
                            <ProgramCollection
                              fill
                              name="requirement_verifications"
                              title="Verification procedures"
                              filters={{ requirement_revision_id: active.id }}
                              columns={[
                                {
                                  key: "procedure_revision_id",
                                  title: "Procedure",
                                  render: (row) => (
                                    <RelationName
                                      table="procedure_revisions"
                                      id={String(row["procedure_revision_id"])}
                                    />
                                  ),
                                },
                                { key: "rationale", title: "Rationale" },
                              ]}
                              canCreate={!!canEdit}
                              readOnly={!canEdit}
                            />
                          );
                        case "Evidence":
                          return (
                            <RequirementEvidence
                              programId={programId}
                              requirementRevisionId={active.id}
                              readOnly={!canEdit}
                            />
                          );
                        case "Edit history":
                          return <RequirementActivity programId={programId} revisions={ordered} />;
                      }
                    }}
                  </RetainedTabPanels>
                </Tabs>
              </>
            );
          }}
        </RequirementForm>
      ) : (
        <Empty>
          <EmptyMedia aria-hidden>
            <EmptyIllustration kind="document" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No requirement details yet</EmptyTitle>
            <EmptyDescription>
              {canCreate
                ? "Add the statement and acceptance criteria to begin this requirement."
                : "The statement and acceptance criteria have not been written yet."}
            </EmptyDescription>
          </EmptyHeader>
          {canCreate ? (
            <EmptyContent>
              <Button variant="primary" iconBefore={<Plus />} onClick={() => setCreating(true)}>
                Create requirement revision
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      )}
      {editingIdentity && requirement.data && (
        <ProductRecordDialog
          table="engineering_requirements"
          existing={requirement.data}
          onClose={() => setEditingIdentity(false)}
        />
      )}
      {confirmation}
      {creating && (
        <AddRequirementDetailsDialog
          programId={programId}
          requirementId={requirementId}
          onClose={() => setCreating(false)}
          onSaved={() => changeTab("Overview")}
        />
      )}
    </Stack>
  );
  return frame(content);
}

const changeLabels: Record<string, string> = {
  title: "Title",
  statement: "Statement",
  acceptanceCriteria: "Acceptance criteria",
  rationale: "Rationale",
  requirementType: "Requirement type",
  ownerPartyId: "Owner",
};
/** The fields whose edits are paragraphs of authored text, shown as what changed in them. */
const proseChanges = new Set(["statement", "acceptanceCriteria", "rationale"]);
const textValue = (value: unknown) =>
  value === null || value === undefined ? "" : typeof value === "string" ? value : String(value);
function RequirementActivity({
  programId,
  revisions,
}: {
  programId: string;
  revisions: Row<"requirement_revisions">[];
}) {
  const query = useRows("activity_events", { program_id: programId });
  const parties = useRows("parties");
  const { formatDate } = useLedgerLocale();
  const revisionMap = new Map(revisions.map((revision) => [revision.id, revision]));
  const partyName = new Map((parties.data ?? []).map((party) => [party.id, party.name]));
  /** A person named in an entry: their name, or what the lookup came to, never a guess. */
  const person = (id: string) => {
    const name = partyName.get(id);
    if (name) return name;
    if (parties.data === undefined && parties.error)
      return <Text color="color.text.subtle">Could not load</Text>;
    if (parties.data === undefined)
      return (
        <>
          <Skeleton shape="line" width={96} />
          <VisuallyHidden>Loading</VisuallyHidden>
        </>
      );
    return <Absent label="Not available" />;
  };
  /**
   * The day and the minute in the reader's zone, and the ISO value as the `<time>`. The full
   * moment, with its weekday and zone, is the tooltip and what a screen reader hears after it.
   */
  const eventTime = (value: string) => {
    const instant = new Date(value);
    return {
      time: formatDate(instant, { dateStyle: "medium", timeStyle: "short" }),
      timeTitle: formatDate(instant, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }),
      dateTime: value,
    };
  };
  /** The fields whose value changed; an entry whose values all stayed the same says nothing. */
  const changedFields = (event: DataRecord) => {
    const changes = event["changes"];
    if (!changes || typeof changes !== "object" || Array.isArray(changes)) return [];
    return Object.entries(changes).filter(([, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      const change = value as Record<string, unknown>;
      return change["before"] !== change["after"];
    }) as [string, Record<string, unknown>][];
  };
  const events = ((query.data ?? []) as DataRecord[])
    .filter(
      (event) =>
        typeof event["requirement_revision_id"] === "string" &&
        revisionMap.has(event["requirement_revision_id"]) &&
        changedFields(event).length > 0,
    )
    .sort((a, b) => String(b["occurred_at"]).localeCompare(String(a["occurred_at"])));
  const diffValue = (field: string, value: unknown) => {
    if (value === null || value === undefined || value === "") return <Absent label="Empty" />;
    if (field === "ownerPartyId") return person(String(value));
    return field === "requirementType" ? labelFor(String(value)) : String(value);
  };
  // A failed refresh keeps the entries the reader has, under QueryState's one alert; a failed
  // lookup of a name says so in its place.
  return (
    <ProgramQueryState queries={[query, parties]}>
      {events.length ? (
        <Timeline label="Edit history" size="small" wrap>
          {events.map((event) => {
            const entries = changedFields(event);
            const actor = event["actor_party_id"];
            return (
              <Timeline.Item
                key={event.id}
                title={`${event["event_type"] === "created" ? "Added" : "Edited"} ${entries.map(([field]) => (changeLabels[field] ?? labelFor(field)).toLowerCase()).join(", ")}`}
                description={
                  !event["source_requirement_revision_id"] &&
                  typeof event["description"] === "string"
                    ? event["description"]
                    : undefined
                }
                meta={
                  typeof actor === "string" ? person(actor) : <Absent label="Actor not recorded" />
                }
                {...eventTime(String(event["occurred_at"]))}
              >
                <Stack space="space.100">
                  {entries.map(([field, change]) => {
                    const label = changeLabels[field] ?? labelFor(field);
                    // Authored paragraphs compare as a Diff; a title, a type or an owner is one value.
                    return proseChanges.has(field) ? (
                      <Diff
                        key={field}
                        before={textValue(change["before"])}
                        after={textValue(change["after"])}
                        beforeLabel="Before"
                        afterLabel="After"
                        label={`${label}, before and after this edit`}
                      />
                    ) : (
                      <KeyValue key={field} label={label} wrap>
                        {diffValue(field, change["before"])} → {diffValue(field, change["after"])}
                      </KeyValue>
                    );
                  })}
                </Stack>
              </Timeline.Item>
            );
          })}
        </Timeline>
      ) : (
        <Empty>
          <EmptyMedia aria-hidden>
            <EmptyIllustration kind="records" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No edits recorded yet</EmptyTitle>
            <EmptyDescription>
              Changes to the title, statement, acceptance criteria, rationale, type and owner appear
              here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </ProgramQueryState>
  );
}

function RequirementHierarchy({
  revisionId,
  programId,
}: {
  revisionId: string;
  programId: string;
}) {
  // The program's revisions, and the decompositions among them, read by their parent: of each, only
  // what names a requirement and its version, never a revision's authored text.
  const contents = useRows(
    "requirement_revisions",
    programRequirementScope(programId, "requirement_revisions"),
    { columns: ["id", "engineering_requirement_id", "version_number"] },
  );
  const relationships = useRows(
    "requirement_decompositions",
    { parent_requirement_revision_id: idSet(contents.data?.map((row) => row.id)) },
    {
      columns: ["id", "parent_requirement_revision_id", "child_requirement_revision_id"],
      enabled: contents.isSuccess,
    },
  );
  // Only a load with nothing to show replaces the section: a failed refresh keeps the links the
  // reader has, under QueryState's alert.
  if (relationships.data === undefined || contents.data === undefined)
    return <ProgramQueryState queries={[relationships, contents]} />;
  const links = requirementIdentityLinks(relationships.data, contents.data);
  const currentParents = links.filter((link) => link.child_requirement_revision_id === revisionId);
  const currentChildren = links.filter(
    (link) => link.parent_requirement_revision_id === revisionId,
  );
  if (!currentParents.length && !currentChildren.length)
    return <ProgramQueryState queries={[relationships, contents]} />;
  return (
    <Section title="Requirement hierarchy">
      <ProgramQueryState queries={[relationships, contents]} />
      {/* One label column for every link, as wide as its longest label. */}
      <KeyValue.Group labelWidth="auto">
        {currentParents.map((parent) => (
          <KeyValue key={parent.parentRequirementId} label="Parent requirement" wrap>
            <RequirementRevisionLink
              programId={programId}
              revisionId={parent.parent_requirement_revision_id}
            />
          </KeyValue>
        ))}
        {currentChildren.map((child) => (
          <KeyValue key={child.childRequirementId} label="Child requirement" wrap>
            <RequirementRevisionLink
              programId={programId}
              revisionId={child.child_requirement_revision_id}
            />
          </KeyValue>
        ))}
      </KeyValue.Group>
    </Section>
  );
}

function RequirementRevisionLink({
  programId,
  revisionId,
}: {
  programId: string;
  revisionId: string;
}) {
  const revision = useRow("requirement_revisions", revisionId);
  const requirement = useRow("engineering_requirements", revision.data?.engineering_requirement_id);
  // Three outcomes, as RelationName: a line while it loads, "Could not load" when the lookup
  // fails, and a missing value read as "Not available" when the requirement is missing or outside
  // this program.
  if (
    (revision.data === undefined && revision.isError) ||
    (revision.data && requirement.data === undefined && requirement.isError)
  )
    return <Text color="color.text.subtle">Could not load</Text>;
  if (revision.data === undefined || (revision.data && requirement.data === undefined))
    return (
      <>
        <Skeleton shape="line" width={160} />
        <VisuallyHidden>Loading requirement</VisuallyHidden>
      </>
    );
  if (!revision.data || !requirement.data || requirement.data.program_id !== programId)
    return <Absent label="Not available" />;
  return (
    <TextLink
      render={
        <Link
          to="/programs/$programId/requirements/$requirementId"
          params={{ programId, requirementId: requirement.data.id }}
        />
      }
    >
      {requirement.data.code} · {revision.data.title}
    </TextLink>
  );
}

export function ProgramRequirementRecord({
  programId,
  requirementId,
  tab,
  onTabChange,
}: RequirementRecordProps) {
  const program = useRow("programs", programId);
  const requirement = useRow("engineering_requirements", requirementId);
  if (
    (program.data === undefined || requirement.data === undefined) &&
    (program.isPending || program.error || requirement.isPending || requirement.error)
  )
    return <ProgramQueryState queries={[program, requirement]} />;
  if (!program.data || !requirement.data || requirement.data.program_id !== programId)
    return (
      <MissingRecord
        backTo="/programs"
        kind="Requirement"
        description="This requirement is unavailable in this program."
      />
    );
  // The program as every program sub-record's trail names it: its code and its name.
  const programName = `${program.data.code} · ${program.data.name}`;
  return (
    <RequirementRecordContent
      key={requirementId}
      programId={programId}
      requirementId={requirementId}
      tab={tab}
      onTabChange={onTabChange}
      renderFrame={({ content, title, onEdit }) => (
        <Page>
          {/* The page is one failure region, and each of its tabs another: an outage reads as one
              alert where it happened, whose Retry reloads every failed read in it. */}
          <ProgramQueryState region>
            <ReportFailures queries={[program]} />
            <PageHeader>
              <RecordTrail current={title}>
                <TrailLink to="/programs">Programs</TrailLink>
                <TrailLink to="/programs/$programId" params={{ programId }}>
                  {programName}
                </TrailLink>
                <TrailLink
                  to="/programs/$programId"
                  params={{ programId }}
                  search={{ tab: "Requirements" }}
                >
                  Requirements
                </TrailLink>
              </RecordTrail>
              <PageHeader.Heading>
                <PageHeader.Title>{title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <RecordActions
                  table="engineering_requirements"
                  id={requirementId}
                  onEdit={onEdit}
                  editLabel="Edit engineering requirement"
                />
              </PageHeader.Actions>
            </PageHeader>
            {content}
          </ProgramQueryState>
        </Page>
      )}
    />
  );
}
