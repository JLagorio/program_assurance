import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Count,
  DataTable,
  defineColumns,
  Id,
  Inline,
  Inspector,
  KeyValue,
  Shell,
  Stack,
  PageHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
  useDataTable,
} from "@ledger/design-system";
import { cciById, cciItems, controlIdsForCci, type Cci } from "@/lib/cci-catalog";
import { catalogVersion, nistControls, type NistControl } from "@/lib/nist-catalog";
import { cciIdsForControl } from "@/lib/cci-catalog";
import { referenceSourceName, referenceSources } from "@/lib/reference-sources";
import type { ReferenceProvenance } from "@/lib/reference-provenance";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Catalog — 800-53 controls, CCIs and their sources | Equinox" },
      {
        name: "description",
        content:
          "The reference layer: NIST SP 800-53 Rev. 5 controls and SP 800-53A objectives, the DISA CCI crosswalk, and the provenance of every source behind them.",
      },
      { property: "og:title", content: "Catalog — Equinox" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CatalogPage,
});

const tabs = ["Controls", "CCIs", "Sources"] as const;
type Tab = (typeof tabs)[number];

/** The catalog rows, with the joins a column sorts and filters on precomputed. */
type ControlRow = NistControl & { cciCount: number; baselineText: string };
type CciRow = Cci & { controls: string };

const controlRows: ControlRow[] = nistControls.map((control) => ({
  ...control,
  cciCount: cciIdsForControl(control.id).length,
  baselineText: control.baselines.join(", ") || "Tailored in only",
}));

const cciRows: CciRow[] = cciItems.map((cci) => ({
  ...cci,
  controls: controlIdsForCci(cci.id).join(", "),
}));

function CatalogPage() {
  const [tab, setTab] = useState<Tab>("Controls");
  const [control, setControl] = useState<ControlRow | null>(null);
  const [cci, setCci] = useState<CciRow | null>(null);

  const counts = {
    Controls: controlRows.length,
    CCIs: cciRows.length,
    Sources: referenceSources.length,
  } as const;

  return (
    <Stack className="animate-rise" space="space.200">
      <PageHeader>
        <div className="min-w-0">
          <PageHeader.Title>{"Catalog"}</PageHeader.Title>
        </div>
      </PageHeader>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as Tab);
          setControl(null);
          setCci(null);
        }}
        className="contents"
      >
        <TabsList className="w-full justify-start" variant="line" activateOnFocus>
          {tabs.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t}
              <Count value={counts[t]} max={9999} />
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="contents">
          {tab === "Controls" ? <ControlsTable onSelect={setControl} /> : null}
          {tab === "CCIs" ? <CcisTable onSelect={setCci} /> : null}
          {tab === "Sources" ? <SourcesList /> : null}
        </TabsContent>
      </Tabs>

      {control ? <ControlPanel control={control} onClose={() => setControl(null)} /> : null}
      {cci ? <CciPanel cci={cci} onClose={() => setCci(null)} /> : null}
    </Stack>
  );
}

/* ------------------------------------------------------------------ Controls */

function ControlsTable({ onSelect }: { onSelect: (control: ControlRow) => void }) {
  const columns = useMemo(
    () =>
      defineColumns<ControlRow>((c) => [
        c.id("id", { header: "Control", width: 116, hideable: false }),
        c.text("title", { header: "Title", hideable: false }),
        c.text("family", { header: "Family", width: 88 }),
        c.custom("baselines", {
          header: "SP 800-53B baselines",
          width: 210,
          cell: (row) =>
            row.baselines.length ? (
              <Inline space="space.050" shouldWrap>
                {row.baselines.map((b) => (
                  <Badge key={b} variant="secondary" tone="neutral">
                    {b}
                  </Badge>
                ))}
              </Inline>
            ) : (
              <span className="text-subtle">Tailored in only</span>
            ),
          text: (row) => row.baselines.join(" ") || "Tailored in only",
        }),
        c.number("cciCount", { header: "CCIs", width: 84 }),
      ]),
    [],
  );

  const table = useDataTable({
    data: controlRows,
    columns,
    getRowId: (row) => row.id,
    label: "Catalog controls",
    view: "catalog-controls",
    resizable: true,
    reorderable: true,
    virtualize: true,
  });

  return (
    <DataTable
      table={table}
      maxHeight={620}
      onRowClick={onSelect}
      empty={{ title: "No controls match", description: "Clear the search or the family filter." }}
      toolbar={
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <DataTable.Search table={table} placeholder="Find a control" />
          <DataTable.Presets
            table={table}
            variant="menu"
            presets={[
              { id: "all", label: "All controls" },
              { id: "low", label: "Low baseline", filters: [{ id: "baselines", value: "Low" }] },
              {
                id: "moderate",
                label: "Moderate baseline",
                filters: [{ id: "baselines", value: "Moderate" }],
              },
              { id: "high", label: "High baseline", filters: [{ id: "baselines", value: "High" }] },
            ]}
          />
          <DataTable.Filter table={table} column="family" />
          <Inline className="ml-auto" space="space.100" alignBlock="center">
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
          </Inline>
        </Inline>
      }
    />
  );
}

