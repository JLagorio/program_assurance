import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AsideLayout,
  Box,
  Button,
  DateTime,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Id,
  Inspector,
  PageHeader,
  Prose,
  Section,
  Shell,
  Stack,
  TextLink,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { useRecordTitle } from "@/components/app/browser-title";
import { useConfirmation } from "@/components/app/confirmation";
import { Page, RecordPending } from "@/components/app/shell";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { QueryValue } from "@/components/prototype/library-shared";
import { canAuthorLibrary } from "@/components/prototype/library-utils";
import { OverlayDecisions, useOverlayDecisions } from "@/components/prototype/overlay-decisions";
import { OverlayDialog, useCatalogEditions } from "@/components/prototype/overlay-dialog";
import { OverlayParameters } from "@/components/prototype/overlay-parameters";
import { RecordTrail, TrailLink } from "@/components/prototype/record-trail";
import {
  DetailFacts,
  MissingRecord,
  QueryState,
  RecordActions,
  ReportFailures,
} from "@/components/prototype/work-common";
import {
  useCreateOverlayVersion,
  useDeleteControlOverlay,
  useOverlayParameters,
  usePublishControlOverlay,
  type ControlOverlay,
} from "@/lib/control-overlays";
import { useRow, useRows, type Row } from "@/lib/models";
import { overlayDecisionActions, revisionStates, statusLabel } from "@/lib/status";

export const Route = createFileRoute("/overlays/$overlayId")({
  component: OverlayRoute,
  head: () => ({ meta: [{ title: "Overlay — Program Assurance" }] }),
  pendingComponent: RecordPending,
});

function OverlayRoute() {
  const { overlayId } = Route.useParams();
  return <OverlayRecord key={overlayId} overlayId={overlayId} />;
}

/**
 * The overlay record, one version of it: its Details beside its description, its control decisions
 * and its parameter values. While the version is a draft, a reader who may write edits it, adds and
 * removes decisions and values and publishes it; a published version cannot change, so its
 * authoring action is Create version, the next version as a draft carrying what it decides. The
 * version menu in the header names the version every part of the page reads, and opens another.
 */
