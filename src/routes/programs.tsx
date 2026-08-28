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
import {
  baselineCounts,
  programStatusTone,
  programs,
  type ImpactLevel,
} from "@/lib/grc-data";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: "Programs — Equinox GRC" },
      {
        name: "description",
        content:
          "Assess systems against NIST SP 800-53 Rev. 5 baselines: FIPS-199 categorization, tailored control sets, assessment progress, and authorization state.",
      },
      { property: "og:title", content: "Programs — Equinox GRC" },
      {
        property: "og:description",
        content:
          "System assessment programs mapped to NIST SP 800-53 Rev. 5 baselines and authorization state.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgramsLayout,
});

function ProgramsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/programs") return <Outlet />;
  return (
    <Shell>
      <ProgramList />
    </Shell>
  );
}

const tabs = [
  { label: "All", count: programs.length },
  { label: "In assessment", count: 1 },
  { label: "Authorized", count: 1 },
  { label: "POA&M open", count: 1 },
  { label: "Draft", count: 1 },
];

function ProgramList() {
  const [tab, setTab] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const rows = useMemo(
    () => (tab === "All" ? programs : programs.filter((p) => p.status === tab)),
    [tab],
  );

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="animate-slide-up space-y-4">
      <PageHeader
        title="Programs"
        description="Each program scopes one system, categorizes it under FIPS-199, and assesses the tailored NIST SP 800-53 Rev. 5 baseline it inherits."
        actions={
          <>
            <Button variant="secondary">
              <Download className="size-3.5" /> Export SSP
            </Button>
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus className="size-3.5" /> New program
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
        <FilterChip label="Baseline" value="Rev. 5" active />
        <FilterChip label="Impact" />
        <FilterChip label="Owner" />
        <FilterChip label="Assessor" />
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
              Reassign assessor
            </Button>
            <Button variant="secondary" size="sm">
              Schedule assessment
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              Clear
            </Button>
          </span>
        </div>
      ) : null}

      <Table>
        <thead>
          <tr>
            <Th className="w-8 pr-0" />
            <Th className="w-[92px]">Program</Th>
            <Th>System</Th>
            <Th className="w-[104px]">Impact</Th>
            <Th className="w-[132px]">Baseline</Th>
            <Th className="w-[168px]">Assessment</Th>
            <Th className="w-[124px]">Status</Th>
            <Th className="w-[120px]">Owner</Th>
            <Th className="w-[112px] text-right">Expires</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const pct = Math.round((p.controlsAssessed / p.controlsTotal) * 100);
            return (
              <Tr key={p.id} className="group">
                <Td className="w-8 pr-0">
                  <input
                    type="checkbox"
                    aria-label={`Select ${p.id}`}
                    checked={selected.includes(p.id)}
                    onChange={() => toggle(p.id)}
                    className="size-3.5 accent-[oklch(0.55_0.19_258)]"
                  />
                </Td>
                <Td className="w-[92px]">
                  <Mono>{p.id}</Mono>
                </Td>
                <Td>
                  <Link
                    to="/programs/$programId"
                    params={{ programId: p.id }}
                    className="font-medium text-foreground group-hover:text-primary"
                  >
                    {p.name}
                  </Link>
                  <span className="ml-2 text-muted-foreground">{p.system}</span>
                </Td>
                <Td className="w-[104px]">
                  <Badge
                    tone={p.impact === "High" ? "danger" : p.impact === "Moderate" ? "warning" : "neutral"}
                  >
                    {p.impact}
                  </Badge>
                </Td>
                <Td className="w-[132px] text-muted-foreground">Rev. 5 · {p.impact}</Td>
                <Td className="w-[168px]">
                  <span className="flex items-center gap-2">
                    <span className="w-16">
                      <Meter value={pct} tone={pct === 100 ? "success" : "info"} />
                    </span>
                    <span className="tnum text-muted-foreground">
                      {p.controlsAssessed}/{p.controlsTotal}
                    </span>
                  </span>
                </Td>
                <Td className="w-[124px]">
                  <Badge tone={programStatusTone[p.status]}>{p.status}</Badge>
                </Td>
                <Td className="w-[120px] text-muted-foreground">{p.owner}</Td>
                <Td className="tnum w-[112px] text-right text-muted-foreground">{p.expires}</Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>

      <div className="flex items-center justify-between border-t border-border pt-3 text-[13px] text-muted-foreground">
        <span className="tnum">
          {rows.length} of {programs.length} programs
        </span>
        <span className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled>
            Previous
          </Button>
          <Button variant="secondary" size="sm" disabled>
            Next
          </Button>
        </span>
      </div>

      <CreateProgram open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

/* ------------------------------------------------------- Create program */

const levels: ImpactLevel[] = ["Low", "Moderate", "High"];
const rank: Record<ImpactLevel, number> = { Low: 0, Moderate: 1, High: 2 };

function CreateProgram({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [system, setSystem] = useState("");
  const [type, setType] = useState("Major application");
  const [environment, setEnvironment] = useState("AWS GovCloud");
  const [owner, setOwner] = useState("Grace Hoppel");
  const [assessor, setAssessor] = useState("Whitcombe LLP");
  const [c, setC] = useState<ImpactLevel>("Moderate");
  const [i, setI] = useState<ImpactLevel>("Moderate");
  const [a, setA] = useState<ImpactLevel>("Low");
  const [inherit, setInherit] = useState(true);
  const [notes, setNotes] = useState("");

  const impact = levels[Math.max(rank[c], rank[i], rank[a])] as ImpactLevel;
  const total = baselineCounts[impact];
  const inherited = inherit ? Math.round(total * 0.16) : 0;

  const close = () => {
    onClose();
    setStep(1);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      width="lg"
      title="Create a program"
      description={`Step ${step} of 3 · ${
        step === 1 ? "System scope" : step === 2 ? "FIPS-199 categorization" : "Baseline and assessment"
      }`}
      aside={
        <div className="space-y-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Derived baseline
          </div>
          <div>
            <div className="text-[20px] font-semibold tracking-[-0.02em]">
              NIST 800-53 Rev. 5
            </div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              {impact} baseline · high-water mark of C/I/A
            </div>
          </div>
          <dl className="divide-y divide-border border-y border-border">
            {[
              ["Controls in baseline", String(total)],
              ["Inherited from idp-core", String(inherited)],
              ["To assess", String(total - inherited)],
              ["Confidentiality", c],
              ["Integrity", i],
              ["Availability", a],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 py-1.5">
                <dt className="text-[12px] text-muted-foreground">{k}</dt>
                <dd className="tnum text-[12px] font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Every control in the baseline is created as an assessable item linked to this
            program. Tailoring can mark controls not applicable after creation.
          </p>
        </div>
      }
      footer={
        <>
          <Button variant="ghost" onClick={step === 1 ? close : () => setStep(step - 1)}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" onClick={close}>
              Create program
            </Button>
          )}
        </>
      }
    >
      {step === 1 ? (
        <div className="space-y-3">
          <Field label="Program name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Atlas payments platform"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="System identifier" hint="Matches the inventory record.">
              <Input
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                placeholder="atlas-prod"
              />
            </Field>
            <Field label="System type">
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option>Major application</option>
                <option>General support system</option>
                <option>Minor application</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Environment">
              <Select value={environment} onChange={(e) => setEnvironment(e.target.value)}>
                <option>AWS GovCloud</option>
                <option>AWS Commercial</option>
                <option>Azure</option>
                <option>On-premise</option>
              </Select>
            </Field>
            <Field label="System owner">
              <Select value={owner} onChange={(e) => setOwner(e.target.value)}>
                <option>Grace Hoppel</option>
                <option>Marcus Ryde</option>
                <option>Dana Whitlock</option>
                <option>Priya Raghavan</option>
              </Select>
            </Field>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <p className="text-[13px] text-muted-foreground">
            Rate the potential impact of a loss for each security objective. The baseline is
            set by the high-water mark.
          </p>
          <div className="divide-y divide-border border-y border-border">
            {(
              [
                ["Confidentiality", c, setC],
                ["Integrity", i, setI],
                ["Availability", a, setA],
              ] as const
            ).map(([label, value, set]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                <div>
                  <div className="text-[13px] font-medium">{label}</div>
                  <div className="text-[12px] text-muted-foreground">
                    FIPS-199 potential impact
                  </div>
                </div>
                <div className="flex items-center rounded-md shadow-button">
                  {levels.map((l) => (
                    <button
                      key={l}
                      onClick={() => set(l)}
                      className={
                        (value === l
                          ? "bg-primary-soft font-medium text-primary "
                          : "text-muted-foreground hover:text-foreground ") +
                        "h-7 px-2.5 text-[12px] transition-colors first:rounded-l-md last:rounded-r-md"
                      }
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Field label="Categorization rationale">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Processes cardholder data for settlement; loss of confidentiality has severe financial and reputational impact."
            />
          </Field>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <div className="rounded-md border border-border px-3 py-2.5">
            <div className="text-[13px] font-medium">
              NIST SP 800-53 Rev. 5 — {impact} baseline
            </div>
            <div className="tnum mt-0.5 text-[12px] text-muted-foreground">
              {total} controls and enhancements will be added to this program.
            </div>
          </div>
          <label className="flex items-start gap-2.5 py-1">
            <input
              type="checkbox"
              checked={inherit}
              onChange={(e) => setInherit(e.target.checked)}
              className="mt-0.5 size-3.5 accent-[oklch(0.55_0.19_258)]"
            />
            <span>
              <span className="block text-[13px] font-medium">
                Inherit common controls from idp-core
              </span>
              <span className="block text-[12px] text-muted-foreground">
                IA and AC family controls provided by the corporate identity provider are
                marked inherited and satisfied.
              </span>
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Assessor">
              <Select value={assessor} onChange={(e) => setAssessor(e.target.value)}>
                <option>Whitcombe LLP</option>
                <option>Internal assessment team</option>
                <option>Unassigned</option>
              </Select>
            </Field>
            <Field label="Target authorization date">
              <Input type="date" defaultValue="2026-12-15" />
            </Field>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
