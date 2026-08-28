import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, ListFilter, Plus } from "lucide-react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  Field,
  FilterChip,
  Input,
  Meter,
  Modal,
  Mono,
  PageHeader,
  Select,
  Table,
  Td,
  Textarea,
  Th,
  Tr,
} from "@/components/app/ui";
import { riskStatusTone, risks } from "@/lib/grc-data";

export const Route = createFileRoute("/risks")({
  head: () => ({
    meta: [
      { title: "Risk register — Equinox GRC" },
      {
        name: "description",
        content:
          "Every tracked risk with inherent and residual scoring, owner, treatment, and linked control — filterable and audit-ready.",
      },
      { property: "og:title", content: "Risk register — Equinox GRC" },
      {
        property: "og:description",
        content: "Inherent and residual scoring, owners, treatments, and linked controls.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RisksLayout,
});

const tabs = [
  { label: "All", count: 24 },
  { label: "Active", count: 4 },
  { label: "Mitigating", count: 11 },
  { label: "Accepted", count: 6 },
  { label: "Closed", count: 3 },
];

function RisksLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/risks") return <Outlet />;
  return (
    <Shell>
      <RiskList />
    </Shell>
  );
}

function RiskList() {
  const [tab, setTab] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const rows = useMemo(
    () => (tab === "All" ? risks : risks.filter((r) => r.status === tab)),
    [tab],
  );

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="animate-slide-up space-y-4">
      <PageHeader
        title="Risk register"
        description="24 tracked risks across 4 frameworks. Residual scores recalculate when linked controls change state."
        actions={
          <>
            <Button variant="secondary">
              <Download className="size-3.5" /> Export
            </Button>
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus className="size-3.5" /> New risk
            </Button>
          </>
        }
      />

      <div className="flex items-center gap-4 border-b border-border">
        {tabs.map((t) => {
          const active = t.label === tab;
          return (
            <button key={t.label} onClick={() => setTab(t.label)}>
              <span
                className={
                  active
                    ? "-mb-px inline-flex items-center gap-1.5 border-b-2 border-primary px-0.5 pb-2.5 pt-1 text-[13px] font-semibold text-primary"
                    : "-mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-0.5 pb-2.5 pt-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {t.label}
                <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                  {t.count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip label="Framework" value="SOC 2" active />
        <FilterChip label="Owner" />
        <FilterChip label="Treatment" />
        <FilterChip label="Updated" />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <ListFilter className="size-3.5" /> Columns
          </Button>
        </div>
      </div>

      {selected.length > 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-primary/25 bg-primary-soft px-3 py-1.5 text-[13px] text-primary">
          <span className="tnum font-medium">{selected.length} selected</span>
          <span className="ml-auto flex items-center gap-2">
            <Button variant="secondary" size="sm">
              Reassign
            </Button>
            <Button variant="secondary" size="sm">
              Change treatment
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              Clear
            </Button>
          </span>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <thead>
            <tr>
              <Th className="w-8">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={selected.length === rows.length && rows.length > 0}
                  onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])}
                  className="size-3.5 accent-[var(--primary)]"
                />
              </Th>
              <Th className="w-[92px]">ID</Th>
              <Th>Risk</Th>
              <Th className="w-[88px]">Framework</Th>
              <Th className="w-[76px]">Control</Th>
              <Th className="w-[118px]">Owner</Th>
              <Th className="w-[88px]">Treatment</Th>
              <Th className="w-[130px]">Residual</Th>
              <Th className="w-[128px]">Updated</Th>
              <Th className="w-[96px] text-right">Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((risk) => (
              <Tr key={risk.id} className="group">
                <Td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${risk.id}`}
                    checked={selected.includes(risk.id)}
                    onChange={() => toggle(risk.id)}
                    className="size-3.5 accent-[var(--primary)]"
                  />
                </Td>
                <Td>
                  <Mono className="text-muted-foreground">{risk.id}</Mono>
                </Td>
                <Td>
                  <Link
                    to="/risks/$riskId"
                    params={{ riskId: risk.id }}
                    className="font-medium underline-offset-2 group-hover:text-primary group-hover:underline"
                  >
                    {risk.title}
                  </Link>
                </Td>
                <Td className="text-muted-foreground">{risk.framework}</Td>
                <Td>
                  <Mono className="text-muted-foreground">{risk.control}</Mono>
                </Td>
                <Td className="text-muted-foreground">{risk.owner}</Td>
                <Td className="text-muted-foreground">{risk.treatment}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="tnum w-5 text-right text-[12px] text-muted-foreground/70 line-through">
                      {risk.inherent}
                    </span>
                    <Meter
                      value={risk.residual}
                      tone={risk.residual > 60 ? "danger" : risk.residual > 30 ? "warning" : "success"}
                    />
                    <span className="tnum w-5 shrink-0 text-right text-[12px] font-medium">
                      {risk.residual}
                    </span>
                  </div>
                </Td>
                <Td className="text-[12px] text-muted-foreground">{risk.updated}</Td>
                <Td className="text-right">
                  <Badge tone={riskStatusTone[risk.status]}>{risk.status}</Badge>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[12px] text-muted-foreground">
          <span className="tnum">{rows.length} of 24 results</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled>
              Previous
            </Button>
            <Button size="sm" variant="secondary">
              Next
            </Button>
          </div>
        </div>
      </div>

      <CreateRiskModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function CreateRiskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [framework, setFramework] = useState("SOC 2");
  const [control, setControl] = useState("CC6.1");
  const [owner, setOwner] = useState("Sarah Chen");
  const [treatment, setTreatment] = useState("Mitigate");
  const [likelihood, setLikelihood] = useState("3");
  const [impact, setImpact] = useState("4");

  const inherent = Number(likelihood) * Number(impact) * 4;
  const residual = Math.round(inherent * (treatment === "Accept" ? 0.95 : 0.55));

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="lg"
      title="Create a risk"
      description="Risks inherit scoring from likelihood × impact and recalculate when the linked control changes state."
      aside={
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Preview
          </div>
          <div className="mt-3 rounded-md border border-border bg-card p-3">
            <Mono className="text-muted-foreground">RSK-2431</Mono>
            <div className="mt-1 text-[13px] font-medium leading-snug">
              {title || "Untitled risk"}
            </div>
            <div className="mt-1 text-[12px] text-muted-foreground">
              {framework} · {control} · {owner}
            </div>
            <dl className="mt-3 space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between text-[12px]">
                <dt className="text-muted-foreground">Inherent</dt>
                <dd className="tnum font-medium">{inherent}</dd>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <dt className="text-muted-foreground">Residual</dt>
                <dd className="tnum font-medium">{residual}</dd>
              </div>
              <Meter value={residual} tone={residual > 60 ? "danger" : residual > 30 ? "warning" : "success"} />
            </dl>
          </div>
          <p className="mt-3 text-[12px] leading-snug text-muted-foreground">
            Creating this risk notifies {owner} and opens a treatment task due in 30 days.
          </p>
        </div>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Save draft
          </Button>
          <Button variant="primary" onClick={onClose}>
            Create risk
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Unscoped object references on export endpoint"
          />
        </Field>
        <Field label="Description" hint="Auditors read this verbatim during sampling.">
          <Textarea placeholder="What could happen, to which system, and why it matters." />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Framework">
            <Select value={framework} onChange={(e) => setFramework(e.target.value)}>
              {["SOC 2", "ISO 27001", "GDPR", "PCI DSS"].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </Select>
          </Field>
          <Field label="Linked control">
            <Select value={control} onChange={(e) => setControl(e.target.value)}>
              {["CC6.1", "CC6.2", "CC7.2", "CC9.2", "A.8.9"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Owner">
            <Select value={owner} onChange={(e) => setOwner(e.target.value)}>
              {["Sarah Chen", "Linus Aarto", "Marcus Ryde", "Priya Raghavan"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </Select>
          </Field>
          <Field label="Treatment">
            <Select value={treatment} onChange={(e) => setTreatment(e.target.value)}>
              {["Mitigate", "Accept", "Transfer", "Avoid"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Likelihood (1–5)">
            <Input
              type="number"
              min={1}
              max={5}
              value={likelihood}
              onChange={(e) => setLikelihood(e.target.value)}
            />
          </Field>
          <Field label="Impact (1–5)">
            <Input
              type="number"
              min={1}
              max={5}
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
