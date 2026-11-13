import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ListChecks, MoreHorizontal, Plus } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  KeyValue,
  LinkButton,
  Prose,
  RecordBrowser,
  Section,
  Stack,
  defineColumns,
  toast,
} from "@ledger/design-system";
import { useConfirmation } from "@/components/app/confirmation";
import { causeText } from "@/components/app/sentence";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import {
  useIssueRequirements,
  useLinkIssueRequirements,
  useRequirementChoices,
  useUnlinkIssueRequirement,
  type IssueRequirement,
  type RequirementChoice,
} from "@/lib/issue-requirements";
import { revisionStates } from "@/lib/status";
import { useCollectionTable } from "./collection-question";
import { ProductCollection } from "./product-collection";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  useDisplayedRecords,
  useEndOnHide,
  useOpenRecord,
  useRemovalFocus,
} from "./record-preview";
import { RequirementRecordContent } from "./requirement-record";

/*
 * The requirements an operational issue is about, as a Section of its record. The issue names
 * them, one link a requirement of its program; the trace and the program's Posture walk the link
 * beside the evidence the issue cites. A requirement has a page: its name opens it, and its eye
 * previews it beside the issue, with Unlink requirement in the preview's menu.
 */

const LINK = "Link requirement";
const UNLINK = "Unlink requirement";
const requirementNoun = { one: "requirement", other: "requirements" };

/** A requirement as its code and its name together, the words a sentence names it by. */
const named = (row: { code: string; name: string }) =>
  row.name === row.code ? row.code : `${row.code} · ${row.name}`;

/** The browser's columns: what a reader chooses a requirement by. */
const choiceColumns = defineColumns<RequirementChoice>((c) => [
  c.text("name", { header: "Requirement", minWidth: 220, priority: 0, hideable: false }),
  c.text("code", { header: "Code", width: 120, priority: 1 }),
  c.status("state", { header: "State", width: 115, priority: 2, statuses: revisionStates }),
  c.text("type", { header: "Type", width: 130, priority: 3 }),
]);

/** What the browser's preview says of a requirement before it is chosen: read, never edited. */
function ChoiceDetails({ choice }: { choice: RequirementChoice }) {
  return (
    <Stack space="space.200">
      <KeyValue.Group labelWidth="default">
        <KeyValue label="Code">{choice.code}</KeyValue>
        <KeyValue label="Version">{choice.version}</KeyValue>
        <KeyValue label="State">
          <StatusBadge statuses={revisionStates} value={choice.state} />
        </KeyValue>
        <KeyValue label="Type">{choice.type}</KeyValue>
      </KeyValue.Group>
      {choice.statement?.trim() && <Prose label="Statement">{choice.statement}</Prose>}
      {choice.acceptanceCriteria?.trim() && (
        <Prose label="Acceptance criteria">{choice.acceptanceCriteria}</Prose>
      )}
    </Stack>
  );
}

/**
 * The requirements an operational issue names. A reader who may write links requirements of the
 * issue's program through the browser, where each can be read before it is chosen, and unlinks one
 * behind a confirmation, from its row or its preview.
 */