function ControlPanel({ control, onClose }: { control: ControlRow; onClose: () => void }) {
  const ccis = cciIdsForControl(control.id);
  return (
    <Shell.Panel title={control.id} onClose={onClose}>
      <>
        <Inspector.Group title="Identity">
          <KeyValue label="Title">{control.title}</KeyValue>
          <KeyValue label="Family">{control.family}</KeyValue>
          {control.parent ? (
            <KeyValue label="Enhances">
              <Id>{control.parent}</Id>
            </KeyValue>
          ) : null}
          <KeyValue label="Catalog">{catalogVersion}</KeyValue>
        </Inspector.Group>
        <Inspector.Group title="Selected by">
          <KeyValue label="SP 800-53B">
            {control.baselines.length ? control.baselines.join(", ") : "No baseline — tailored in"}
          </KeyValue>
        </Inspector.Group>
        <Inspector.Group title="Cross-referenced by">
          {ccis.length ? (
            <Stack className="font-body-small" space="space.050">
              {ccis.map((id) => (
                <Id key={id}>{id}</Id>
              ))}
            </Stack>
          ) : (
            <span className="font-body-small text-subtle">
              No CCI in the published list maps to this control.
            </span>
          )}
        </Inspector.Group>
      </>
    </Shell.Panel>
  );
}

/* ---------------------------------------------------------------------- CCIs */

function CcisTable({ onSelect }: { onSelect: (cci: CciRow) => void }) {
  const columns = useMemo(
    () =>
      defineColumns<CciRow>((c) => [
        c.id("id", { header: "CCI", width: 132, hideable: false }),
        c.custom("controls", {
          header: "Controls",
          width: 180,
          cell: (row) =>
            row.controls ? (
              <Id>{row.controls}</Id>
            ) : (
              <span className="text-subtle">No Rev. 5 mapping</span>
            ),
          text: (row) => row.controls || "No Rev. 5 mapping",
        }),
        c.text("type", { header: "Type", width: 104 }),
        c.status("status", {
          header: "Status",
          width: 124,
          tone: (row) => (row.status === "deprecated" ? "warning" : "neutral"),
        }),
        c.text("family", { header: "Family", width: 96 }),
        c.text("publishDate", { header: "Published", width: 124 }),
      ]),
    [],
  );

  const table = useDataTable({
    data: cciRows,
    columns,
    getRowId: (row) => row.id,
    label: "Control correlation identifiers",
    view: "catalog-ccis",
    resizable: true,
    reorderable: true,
    virtualize: true,
  });

  return (
    <DataTable
      table={table}
      maxHeight={620}
      onRowClick={onSelect}
      empty={{ title: "No CCIs match", description: "Clear the search or the filters." }}
      toolbar={
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <DataTable.Search table={table} placeholder="Find a CCI" />
          <DataTable.Presets
            table={table}
            variant="menu"
            presets={[
              { id: "all", label: "All CCIs" },
              {
                id: "technical",
                label: "Technical",
                filters: [{ id: "type", value: "technical" }],
              },
              { id: "policy", label: "Policy", filters: [{ id: "type", value: "policy" }] },
              {
                id: "deprecated",
                label: "Deprecated",
                filters: [{ id: "status", value: "deprecated" }],
              },
            ]}
          />
          <DataTable.Filter table={table} column="type" />
          <DataTable.Filter table={table} column="family" />
          <Inline className="ml-auto" space="space.100" alignBlock="center">
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
          </Inline>
        </Inline>
      }
    />
  );
}

