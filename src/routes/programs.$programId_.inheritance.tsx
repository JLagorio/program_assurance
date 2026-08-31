import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import {
  ConflictList,
  InheritanceSummaryStats,
  NotApplicableTable,
  ObligationList,
  ResolutionRail,
  ResolutionTable,
  carriesObligation,
  obligationUnstated,
} from "@/components/app/inheritance-resolution";
import { Shell } from "@/components/app/shell";
import {
  Badge,
  KeyValue,
  Mono,
  RailGroup,
  RecordHeader,
  Section,
  ShowPage,
  TabStrip,
} from "@/components/app/ui";
import { programs } from "@/lib/grc-data";
import {
  inheritanceConflicts,
  inheritanceSummary,
  offeredNotApplicable,
  resolveInheritance,
} from "@/lib/inheritance";
import { systemComponents } from "@/lib/reusable-components";

const inheritanceTabs = ["Resolved", "Conflicts", "Obligations", "Not applicable"] as const;
type InheritanceTab = (typeof inheritanceTabs)[number];

/** "AC-2", "IA-5(1)" — the natural key `resolveInheritance` is keyed on. */
const controlKey = /^[A-Za-z]{2}-\d{1,3}(\(\d{1,3}\))?$/;

/** Counts read as prose on this page, and "1 controls" reads as a bug. */
function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export const Route = createFileRoute("/programs/$programId_/inheritance")({
  // Both keys are ALWAYS emitted, `undefined` included, and never spread from
  // the raw search: an unrecognised `?tab=` value is therefore replaced rather
  // than carried through, so the body always matches a tab instead of rendering
  // an empty page. The keys are declared optional only so a `<Link>` to this
  // route does not have to name them.
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: InheritanceTab | undefined; control?: string | undefined } => {
    const rawTab = String(search["tab"] ?? "");
    const tab = inheritanceTabs.find((t) => t.toLowerCase() === rawTab.toLowerCase());
    const rawControl = search["control"];
    const control =
      typeof rawControl === "string" && controlKey.test(rawControl) ? rawControl : undefined;
    return { tab, control };
  },
  loader: ({ params }) => {
    const program = programs.find((p) => p.id.toLowerCase() === params.programId.toLowerCase());
    if (!program) throw notFound();
    return program;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Program"} inheritance — Equinox` },
      {
        name: "description",
        content: `Inheritance and shared-responsibility resolution for ${loaderData?.id ?? "the program"}: which common control provider won each control, what the consuming system still owes, and which offers do not reach its inventory.`,
      },
      { property: "og:title", content: `${loaderData?.name ?? "Program"} inheritance — Equinox` },
      {
        property: "og:description",
        content:
          "Why this provider, and what do I still owe — the CCP tier ladder, the versioned acceptance, and every consumer obligation on a shared control.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgramInheritance,
});

function ProgramInheritance() {
  const program = Route.useLoaderData();
  const search = Route.useSearch();
  const tab = search.tab ?? "Resolved";
  const navigate = useNavigate({ from: Route.fullPath });

  // `resolveInheritance` memoises on the composition graph version and returns a
  // stable reference, so these are cheap to read on every render and stay honest
  // when a node is reclassified underneath them.
  const resolved = resolveInheritance(program.id);
  const notApplicable = offeredNotApplicable(program.id);
  const conflicts = inheritanceConflicts(program.id);
  const summary = inheritanceSummary(program.id);

  const rows = useMemo(
    () => [...resolved.values()].sort((a, b) => a.control.localeCompare(b.control)),
    [resolved],
  );

  // Deliberately NOT `consumerObligations`, which filters on the obligation text:
  // a shared row whose obligation was never written down is the gap this tab
  // exists to show, and filtering on the text is exactly what hides it.
  const obligations = useMemo(() => rows.filter(carriesObligation), [rows]);
  const unstated = useMemo(() => obligations.filter(obligationUnstated).length, [obligations]);

  const componentNames = useMemo(() => new Map(systemComponents.map((c) => [c.id, c.name])), []);
  const nameOf = (componentId: string) => componentNames.get(componentId) ?? componentId;

  const selected = useMemo(() => {
    const wanted = search.control ? resolved.get(search.control) : undefined;
    return wanted ?? rows[0] ?? null;
  }, [resolved, rows, search.control]);

  const go = (next: InheritanceTab) =>
    navigate({ search: { ...search, tab: next }, replace: true });

  const select = (control: string) => navigate({ search: { ...search, control }, replace: true });

  const counts: Record<InheritanceTab, number | null> = {
    Resolved: rows.length || null,
    Conflicts: conflicts.length || null,
    Obligations: obligations.length || null,
    "Not applicable": notApplicable.length || null,
  };

  const failing = summary.failed;
  const drifted = summary.drifted;
  const providerCount = new Set(rows.map((r) => r.component.id)).size;

  return (
    <Shell>
      <ShowPage
        header={
          <RecordHeader
            backTo="/programs/$programId"
            backParams={{ programId: program.id }}
            id={program.id}
            title={`${program.name} — inheritance resolution`}
            meta={`${program.system} · ${program.environment} · impact ${program.impact} · ${plural(rows.length, "inherited control")} from ${plural(providerCount, "provider")}`}
            actions={
              <>
                {failing > 0 ? (
                  <Badge tone="danger">{failing} provider failed</Badge>
                ) : (
                  <Badge tone="success">No failing provider</Badge>
                )}
                {unstated > 0 ? <Badge tone="danger">{unstated} obligation unstated</Badge> : null}
                <Link
                  to="/programs/$programId"
                  params={{ programId: program.id }}
                  className="text-[12.5px] text-primary hover:underline"
                >
                  Program record
                </Link>
              </>
            }
          />
        }
        tabs={
          <TabStrip
            items={inheritanceTabs.map((key) => ({
              key,
              label: key,
              active: tab === key,
              onSelect: () => go(key),
              trailing: counts[key] ? (
                <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                  {counts[key]}
                </span>
              ) : null,
            }))}
          />
        }
        showRail={tab === "Resolved" && selected !== null}
        rail={
          selected ? (
            <>
              <ResolutionRail row={selected} />
              <RailGroup title="Joins">
                <KeyValue label="Provider">
                  <Link
                    to="/library/components/$componentKey"
                    params={{ componentKey: selected.component.key }}
                    className="text-primary hover:underline"
                  >
                    <Mono className="text-primary">{selected.component.key}</Mono>
                  </Link>
                </KeyValue>
                <KeyValue label="Control">
                  <Link
                    to="/programs/$programId/controls/$controlId"
                    params={{ programId: program.id, controlId: selected.control }}
                    className="text-primary hover:underline"
                  >
                    <Mono className="text-primary">{selected.control}</Mono>
                  </Link>
                </KeyValue>
                <KeyValue label="Matrix">
                  <Link
                    to="/programs/$programId/sctm"
                    params={{ programId: program.id }}
                    className="text-primary hover:underline"
                  >
                    <span className="text-[12.5px]">Open the SCTM</span>
                  </Link>
                </KeyValue>
                <KeyValue label="Program">
                  <Link
                    to="/programs/$programId"
                    params={{ programId: program.id }}
                    className="text-primary hover:underline"
                  >
                    <Mono className="text-primary">{program.id}</Mono>
                  </Link>
                </KeyValue>
              </RailGroup>
            </>
          ) : null
        }
      >
        {tab === "Resolved" ? (
          <>
            <Section
              title="Inheritance posture"
              description="Every offer a reusable component makes to this system, resolved against the CCP tier ladder and checked against what the consumer actually accepted. A failing provider stays a deficiency here — it is never re-scored as Not assessed, because that would sever the POA&M obligation."
            >
              <InheritanceSummaryStats summary={summary} unstated={unstated} />
            </Section>

            <Section
              title="Resolved controls"
              description={`${plural(rows.length, "control")} reach this system. ${drifted} of them were accepted at a version the provider has since moved past; ${summary.current} are current. Select a row to see why that provider won and what is still owed.`}
            >
              <ResolutionTable rows={rows} selected={selected?.control ?? null} onSelect={select} />
            </Section>
          </>
        ) : null}

        {tab === "Conflicts" ? (
          <Section
            title="Why this provider"
            description="Two components offered the same control. The nearer provider on the eMASS common-control-provider ladder wins, because that is who the AO holds accountable — but the candidate that lost is kept on the record with the reason, not dropped."
          >
            <div className="pt-1">
              <ConflictList items={conflicts} nameOf={nameOf} />
            </div>
          </Section>
        ) : null}

        {tab === "Obligations" ? (
          <Section
            title="What this system still owes"
            description={
              obligations.length === 0
                ? "Nothing on this system carries residual work on an inherited control: every offer it accepted is implemented by the provider end to end."
                : `${plural(obligations.length, "control")} carry residual work on this side of the boundary — the provider implements part of the control and names the rest as the consumer's. ${
                    unstated > 0
                      ? `${unstated} of them name no obligation at all, which is the gap: shared responsibility that nobody has written down.`
                      : "Each one states what is owed."
                  }`
            }
          >
            <div className="pt-1">
              <ObligationList rows={obligations} />
            </div>
          </Section>
        ) : null}

        {tab === "Not applicable" ? (
          <Section
            title="Offered but not applicable"
            description="A provider listed this system as a consumer, but the offer is scoped to inventory the system does not carry. These belong in the inherited-controls appendix with the reason, not in the matrix — and not silently missing from either."
          >
            <NotApplicableTable rows={notApplicable} />
          </Section>
        ) : null}
      </ShowPage>
    </Shell>
  );
}
