import { Badge, Button, PageHeader } from "program-assurance";

export function WithActions() {
  return (
    <PageHeader
      eyebrow="Programs / GC2-Cloud"
      title="GovCloud Payroll Modernization"
      description="FISMA Moderate · Agile authorization track · 421 controls in scope."
      actions={
        <>
          <Button variant="secondary">Export SSP</Button>
          <Button variant="primary">Submit for authorization</Button>
        </>
      }
    />
  );
}

export function WithEyebrowBadge() {
  return (
    <PageHeader
      eyebrow={
        <span className="flex items-center gap-2">
          Findings <Badge tone="danger">3 overdue</Badge>
        </span>
      }
      title="Plan of Action & Milestones"
      description="Weaknesses tracked to closure across all active programs."
      actions={<Button variant="primary">Add item</Button>}
    />
  );
}

export function Minimal() {
  return <PageHeader title="Evidence library" />;
}
