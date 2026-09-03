import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, ListFilter, Plus } from "lucide-react";

import {
  Badge,
  Box,
  Button,
  Combobox,
  Dialog,
  Field,
  FilterChip,
  Glance,
  Grid,
  HoverCard,
  Id,
  IndexPage,
  Inline,
  Input,
  NativeSelect,
  PageHeader,
  Pagination,
  Popover,
  Progress,
  RadioGroup,
  Spinner,
  Stack,
  Table,
  Tabs,
  Textarea,
  toast,
  usePage,
  useRequired,
  useSort,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";
import { riskStatusTone, risks, type Risk } from "@/lib/grc-data";

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

const riskSort = {
  id: (r: Risk) => r.id,
  title: (r: Risk) => r.title,
  framework: (r: Risk) => r.framework,
  owner: (r: Risk) => r.owner,
  treatment: (r: Risk) => r.treatment,
  residual: (r: Risk) => r.residual,
  status: (r: Risk) => r.status,
};

const treatments = ["All", "Mitigate", "Transfer", "Accept"] as const;

function RiskPeek({ risk: r }: { risk: Risk }) {
  return (
    <Glance
      id={r.id}
      title={r.title}
      meta={`${r.framework} · ${r.control} · ${r.team}`}
      status={
        <Badge tone={riskStatusTone[r.status]} size="xsmall">
          {r.status}
        </Badge>
      }
      facts={[
        { label: "Owner", value: r.owner },
        { label: "Treatment", value: r.treatment },
        { label: "Residual", value: `${r.residual} of ${r.inherent} inherent` },
        { label: "Due", value: r.due },
      ]}
    />
  );
}

function RiskList() {
  const [tab, setTab] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [treatment, setTreatment] = useState<(typeof treatments)[number]>("All");

  const filtered = useMemo(
    () =>
      risks.filter(
        (r) =>
          (tab === "All" || r.status === tab) && (treatment === "All" || r.treatment === treatment),
      ),
    [tab, treatment],
  );
  const sort = useSort(filtered, riskSort, { key: "id", dir: "desc" });
  const paged = usePage(sort.rows, 5);
  const rows = paged.rows;

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <IndexPage
      header={
        <PageHeader
          title="Risk register"
          description="24 tracked risks across 4 frameworks. Residual scores recalculate when linked controls change state."
          actions={
            <>
              <Button
                variant="secondary"
                disabled={exporting}
                onClick={() => {
                  setExporting(true);
                  window.setTimeout(() => {
                    setExporting(false);
                    toast.success("Risk register exported", {
                      description: `${filtered.length} risks · CSV with inherent and residual scores`,
                    });
                  }, 900);
                }}
              >
                {exporting ? <Spinner /> : <Download className="size-icon-small" />} Export
              </Button>
              <Button variant="primary" onClick={() => setCreating(true)}>
                <Plus className="size-icon-small" /> New risk
              </Button>
            </>
          }
        />
      }
    >
      <Tabs>
        {tabs.map((t) => (
          <Tabs.Tab
            key={t.label}
            isSelected={tab === t.label}
            onClick={() => setTab(t.label)}
            count={t.count}
          >
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs>

      <Inline space="space.100" alignBlock="center" shouldWrap>
        <FilterChip label="Framework" value="SOC 2" isActive />
        <FilterChip label="Owner" />
        <Popover
          width={180}
          trigger={
            <FilterChip
              label="Treatment"
              {...(treatment === "All" ? {} : { value: treatment, active: true })}
            />
          }
        >
          <RadioGroup
            value={treatment}
            onValueChange={(v) => setTreatment(v as (typeof treatments)[number])}
            aria-label="Treatment"
            className="space-y-100"
          >
            {treatments.map((t) => (
              <RadioGroup.Item key={t} value={t}>
                {t === "All" ? "Any treatment" : t}
              </RadioGroup.Item>
            ))}
          </RadioGroup>
        </Popover>
        <FilterChip label="Updated" />
        <Inline className="ml-auto" space="space.100" alignBlock="center">
          <Button variant="secondary" size="small">
            <ListFilter className="size-icon-small" /> Columns
          </Button>
        </Inline>
      </Inline>

      {selected.length > 0 ? (
        <Inline
          className="rounded-medium border border-brand bg-selected px-150 py-075 font-body text-brand"
          space="space.100"
          alignBlock="center"
        >
          <span className="tabular-nums font-medium">{selected.length} selected</span>
          <Inline className="ml-auto" as="span" space="space.100" alignBlock="center">
            <Button variant="secondary" size="small">
              Reassign
            </Button>
            <Button variant="secondary" size="small">
              Change treatment
            </Button>
            <Button variant="subtle" size="small" onClick={() => setSelected([])}>
              Clear
            </Button>
          </Inline>
        </Inline>
      ) : null}

      <div className="overflow-hidden rounded-large border border-default">
        <Table>
          <thead>
            <tr>
              <Table.Selection
                header
                checked={
                  selected.length > 0 && selected.length === rows.length
                    ? true
                    : selected.length > 0
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={(next) => setSelected(next ? rows.map((r) => r.id) : [])}
                label="Select all risks"
              />
              <Table.Header sort={sort.dir("id")} onSort={() => sort.toggle("id")} width={92}>
                ID
              </Table.Header>
              <Table.Header sort={sort.dir("title")} onSort={() => sort.toggle("title")}>
                Risk
              </Table.Header>
              <Table.Header
                sort={sort.dir("framework")}
                onSort={() => sort.toggle("framework")}
                width={88}
              >
                Framework
              </Table.Header>
              <Table.Header width={76}>Control</Table.Header>
              <Table.Header
                sort={sort.dir("owner")}
                onSort={() => sort.toggle("owner")}
                width={118}
              >
                Owner
              </Table.Header>
              <Table.Header
                sort={sort.dir("treatment")}
                onSort={() => sort.toggle("treatment")}
                width={88}
              >
                Treatment
              </Table.Header>
              <Table.Header
                sort={sort.dir("residual")}
                onSort={() => sort.toggle("residual")}
                width={130}
              >
                Residual
              </Table.Header>
              <Table.Header width={128}>Updated</Table.Header>
              <Table.Header
                className="text-right"
                sort={sort.dir("status")}
                onSort={() => sort.toggle("status")}
                width={96}
              >
                Status
              </Table.Header>
            </tr>
          </thead>
          <tbody>
            {rows.map((risk) => (
              <Table.Row key={risk.id} className="group" isSelected={selected.includes(risk.id)}>
                <Table.Selection
                  checked={selected.includes(risk.id)}
                  onCheckedChange={() => toggle(risk.id)}
                  label={`Select ${risk.id}`}
                />
                <Table.Cell>
                  <HoverCard content={<RiskPeek risk={risk} />} width={300}>
                    <Inline
                      tabIndex={0}
                      className="rounded-xsmall outline-none focus-visible:outline-focused"
                      as="span"
                      display="inline-flex"
                    >
                      <Id>{risk.id}</Id>
                    </Inline>
                  </HoverCard>
                </Table.Cell>
                <Table.Cell>
                  <Link
                    to="/risks/$riskId"
                    params={{ riskId: risk.id }}
                    className="font-medium underline-offset-2 group-hover:text-brand group-hover:underline"
                  >
                    {risk.title}
                  </Link>
                </Table.Cell>
                <Table.Cell>{risk.framework}</Table.Cell>
                <Table.Cell>
                  <Id>{risk.control}</Id>
                </Table.Cell>
                <Table.Cell>{risk.owner}</Table.Cell>
                <Table.Cell>{risk.treatment}</Table.Cell>
                <Table.Cell>
                  <Inline space="space.100" alignBlock="center">
                    <span className="tabular-nums text-right font-body-small text-subtlest line-through w-250">
                      {risk.inherent}
                    </span>
                    <Progress
                      value={risk.residual}
                      tone={
                        risk.residual > 60 ? "danger" : risk.residual > 30 ? "warning" : "success"
                      }
                    />
                    <span className="tabular-nums shrink-0 text-right font-body-small font-medium w-250">
                      {risk.residual}
                    </span>
                  </Inline>
                </Table.Cell>
                <Table.Cell>{risk.updated}</Table.Cell>
                <Table.Cell className="text-right">
                  <Badge tone={riskStatusTone[risk.status]}>{risk.status}</Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
        <Pagination
          page={paged.page}
          pageCount={paged.pageCount}
          onPageChange={paged.setPage}
          total={paged.total}
          pageSize={paged.pageSize}
          className="border-t border-default px-150 py-100"
        />
      </div>

      <CreateRiskModal open={creating} onClose={() => setCreating(false)} />
    </IndexPage>
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
  const req = useRequired({ title, owner });

  const inherent = Number(likelihood) * Number(impact) * 4;
  const residual = Math.round(inherent * (treatment === "Accept" ? 0.95 : 0.55));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="large"
      title="Create a risk"
      description="Risks inherit scoring from likelihood × impact and recalculate when the linked control changes state."
      aside={
        <div>
          <div className="font-heading-xxsmall uppercase text-subtle">Preview</div>
          <Box paddingBlockStart="space.150">
            <Box className="rounded-medium border border-default bg-surface" padding="space.150">
              <Id className="text-subtle">RSK-2431</Id>
              <Box className="font-body font-medium" paddingBlockStart="space.050">
                {title || "Untitled risk"}
              </Box>
              <Box className="font-body-small text-subtle" paddingBlockStart="space.050">
                {framework} · {control} · {owner}
              </Box>
              <dl className="pt-150 space-y-100 border-t border-default">
                <Inline className="font-body-small" alignBlock="center" spread="space-between">
                  <dt className="text-subtle">Inherent</dt>
                  <dd className="tabular-nums font-medium">{inherent}</dd>
                </Inline>
                <Inline className="font-body-small" alignBlock="center" spread="space-between">
                  <dt className="text-subtle">Residual</dt>
                  <dd className="tabular-nums font-medium">{residual}</dd>
                </Inline>
                <Progress
                  value={residual}
                  tone={residual > 60 ? "danger" : residual > 30 ? "warning" : "success"}
                />
              </dl>
            </Box>
          </Box>
          <p className="pt-150 font-body-small text-subtle">
            Creating this risk notifies {owner} and opens a treatment task due in 30 days.
          </p>
        </div>
      }
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Save draft
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!req.check()) return;
              onClose();
            }}
          >
            Create risk
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <Field isRequired error={req.errorFor("title")} label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Unscoped object references on export endpoint"
          />
        </Field>
        <Field label="Description" hint="Auditors read this verbatim during sampling.">
          <Textarea placeholder="What could happen, to which system, and why it matters." />
        </Field>
        <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
          <Field label="Framework">
            <NativeSelect value={framework} onChange={(e) => setFramework(e.target.value)}>
              {["SOC 2", "ISO 27001", "GDPR", "PCI DSS"].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Linked control">
            <NativeSelect value={control} onChange={(e) => setControl(e.target.value)}>
              {["CC6.1", "CC6.2", "CC7.2", "CC9.2", "A.8.9"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field isRequired error={req.errorFor("owner")} label="Owner">
            <Combobox
              value={owner}
              onChange={setOwner}
              options={["Sarah Chen", "Linus Aarto", "Marcus Ryde", "Priya Raghavan"].map(
                (name) => ({ value: name, label: name }),
              )}
              placeholder="Choose an owner"
              searchPlaceholder="Search people…"
              className="w-full"
            />
          </Field>
          <Field label="Treatment">
            <NativeSelect value={treatment} onChange={(e) => setTreatment(e.target.value)}>
              {["Mitigate", "Accept", "Transfer", "Avoid"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </NativeSelect>
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
        </Grid>
      </Stack>
    </Dialog>
  );
}
