import { UnavailableAction } from "@/components/app/unavailable-action";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  Badge,
  Button,
  Empty,
  Id,
  Indicator,
  Inline,
  Input,
  InputGroup,
  Inspector,
  KeyValue,
  PageHeader,
  PreviewRail,
  PreviewSplit,
  Stack,
  Table,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Count,
  ToggleGroup,
  ToggleGroupItem,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import {
  benchmarkById,
  ccis,
  ccisByControl,
  controls,
  families,
  overlays,
  rulesByCci,
  type Cci,
} from "@/lib/catalog";
import { severityTone, statusTone } from "@/lib/spine";

export const Route = createFileRoute("/controls")({
  head: () => ({
    meta: [
      { title: "Control catalog — 800-53, overlays and CCIs | Equinox" },
      {
        name: "description",
        content:
          "The tailoring engine's source data: NIST SP 800-53 Rev 5 controls, CNSSI 1253 overlays, and the CCI decomposition that joins requirements to STIG rules and test objectives.",
      },
      { property: "og:title", content: "Control catalog — 800-53, overlays and CCIs" },
      {
        property: "og:description",
        content:
          "800-53 Rev 5 controls, CNSSI 1253 overlays and the CCI decomposition behind every verification path.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Catalog,
});

const tabs = ["Controls", "Overlays", "CCIs"] as const;
type Tab = (typeof tabs)[number];

function Catalog() {
  const [tab, setTab] = useState<Tab>("Controls");
  const [family, setFamily] = useState<string>("All");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Cci | null>(null);

  const counts = {
    Controls: controls.length,
    Overlays: overlays.length,
    CCIs: ccis.length,
  } as const;

  const filteredControls = useMemo(
    () =>
      controls.filter(
        (c) =>
          (family === "All" || c.family === family) &&
          (q === "" || `${c.id} ${c.title}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [family, q],
  );

  const filteredCcis = useMemo(
    () =>
      ccis.filter(
        (c) =>
          (family === "All" || c.control.startsWith(family)) &&
          (q === "" ||
            `${c.id} ${c.control} ${c.definition}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [family, q],
  );

  return (
    <Shell>
      <Stack className="animate-rise" space="space.200">
        <PageHeader
          title="Control catalog"
          actions={
            <UnavailableAction
              reason="Catalog import is not connected. This catalog is read-only."
              variant="secondary"
            >
              Import catalog
            </UnavailableAction>
          }
        />

        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value as typeof tab);
            setSelected(null);
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
            {tab !== "Overlays" ? (
              <Inline className="pt-050" space="space.100" alignBlock="center" shouldWrap>
                <InputGroup leading={<Search />}>
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={tab === "Controls" ? "Search controls" : "Search CCIs"}
                    aria-label="Search"
                    style={{ width: 240, maxWidth: "100%" }}
                  />
                </InputGroup>
                <ToggleGroup
                  aria-label="Family"
                  size="sm"
                  value={[family]}
                  onValueChange={([next]) => {
                    if (next !== undefined) setFamily(next);
                  }}
                >
                  {["All", ...families.map((f) => f.id)].map((f) => (
                    <ToggleGroupItem key={f} value={f}>
                      {f}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Inline>
            ) : null}

            <p role="status" className="font-body-small text-subtle">
              {tab === "Controls"
                ? `${filteredControls.length} matching controls`
                : tab === "CCIs"
                  ? `${filteredCcis.length} matching CCIs`
                  : `${overlays.length} overlays`}
            </p>
            <PreviewSplit open={selected !== null}>
              <div className="min-w-0 lg:pe-300">
                {tab === "Controls" ? (
                  <Table className="table-fixed">
                    <thead>
                      <tr>
                        <Table.Header width={104}>Control</Table.Header>
                        <Table.Header>Title</Table.Header>
                        <Table.Header width={56}>Family</Table.Header>
                        <Table.Header width={168}>Baseline</Table.Header>
                        <Table.Header width={120}>Added by overlay</Table.Header>
                        <Table.Header width={72} className="text-right">
                          CCIs
                        </Table.Header>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredControls.map((c) => (
                        <Table.Row key={c.id}>
                          <Table.Cell>
                            <Id>{c.id}</Id>
                          </Table.Cell>
                          <Table.Cell className="truncate">{c.title}</Table.Cell>
                          <Table.Cell>{c.family}</Table.Cell>
                          <Table.Cell className="truncate">{c.baseline.join(" · ")}</Table.Cell>
                          <Table.Cell className="truncate">
                            {c.addedBy.length ? <Id>{c.addedBy.join(", ")}</Id> : "—"}
                          </Table.Cell>
                          <Table.Cell className="tabular-nums text-right">{c.cciCount}</Table.Cell>
                        </Table.Row>
                      ))}
                      {filteredControls.length === 0 ? (
                        <Table.Row>
                          <Table.Cell colSpan={12}>
                            <Empty
                              title="No results match your filters"
                              description="Clear the filters to see the available records."
                              action={
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    setQ("");
                                    setFamily("All");
                                  }}
                                >
                                  Clear filters
                                </Button>
                              }
                            />
                          </Table.Cell>
                        </Table.Row>
                      ) : null}
                    </tbody>
                  </Table>
                ) : null}

                {tab === "Overlays" ? (
                  <Table className="table-fixed">
                    <thead>
                      <tr>
                        <Table.Header width={88}>ID</Table.Header>
                        <Table.Header width={184}>Overlay</Table.Header>
                        <Table.Header>Applicability</Table.Header>
                        <Table.Header width={196}>Authority</Table.Header>
                        <Table.Header width={64} className="text-right">
                          Adds
                        </Table.Header>
                        <Table.Header width={76} className="text-right">
                          Removes
                        </Table.Header>
                        <Table.Header width={84} className="text-right">
                          Params
                        </Table.Header>
                      </tr>
                    </thead>
                    <tbody>
                      {overlays.map((o) => (
                        <Table.Row key={o.id}>
                          <Table.Cell>
                            <Id>{o.id}</Id>
                          </Table.Cell>
                          <Table.Cell className="truncate">{o.name}</Table.Cell>
                          <Table.Cell className="truncate">{o.applicability}</Table.Cell>
                          <Table.Cell className="truncate">{o.authority}</Table.Cell>
                          <Table.Cell className="tabular-nums text-right">+{o.adds}</Table.Cell>
                          <Table.Cell className="tabular-nums text-right">−{o.removes}</Table.Cell>
                          <Table.Cell className="tabular-nums text-right">
                            {o.parameters}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </tbody>
                  </Table>
                ) : null}

                {tab === "CCIs" ? (
                  <Table className="table-fixed">
                    <thead>
                      <tr>
                        <Table.Header width={112}>CCI</Table.Header>
                        <Table.Header width={88}>Control</Table.Header>
                        <Table.Header>Statement</Table.Header>
                        <Table.Header width={132}>Compliance</Table.Header>
                        <Table.Header width={64} className="text-right">
                          Rules
                        </Table.Header>
                        <Table.Header width={68} className="text-right">
                          Procs
                        </Table.Header>
                        <Table.Header width={76} className="text-right">
                          Objectives
                        </Table.Header>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCcis.map((c) => (
                        <Table.Row
                          key={c.id}
                          onClick={() => setSelected(c)}
                          className="cursor-pointer"
                          data-selected={selected?.id === c.id ? "" : undefined}
                        >
                          <Table.Cell>
                            <Id>{c.id}</Id>
                          </Table.Cell>
                          <Table.Cell>
                            <Id>{c.control}</Id>
                          </Table.Cell>
                          <Table.Cell className="truncate">{c.definition}</Table.Cell>
                          <Table.Cell>
                            {c.compliance === "Non-compliant" ? (
                              <Badge variant="secondary" tone="danger">
                                Non-compliant
                              </Badge>
                            ) : c.compliance === "Compliant" ? (
                              <Badge variant="secondary" tone="success">
                                Compliant
                              </Badge>
                            ) : (
                              <span className="text-subtle">{c.compliance}</span>
                            )}
                          </Table.Cell>
                          <Table.Cell className="tabular-nums text-right">
                            {c.rules.length}
                          </Table.Cell>
                          <Table.Cell className="tabular-nums text-right">
                            {c.procedures.length}
                          </Table.Cell>
                          <Table.Cell className="tabular-nums text-right">
                            {c.objectives.length || <span className="text-warning">0</span>}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                      {filteredCcis.length === 0 ? (
                        <Table.Row>
                          <Table.Cell colSpan={12}>
                            <Empty
                              title="No results match your filters"
                              description="Clear the filters to see the available records."
                              action={
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    setQ("");
                                    setFamily("All");
                                  }}
                                >
                                  Clear filters
                                </Button>
                              }
                            />
                          </Table.Cell>
                        </Table.Row>
                      ) : null}
                    </tbody>
                  </Table>
                ) : null}
              </div>

              {selected ? (
                <PreviewRail id={selected.id} onClose={() => setSelected(null)}>
                  <p className="pb-150 font-body-small text-subtle">{selected.definition}</p>

                  <Inspector.Group title="Identity">
                    <KeyValue label="Parent control">
                      <Id>{selected.control}</Id>
                    </KeyValue>
                    <KeyValue label="Statement type">{selected.type}</KeyValue>
                    <KeyValue label="Compliance">
                      <Badge variant="secondary" tone={statusTone(selected.compliance)}>
                        {selected.compliance}
                      </Badge>
                    </KeyValue>
                    <KeyValue label="Sibling CCIs">
                      {(ccisByControl.get(selected.control)?.length ?? 1) - 1}
                    </KeyValue>
                  </Inspector.Group>

                  <Inspector.Group title="Implemented by">
                    <Stack className="font-body-small" space="space.075">
                      {(rulesByCci.get(selected.id) ?? []).map((r) => (
                        <Inline
                          key={r.id}
                          space="space.100"
                          alignBlock="baseline"
                          spread="space-between"
                        >
                          <span className="min-w-0">
                            <Id>{r.id}</Id>{" "}
                            <span className="text-subtle">
                              {benchmarkById.get(r.benchmark)?.technology}
                            </span>
                          </span>
                          <Indicator tone={severityTone(r.severity)}>{r.severity}</Indicator>
                        </Inline>
                      ))}
                      {selected.rules.length === 0 ? (
                        <span className="text-subtle">No STIG rule covers this CCI</span>
                      ) : null}
                    </Stack>
                  </Inspector.Group>

                  <Inspector.Group title="Assessed by">
                    <Stack className="font-body-small text-subtle" space="space.050">
                      {selected.procedures.map((p) => (
                        <div key={p}>
                          <Id>{p}</Id> · 800-53A procedure
                        </div>
                      ))}
                    </Stack>
                  </Inspector.Group>

                  <Inspector.Group title="Exercised by">
                    <Stack className="font-body-small" space="space.050">
                      {selected.objectives.length ? (
                        selected.objectives.map((o) => (
                          <div key={o} className="truncate text-subtle">
                            {o}
                          </div>
                        ))
                      ) : (
                        <span className="text-warning">No test objective — coverage gap</span>
                      )}
                    </Stack>
                  </Inspector.Group>
                </PreviewRail>
              ) : null}
            </PreviewSplit>
          </TabsContent>
        </Tabs>
      </Stack>
    </Shell>
  );
}
