import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  Id,
  IndexPage,
  Inline,
  PageHeader,
  Progress,
  Table,
} from "@ledger/design-system";
import { Shell } from "@/components/app/shell";

export const Route = createFileRoute("/vendors")({
  head: () => ({
    meta: [
      { title: "Vendor registry — Equinox GRC" },
      {
        name: "description",
        content:
          "Sub-processor inventory with data classification, assurance report status, review dates, and residual vendor risk score.",
      },
      { property: "og:title", content: "Vendor registry — Equinox GRC" },
      {
        property: "og:description",
        content: "Sub-processor inventory, assurance reports, review dates and vendor risk scores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Vendors,
});

type Vendor = {
  name: string;
  domain: string;
  data: string;
  report: string;
  reportTone: "success" | "warning" | "danger";
  tier: string;
  score: number;
  review: string;
};

const vendors: Vendor[] = [
  {
    name: "Northwind Analytics",
    domain: "northwind.io",
    data: "Customer PII",
    report: "Expired",
    reportTone: "danger",
    tier: "Critical",
    score: 74,
    review: "Overdue 58d",
  },
  {
    name: "Larkspur Cloud",
    domain: "larkspur.com",
    data: "Infrastructure",
    report: "SOC 2 II",
    reportTone: "success",
    tier: "Critical",
    score: 21,
    review: "Jan 12, 2027",
  },
  {
    name: "Cobalt Mail",
    domain: "cobaltmail.co",
    data: "Contact data",
    report: "SOC 2 II",
    reportTone: "success",
    tier: "Standard",
    score: 18,
    review: "Nov 03, 2026",
  },
  {
    name: "Meridian Payroll",
    domain: "meridianhr.com",
    data: "Employee PII",
    report: "ISO 27001",
    reportTone: "success",
    tier: "Critical",
    score: 33,
    review: "Dec 01, 2026",
  },
  {
    name: "Tessellate Support",
    domain: "tessellate.app",
    data: "Support tickets",
    report: "Under review",
    reportTone: "warning",
    tier: "Standard",
    score: 44,
    review: "Sep 22, 2026",
  },
  {
    name: "Pinehurst Legal",
    domain: "pinehurstlaw.com",
    data: "Contracts",
    report: "None",
    reportTone: "warning",
    tier: "Low",
    score: 12,
    review: "Feb 18, 2027",
  },
];

function Vendors() {
  return (
    <Shell>
      <IndexPage
        header={
          <PageHeader
            title="Vendor registry"
            description="Every sub-processor with access to customer data, scored on the assurance evidence we hold today."
            actions={
              <>
                <Button variant="secondary">Send questionnaire</Button>
                <Button variant="primary">
                  <Plus className="size-icon-small" /> Add vendor
                </Button>
              </>
            }
          />
        }
      >
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Table.Header>Vendor</Table.Header>
                <Table.Header width={132}>Data accessed</Table.Header>
                <Table.Header width={96}>Tier</Table.Header>
                <Table.Header width={132}>Assurance</Table.Header>
                <Table.Header width={148}>Risk score</Table.Header>
                <Table.Header className="text-right" width={124}>
                  Next review
                </Table.Header>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <Table.Row key={vendor.name}>
                  <Table.Cell>
                    <div className="font-medium">{vendor.name}</div>
                    <Id>{vendor.domain}</Id>
                  </Table.Cell>
                  <Table.Cell>{vendor.data}</Table.Cell>
                  <Table.Cell>{vendor.tier}</Table.Cell>
                  <Table.Cell>
                    <Badge tone={vendor.reportTone}>{vendor.report}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Inline space="space.100" alignBlock="center">
                      <Progress
                        value={vendor.score}
                        tone={
                          vendor.score > 60 ? "danger" : vendor.score > 30 ? "warning" : "success"
                        }
                      />
                      <span className="tabular-nums shrink-0 text-right font-body-small font-medium w-250">
                        {vendor.score}
                      </span>
                    </Inline>
                  </Table.Cell>
                  <Table.Cell
                    className={
                      vendor.review.startsWith("Overdue") ? "text-right text-danger" : "text-right"
                    }
                  >
                    {vendor.review}
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Card>
      </IndexPage>
    </Shell>
  );
}