function OverlayRecord({ overlayId }: { overlayId: string }) {
  const workspace = useWorkspace();
  const { formatNumber } = useLedgerLocale();
  const overlayQuery = useRow("control_overlays", overlayId);
  const overlay = overlayQuery.data;
  useRecordTitle("Overlay", overlay?.title);
  // The same read the Control decisions section draws: Details counts it and Publish waits on it.
  const decisions = useOverlayDecisions(overlayId);
  // And the parameter values the Parameter values section draws: Details counts them too.
  const parameters = useOverlayParameters(overlayId);
  const editions = useCatalogEditions();
  const publish = usePublishControlOverlay();
  const remove = useDeleteControlOverlay();
  const navigate = useNavigate();
  const { confirm, confirmation } = useConfirmation();
  const [editing, setEditing] = useState(false);
  // Every version of the overlay, newest first: they share its code.
  const versionRows = useRows(
    "control_overlays",
    { code: overlay?.code ?? "" },
    { columns: ["id", "version", "state", "previous_overlay_id"], enabled: !!overlay },
  );
  const versions = useMemo(
    () => [...(versionRows.data ?? [])].sort((a, b) => b.version - a.version),
    [versionRows.data],
  );
  const newest = versions[0];
  const createVersion = useCreateOverlayVersion();
  // What this page's last write answered, until the overlay read back carries it: the next write
  // (more decisions, a removal, Publish) is made at its revision, and a publish shows at once.
  const answered = useRef<ControlOverlay | null>(null);
  const [publishedHere, setPublishedHere] = useState(false);
  const revision = () => Math.max(overlay?.revision ?? 0, answered.current?.revision ?? 0);
  const saved = (row: ControlOverlay) => {
    if (row.revision >= (answered.current?.revision ?? 0)) answered.current = row;
  };
  const draft = overlay?.state === "draft" && !publishedHere;
  const state = publishedHere ? "published" : overlay?.state;
  const canAuthor = draft && canAuthorLibrary(workspace.role);
  const count = (action: "include" | "exclude") =>
    formatNumber((decisions.data ?? []).filter((decision) => decision.action === action).length);
  const publishWaits =
    decisions.isError || parameters.isError
      ? "The control decisions or parameter values could not be loaded."
      : !decisions.data || !parameters.data
        ? "The control decisions and parameter values are still loading."
        : decisions.data.length === 0 && parameters.data.length === 0
          ? "Add a control decision or a parameter value before publishing."
          : undefined;
  /** "12 control decisions and 3 parameter values", as a confirmation counts what goes with it. */
  const contents = () => {
    const decided = decisions.data?.length ?? 0;
    const set = parameters.data?.length ?? 0;
    return [
      ...(decided
        ? [`${formatNumber(decided)} control ${decided === 1 ? "decision" : "decisions"}`]
        : []),
      ...(set ? [`${formatNumber(set)} parameter ${set === 1 ? "value" : "values"}`] : []),
    ].join(" and ");
  };
  async function publishOverlay() {
    if (!overlay || publishWaits) return;
    const published = await confirm({
      title: "Publish overlay?",
      description: `Programs will be able to apply ${overlay.title}. Its ${contents()}, code, name and description can no longer change.`,
      confirmLabel: "Publish overlay",
      variant: "primary",
      failureTitle: "The overlay was not published",
      action: async () =>
        saved(await publish.mutateAsync({ overlayId: overlay.id, expectedRevision: revision() })),
    });
    if (!published) return;
    setPublishedHere(true);
    toast.add({
      type: "success",
      title: "Overlay published",
      description: `Programs can now apply ${overlay.title}.`,
    });
  }
  /**
   * Create version: the next version of a published one, a draft carrying its decisions and its
   * values, opened once it exists. Its id is chosen as the prompt opens, so trying again after a
   * failure sends the same request.
   */
  async function createNextVersion() {
    if (!overlay) return;
    const versionId = crypto.randomUUID();
    const next = overlay.version + 1;
    const held = contents();
    let created: ControlOverlay | null = null;
    const done = await confirm({
      title: `Create version ${formatNumber(next)}?`,
      description: `A draft of ${overlay.title}${held ? ` with version ${formatNumber(overlay.version)}'s ${held}` : ""}, to edit and publish. Version ${formatNumber(overlay.version)} stays published, and every program that applies it keeps it until its stack is changed.`,
      confirmLabel: `Create version ${formatNumber(next)}`,
      variant: "primary",
      failureTitle: "The version was not created",
      action: async () => {
        created = await createVersion.mutateAsync({ overlayId: overlay.id, versionId });
      },
    });
    const opened = created as ControlOverlay | null;
    if (!done || !opened) return;
    toast.add({
      type: "success",
      title: `Version ${formatNumber(opened.version)} created`,
      description: `A draft of ${overlay.code} to edit and publish.`,
    });
    void navigate({ to: "/overlays/$overlayId", params: { overlayId: opened.id } });
  }
  /**
   * Delete overlay: a draft no program applies goes, with its decisions and values. A first version
   * leaves for the register; a later one opens the version it was created from, which stays.
   */
  async function deleteOverlay() {
    if (!overlay) return;
    const loaded = decisions.data !== undefined && parameters.data !== undefined;
    const held = contents();
    const previous = overlay.previous_overlay_id;
    if (previous) {
      const gone = await confirm({
        title: `Delete version ${formatNumber(overlay.version)}?`,
        description: `Version ${formatNumber(overlay.version)} of ${overlay.title}${!loaded ? " and its control decisions and parameter values" : held ? ` and its ${held}` : ""} will be deleted. Version ${formatNumber(overlay.version - 1)} stays as it is.`,
        confirmLabel: "Delete draft version",
        variant: "danger",
        failureTitle: "The version was not deleted",
        action: () => remove.mutateAsync({ overlayId: overlay.id, expectedRevision: revision() }),
      });
      if (!gone) return;
      toast.add({
        type: "success",
        title: "Draft version deleted",
        description: `${overlay.code} is at version ${formatNumber(overlay.version - 1)} again.`,
      });
      void navigate({ to: "/overlays/$overlayId", params: { overlayId: previous }, replace: true });
      return;
    }
    const deleted = await confirm({
      title: "Delete overlay?",
      description: `${overlay.title}${!loaded ? " and its control decisions and parameter values" : held ? ` and its ${held}` : ""} will be deleted. A deleted overlay cannot be restored.`,
      confirmLabel: "Delete overlay",
      variant: "danger",
      failureTitle: "The overlay was not deleted",
      action: () => remove.mutateAsync({ overlayId: overlay.id, expectedRevision: revision() }),
    });
    if (!deleted) return;
    toast.add({
      type: "success",
      title: "Overlay deleted",
      description: `${overlay.code} is no longer in the library.`,
    });
    void navigate({ to: "/overlays" });
  }
  return (
    <Page>
      {editing && overlay && (
        <OverlayDialog overlay={overlay} onClose={() => setEditing(false)} onSaved={saved} />
      )}
      {/* The page is one failure region: an outage of the overlay, its decisions, their controls
          and the catalog editions reads as one alert at the top, whose Retry reloads all of them. */}
      <QueryState queries={[overlayQuery]} region>
        {overlay ? (
          <>
            <ReportFailures queries={editions.queries} />
            <PageHeader>
              <RecordTrail current={overlay.title}>
                <TrailLink to="/overlays">Overlays</TrailLink>
              </RecordTrail>
              <PageHeader.Heading>
                <PageHeader.Title>{overlay.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                {/* The version every part of the page reads, named and chosen here. */}
                {versions.length > 0 && (
                  <VersionMenu
                    versions={versions}
                    current={overlay.id}
                    onVersion={(id) =>
                      void navigate({
                        to: "/overlays/$overlayId",
                        params: { overlayId: id },
                        replace: true,
                      })
                    }
                  />
                )}
                <RecordActions
                  table="control_overlays"
                  id={overlay.id}
                  editLabel="Edit overlay"
                  readOnly={!draft}
                  onEdit={() => {
                    // The trigger stays enabled while its dialog is open; a second press opens nothing new.
                    if (!editing) setEditing(true);
                  }}
                >
                  {canAuthor && (
                    <DropdownMenuItem
                      onClick={() => void publishOverlay()}
                      {...(publishWaits ? { disabledReason: publishWaits } : {})}
                    >
                      Publish overlay
                    </DropdownMenuItem>
                  )}
                  {!draft && canAuthorLibrary(workspace.role) && (
                    <DropdownMenuItem
                      {...(!newest || !decisions.data || !parameters.data
                        ? {
                            disabledReason:
                              versionRows.isError || decisions.isError || parameters.isError
                                ? "The overlay's versions could not be loaded."
                                : "The overlay's versions are still loading.",
                          }
                        : newest.id !== overlay.id
                          ? {
                              disabledReason: `Version ${formatNumber(newest.version)} is the overlay's newest; a next version is created from it.`,
                            }
                          : {})}
                      onClick={() => void createNextVersion()}
                    >
                      {`Create version ${formatNumber(overlay.version + 1)}`}
                    </DropdownMenuItem>
                  )}
                  {canAuthor && (
                    <DropdownMenuItem variant="danger" onClick={() => void deleteOverlay()}>
                      {overlay.previous_overlay_id ? "Delete draft version" : "Delete overlay"}
                    </DropdownMenuItem>
                  )}
                </RecordActions>
              </PageHeader.Actions>
            </PageHeader>
            {/* The body beside the overlay's Details: the rail at its end where it fits, else a
                Details disclosure above it whose row carries the overlay's state. */}
            <AsideLayout
              aside={
                <Shell.Aside
                  label="Overlay details"
                  summary={<StatusBadge statuses={revisionStates} value={state} />}
                >
                  <Inspector.Group title="Details">
                    <DetailFacts
                      facts={[
                        ["State", <StatusBadge statuses={revisionStates} value={state} />],
                        ["Code", <Id>{overlay.code}</Id>],
                        ["Version", formatNumber(overlay.version)],
                        [
                          "Catalog edition",
                          <QueryValue queries={editions.queries}>
                            {() => (
                              <TextLink
                                render={
                                  <Link
                                    to="/catalog"
                                    search={{ edition: overlay.catalog_revision_id }}
                                  />
                                }
                              >
                                {editions.label(overlay.catalog_revision_id) ?? "Catalog edition"}
                              </TextLink>
                            )}
                          </QueryValue>,
                        ],
                        [
                          overlayDecisionActions.include.label,
                          <QueryValue queries={[decisions]}>{() => count("include")}</QueryValue>,
                        ],
                        [
                          overlayDecisionActions.exclude.label,
                          <QueryValue queries={[decisions]}>{() => count("exclude")}</QueryValue>,
                        ],
                        [
                          "Parameters",
                          <QueryValue queries={[parameters]}>
                            {() => formatNumber(parameters.data?.length ?? 0)}
                          </QueryValue>,
                        ],
                        ["Updated", <DateTime value={overlay.updated_at} format="date" />],
                      ]}
                    />
                  </Inspector.Group>
                </Shell.Aside>
              }
            >
              <Stack space="space.300" className="min-w-0">
                {!draft && (
                  <Alert role="note">
                    <AlertDescription>
                      {newest && newest.id !== overlay.id
                        ? `Version ${formatNumber(overlay.version)} is published and cannot change. Version ${formatNumber(newest.version)} is the overlay's newest.`
                        : `Version ${formatNumber(overlay.version)} is published and cannot change. Create version ${formatNumber(overlay.version + 1)} to decide differently.`}
                    </AlertDescription>
                  </Alert>
                )}
                {overlay.description ? (
                  <Section title="Description">
                    <Box className="max-w-layout-measure">
                      <Prose>{overlay.description}</Prose>
                    </Box>
                  </Section>
                ) : null}
                <OverlayDecisions
                  overlay={overlay}
                  revision={revision}
                  canAuthor={canAuthor}
                  onSaved={saved}
                />
                <OverlayParameters
                  overlay={overlay}
                  revision={revision}
                  canAuthor={canAuthor}
                  onSaved={saved}
                />
              </Stack>
            </AsideLayout>
          </>
        ) : (
          <MissingRecord
            kind="Overlay"
            back={{ label: "Open overlays", link: <Link to="/overlays" /> }}
          />
        )}
      </QueryState>
      {confirmation}
    </Page>
  );
}

/**
 * The version every part of the page reads, as the header's version menu: its trigger names the
 * version, and the menu lists every version of the overlay, newest first, with its state, the shown
 * one marked. Choosing one opens it in place of this one, as a library record's version does.
 */
function VersionMenu({
  versions,
  current,
  onVersion,
}: {
  versions: readonly Pick<Row<"control_overlays">, "id" | "version" | "state">[];
  current: string;
  onVersion: (id: string) => void;
}) {
  const { formatNumber } = useLedgerLocale();
  const shown = versions.find((version) => version.id === current);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            iconAfter={<ChevronDown />}
          >{`Version ${formatNumber(shown?.version ?? 1)}`}</Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Overlay versions</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={current}
            onValueChange={(value: string) => onVersion(value)}
          >
            {versions.map((version) => (
              <DropdownMenuRadioItem key={version.id} value={version.id} closeOnClick>
                {formatNumber(version.version)} · {statusLabel(revisionStates, version.state)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
