import { downloadText } from "@/components/app/export";
import { useAssuranceVersion } from "@/lib/assurance-record-store";
import {
  assetById,
  assets,
  bySeverity,
  findings,
  isOpen,
  type Asset,
  type Finding,
} from "@/lib/findings";
import { assetPosture } from "@/lib/graph-posture";
import { severityTone, statusTone } from "@/lib/spine";
import {
  Badge,
  Button,
  Count,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Id,
  Indicator,
  Inline,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Inspector,
  KeyValue,
  PageHeader,
  Shell,
  Stack,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
  ToggleGroup,
  ToggleGroupItem,
} from "@ledger/design-system";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/findings/")({
  head: () => ({
    meta: [
      { title: "Findings & assets — Equinox" },
      {
        name: "description",
        content:
          "Every technical finding joined to its CCI and asset, with raw and mitigated severity, verification path, and the POA&M or risk it rolls up to.",
      },
      { property: "og:title", content: "Findings & assets — Equinox" },
      {
        property: "og:description",
        content:
          "Findings joined to CCIs and assets: raw vs mitigated severity, verification path, POA&M and risk rollup.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FindingsPage,
});

const tabs = ["Findings", "Assets"] as const;
type Tab = (typeof tabs)[number];

const scopes = ["Open", "All", "CAT I", "Settled"] as const;
type Scope = (typeof scopes)[number];

function scopeFilter(f: Finding, scope: Scope) {
  if (scope === "All") return true;
  if (scope === "Open") return isOpen(f);
  if (scope === "CAT I") return f.mitigatedSeverity === "CAT I" || f.rawSeverity === "CAT I";
  return !isOpen(f);
}

type Preview = { kind: "finding"; item: Finding } | { kind: "asset"; item: Asset } | null;

/**
 * Register-derived open counts for an asset's composition subtree. The scanner
 * columns beside these stay exactly as authored — the delta between the two is
 * the reconciliation an SCA writes up, so neither side overwrites the other.
 */
function trackedLabel(assetId: string): string {
  const rolled = assetPosture(assetId)?.rolled ?? null;
  return rolled ? `${rolled.catI} / ${rolled.catII} / ${rolled.catIII}` : "—";
}

/** The register-tracked CAT triple, rendered as its own table cell. */
function TrackedCell({ assetId }: { assetId: string }) {
  const rolled = assetPosture(assetId)?.rolled ?? null;
  if (!rolled) {
    return <Table.Cell className="text-right">—</Table.Cell>;
  }
  return (
    <Table.Cell className="tabular-nums text-right">
      <span className={rolled.catI ? "font-medium text-danger" : ""}>{rolled.catI}</span>
      <span className="text-subtle">
        {" "}
        / {rolled.catII} / {rolled.catIII}
      </span>
    </Table.Cell>
  );
}

function FindingsPage() {
  const assuranceVersion = useAssuranceVersion();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Findings");
  const [scope, setScope] = useState<Scope>("Open");
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<Preview>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return findings
      .filter((f) => scopeFilter(f, scope))
      .filter(
        (f) =>
          !needle ||
          f.title.toLowerCase().includes(needle) ||
          f.id.toLowerCase().includes(needle) ||
          f.cci.toLowerCase().includes(needle) ||
          f.control.toLowerCase().includes(needle) ||
          (assetById.get(f.asset)?.name ?? "").toLowerCase().includes(needle),
      )
      .slice()
      .sort(bySeverity);
  }, [scope, q, assuranceVersion]);

  const counts: Record<Tab, number> = {
    Findings: findings.filter(isOpen).length,
    Assets: assets.length,
  };

  return (
    <Stack space="space.200" className="min-w-0">
      <PageHeader>
        <div className="min-w-0">
          <PageHeader.Title>{"Findings & assets"}</PageHeader.Title>
        </div>
        <PageHeader.Actions>
          <Button
            variant="secondary"
            iconBefore={<Download />}
            onClick={() =>
              downloadText("findings.json", JSON.stringify(rows, null, 2), "application/json")
            }
          >
            Export findings JSON
          </Button>
        </PageHeader.Actions>
      </PageHeader>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as typeof tab);
          setPreview(null);
        }}
        className="contents"
      >
        <TabsList className="w-full justify-start" variant="line" activateOnFocus>
          {tabs.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t}
              {counts[t] != null ? <Count value={counts[t]} max={9999} /> : null}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="contents">
          {tab === "Findings" ? (
            <Inline className="pt-050" space="space.100" alignBlock="center" shouldWrap>
              <InputGroup>
                <InputGroupInput
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search findings, CCIs, assets"
                  aria-label="Search"
                  style={{ width: 240, maxWidth: "100%" }}
                />
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
              </InputGroup>
              <ToggleGroup
                aria-label="Scope"
                size="sm"
                value={[scope]}
                onValueChange={([next]) => {
                  if (next !== undefined) setScope(next);
                }}
              >
                {scopes.map((s) => (
                  <ToggleGroupItem key={s} value={s}>
                    {s}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Inline>
          ) : null}

          <p role="status" className="font-body-small text-subtle">
            {tab === "Findings" ? `${rows.length} matching findings` : `${assets.length} assets`}
          </p>
          <>
            <div className="min-w-0 lg:pe-300">
              {tab === "Findings" ? (
                <Table className="table-fixed">
                  <thead>
                    <tr>
                      <Table.Header width={112}>Finding</Table.Header>
                      <Table.Header>Title</Table.Header>
                      <Table.Header width={104}>CCI</Table.Header>
                      <Table.Header width={132}>Asset</Table.Header>
                      <Table.Header width={124}>Source</Table.Header>
                      <Table.Header width={68}>Raw</Table.Header>
                      <Table.Header width={68}>Mitigated</Table.Header>
                      <Table.Header width={112}>Lifecycle</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((f) => (
                      <Table.Row
                        key={f.id}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate({ to: "/findings/$findingId", params: { findingId: f.id } })
                        }
                      >
                        <Table.Id
                          id={f.id}
                          isActive={preview?.kind === "finding" && preview.item.id === f.id}
                          onPreview={() => setPreview({ kind: "finding", item: f })}
                        />
                        <Table.Cell className="truncate">{f.title}</Table.Cell>
                        <Table.Cell>
                          <Id>{f.cci}</Id>
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          {assetById.get(f.asset)?.name ?? f.asset}
                        </Table.Cell>
                        <Table.Cell className="truncate">{f.source}</Table.Cell>
                        <Table.Cell>{f.rawSeverity}</Table.Cell>
                        <Table.Cell>
                          <Indicator tone={severityTone(f.mitigatedSeverity)}>
                            {f.mitigatedSeverity}
                          </Indicator>
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          <Badge variant="secondary" tone={statusTone(f.lifecycle)}>
                            {f.lifecycle}
                          </Badge>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                    {rows.length === 0 ? (
                      <Table.Row>
                        <Table.Cell colSpan={12}>
                          <Empty>
                            <EmptyHeader>
                              <EmptyTitle>No results match your filters</EmptyTitle>
                              <EmptyDescription>
                                Clear the filters to see the available records.
                              </EmptyDescription>
                            </EmptyHeader>
                            <EmptyContent>
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  setQ("");
                                  setScope("All");
                                }}
                              >
                                Clear filters
                              </Button>
                            </EmptyContent>
                          </Empty>
                        </Table.Cell>
                      </Table.Row>
                    ) : null}
                  </tbody>
                </Table>
              ) : (
                <Table className="table-fixed">
                  <thead>
                    <tr>
                      <Table.Header width={112}>Asset</Table.Header>
                      <Table.Header>Name</Table.Header>
                      <Table.Header width={120}>Kind</Table.Header>
                      <Table.Header width={148}>Technology</Table.Header>
                      <Table.Header width={112}>Environment</Table.Header>
                      <Table.Header width={116}>Last scan</Table.Header>
                      <Table.Header width={124} className="text-right">
                        Scanner I / II / III
                      </Table.Header>
                      <Table.Header width={124} className="text-right">
                        Tracked I / II / III
                      </Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((a) => (
                      <Table.Row
                        key={a.id}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate({ to: "/findings/assets/$assetId", params: { assetId: a.id } })
                        }
                      >
                        <Table.Id
                          id={a.id}
                          isActive={preview?.kind === "asset" && preview.item.id === a.id}
                          onPreview={() => setPreview({ kind: "asset", item: a })}
                        />
                        <Table.Cell className="truncate">{a.name}</Table.Cell>
                        <Table.Cell className="truncate">{a.kind}</Table.Cell>
                        <Table.Cell className="truncate">{a.technology}</Table.Cell>
                        <Table.Cell className="truncate">{a.environment}</Table.Cell>
                        <Table.Cell className="truncate">{a.lastScan}</Table.Cell>
                        <Table.Cell className="tabular-nums text-right">
                          {a.scanAvailable === false ? (
                            "—"
                          ) : (
                            <>
                              <span className={a.openCatI ? "font-medium text-danger" : ""}>
                                {a.openCatI}
                              </span>
                              <span className="text-subtle">
                                {" "}
                                / {a.openCatII} / {a.openCatIII}
                              </span>
                            </>
                          )}
                        </Table.Cell>
                        <TrackedCell assetId={a.id} />
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
            {preview?.kind === "finding" ? (
              <Shell.Panel title={preview.item.title} onClose={() => setPreview(null)}>
                <Stack space="space.150" className="min-w-0">
                  <Inline space="space.100" alignBlock="center" shouldWrap>
                    <Id>{preview.item.id}</Id>
                  </Inline>
                  <div className="font-body">
                    <TextLink
                      render={
                        <Link to="/findings/$findingId" params={{ findingId: preview.item.id }} />
                      }
                    >
                      Open finding
                    </TextLink>
                  </div>
                  <Inspector.Group title="Join keys">
                    <KeyValue label="CCI">
                      <Id>{preview.item.cci}</Id>
                    </KeyValue>
                    <KeyValue label="Control">
                      <Id>{preview.item.control}</Id>
                    </KeyValue>
                    <KeyValue label="Asset">
                      {assetById.get(preview.item.asset)?.name ?? preview.item.asset}
                    </KeyValue>
                    <KeyValue label="Rule">
                      {preview.item.rule ? <Id>{preview.item.rule}</Id> : "—"}
                    </KeyValue>
                  </Inspector.Group>
                  <Inspector.Group title="Severity">
                    <KeyValue label="Raw">{preview.item.rawSeverity}</KeyValue>
                    <KeyValue label="Mitigated">
                      <Indicator tone={severityTone(preview.item.mitigatedSeverity)}>
                        {preview.item.mitigatedSeverity}
                      </Indicator>
                    </KeyValue>
                    <KeyValue label="Lifecycle">
                      <Badge variant="secondary" tone={statusTone(preview.item.lifecycle)}>
                        {preview.item.lifecycle}
                      </Badge>
                    </KeyValue>
                  </Inspector.Group>
                  <Inspector.Group title="Rolls up to">
                    <KeyValue label="POA&M">
                      {preview.item.poam ? <Id>{preview.item.poam}</Id> : "Not yet scheduled"}
                    </KeyValue>
                    <KeyValue label="Risk">
                      {preview.item.risk ? <Id>{preview.item.risk}</Id> : "Not aggregated"}
                    </KeyValue>
                  </Inspector.Group>
                </Stack>
              </Shell.Panel>
            ) : null}
            {preview?.kind === "asset" ? (
              <Shell.Panel title={preview.item.name} onClose={() => setPreview(null)}>
                <Stack space="space.150" className="min-w-0">
                  <Inline space="space.100" alignBlock="center" shouldWrap>
                    <Id>{preview.item.id}</Id>
                  </Inline>
                  <div className="font-body">
                    <TextLink
                      render={
                        <Link
                          to="/findings/assets/$assetId"
                          params={{ assetId: preview.item.id }}
                        />
                      }
                    >
                      Open asset
                    </TextLink>
                  </div>
                  <Inspector.Group title="Inventory">
                    <KeyValue label="Kind">{preview.item.kind}</KeyValue>
                    <KeyValue label="Technology">{preview.item.technology}</KeyValue>
                    <KeyValue label="Environment">{preview.item.environment}</KeyValue>
                    <KeyValue label="Last scan">{preview.item.lastScan}</KeyValue>
                  </Inspector.Group>
                  <Inspector.Group title="Open findings">
                    <KeyValue label="Scanner declared">
                      {preview.item.scanAvailable === false ? (
                        "Not supplied"
                      ) : (
                        <span className="tabular-nums">
                          {preview.item.openCatI} / {preview.item.openCatII} /{" "}
                          {preview.item.openCatIII}
                        </span>
                      )}
                    </KeyValue>
                    <KeyValue label="Register tracked">
                      <span className="tabular-nums">{trackedLabel(preview.item.id)}</span>
                    </KeyValue>
                  </Inspector.Group>
                </Stack>
              </Shell.Panel>
            ) : null}
          </>
        </TabsContent>
      </Tabs>
    </Stack>
  );
}
