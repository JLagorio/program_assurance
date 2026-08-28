import { Button } from "program-assurance";

export function Variants() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="primary">Submit for authorization</Button>
      <Button variant="secondary">Save draft</Button>
      <Button variant="ghost">Dismiss</Button>
      <Button variant="danger">Revoke ATO</Button>
      <Button variant="link">View evidence</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="primary" size="md">
        Add finding
      </Button>
      <Button variant="primary" size="sm">
        Add finding
      </Button>
      <Button variant="secondary" size="sm">
        Export CSV
      </Button>
    </div>
  );
}

export function Disabled() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="primary" disabled>
        Submit package
      </Button>
      <Button variant="secondary" disabled>
        Reassign
      </Button>
    </div>
  );
}
