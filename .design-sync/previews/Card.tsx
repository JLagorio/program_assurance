import { Badge, Button, Card, CardHeader } from "program-assurance";

export function WithHeader() {
  return (
    <Card className="max-w-lg">
      <CardHeader
        title="Authorization boundary"
        description="Systems and services covered by this ATO."
        action={
          <Button variant="secondary" size="sm">
            Edit boundary
          </Button>
        }
      />
      <div className="p-4 text-[13px] text-muted-foreground">
        3 systems, 2 inherited providers. Last reviewed Jan 12, 2026 by the assessment team.
      </div>
    </Card>
  );
}

export function Plain() {
  return (
    <Card className="max-w-sm p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium">Continuous monitoring</span>
        <Badge tone="success">Healthy</Badge>
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">
        Weekly scan uploads current through Feb 21, 2026.
      </p>
    </Card>
  );
}
