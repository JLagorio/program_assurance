import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Alert,
  AlertDescription,
  AsideLayout,
  Box,
  DateTime,
  DropdownMenuItem,
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
import { OverlayParameters, useOverlayParameters } from "@/components/prototype/overlay-parameters";
import { RecordTrail, TrailLink } from "@/components/prototype/record-trail";
import {
  DetailFacts,
  MissingRecord,
  QueryState,
  RecordActions,
  ReportFailures,
} from "@/components/prototype/work-common";
import {
  useDeleteControlOverlay,
  usePublishControlOverlay,
  type ControlOverlay,
} from "@/lib/control-overlays";
import { useRow } from "@/lib/models";
import { overlayDecisionActions, revisionStates } from "@/lib/status";

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
 * The overlay record: its Details beside its description and its control decisions. While it is a
 * draft, a reader who may write edits it, adds and removes decisions and publishes it; a published
 * overlay cannot change, so it shows no authoring action.
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
  /** Delete overlay: a draft no program applies goes, with its decisions, and the register opens. */
  async function deleteOverlay() {
    if (!overlay) return;
    const loaded = decisions.data !== undefined && parameters.data !== undefined;
    const held = contents();
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
                  {canAuthor && (
                    <DropdownMenuItem variant="danger" onClick={() => void deleteOverlay()}>
                      Delete overlay
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
                      This overlay is published, and a published overlay cannot change. Create a new
                      overlay to decide differently.
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
