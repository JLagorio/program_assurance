import { Button, Card, CardHeader, EmptyState } from "program-assurance";
import { FileSearch, ShieldCheck } from "lucide-react";

export function Basic() {
  return (
    <Card>
      <CardHeader title="Open findings" description="Weaknesses awaiting remediation or risk acceptance." />
      <EmptyState
        icon={<ShieldCheck />}
        title="No open findings"
        description="Every weakness from the last assessment cycle has been remediated or risk-accepted. New findings land here as assessments run."
        action={<Button variant="secondary" size="sm">View closed findings</Button>}
      />
    </Card>
  );
}

export function Filtered() {
  return (
    <Card>
      <EmptyState
        icon={<FileSearch />}
        title="No evidence matches these filters"
        description="Try clearing the source filter, or widen the date range."
        action={
          <>
            <Button variant="ghost" size="sm">Clear filters</Button>
            <Button variant="primary" size="sm">Upload evidence</Button>
          </>
        }
      />
    </Card>
  );
}