export function IssueRequirements({
  issue,
  linkAsked = false,
  onLinkOpened,
}: {
  issue: { id: string; title: string; program_id: string };
  /**
   * The page was asked to link a requirement (its address says so, as the trace's gap offers):
   * the browser opens once the issue's requirements have loaded, for a reader who may write.
   */
  linkAsked?: boolean | undefined;
  /** The ask was taken, opened or not: the page stops asking. */
  onLinkOpened?: (() => void) | undefined;
}) {
  const workspace = useWorkspace();
  const open = useOpenRecord();
  const canWrite = workspace.role !== "viewer";
  const linked = useIssueRequirements(issue.id);
  const rows = linked.rows;
  const [linking, setLinking] = useState(false);
  // The browser reads what it offers as it first opens, and keeps it for its exit and the next time.
  const [opened, setOpened] = useState(false);
  const namedIds = useMemo(() => new Set(rows.map((row) => row.id)), [rows]);
  const choices = useRequirementChoices(issue.program_id, namedIds, { enabled: opened });
  const [previewId, setPreviewId] = useState<string | null>(null);
  // A preview belongs to its page: it ends when the record leaves.
  useEndOnHide(() => setPreviewId(null));
  const link = useLinkIssueRequirements();
  const unlink = useUnlinkIssueRequirement();
  const { confirm, confirmation } = useConfirmation();
  const focus = useRemovalFocus(rows);

  async function unlinkRequirement(row: IssueRequirement) {
    const removed = await confirm({
      title: `${UNLINK}?`,
      description: `${issue.title} will no longer name ${named(row)}. Both records are kept; the issue reaches the requirement only through evidence it cites, if any.`,
      confirmLabel: UNLINK,
      variant: "danger",
      failureTitle: "The requirement was not unlinked",
      action: () => {
        focus.removed(row.id);
        return unlink.mutateAsync({ linkId: row.linkId });
      },
    });
    if (!removed) return;
    setPreviewId((current) => (current === row.id ? null : current));
    toast.add({
      type: "success",
      title: "Requirement unlinked",
      description: `${named(row)} is no longer linked to this operational issue.`,
    });
  }
  // The row menu calls the current render's unlink, so the columns need not change with it.
  const unlinkRow = useRef<(row: IssueRequirement) => void>(() => {});
  unlinkRow.current = (row) => void unlinkRequirement(row);
  const columns = useMemo(
    () =>
      defineColumns<IssueRequirement>((c) => [
        c.text("name", {
          header: "Requirement",
          minWidth: 200,
          priority: 0,
          hideable: false,
          cell: (row) => (
            <RecordLink
              table="engineering_requirements"
              record={{ id: row.id, program_id: row.programId }}
            >
              {row.name}
            </RecordLink>
          ),
        }),
        c.text("code", { header: "Code", width: 120, priority: 1 }),
        c.status("state", { header: "State", width: 115, priority: 2, statuses: revisionStates }),
        c.text("type", { header: "Type", width: 130, priority: 3 }),
        ...(canWrite
          ? [
              c.actions((row: IssueRequirement) => [
                { label: UNLINK, tone: "danger" as const, onSelect: () => unlinkRow.current(row) },
              ]),
            ]
          : []),
      ]),
    [canWrite],
  );
  // The preview is the table's, so opening or stepping through it never rebuilds the columns.
  const tablePreview = useMemo(
    () => ({ onPreview: (row: IssueRequirement) => setPreviewId(row.id), activeId: previewId }),
    [previewId],
  );
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    preview: tablePreview,
    // A reader knows a requirement by its code as much as its name: the issue's title says it.
    rowLabel: named,
    label: "Requirements",
    pinnable: false,
    hideable: false,
  });
  const displayed = useDisplayedRecords(table);
  const preview = rows.find((row) => row.id === previewId);

  /**
   * The first requirements replace an empty state, and the button in it that opened the browser,
   * with a toolbar's: once the closing dialog has let go of focus and it has nowhere to be, it goes
   * to the toolbar's Link requirement.
   */
  function focusActionWhenLost() {
    let tries = 0;
    const settle = () => {
      const active = document.activeElement;
      const target = focus.target.current;
      if ((!active || active === document.body) && target?.isConnected) {
        target.focus();
        if (document.activeElement === target) return;
      }
      if (tries++ < 120) requestAnimationFrame(settle);
    };
    requestAnimationFrame(settle);
  }
  async function linkChosen(chosen: RequirementChoice[]) {
    const first = rows.length === 0;
    try {
      await link.mutateAsync({
        issueId: issue.id,
        programId: issue.program_id,
        requirementIds: chosen.map((choice) => choice.id),
      });
    } catch (cause) {
      // The browser keeps the choice and says this; a requirement the issue names is passed over.
      throw new Error(
        `${causeText(cause, "The requirements could not be linked.")} Your choice is kept; linking it again will not name a requirement twice.`,
      );
    }
    toast.add({
      type: "success",
      title: chosen.length === 1 ? "Requirement linked" : `${chosen.length} requirements linked`,
      description: chosen.map(named).join("; "),
    });
    if (first) focusActionWhenLost();
  }
  function beginLinking() {
    setPreviewId(null);
    setOpened(true);
    setLinking(true);
  }
  // An ask from the address opens the browser as the action would, once it would be enabled: the
  // browser leaves out the requirements the issue names, so it waits for them. A viewer, who has
  // no action, is asked nothing.
  const begin = useRef(beginLinking);
  begin.current = beginLinking;
  const taken = useRef(onLinkOpened);
  taken.current = onLinkOpened;
  useEffect(() => {
    if (!linkAsked || !linked.loaded) return;
    if (canWrite) begin.current();
    taken.current?.();
  }, [linkAsked, linked.loaded, canWrite]);

  // The action keeps its place while the issue's requirements load: the browser leaves out the
  // ones the issue names, so it waits for them.
  const waiting = linked.loaded
    ? undefined
    : linked.failed
      ? "The issue's requirements could not be loaded. Retry loading them first."
      : "The issue's requirements are still loading.";
  const linkAction = canWrite ? (
    <Button
      // An unlink takes its row and the menu that asked; focus comes back here.
      ref={(node: HTMLButtonElement | null) => {
        focus.target.current = node;
      }}
      size="small"
      variant="secondary"
      iconBefore={<Plus />}
      disabledReason={waiting}
      onClick={beginLinking}
    >
      {LINK}
    </Button>
  ) : undefined;
  return (
    <Section title="Requirements" count={linked.loaded ? rows.length : undefined} countMax={9999}>
      <ProductCollection
        compact
        keepQuestion={false}
        search={false}
        table={table}
        queries={linked.queries}
        noun={requirementNoun}
        onRowClick={(row) =>
          open("engineering_requirements", { id: row.id, program_id: row.programId })
        }
        action={linkAction}
        empty={{
          title: "No requirements linked",
          description: canWrite
            ? "Link the requirements this issue is about."
            : "This issue names no requirement.",
          icon: <ListChecks />,
          action: linkAction,
        }}
      />
      {canWrite && (
        // Mounted while the record is, so the browser plays its exit; each opening starts afresh.
        <RecordBrowser
          open={linking}
          title={LINK}
          description="Find, read and choose the requirements of this program that the operational issue is about."
          records={choices.rows}
          columns={choiceColumns}
          filters={["state", "type"]}
          previewColumn="name"
          searchPlaceholder="Find requirements"
          recordTitle={(row) => row.name}
          recordLabel={named}
          recordCode={(row) => row.code}
          state={choices.state}
          error="The program's requirements could not be loaded."
          onRetry={choices.retry}
          empty={
            choices.total
              ? {
                  illustration: "done",
                  title: "Every requirement is linked",
                  description: "This issue already names every requirement of its program.",
                }
              : {
                  illustration: "shield",
                  title: "No requirements in this program",
                  description: "A requirement is created on the program's Requirements tab.",
                  secondary: (
                    <LinkButton
                      variant="secondary"
                      render={
                        <Link
                          to="/programs/$programId"
                          params={{ programId: issue.program_id }}
                          search={{ tab: "Requirements" }}
                        />
                      }
                    >
                      Open program requirements
                    </LinkButton>
                  ),
                }
          }
          renderPreview={(row) => <ChoiceDetails choice={row} />}
          context={<KeyValue label="Operational issue">{issue.title}</KeyValue>}
          onClose={() => setLinking(false)}
          onConfirm={linkChosen}
          confirmLabel={LINK}
        />
      )}
      {preview && !linking && (
        <RecordPreviewPanel
          title={preview.name}
          label="Requirement preview"
          defaultWidth={640}
          onClose={() => setPreviewId(null)}
          recordActions={
            canWrite ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <IconButton
                      size="small"
                      variant="subtle"
                      label="Requirement actions"
                      icon={<MoreHorizontal />}
                    />
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="danger"
                    onClick={() => void unlinkRequirement(preview)}
                  >
                    {UNLINK}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : undefined
          }
          navigation={
            <RecordPreviewActions
              table="engineering_requirements"
              record={{ id: preview.id, program_id: preview.programId }}
              rows={displayed}
              onSelect={(row) => setPreviewId(row.id)}
              recordLabel={named(preview)}
            />
          }
        >
          {/* Keyed by its requirement, so a step to the next one starts that one's preview. */}
          <RequirementRecordContent
            key={preview.id}
            programId={preview.programId}
            requirementId={preview.id}
            preview
          />
        </RecordPreviewPanel>
      )}
      {confirmation}
    </Section>
  );
}