function CciPanel({ cci, onClose }: { cci: CciRow; onClose: () => void }) {
  const [definition, setDefinition] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const controls = cci.controls ? cci.controls.split(", ") : [];

  useMemo(() => {
    let live = true;
    void import("@/lib/cci-catalog")
      .then((m) => m.loadCciDefinition(cci.id))
      .then((text) => {
        if (!live) return;
        setDefinition(text);
        setState(text ? "ready" : "missing");
      })
      .catch(() => live && setState("missing"));
    return () => {
      live = false;
    };
  }, [cci.id]);

  return (
    <Shell.Panel title={cci.id} onClose={onClose}>
      <>
        <Inspector.Group title="Statement">
          <p className="font-body-small">
            {state === "loading"
              ? "Loading the published definition…"
              : (definition ?? "No definition is published for this identifier.")}
          </p>
        </Inspector.Group>
        <Inspector.Group title="Identity">
          <KeyValue label="Type">{cci.type}</KeyValue>
          <KeyValue label="Status">{cci.status}</KeyValue>
          <KeyValue label="Published">{cci.publishDate}</KeyValue>
          <KeyValue label="Contributor">{cci.contributor}</KeyValue>
        </Inspector.Group>
        <Inspector.Group title="Cross-references">
          {controls.length ? (
            <Stack className="font-body-small" space="space.050">
              {controls.map((id) => (
                <Id key={id}>{id}</Id>
              ))}
            </Stack>
          ) : (
            <span className="font-body-small text-subtle">
              This identifier carries no SP 800-53 Rev. 5 reference. It is cited only by an earlier
              revision.
            </span>
          )}
        </Inspector.Group>
      </>
    </Shell.Panel>
  );
}

/* ------------------------------------------------------------------- Sources */

/**
 * The provenance of everything above.
 *
 * `authoritative` is the load-bearing field and the reason this tab exists: it is
 * true only for a machine-readable release published by the body that owns the
 * document. Two of the five are not, and both are in use.
 */
function SourcesList() {
  return (
    <Stack space="space.200" className="min-w-0 pt-100">
      {referenceSources.map((source) => (
        <SourceCard key={source.id} source={source} />
      ))}
    </Stack>
  );
}

function SourceCard({ source }: { source: ReferenceProvenance }) {
  // A couple of sources repeat their rights statement as a note; it is already
  // shown above, so printing it twice just makes the caveats harder to read.
  const notes = (source.notes ?? []).filter((note) => note !== source.rights);
  return (
    <Stack space="space.100" className="min-w-0 border-b pb-200 last:border-b-0">
      <Inline space="space.100" alignBlock="center" shouldWrap>
        <span className="font-heading-small">{referenceSourceName(source)}</span>
        <Badge variant="secondary" tone={source.authoritative ? "success" : "warning"}>
          {source.authoritative ? "Authoritative" : "Not authoritative"}
        </Badge>
        <Id className="text-subtle">{source.id}</Id>
      </Inline>
      <p className="font-body-small text-subtle">{source.citation}</p>
      <Inline space="space.300" shouldWrap>
        <KeyValue label="Authority">{source.authority}</KeyValue>
        <KeyValue label="Release">{source.release}</KeyValue>
      </Inline>
      {source.normativePublication ? (
        <KeyValue label="Expresses">{source.normativePublication}</KeyValue>
      ) : null}
      <KeyValue label="Fetched from">
        <TextLink
          render={<a href={source.sourceUrl} target="_blank" rel="noreferrer noopener" />}
          className="break-all"
        >
          {source.sourceUrl}
        </TextLink>
      </KeyValue>
      {source.officialLandingPage ? (
        <KeyValue label="Publisher">
          <TextLink
            render={
              <a href={source.officialLandingPage} target="_blank" rel="noreferrer noopener" />
            }
            className="break-all"
          >
            {source.officialLandingPage}
          </TextLink>
        </KeyValue>
      ) : null}
      {source.sha256 ? (
        <KeyValue label="SHA-256">
          <span className="break-all font-code">{source.sha256}</span>
        </KeyValue>
      ) : null}
      <KeyValue label="Rights">{source.rights}</KeyValue>
      {notes.length ? (
        <Stack space="space.050" className="font-body-small text-subtle">
          {notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
