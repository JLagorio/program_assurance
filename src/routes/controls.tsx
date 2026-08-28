import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  KeyValue,
  Mono,
  PageHeader,
  RailGroup,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
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
          (q === "" ||
            `${c.id} ${c.title}`.toLowerCase().includes(q.toLowerCase())),
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
      <div className="animate-slide-up space-y-4">
        <PageHeader
          title="Control catalog"
          description="800-53 Rev 5, CNSSI 1253 overlays and the CCI decomposition. Every rule, procedure and test objective in the product resolves to a CCI in this table."
          actions={<Button variant="secondary">Import catalog</Button>}
        />

        <div className="flex items-center gap-4 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setSelected(null);
              }}
            >
              <span
                className={
                  t === tab
                    ? "-mb-px inline-flex items-center gap-1.5 border-b-2 border-primary px-0.5 pb-2.5 pt-1 text-[13px] font-semibold text-primary"
                    : "-mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-0.5 pb-2.5 pt-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {t}
                <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                  {counts[t]}
                </span>
              </span>
            </button>
          ))}
        </div>

        {tab !== "Overlays" ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <label className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={tab === "Controls" ? "Search controls" : "Search CCIs"}
                className="h-7 w-[240px] rounded-md border border-border bg-background pl-7 pr-2 text-[13px] outline-none placeholder:text-muted-foreground focus:border-primary/40"
              />
            </label>
            <div className="flex items-center gap-1">
              {["All", ...families.map((f) => f.id)].map((f) => (
                <button
                  key={f}
                  onClick={() => setFamily(f)}
                  className={
                    f === family
                      ? "h-7 rounded-md bg-primary-soft px-2 text-[12.5px] font-medium text-primary"
                      : "h-7 rounded-md px-2 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  }
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className={selected ? "grid lg:grid-cols-[minmax(0,1fr)_272px]" : "grid"}>
          <div className="min-w-0 lg:pr-6">
            {tab === "Controls" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "104px" }} />
                  <col />
                  <col style={{ width: "56px" }} />
                  <col style={{ width: "168px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "72px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Th>Control</Th>
                    <Th>Title</Th>
                    <Th>Family</Th>
                    <Th>Baseline</Th>
                    <Th>Added by overlay</Th>
                    <Th className="text-right">CCIs</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredControls.map((c) => (
                    <Tr key={c.id}>
                      <Td>
                        <Mono>{c.id}</Mono>
                      </Td>
                      <Td className="truncate font-medium">{c.title}</Td>
                      <Td className="text-muted-foreground">{c.family}</Td>
                      <Td className="truncate text-muted-foreground">
                        {c.baseline.join(" · ")}
                      </Td>
                      <Td className="truncate text-muted-foreground">
                        {c.addedBy.length ? <Mono>{c.addedBy.join(", ")}</Mono> : "—"}
                      </Td>
                      <Td className="tnum text-right text-muted-foreground">{c.cciCount}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : null}

            {tab === "Overlays" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "88px" }} />
                  <col style={{ width: "184px" }} />
                  <col />
                  <col style={{ width: "196px" }} />
                  <col style={{ width: "64px" }} />
                  <col style={{ width: "76px" }} />
                  <col style={{ width: "84px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Th>ID</Th>
                    <Th>Overlay</Th>
                    <Th>Applicability</Th>
                    <Th>Authority</Th>
                    <Th className="text-right">Adds</Th>
                    <Th className="text-right">Removes</Th>
                    <Th className="text-right">Params</Th>
                  </tr>
                </thead>
                <tbody>
                  {overlays.map((o) => (
                    <Tr key={o.id}>
                      <Td>
                        <Mono>{o.id}</Mono>
                      </Td>
                      <Td className="truncate font-medium">{o.name}</Td>
                      <Td className="truncate text-muted-foreground">{o.applicability}</Td>
                      <Td className="truncate text-muted-foreground">{o.authority}</Td>
                      <Td className="tnum text-right text-muted-foreground">+{o.adds}</Td>
                      <Td className="tnum text-right text-muted-foreground">−{o.removes}</Td>
                      <Td className="tnum text-right text-muted-foreground">{o.parameters}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : null}

            {tab === "CCIs" ? (
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "112px" }} />
                  <col style={{ width: "88px" }} />
                  <col />
                  <col style={{ width: "132px" }} />
                  <col style={{ width: "64px" }} />
                  <col style={{ width: "68px" }} />
                  <col style={{ width: "76px" }} />
                </colgroup>
                <thead>
                  <tr>
                    <Th>CCI</Th>
                    <Th>Control</Th>
                    <Th>Statement</Th>
                    <Th>Compliance</Th>
                    <Th className="text-right">Rules</Th>
                    <Th className="text-right">Procs</Th>
                    <Th className="text-right">Objectives</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCcis.map((c) => (
                    <Tr
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="cursor-pointer"
                      data-selected={selected?.id === c.id ? "" : undefined}
                    >
                      <Td>
                        <Mono>{c.id}</Mono>
                      </Td>
                      <Td>
                        <Mono className="text-muted-foreground">{c.control}</Mono>
                      </Td>
                      <Td className="truncate">{c.definition}</Td>
                      <Td>
                        {c.compliance === "Non-compliant" ? (
                          <Badge tone="danger">Non-compliant</Badge>
                        ) : c.compliance === "Compliant" ? (
                          <Badge tone="success">Compliant</Badge>
                        ) : (
                          <span className="text-muted-foreground">{c.compliance}</span>
                        )}
                      </Td>
                      <Td className="tnum text-right text-muted-foreground">{c.rules.length}</Td>
                      <Td className="tnum text-right text-muted-foreground">
                        {c.procedures.length}
                      </Td>
                      <Td className="tnum text-right text-muted-foreground">
                        {c.objectives.length || (
                          <span className="text-warning">0</span>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : null}
          </div>

          {selected ? (
            <aside className="pt-1 lg:border-l lg:border-border lg:pl-6">
              <div className="flex items-center justify-between gap-2 pb-1">
                <Mono className="text-[12.5px] font-medium">{selected.id}</Mono>
                <button
                  onClick={() => setSelected(null)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Close CCI detail"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <p className="pb-3 text-[12.5px] leading-relaxed text-muted-foreground">
                {selected.definition}
              </p>

              <RailGroup title="Identity">
                <KeyValue label="Parent control">
                  <Mono>{selected.control}</Mono>
                </KeyValue>
                <KeyValue label="Statement type">{selected.type}</KeyValue>
                <KeyValue label="Compliance">
                  <Badge tone={statusTone(selected.compliance)}>{selected.compliance}</Badge>
                </KeyValue>
                <KeyValue label="Sibling CCIs">
                  {(ccisByControl.get(selected.control)?.length ?? 1) - 1}
                </KeyValue>
              </RailGroup>

              <RailGroup title="Implemented by">
                <div className="space-y-1.5 text-[12.5px]">
                  {(rulesByCci.get(selected.id) ?? []).map((r) => (
                    <div key={r.id} className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0">
                        <Mono>{r.id}</Mono>{" "}
                        <span className="text-muted-foreground">
                          {benchmarkById.get(r.benchmark)?.technology}
                        </span>
                      </span>
                      <Badge tone={severityTone(r.severity)}>{r.severity}</Badge>
                    </div>
                  ))}
                  {selected.rules.length === 0 ? (
                    <span className="text-muted-foreground">No STIG rule covers this CCI</span>
                  ) : null}
                </div>
              </RailGroup>

              <RailGroup title="Assessed by">
                <div className="space-y-1 text-[12.5px] text-muted-foreground">
                  {selected.procedures.map((p) => (
                    <div key={p}>
                      <Mono>{p}</Mono> · 800-53A procedure
                    </div>
                  ))}
                </div>
              </RailGroup>

              <RailGroup title="Exercised by">
                <div className="space-y-1 text-[12.5px]">
                  {selected.objectives.length ? (
                    selected.objectives.map((o) => (
                      <div key={o} className="truncate text-muted-foreground">
                        {o}
                      </div>
                    ))
                  ) : (
                    <span className="text-warning">No test objective — coverage gap</span>
                  )}
                </div>
              </RailGroup>
            </aside>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}
