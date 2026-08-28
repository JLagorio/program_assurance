import { Badge } from "program-assurance";
import { ShieldCheck, Clock } from "lucide-react";

export function Tones() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="neutral">Not assessed</Badge>
      <Badge tone="success">Satisfied</Badge>
      <Badge tone="warning">In remediation</Badge>
      <Badge tone="danger">Overdue</Badge>
      <Badge tone="info">Inherited</Badge>
    </div>
  );
}

export function WithIcon() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="success" icon={<ShieldCheck className="size-3" />}>
        ATO granted
      </Badge>
      <Badge tone="warning" icon={<Clock className="size-3" />}>
        Expires in 30 days
      </Badge>
    </div>
  );
}

export function StatusVocabulary() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="success">Implemented</Badge>
      <Badge tone="warning">Partially satisfied</Badge>
      <Badge tone="danger">Other than satisfied</Badge>
      <Badge tone="info">Planned</Badge>
      <Badge tone="neutral">Not applicable</Badge>
    </div>
  );
}
