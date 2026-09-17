import { EmptyMessage, MissingRecord } from "./work-common";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Absent,
  Inspector,
  Shell,
  Id,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Inline,
  KeyValue,
  PageHeader,
  Section,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
  Timeline,
} from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useWorkspace } from "@/components/app/workspace";
import { useRow, useRows, type Row } from "@/lib/models";
import { labelFor, type DataRecord } from "@/lib/records";
import { requirementIdentityLinks } from "@/lib/requirement-tree";
import { RelationName } from "./record-tools";
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

export type RequirementRecordFrame = { content: ReactNode; title: string };

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
  const frame = (content: ReactNode) =>
    renderFrame ? renderFrame({ content, title: active?.title ?? "Requirement" }) : content;

  if (
    (requirement.data === undefined || revisions.data === undefined) &&
    (requirement.isPending || requirement.error || revisions.isPending || revisions.error)
  )
    return frame(<ProgramQueryState queries={[requirement, revisions]} />);
  if (!requirement.data || requirement.data.program_id !== programId)
    return frame(
      <EmptyMessage
        title="Requirement not found"
        description="This requirement is unavailable in this program."
      />,
    );
  const content = (
    <Stack space="space.250">
      <ProgramQueryState queries={[requirement, revisions]} />
      {active ? (
        <>
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
                    createLabel="Link verification procedure"
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
              <Inspector.Group title="Details">
                <KeyValue label="Code">
                  <Id>{requirement.data.code}</Id>
                </KeyValue>
                <KeyValue label="Version">{active.version_number}</KeyValue>
                <KeyValue label="Status">{active.state}</KeyValue>
              </Inspector.Group>
            </Shell.Aside>
          )}
        </>
      ) : (
        <Section
          title="Requirement details"
          description="Add the authored statement and acceptance criteria to begin this requirement."
        >
          {canCreate && (
            <Button iconBefore={<Plus />} onClick={() => setCreating(true)}>
              Add requirement details
            </Button>
          )}
        </Section>
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
  statement: "Overview",
  acceptanceCriteria: "Acceptance criteria",
  rationale: "Rationale",
  requirementType: "Requirement type",
  ownerPartyId: "Owner",
};
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
  const events = ((query.data ?? []) as DataRecord[])
    .filter(
      (event) =>
        typeof event["requirement_revision_id"] === "string" &&
        revisionMap.has(event["requirement_revision_id"]) &&
        !!event["changes"] &&
        typeof event["changes"] === "object" &&
        !Array.isArray(event["changes"]) &&
        Object.keys(event["changes"]).length > 0,
    )
    .sort((a, b) => String(b["occurred_at"]).localeCompare(String(a["occurred_at"])));
  const diffValue = (field: string, value: unknown) => {
    if (value === null || value === undefined || value === "") return <Absent />;
    if (field === "ownerPartyId")
      return parties.data?.find((party) => party.id === value)?.name ?? String(value);
    return field === "requirementType" ? labelFor(String(value)) : String(value);
  };
  return (
    <Section title="Edit history" count={events.length}>
      <ProgramQueryState queries={[query]} />
      {query.isSuccess && !events.length && <EmptyMessage title="No edits recorded yet" />}
      {!!events.length && (
        <Timeline label="Edit history" size="small" wrap>
          {events.map((event) => {
            const changes = event["changes"];
            const entries =
              changes && typeof changes === "object" && !Array.isArray(changes)
                ? Object.entries(changes).filter(([, value]) => {
                    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
                    const change = value as Record<string, unknown>;
                    return change["before"] !== change["after"];
                  })
                : [];
            return (
              <Timeline.Item
                key={event.id}
                title={`${event["event_type"] === "created" ? "Added" : "Edited"} ${entries.map(([field]) => changeLabels[field] ?? labelFor(field)).join(", ")}`}
                description={
                  !event["source_requirement_revision_id"] &&
                  typeof event["description"] === "string"
                    ? event["description"]
                    : undefined
                }
                meta={
                  event["actor_party_id"] ? (
                    <RelationName table="parties" id={String(event["actor_party_id"])} />
                  ) : (
                    "Actor not recorded"
                  )
                }
                dateTime={String(event["occurred_at"])}
                timeTitle={String(event["occurred_at"])}
                time={new Date(String(event["occurred_at"])).toLocaleString()}
              >
                {entries.map(([field, value]) => {
                  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
                  return (
                    <span key={field} className="block whitespace-pre-wrap font-body-small">
                      <strong>{changeLabels[field] ?? labelFor(field)}: </strong>
                      {diffValue(field, (value as Record<string, unknown>)["before"])} →{" "}
                      {diffValue(field, (value as Record<string, unknown>)["after"])}
                    </span>
                  );
                })}
              </Timeline.Item>
            );
          })}
        </Timeline>
      )}
    </Section>
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
    return <span className="text-subtle">Loading requirement…</span>;
  if (!revision.data || !requirement.data || requirement.data.program_id !== programId)
    return <span className="text-subtle">Requirement unavailable</span>;
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
  const requirementCode = requirement.data.code;
  return (
    <RequirementRecordContent
      key={requirementId}
      programId={programId}
      requirementId={requirementId}
      tab={tab}
      onTabChange={onTabChange}
      renderFrame={({ content, title }) => (
        <Stack space="space.250">
          <PageHeader>
            <PageHeader.Lead render={<Breadcrumb />}>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link to="/programs" />}>Programs</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={<Link to="/programs/$programId" params={{ programId }} />}
                  >
                    {programName}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={
                      <Link
                        to="/programs/$programId"
                        params={{ programId }}
                        search={{ tab: "Requirements" }}
                      />
                    }
                  >
                    Requirements
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </PageHeader.Lead>
            <PageHeader.Heading>
              <PageHeader.Title>{title}</PageHeader.Title>
            </PageHeader.Heading>
          </PageHeader>
          {content}
        </Stack>
      )}
    />
  );
}
