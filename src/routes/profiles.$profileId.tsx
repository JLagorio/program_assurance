import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Count,
  DataTable,
  defineColumns,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Id,
  Inline,
  Inspector,
  KeyValue,
  PageHeader,
  Section,
  Shell,
  Stack,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
  useDataTable,
} from "@ledger/design-system";
import { nistBaselineProvenance, nistBaselines } from "@/lib/nist-baselines";
import { nistControlById } from "@/lib/nist-catalog";
import {
  baselineIdFromProfileId,
  baselineProfileIds,
  countsOf,
  derivationFor,
  eventsForControl,
  hasDerivation,
  profileById,
  stagesOf,
  unexplainedControlIds,
  type ControlDerivation,
  type Profile,
  type ProfileOverlay,
} from "@/lib/profiles";
import { referenceSourceName } from "@/lib/reference-sources";

export const Route = createFileRoute("/profiles/$profileId")({
  loader: ({ params }) => {
    const baseline = baselineIdFromProfileId(params.profileId);
    if (baseline) return { baseline };
    const profile = profileById(params.profileId);
    if (!profile) throw notFound();
    return { baseline: null };
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.profileId} — profile | Equinox` },
      {
        name: "description",
        content:
          "A profile's control selection: where it starts, what tailored it, and the trail behind each control.",
      },
      { property: "og:title", content: `${params.profileId} — Equinox` },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ProfileRecord,
  notFoundComponent: () => (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{"No such profile"}</EmptyTitle>
        <EmptyDescription>
          {"The profile register lists every control selection in the product."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <TextLink render={<Link to="/profiles" />}>Back to profiles</TextLink>
      </EmptyContent>
    </Empty>
  ),
});

function ProfileTrail({ name }: { name: string }) {
  return (
    <Breadcrumb className="col-span-full">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to="/profiles" />}>Profiles</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function ProfileRecord() {
  const { baseline } = Route.useLoaderData();
  const { profileId } = Route.useParams();
  return baseline ? (
    <BaselineRecord baseline={baseline} />
  ) : (
    <TailoredRecord profileId={profileId} />
  );
}

/* ---------------------------------------------------------------- baseline */

/**
 * A published baseline, read-only.
 *
 * SP 800-53B ships as four OSCAL *profile* documents, which is why they belong
 * in this register rather than in a separate "baselines" corner: the tailored
 * profile's first stage imports one of these, and a reader chasing "starting
 * baseline 370" should land on the 370.
 */
function BaselineRecord({ baseline }: { baseline: import("@/lib/nist-baselines").NistBaselineId }) {
  const definition = nistBaselines[baseline];
  const provenance = nistBaselineProvenance[baseline];
  const [controlId, setControlId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      definition.controlIds.map((id) => {
        const control = nistControlById.get(id);
        return {
          id,
          title: control?.title ?? "—",
          family: control?.family ?? id.split("-")[0] ?? "—",
          kind: id.includes("(") ? "Enhancement" : "Base control",
        };
      }),
    [definition],
  );
  type BaselineRow = (typeof rows)[number];

  const columns = useMemo(
    () =>
      defineColumns<BaselineRow>((c) => [
        c.id("id", { header: "Control", width: 120, hideable: false }),
        c.text("title", { header: "Title", hideable: false }),
        c.text("family", { header: "Family", width: 88 }),
        c.text("kind", { header: "Kind", width: 132 }),
      ]),
    [],
  );

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    label: `SP 800-53B ${definition.name} baseline`,
    view: `baseline-${baseline}`,
    resizable: true,
    virtualize: true,
  });

  const selected = controlId ? (nistControlById.get(controlId) ?? null) : null;

  return (
    <Stack className="animate-rise" space="space.200">
      <PageHeader>
        <ProfileTrail name={`SP 800-53B ${definition.name}`} />
        <div className="min-w-0">
          <PageHeader.Title>{`SP 800-53B ${definition.name} baseline`}</PageHeader.Title>
        </div>
      </PageHeader>

      <DataTable
        table={table}
        maxHeight={620}
        onRowClick={(row) => setControlId(row.id)}
        empty={{ title: "No controls match", description: "Clear the search or the filters." }}
        toolbar={
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <DataTable.Search table={table} placeholder="Find a control" />
            <DataTable.Filter table={table} column="family" />
            <DataTable.Filter table={table} column="kind" />
            <Inline className="ml-auto" space="space.100" alignBlock="center">
              <DataTable.Columns table={table} />
              <DataTable.Settings table={table} />
            </Inline>
          </Inline>
        }
      />

      {/* Everything about the profile itself lives in the rail, so the page is
          a header and the selection it names. The control panel is a different
          thing — a row the reader opened — and stays a Panel. */}
      <Shell.Aside label="Record properties">
        <>
          <Inspector.Group title="Profile">
            <KeyValue label="Controls">{definition.controlIds.length}</KeyValue>
            <KeyValue label="Release">{definition.version ?? "—"}</KeyValue>
            <KeyValue label="Published by" wrap>
              {provenance.authority}
            </KeyValue>
            <KeyValue label="Standing">
              <Badge variant="secondary" tone="success">
                Authoritative
              </Badge>
            </KeyValue>
          </Inspector.Group>
          <Inspector.Group title="Source">
            <KeyValue label="Dataset" wrap>
              {referenceSourceName(provenance)}
            </KeyValue>
            <KeyValue label="Citation" wrap>
              {provenance.citation}
            </KeyValue>
            <KeyValue label="Fetched from">
              <TextLink href={provenance.sourceUrl} target="_blank" rel="noreferrer">
                {provenance.sourceUrl}
              </TextLink>
            </KeyValue>
            {provenance.sha256 ? (
              <KeyValue label="sha256" wrap>
                <Id className="break-all text-subtle">{provenance.sha256}</Id>
              </KeyValue>
            ) : null}
            <KeyValue label="Rights" wrap>
              {provenance.rights}
            </KeyValue>
          </Inspector.Group>
        </>
      </Shell.Aside>

      {selected ? (
        <Shell.Panel title={selected.id} onClose={() => setControlId(null)}>
          <Inspector.Group title={selected.title}>
            <KeyValue label="Family">{selected.family}</KeyValue>
            <KeyValue label="In baselines">{selected.baselines.join(", ") || "—"}</KeyValue>
          </Inspector.Group>
        </Shell.Panel>
      ) : null}
    </Stack>
  );
}

/* ---------------------------------------------------------------- tailored */

const tabs = ["Derivation", "Controls", "Overlays"] as const;
type Tab = (typeof tabs)[number];

function TailoredRecord({ profileId }: { profileId: string }) {
  const profile = profileById(profileId);
  const [tab, setTab] = useState<Tab>("Derivation");
  const [controlId, setControlId] = useState<string | null>(null);

  if (!profile) return null;
  const counts = countsOf(profile);
  const unexplained = unexplainedControlIds(profile);

  return (
    <Stack className="animate-rise" space="space.200">
      <PageHeader>
        <ProfileTrail name={profile.name} />
        <div className="min-w-0">
          <PageHeader.Title>{profile.name}</PageHeader.Title>
        </div>
      </PageHeader>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as Tab);
          setControlId(null);
        }}
        className="contents"
      >
        <TabsList className="w-full justify-start" variant="line" activateOnFocus>
          {tabs.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t}
              {t === "Controls" ? <Count value={counts.effective} max={9999} /> : null}
              {t === "Overlays" ? <Count value={counts.overlays} max={9999} /> : null}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="contents">
          {tab === "Derivation" ? <Derivation profile={profile} /> : null}
          {tab === "Controls" ? (
            <EffectiveControls profile={profile} onSelect={setControlId} />
          ) : null}
          {tab === "Overlays" ? <Overlays profile={profile} /> : null}
        </TabsContent>
      </Tabs>

      <Shell.Aside label="Record properties">
        <>
          <Inspector.Group title="Profile">
            <KeyValue label="Controls">{counts.effective}</KeyValue>
            <KeyValue label="Imports" wrap>
              {/* The baseline is a profile of its own in the register; a reader
                  asking where 370 came from should be able to open it. */}
              <TextLink
                render={
                  <Link to="/profiles/$profileId" params={{ profileId: baselineProfileIds.high }} />
                }
              >
                {`SP 800-53B High baseline (${counts.startingBaseline})`}
              </TextLink>
            </KeyValue>
            <KeyValue label="Catalog" wrap>
              {`SP 800-53 Rev. 5 (${counts.catalog})`}
            </KeyValue>
            <KeyValue label="Standing">
              <Badge variant="secondary" tone="neutral">
                Derived here
              </Badge>
            </KeyValue>
          </Inspector.Group>
          <Inspector.Group title="Tailoring">
            <KeyValue label="Overlays">{counts.overlays}</KeyValue>
            <KeyValue label="Events">{counts.events}</KeyValue>
            <KeyValue label="ODP values">{counts.withOdp}</KeyValue>
          </Inspector.Group>
          <Inspector.Group title="Accounted for">
            {unexplained.length === 0 ? (
              <span className="font-body-small text-subtle">
                {`All ${counts.effective} controls carry a selection trail. A control in the set with no trail is one nobody could defend in an assessment, so it is checked rather than assumed.`}
              </span>
            ) : (
              <Stack space="space.100">
                <span className="font-body-small text-danger">
                  {`${unexplained.length} controls are in the set with no recorded basis.`}
                </span>
                <Id>{unexplained.join(", ")}</Id>
              </Stack>
            )}
          </Inspector.Group>
        </>
      </Shell.Aside>

      {controlId ? (
        <ControlTrail profile={profile} controlId={controlId} onClose={() => setControlId(null)} />
      ) : null}
    </Stack>
  );
}

/* ------------------------------------------------------------- Derivation */

/**
 * The resolution, top to bottom.
 *
 * This is the screen the whole reference layer was built for. The pipeline ran
 * once, against the real corpus, and recorded every step; all this does is print
 * it in order so a reader can follow 1,196 catalog controls down to the set the
 * program actually carries, and see which publication is responsible for each
 * move.
 */
function Derivation({ profile }: { profile: Profile }) {
  const stages = stagesOf(profile);
  const counts = countsOf(profile);
  const unexplained = unexplainedControlIds(profile);

  if (!hasDerivation(profile)) {
    return (
      <Section title="Derivation">
        <p className="font-body-small text-subtle">
          This profile was imported with a selection but no trail. It can say which controls it
          carries, not how they were chosen.
        </p>
      </Section>
    );
  }

  return (
    <Stack space="space.200" className="min-w-0 pt-100">
      <Section title="Stages">
        <Table>
          <thead>
            <tr>
              <Table.Header width={52}>#</Table.Header>
              <Table.Header width={210}>Stage</Table.Header>
              <Table.Header>What it did</Table.Header>
              <Table.Header width={108} className="text-right">
                Running
              </Table.Header>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage, index) => {
              const note = typeof stage["note"] === "string" ? stage["note"] : null;
              const input = typeof stage["input"] === "string" ? stage["input"] : null;
              const name = typeof stage["name"] === "string" ? stage["name"] : null;
              const running = stage["running_total"] ?? stage["effective"];
              const added = stage["added"];
              const withdrawn = stage["withdrawn"];
              return (
                <Table.Row key={`${stage.stage}-${index}`}>
                  <Table.Cell className="tabular-nums">{stage.sequence}</Table.Cell>
                  <Table.Cell>
                    <Stack space="space.025">
                      <span>{name ?? stage.stage.replace(/_/g, " ")}</span>
                      {typeof stage["source_id"] === "string" ? (
                        <Id className="text-subtle">{stage["source_id"]}</Id>
                      ) : null}
                    </Stack>
                  </Table.Cell>
                  <Table.Cell className="whitespace-normal py-100 align-top">
                    <Stack space="space.050">
                      {input ? <span>{input}</span> : null}
                      <Inline space="space.100" shouldWrap>
                        {typeof added === "number" && added > 0 ? (
                          <Badge variant="secondary" tone="success">{`+${added}`}</Badge>
                        ) : null}
                        {typeof withdrawn === "number" && withdrawn > 0 ? (
                          <Badge variant="secondary" tone="warning">{`−${withdrawn}`}</Badge>
                        ) : null}
                      </Inline>
                      {note ? <span className="font-body-small text-subtle">{note}</span> : null}
                    </Stack>
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">
                    {typeof running === "number" ? running : "—"}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </tbody>
        </Table>
      </Section>
    </Stack>
  );
}

/* --------------------------------------------------------------- Controls */

type ControlRow = {
  id: string;
  family: string;
  title: string;
  origin: string;
  drivers: string;
  steps: number;
};

function EffectiveControls({
  profile,
  onSelect,
}: {
  profile: Profile;
  onSelect: (id: string) => void;
}) {
  const rows = useMemo<ControlRow[]>(
    () =>
      profile.effective_control_ids.map((id) => {
        const derivation = derivationFor(profile, id);
        return {
          id,
          family: derivation?.family ?? id.split("-")[0] ?? "—",
          title: derivation?.title ?? "—",
          origin: derivation?.selection_origin ?? "—",
          drivers: (derivation?.cnssi_1253?.drivers ?? []).join(", ") || "—",
          steps: (derivation?.selection_trail ?? []).length,
        };
      }),
    [profile],
  );

  const columns = useMemo(
    () =>
      defineColumns<ControlRow>((c) => [
        c.id("id", { header: "Control", width: 120, hideable: false }),
        c.text("title", { header: "Title", hideable: false }),
        c.text("family", { header: "Family", width: 88 }),
        c.text("origin", { header: "Selected by", width: 210 }),
        c.text("drivers", { header: "CNSSI drivers", width: 200 }),
        c.number("steps", { header: "Trail", width: 84 }),
      ]),
    [],
  );

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    label: "Effective controls",
    view: "profile-controls",
    resizable: true,
    reorderable: true,
    virtualize: true,
  });

  return (
    <DataTable
      table={table}
      maxHeight={620}
      onRowClick={(row) => onSelect(row.id)}
      empty={{ title: "No controls match", description: "Clear the search or the filters." }}
      toolbar={
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <DataTable.Search table={table} placeholder="Find a control" />
          <DataTable.Filter table={table} column="family" />
          <DataTable.Filter table={table} column="origin" />
          <Inline className="ml-auto" space="space.100" alignBlock="center">
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
          </Inline>
        </Inline>
      }
    />
  );
}

/** The control's own history: why it is in the set, and every event that touched it. */
function ControlTrail({
  profile,
  controlId,
  onClose,
}: {
  profile: Profile;
  controlId: string;
  onClose: () => void;
}) {
  const derivation: ControlDerivation | null = derivationFor(profile, controlId);
  const events = eventsForControl(profile, controlId);

  return (
    <Shell.Panel title={controlId} onClose={onClose}>
      <>
        <Inspector.Group title="Why it is in the set">
          {derivation?.selection_trail?.length ? (
            <Stack space="space.150">
              {derivation.selection_trail.map((step, index) => (
                <Stack key={`${step.stage}-${index}`} space="space.025">
                  <Inline space="space.100" alignBlock="center" shouldWrap>
                    <Badge variant="secondary" tone={toneForAction(step.action)}>
                      {step.action}
                    </Badge>
                    <span className="font-body-small">{step.stage.replace(/_/g, " ")}</span>
                  </Inline>
                  <span className="font-body-small text-subtle">{step.basis}</span>
                  {step.source_id ? <Id className="text-subtle">{step.source_id}</Id> : null}
                </Stack>
              ))}
            </Stack>
          ) : (
            <span className="font-body-small text-subtle">No trail recorded.</span>
          )}
        </Inspector.Group>

        <Inspector.Group title="CNSSI 1253">
          {derivation?.cnssi_1253 ? (
            <>
              <KeyValue label="Drivers">
                {(derivation.cnssi_1253.drivers ?? []).join(", ") || "—"}
              </KeyValue>
              <KeyValue label="Parameter value">
                {derivation.cnssi_1253.parameter_value ?? "—"}
              </KeyValue>
              {derivation.cnssi_1253.justification ? (
                <KeyValue label="Justification">{derivation.cnssi_1253.justification}</KeyValue>
              ) : null}
              <KeyValue label="Source">
                <Badge
                  variant="secondary"
                  tone={derivation.cnssi_1253.authoritative ? "success" : "warning"}
                >
                  {derivation.cnssi_1253.authoritative ? "Authoritative" : "Not authoritative"}
                </Badge>
              </KeyValue>
            </>
          ) : (
            <span className="font-body-small text-subtle">No CNSSI 1253 row for this control.</span>
          )}
        </Inspector.Group>

        <Inspector.Group title="Tailoring events">
          {events.length ? (
            <Stack space="space.150">
              {events.map((event) => (
                <Stack key={event.sequence} space="space.025">
                  <Inline space="space.100" alignBlock="center" shouldWrap>
                    <Badge variant="secondary" tone={toneForAction(event.action)}>
                      {event.action}
                    </Badge>
                    <Id className="text-subtle">{event.overlay_id}</Id>
                  </Inline>
                  <span className="font-body-small text-subtle">{event.rationale}</span>
                </Stack>
              ))}
            </Stack>
          ) : (
            <span className="font-body-small text-subtle">
              No overlay touched this control; it comes from the baseline alone.
            </span>
          )}
        </Inspector.Group>
      </>
    </Shell.Panel>
  );
}

function toneForAction(action: string): "success" | "warning" | "neutral" {
  if (action === "include" || action === "selected" || action === "confirmed") return "success";
  if (action === "exclude" || action === "withdrawn" || action === "removed") return "warning";
  return "neutral";
}

/* --------------------------------------------------------------- Overlays */

/**
 * The named deltas, in the order they were applied.
 *
 * This is the only surviving meaning of "overlay" in the product: a named change
 * to a control selection, with a stated reason and a provenance note saying
 * whether the publication behind it is authoritative.
 */
function Overlays({ profile }: { profile: Profile }) {
  return (
    <Stack space="space.200" className="min-w-0 pt-100">
      {profile.overlays.map((overlay) => (
        <OverlayCard key={overlay.overlay_id} overlay={overlay} />
      ))}
    </Stack>
  );
}

function OverlayCard({ overlay }: { overlay: ProfileOverlay }) {
  return (
    <Stack space="space.100" className="min-w-0 border-b pb-200 last:border-b-0">
      <Inline space="space.100" alignBlock="center" shouldWrap>
        <span className="font-heading-small">{overlay.name}</span>
        <Badge variant="secondary" tone="neutral">
          {overlay.type}
        </Badge>
        {overlay["authoritative"] === false ? (
          <Badge variant="secondary" tone="warning">
            Not authoritative
          </Badge>
        ) : null}
        <Id className="text-subtle">{overlay.overlay_id}</Id>
      </Inline>
      <Inline space="space.300" shouldWrap>
        <KeyValue label="Adds">{overlay.adds.length}</KeyValue>
        <KeyValue label="Removes">{overlay.removes.length}</KeyValue>
        {typeof overlay["source_id"] === "string" ? (
          <KeyValue label="Source">{overlay["source_id"]}</KeyValue>
        ) : null}
      </Inline>
      {typeof overlay["reason"] === "string" ? (
        <p className="font-body-small text-subtle">{overlay["reason"]}</p>
      ) : null}
      {typeof overlay["provenance_note"] === "string" ? (
        <p className="font-body-small text-subtle">{overlay["provenance_note"]}</p>
      ) : null}
    </Stack>
  );
}
