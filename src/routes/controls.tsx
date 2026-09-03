import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  Badge,
  Button,
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
  ToggleGroup,
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
          description="800-53 Rev 5, CNSSI 1253 overlays and the CCI decomposition. Every rule, procedure and test objective in the product resolves to a CCI in this table."
          actions={<Button variant="secondary">Import catalog</Button>}
        />

        <Tabs>
          {tabs.map((t) => (
            <Tabs.Tab
              key={t}
              isSelected={tab === t}
              onClick={() => {
                setTab(t);
                setSelected(null);
              }}
              count={counts[t]}
            >
              {t}
            </Tabs.Tab>
          ))}
        </Tabs>

        {tab !== "Overlays" ? (
          <Inline className="pt-050" space="space.100" alignBlock="center" shouldWrap>
            <InputGroup leading={<Search />}>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={tab === "Controls" ? "Search controls" : "Search CCIs"}
                aria-label="Search"
                style={{ width: 240 }}
              />
            </InputGroup>
            <ToggleGroup
              aria-label="Family"
              value={family}
              onChange={setFamily}
              items={["All", ...families.map((f) => f.id)].map((f) => ({ value: f, label: f }))}
            />
          </Inline>
        ) : null}

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
                      <Table.Cell className="tabular-nums text-right">{o.parameters}</Table.Cell>
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
                          <Badge tone="danger">Non-compliant</Badge>
                        ) : c.compliance === "Compliant" ? (
                          <Badge tone="success">Compliant</Badge>
                        ) : (
                          <span className="text-subtle">{c.compliance}</span>
                        )}
                      </Table.Cell>
                      <Table.Cell className="tabular-nums text-right">{c.rules.length}</Table.Cell>
                      <Table.Cell className="tabular-nums text-right">
                        {c.procedures.length}
                      </Table.Cell>
                      <Table.Cell className="tabular-nums text-right">
                        {c.objectives.length || <span className="text-warning">0</span>}
                      </Table.Cell>
                    </Table.Row>
                  ))}
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
                  <Badge tone={statusTone(selected.compliance)}>{selected.compliance}</Badge>
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
      </Stack>
    </Shell>
  );
}
