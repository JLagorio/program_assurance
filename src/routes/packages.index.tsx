import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

import {
  Badge,
  Button,
  Id,
  IndexPage,
  Inspector,
  KeyValue,
  PageHeader,
  PreviewRail,
  Table,
} from "@ledger/design-system";
import { PreviewSplit } from "@/components/app/preview-split";
import { Shell } from "@/components/app/shell";
import { packageStateTone, packages, readiness, type Pkg } from "@/lib/packages";

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
    <Shell>
      <IndexPage
        header={
          <PageHeader
            title="Authorization packages"
            description="A package is a snapshot of the spine, not a folder of documents. The SSP, SAR and POA&M are generated views of the same in-scope CCIs — if a CCI has no objective, no result, or an open finding it did not declare, the package is not shippable."
            actions={
              <Button>
                <RefreshCw className="size-icon-small" /> Regenerate stale
              </Button>
            }
          />
        }
      >
        <PreviewSplit open={preview !== null}>
          <div className="min-w-0 lg:pe-300">
            <Table className="table-fixed">
              <colgroup>
                <col style={{ width: "112px" }} />
                <col />
                <col style={{ width: "68px" }} />
                <col style={{ width: "124px" }} />
                <col style={{ width: "132px" }} />
                <col style={{ width: "96px" }} />
                <col style={{ width: "84px" }} />
                <col style={{ width: "84px" }} />
              </colgroup>
              <thead>
                <tr>
                  <Table.Header>Package</Table.Header>
                  <Table.Header>Name</Table.Header>
                  <Table.Header>Ver.</Table.Header>
                  <Table.Header>State</Table.Header>
                  <Table.Header>Snapshot</Table.Header>
                  <Table.Header>Owner</Table.Header>
                  <Table.Header className="text-right">Traced</Table.Header>
                  <Table.Header className="text-right">Gaps</Table.Header>
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
                        <Badge tone={packageStateTone[p.state]}>{p.state}</Badge>
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
            <PreviewRail
              id={preview.id}
              title={preview.name}
              onClose={() => setPreview(null)}
              openTo={
                <Link
                  to="/packages/$pkgId"
                  params={{ pkgId: preview.id }}
                  className="text-brand hover:underline"
                >
                  Open package →
                </Link>
              }
            >
              <Inspector.Group title="Snapshot">
                <KeyValue label="Version">{preview.version}</KeyValue>
                <KeyValue label="State">
                  <Badge tone={packageStateTone[preview.state]}>{preview.state}</Badge>
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
            </PreviewRail>
          ) : null}
        </PreviewSplit>
      </IndexPage>
    </Shell>
  );
}
