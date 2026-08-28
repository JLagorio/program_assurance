import { Badge, Button, Card, Section } from "program-assurance";

export function WithAction() {
  return (
    <Section
      title="Continuous monitoring"
      description="Signals collected from connected scanners over the last 30 days."
      action={<Button variant="secondary" size="sm">Configure</Button>}
    >
      <div className="flex gap-3 pt-4">
        <Card className="flex-1 p-4">
          <div className="text-[12px] text-muted-foreground">STIG compliance</div>
          <div className="mt-1 text-[20px] font-semibold tracking-tight">94.2%</div>
        </Card>
        <Card className="flex-1 p-4">
          <div className="text-[12px] text-muted-foreground">Open vulnerabilities</div>
          <div className="mt-1 text-[20px] font-semibold tracking-tight">37</div>
        </Card>
        <Card className="flex-1 p-4">
          <div className="text-[12px] text-muted-foreground">Scan coverage</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[20px] font-semibold tracking-tight">88%</span>
            <Badge tone="warning">2 hosts stale</Badge>
          </div>
        </Card>
      </div>
    </Section>
  );
}

export function TextBlock() {
  return (
    <Section title="Authorization boundary">
      <p className="max-w-2xl pt-3 text-[13px] leading-relaxed text-muted-foreground">
        The boundary includes the production VPC, the CI/CD pipeline, and the managed PostgreSQL
        cluster. Corporate identity services are inherited from the enterprise GSS and are outside
        this boundary.
      </p>
    </Section>
  );
}
