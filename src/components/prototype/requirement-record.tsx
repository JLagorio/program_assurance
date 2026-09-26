import { ProductRecordDialog } from "./product-record-dialog";
import { DetailFacts, MissingRecord } from "./work-common";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Absent,
  DateTime,
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
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { useRow, useRows, type Row } from "@/lib/models";
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
import { ProgramCollection, ProgramQueryState } from "./program-shared";

export const REQUIREMENT_TABS = [
  "Overview",
  "Control mappings",
  "Allocation",
  "Verification",
  "Evidence",
  "Edit history",
] as const;
export type RequirementTab = (typeof REQUIREMENT_TABS)[number];

export function requirementTab(value: unknown): RequirementTab | undefined {
  if (value === "Statement") return "Overview";
  if (value === "History") return "Edit history";
  return REQUIREMENT_TABS.find((tab) => tab === value);
}

export type RequirementRecordFrame = { content: ReactNode; title: string; actions: ReactNode };

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
  const onEditStateChange = useCallback((state: RequirementEditState) => {
    setLockedRecord(state.dirty || state.busy ? (activeRef.current ?? null) : null);
  }, []);
  const [creating, setCreating] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const ordered = [...(revisions.data ?? [])].sort((a, b) => b.version_number - a.version_number);
  const active = lockedRecord ?? ordered[0];
  activeRef.current = active;
  const currentTab = requirementTab(tab) ?? localTab;
  const changeTab = (next: RequirementTab) => {
    setLocalTab(next);
    onTabChange?.(next);
  };
  const collection = workspace.collections.find((item) => item.name === "requirement_revisions");
  const canWrite =
    workspace.role !== "viewer" && requirement.data?.tenant_id === workspace.tenantId;
  const canCreate = canWrite && collection?.can_insert;
  const canEdit = canWrite && collection?.can_update;
  // One rule for the page and the preview: the identity is edited where it can be updated.
  const canEditIdentity =
    canWrite &&
    !!workspace.collections.find((item) => item.name === "engineering_requirements")?.can_update;
  const actions = canEditIdentity ? (
    <Button size="small" variant="primary" onClick={() => setEditingIdentity(true)}>
      Edit engineering requirement
    </Button>
  ) : null;
  const frame = (content: ReactNode) =>
    renderFrame
      ? renderFrame({
          content,
          title: active?.title ?? requirement.data?.code ?? "Requirement",
          actions,
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
  const details = active ? (
    <DetailFacts
      facts={[
        ["Code", <Id>{requirement.data.code}</Id>],
        ["Version", active.version_number],
        ["State", <StatusBadge statuses={revisionStates} value={active.state} />],
      ]}
    />
  ) : null;
  const content = (
    <Stack space="space.250">
      <ProgramQueryState queries={[requirement, revisions]} />
      {active ? (
        <>
          {/* A preview has no rail: its identity sits under its header. */}
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
            <TabsContent value={currentTab}>
              <Stack space="space.250" className="pt-200">
                {currentTab === "Overview" && (
                  <>
                    <RequirementForm
                      key={`${active.id}/${active.revision}`}
                      requirementId={requirementId}
                      source={active}
                      readOnly={!canEdit}
                      onStateChange={onEditStateChange}
                    />
                    <RequirementHierarchy revisionId={active.id} programId={programId} />
                  </>
                )}
                {currentTab === "Control mappings" && (
                  <RequirementControlMappings
                    programId={programId}
                    requirementId={requirementId}
                    contentId={active.id}
                    readOnly={!canEdit}
                  />
                )}
                {currentTab === "Allocation" && (
                  <RequirementAllocations
                    programId={programId}
                    requirementId={requirementId}
                    contentId={active.id}
                    readOnly={!canEdit}
                  />
                )}
                {currentTab === "Verification" && (
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
                )}
                {currentTab === "Evidence" && (
                  <RequirementEvidence
                    programId={programId}
                    requirementRevisionId={active.id}
                    readOnly={!canEdit}
                  />
                )}
                {currentTab === "Edit history" && (
                  <RequirementActivity programId={programId} revisions={ordered} />
                )}
              </Stack>
            </TabsContent>
          </Tabs>
          {!preview && currentTab === "Overview" && (
            <Shell.Aside label="Requirement details">
              <Inspector.Group title="Details">{details}</Inspector.Group>
            </Shell.Aside>
          )}
        </>
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
  const revisionMap = new Map(revisions.map((revision) => [revision.id, revision]));
  const partyName = new Map((parties.data ?? []).map((party) => [party.id, party.name]));
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
    if (field === "ownerPartyId") return partyName.get(String(value)) ?? "Unavailable owner";
    return field === "requirementType" ? labelFor(String(value)) : String(value);
  };
  if (query.isPending || query.error || parties.error)
    return <ProgramQueryState queries={[query, parties]} />;
  if (!events.length)
    return (
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
    );
  return (
    <Timeline label="Edit history" size="small" wrap>
      {events.map((event) => {
        const entries = changedFields(event);
        const actor = event["actor_party_id"];
        const occurredAt = String(event["occurred_at"]);
        return (
          <Timeline.Item
            key={event.id}
            title={`${event["event_type"] === "created" ? "Added" : "Edited"} ${entries.map(([field]) => (changeLabels[field] ?? labelFor(field)).toLowerCase()).join(", ")}`}
            description={
              !event["source_requirement_revision_id"] && typeof event["description"] === "string"
                ? event["description"]
                : undefined
            }
            meta={
              typeof actor === "string"
                ? (partyName.get(actor) ?? (parties.data ? "Unavailable person" : "Loading…"))
                : "Actor not recorded"
            }
            time={<DateTime value={occurredAt} focusable={false} />}
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
  );
}

function RequirementHierarchy({
  revisionId,
  programId,
}: {
  revisionId: string;
  programId: string;
}) {
  const relationships = useRows("requirement_decompositions");
  const contents = useRows("requirement_revisions");
  if (relationships.isPending || relationships.error || contents.isPending || contents.error)
    return <ProgramQueryState queries={[relationships, contents]} />;
  const links = requirementIdentityLinks(relationships.data ?? [], contents.data ?? []);
  const currentParents = links.filter((link) => link.child_requirement_revision_id === revisionId);
  const currentChildren = links.filter(
    (link) => link.parent_requirement_revision_id === revisionId,
  );
  if (!currentParents.length && !currentChildren.length) return null;
  return (
    <Section title="Requirement hierarchy">
      <Stack space="space.150">
        {currentParents.map((parent) => (
          <KeyValue
            key={parent.parentRequirementId}
            label="Parent requirement"
            labelWidth={144}
            wrap
          >
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
      </Stack>
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
  if (revision.isPending || (revision.data && requirement.isPending))
    return <Text color="color.text.subtle">Loading requirement…</Text>;
  if (!revision.data || !requirement.data || requirement.data.program_id !== programId)
    return <Text color="color.text.subtle">Requirement unavailable</Text>;
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
  const programName = program.data.name;
  return (
    <RequirementRecordContent
      key={requirementId}
      programId={programId}
      requirementId={requirementId}
      tab={tab}
      onTabChange={onTabChange}
      renderFrame={({ content, title, actions }) => (
        <Stack space="space.250">
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
            <PageHeader.Actions>{actions}</PageHeader.Actions>
          </PageHeader>
          {content}
        </Stack>
      )}
    />
  );
}
