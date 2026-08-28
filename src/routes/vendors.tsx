import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  Card,
  Meter,
  Mono,
  PageHeader,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";

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
  { name: "Northwind Analytics", domain: "northwind.io", data: "Customer PII", report: "Expired", reportTone: "danger", tier: "Critical", score: 74, review: "Overdue 58d" },
  { name: "Larkspur Cloud", domain: "larkspur.com", data: "Infrastructure", report: "SOC 2 II", reportTone: "success", tier: "Critical", score: 21, review: "Jan 12, 2027" },
  { name: "Cobalt Mail", domain: "cobaltmail.co", data: "Contact data", report: "SOC 2 II", reportTone: "success", tier: "Standard", score: 18, review: "Nov 03, 2026" },
  { name: "Meridian Payroll", domain: "meridianhr.com", data: "Employee PII", report: "ISO 27001", reportTone: "success", tier: "Critical", score: 33, review: "Dec 01, 2026" },
  { name: "Tessellate Support", domain: "tessellate.app", data: "Support tickets", report: "Under review", reportTone: "warning", tier: "Standard", score: 44, review: "Sep 22, 2026" },
  { name: "Pinehurst Legal", domain: "pinehurstlaw.com", data: "Contracts", report: "None", reportTone: "warning", tier: "Low", score: 12, review: "Feb 18, 2027" },
];

function Vendors() {
  return (
    <Shell>
      <div className="space-y-5 animate-slide-up">
        <PageHeader
          title="Vendor registry"
          description="Every sub-processor with access to customer data, scored on the assurance evidence we hold today."
          actions={
            <>
              <Button variant="secondary">Send questionnaire</Button>
              <Button variant="primary">
                <Plus className="size-3.5" /> Add vendor
              </Button>
            </>
          }
        />

        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th>Vendor</Th>
                <Th className="w-[132px]">Data accessed</Th>
                <Th className="w-[96px]">Tier</Th>
                <Th className="w-[132px]">Assurance</Th>
                <Th className="w-[148px]">Risk score</Th>
                <Th className="w-[124px] text-right">Next review</Th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <Tr key={vendor.name}>
                  <Td>
                    <div className="font-medium">{vendor.name}</div>
                    <Mono className="text-muted-foreground">{vendor.domain}</Mono>
                  </Td>
                  <Td className="text-muted-foreground">{vendor.data}</Td>
                  <Td className="text-muted-foreground">{vendor.tier}</Td>
                  <Td>
                    <Badge tone={vendor.reportTone}>{vendor.report}</Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Meter
                        value={vendor.score}
                        tone={vendor.score > 60 ? "danger" : vendor.score > 30 ? "warning" : "success"}
                      />
                      <span className="tnum w-5 shrink-0 text-right text-[12px] font-medium">
                        {vendor.score}
                      </span>
                    </div>
                  </Td>
                  <Td
                    className={
                      vendor.review.startsWith("Overdue")
                        ? "text-right text-[12px] font-medium text-danger"
                        : "text-right text-[12px] text-muted-foreground"
                    }
                  >
                    {vendor.review}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </Shell>
  );
}
