import { UnavailableAction } from "@/components/app/unavailable-action";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Id,
  Inline,
  PageHeader,
  Shell,
  Stack,
} from "@ledger/design-system";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, FileDown } from "lucide-react";
import { useMemo, useState } from "react";

import {
  packages,
  packageStateTone,
  readiness,
  submissionsFor,
  type TraceRow,
} from "@/lib/packages";
import { statusTone } from "@/lib/spine";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Box,
  BreadcrumbLink,
  Count,
  Dot,
  Inspector,
  KeyValue,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
  ToggleGroup,
  ToggleGroupItem,
} from "@ledger/design-system";

export const Route = createFileRoute("/packages/$pkgId")({
  head: ({ params }) => {
    const p = packages.find((x) => x.id === params.pkgId);
    const title = p ? `${p.id} ${p.name} — authorization package` : "Package — Equinox";
    const description = p
      ? `${p.state} snapshot ${p.version} for ${p.program}, traced across ${p.ccisInScope.length} in-scope CCIs.`
      : "Authorization package snapshot with CCI traceability and generated artifacts.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PackageRecord,
});

const tabs = ["Traceability", "Artifacts", "Submission log"] as const;
type Tab = (typeof tabs)[number];

function resultTone(r: TraceRow["result"]) {
  if (r === "Met") return "success" as const;
  if (r === "Not met") return "danger" as const;
  if (r === "Partially met") return "warning" as const;
  return "neutral" as const;
}

function PackageRecord() {
  const { pkgId } = Route.useParams();
  const pkg = packages.find((p) => p.id === pkgId);
  const [tab, setTab] = useState<Tab>("Traceability");
  const [preview, setPreview] = useState<TraceRow | null>(null);
  const [gapsOnly, setGapsOnly] = useState(false);

  const ready = useMemo(() => (pkg ? readiness(pkg) : null), [pkg]);
  const log = useMemo(() => (pkg ? submissionsFor(pkg.id) : []), [pkg]);

  if (!pkg || !ready) {
    return (
      <Stack space="space.150">
        <h1 className="font-heading-small font-semibold">Package not found</h1>
        <TextLink size="medium" render={<Link to="/packages" />}>
          Back to packages
        </TextLink>
      </Stack>
    );
  }

  const traceRows = gapsOnly ? ready.rows.filter((r) => r.gap) : ready.rows;
  const counts: Record<Tab, number> = {
    Traceability: ready.rows.length,
    Artifacts: ready.artifacts.length,
    "Submission log": log.length,
  };

  return (
    <Stack className="animate-rise" space="space.200">
      <PageHeader>
        <Breadcrumb className="col-span-full">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/packages" />}>Packages</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                <Id>{pkg.id}</Id>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="min-w-0">
          <PageHeader.Title>{pkg.name}</PageHeader.Title>
          <Inline
            space="space.100"
            alignBlock="center"
            shouldWrap
            className="pt-050 font-body-small text-subtle"
          >{`${pkg.version} · ${pkg.program} · snapshot ${pkg.snapshotAt}`}</Inline>
        </div>
        <PageHeader.Actions>
          <>
            <Badge variant="secondary" tone={packageStateTone[pkg.state]}>
              {pkg.state}
            </Badge>
            <UnavailableAction
              reason="No receiving service is connected. Download artifacts from the program export workspace."
              variant="primary"
              disabled={!ready.shippable}
              iconBefore={<FileDown />}
            >
              Submit snapshot
            </UnavailableAction>
          </>
        </PageHeader.Actions>
      </PageHeader>

      {ready.gaps.length > 0 || ready.stale.length > 0 ? (
        <Alert tone="warning" role="status">
          <AlertTitle>
            <span aria-hidden="true" className="flex h-250 shrink-0 items-center">
              <Dot tone={"warning"} />
            </span>
            <span className="min-w-0 break-words">{`${pkg.id} is not shippable`}</span>
          </AlertTitle>
          <AlertDescription>
            {ready.gaps.length} of {ready.rows.length} in-scope CCIs have a traceability gap
            {ready.stale.length > 0
              ? ` and ${ready.stale.length} generated artifact${ready.stale.length === 1 ? " is" : "s are"} out of date with the snapshot`
              : ""}
            .
          </AlertDescription>
        </Alert>
      ) : null}

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
          {tab === "Traceability" ? (
            <Box paddingBlockStart="space.050">
              <ToggleGroup
                aria-label="Traceability filter"
                size="sm"
                value={[gapsOnly ? "gaps" : "all"]}
                onValueChange={([next]) => {
                  if (next !== undefined) setGapsOnly(next === "gaps");
                }}
              >
                <ToggleGroupItem value="all">All CCIs</ToggleGroupItem>
                <ToggleGroupItem value="gaps">Gaps only ({ready.gaps.length})</ToggleGroupItem>
              </ToggleGroup>
            </Box>
          ) : null}

          <>
            <div className="min-w-0 lg:pe-300">
              {tab === "Traceability" ? (
                <Table className="table-fixed">
                  <thead>
                    <tr>
                      <Table.Header width={124}>CCI</Table.Header>
                      <Table.Header width={84}>Control</Table.Header>
                      <Table.Header>Statement</Table.Header>
                      <Table.Header width={104}>Objectives</Table.Header>
                      <Table.Header width={112}>Result</Table.Header>
                      <Table.Header width={64} className="text-right">
                        Open
                      </Table.Header>
                      <Table.Header width={72}>Worst</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {traceRows.map((r) => (
                      <Table.Row key={r.cci}>
                        <Table.Id
                          id={r.cci}
                          isActive={preview?.cci === r.cci}
                          onPreview={() => setPreview(r)}
                        />
                        <Table.Cell>
                          <Id>{r.control}</Id>
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          {r.gap ? (
                            <Inline
                              as="span"
                              display="inline-flex"
                              space="space.075"
                              alignBlock="center"
                            >
                              <AlertTriangle className="shrink-0 text-warning size-150" />
                              <span className="truncate">{r.statement}</span>
                            </Inline>
                          ) : (
                            r.statement
                          )}
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          {r.objectives.length ? (
                            <Id>{r.objectives.join(", ")}</Id>
                          ) : (
                            <span className="text-subtle">—</span>
                          )}
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          <Badge variant="secondary" tone={resultTone(r.result)}>
                            {r.result}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell className="tabular-nums text-right">
                          {r.openFindings}
                        </Table.Cell>
                        <Table.Cell>{r.worstSeverity}</Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              ) : null}

              {tab === "Artifacts" ? (
                <Table className="table-fixed">
                  <thead>
                    <tr>
                      <Table.Header width={72}>Kind</Table.Header>
                      <Table.Header>Artifact</Table.Header>
                      <Table.Header width={104}>Format</Table.Header>
                      <Table.Header width={116}>Generated</Table.Header>
                      <Table.Header width={60} className="text-right">
                        Pages
                      </Table.Header>
                      <Table.Header width={112}>State</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {ready.artifacts.map((a) => (
                      <Table.Row key={a.id}>
                        <Table.Cell>{a.kind}</Table.Cell>
                        <Table.Cell className="truncate">
                          <span className="truncate">{a.name}</span>
                          <Box
                            className="font-body-small text-subtle"
                            as="span"
                            paddingInlineStart="space.100"
                          >
                            {a.note}
                          </Box>
                        </Table.Cell>
                        <Table.Cell className="truncate">{a.format}</Table.Cell>
                        <Table.Cell className="truncate">{a.generated}</Table.Cell>
                        <Table.Cell className="tabular-nums text-right">
                          {a.pages || "—"}
                        </Table.Cell>
                        <Table.Cell className="truncate">
                          <Badge variant="secondary" tone={statusTone(a.state)}>
                            {a.state}
                          </Badge>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              ) : null}

              {tab === "Submission log" ? (
                <Table className="table-fixed">
                  <thead>
                    <tr>
                      <Table.Header width={116}>When</Table.Header>
                      <Table.Header width={176}>Actor</Table.Header>
                      <Table.Header width={168}>Action</Table.Header>
                      <Table.Header>Detail</Table.Header>
                    </tr>
                  </thead>
                  <tbody>
                    {log.map((s) => (
                      <Table.Row key={s.id}>
                        <Table.Cell className="truncate">{s.at}</Table.Cell>
                        <Table.Cell className="truncate">{s.actor}</Table.Cell>
                        <Table.Cell className="truncate">{s.action}</Table.Cell>
                        <Table.Cell className="truncate">{s.detail}</Table.Cell>
                      </Table.Row>
                    ))}
                  </tbody>
                </Table>
              ) : null}
            </div>
            {preview ? (
              <Shell.Panel title={preview.statement} onClose={() => setPreview(null)}>
                <Stack space="space.150" className="min-w-0">
                  <Inline space="space.100" alignBlock="center" shouldWrap>
                    <Id>{preview.cci}</Id>
                  </Inline>
                  {preview.gap ? (
                    <Box paddingBlockEnd="space.150">
                      <Alert tone="warning" role="status">
                        <AlertDescription>{preview.gap}</AlertDescription>
                      </Alert>
                    </Box>
                  ) : null}
                  <Inspector.Group title="Join keys">
                    <KeyValue label="Control">
                      <Id>{preview.control}</Id>
                    </KeyValue>
                    <KeyValue label="Package">
                      <Id>{pkg.id}</Id>
                    </KeyValue>
                    <KeyValue label="System">
                      <Id>{pkg.system}</Id>
                    </KeyValue>
                    <KeyValue label="Rules">
                      {preview.paths.length ? <Id>{preview.paths.join(", ")}</Id> : "—"}
                    </KeyValue>
                  </Inspector.Group>
                  <Inspector.Group title="Verification">
                    <KeyValue label="Objectives">
                      {preview.objectives.length ? (
                        <Id>{preview.objectives.join(", ")}</Id>
                      ) : (
                        "None"
                      )}
                    </KeyValue>
                    <KeyValue label="Result">
                      <Badge variant="secondary" tone={resultTone(preview.result)}>
                        {preview.result}
                      </Badge>
                    </KeyValue>
                    <KeyValue label="Open findings">{preview.openFindings}</KeyValue>
                    <KeyValue label="Worst severity">{preview.worstSeverity}</KeyValue>
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
