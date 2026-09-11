import { UnavailableAction } from "@/components/app/unavailable-action";
import { Id, Inline, PageHeader, Shell, Stack } from "@ledger/design-system";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { packages, packageStateTone, readiness, type Pkg } from "@/lib/packages";
import { Badge, Inspector, KeyValue, Table, TextLink } from "@ledger/design-system";

export const Route = createFileRoute("/packages/")({
  head: () => ({
    meta: [
      { title: "Authorization packages — Equinox" },
      {
        name: "description",
        content:
          "PKG- snapshots of the spine: every in-scope CCI traced to the objective that proved it, the findings still open, and the SSP/SAR/POA&M generated from that snapshot.",
      },
      { property: "og:title", content: "Authorization packages — Equinox" },
      {
        property: "og:description",
        content: "Package readiness, CCI traceability and generated SSP/SAR/POA&M artifacts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PackagesIndex,
});

function PackagesIndex() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<Pkg | null>(null);
  const ready = preview ? readiness(preview) : null;

  return (
    <Stack space="space.200" className="min-w-0">
      <PageHeader>
        <div className="min-w-0">
          <PageHeader.Title>{"Authorization packages"}</PageHeader.Title>
        </div>
        <PageHeader.Actions>
          <UnavailableAction
            reason="Open the program export workspace to generate current artifacts."
            iconBefore={<RefreshCw />}
          >
            Regenerate stale
          </UnavailableAction>
        </PageHeader.Actions>
      </PageHeader>
      <>
        <div className="min-w-0 lg:pe-300">
          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Header width={112}>Package</Table.Header>
                <Table.Header>Name</Table.Header>
                <Table.Header width={68}>Ver.</Table.Header>
                <Table.Header width={124}>State</Table.Header>
                <Table.Header width={132}>Snapshot</Table.Header>
                <Table.Header width={96}>Owner</Table.Header>
                <Table.Header width={84} className="text-right">
                  Traced
                </Table.Header>
                <Table.Header width={84} className="text-right">
                  Gaps
                </Table.Header>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => {
                const r = readiness(p);
                return (
                  <Table.Row
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => navigate({ to: "/packages/$pkgId", params: { pkgId: p.id } })}
                  >
                    <Table.Id
                      id={p.id}
                      isActive={preview?.id === p.id}
                      onPreview={() => setPreview(p)}
                    />
                    <Table.Cell className="truncate">{p.name}</Table.Cell>
                    <Table.Cell className="tabular-nums">{p.version}</Table.Cell>
                    <Table.Cell className="truncate">
                      <Badge variant="secondary" tone={packageStateTone[p.state]}>
                        {p.state}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="truncate">{p.snapshotAt}</Table.Cell>
                    <Table.Cell className="truncate">{p.owner}</Table.Cell>
                    <Table.Cell className="tabular-nums text-right">{r.coverage}%</Table.Cell>
                    <Table.Cell className="tabular-nums text-right">
                      {r.gaps.length > 0 ? (
                        <span className="font-medium text-danger">{r.gaps.length}</span>
                      ) : (
                        <span className="text-subtle">0</span>
                      )}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </tbody>
          </Table>
        </div>
        {preview && ready ? (
          <Shell.Panel title={preview.name} onClose={() => setPreview(null)}>
            <Stack space="space.150" className="min-w-0">
              <Inline space="space.100" alignBlock="center" shouldWrap>
                <Id>{preview.id}</Id>
              </Inline>
              <div className="font-body">
                <TextLink render={<Link to="/packages/$pkgId" params={{ pkgId: preview.id }} />}>
                  Open package
                </TextLink>
              </div>
              <Inspector.Group title="Snapshot">
                <KeyValue label="Version">{preview.version}</KeyValue>
                <KeyValue label="State">
                  <Badge variant="secondary" tone={packageStateTone[preview.state]}>
                    {preview.state}
                  </Badge>
                </KeyValue>
                <KeyValue label="Decision">{preview.decision}</KeyValue>
                <KeyValue label="Taken">{preview.snapshotAt}</KeyValue>
                <KeyValue label="Owner">{preview.owner}</KeyValue>
              </Inspector.Group>
              <Inspector.Group title="Join keys">
                <KeyValue label="Program">
                  <Id>{preview.program}</Id>
                </KeyValue>
                <KeyValue label="System">
                  <Id>{preview.system}</Id>
                </KeyValue>
                <KeyValue label="Submitted to">{preview.submittedTo}</KeyValue>
              </Inspector.Group>
              <Inspector.Group title="Readiness">
                <KeyValue label="CCIs in scope">{ready.rows.length}</KeyValue>
                <KeyValue label="Traced">{ready.coverage}%</KeyValue>
                <KeyValue label="Gaps">{ready.gaps.length}</KeyValue>
                <KeyValue label="Stale artifacts">{ready.stale.length}</KeyValue>
                <KeyValue label="Shippable">{ready.shippable ? "Yes" : "No"}</KeyValue>
              </Inspector.Group>
            </Stack>
          </Shell.Panel>
        ) : null}
      </>
    </Stack>
  );
}
