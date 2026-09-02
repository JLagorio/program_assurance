import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  IdCell,
  KeyValue,
  Mono,
  IndexPage,
  PageHeader,
  PreviewRail,
  RailGroup,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
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
                <RefreshCw className="size-3.5" /> Regenerate stale
              </Button>
            }
          />
        }
      >
        <div className={preview ? "grid lg:grid-cols-[minmax(0,1fr)_272px]" : "grid"}>
          <div className="min-w-0 lg:pr-6">
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
                  <Th>Package</Th>
                  <Th>Name</Th>
                  <Th>Ver.</Th>
                  <Th>State</Th>
                  <Th>Snapshot</Th>
                  <Th>Owner</Th>
                  <Th className="text-right">Traced</Th>
                  <Th className="text-right">Gaps</Th>
                </tr>
              </thead>
              <tbody>
                {packages.map((p) => {
                  const r = readiness(p);
                  return (
                    <Tr
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => navigate({ to: "/packages/$pkgId", params: { pkgId: p.id } })}
                    >
                      <IdCell
                        id={p.id}
                        active={preview?.id === p.id}
                        onPreview={() => setPreview(p)}
                      />
                      <Td className="truncate font-medium">{p.name}</Td>
                      <Td className="tnum text-muted-foreground">{p.version}</Td>
                      <Td className="truncate">
                        <Badge tone={packageStateTone[p.state]}>{p.state}</Badge>
                      </Td>
                      <Td className="truncate text-[12px] text-muted-foreground">{p.snapshotAt}</Td>
                      <Td className="truncate text-muted-foreground">{p.owner}</Td>
                      <Td className="tnum text-right text-muted-foreground">{r.coverage}%</Td>
                      <Td className="tnum text-right">
                        {r.gaps.length > 0 ? (
                          <span className="font-medium text-danger">{r.gaps.length}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </Td>
                    </Tr>
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
                  className="text-primary hover:underline"
                >
                  Open package →
                </Link>
              }
            >
              <RailGroup title="Snapshot">
                <KeyValue label="Version">{preview.version}</KeyValue>
                <KeyValue label="State">
                  <Badge tone={packageStateTone[preview.state]}>{preview.state}</Badge>
                </KeyValue>
                <KeyValue label="Decision">{preview.decision}</KeyValue>
                <KeyValue label="Taken">{preview.snapshotAt}</KeyValue>
                <KeyValue label="Owner">{preview.owner}</KeyValue>
              </RailGroup>
              <RailGroup title="Join keys">
                <KeyValue label="Program">
                  <Mono>{preview.program}</Mono>
                </KeyValue>
                <KeyValue label="System">
                  <Mono>{preview.system}</Mono>
                </KeyValue>
                <KeyValue label="Submitted to">{preview.submittedTo}</KeyValue>
              </RailGroup>
              <RailGroup title="Readiness">
                <KeyValue label="CCIs in scope">{ready.rows.length}</KeyValue>
                <KeyValue label="Traced">{ready.coverage}%</KeyValue>
                <KeyValue label="Gaps">{ready.gaps.length}</KeyValue>
                <KeyValue label="Stale artifacts">{ready.stale.length}</KeyValue>
                <KeyValue label="Shippable">{ready.shippable ? "Yes" : "No"}</KeyValue>
              </RailGroup>
            </PreviewRail>
          ) : null}
        </div>
      </IndexPage>
    </Shell>
  );
}
