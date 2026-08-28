import { Badge, Button, Card, CardHeader } from "program-assurance";

export function Titles() {
  return (
    <Card className="max-w-lg">
      <CardHeader
        title="Assessment schedule"
        description="Annual assessment and interim checkpoints for this package."
      />
    </Card>
  );
}

export function Actions() {
  return (
    <Card className="max-w-lg">
      <CardHeader
        title="Evidence requests"
        action={
          <>
            <Badge tone="info">4 open</Badge>
            <Button variant="secondary" size="sm">
              Request evidence
            </Button>
          </>
        }
      />
    </Card>
  );
}
