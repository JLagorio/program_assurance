import { Badge, Button, KeyValue, Mono, RailGroup } from "program-assurance";

export function DetailRail() {
  return (
    <div style={{ width: 300 }}>
      <RailGroup title="Details" action={<Button variant="ghost" size="sm">Edit</Button>}>
        <KeyValue label="Status">
          <Badge tone="info">In assessment</Badge>
        </KeyValue>
        <KeyValue label="System ID">
          <Mono>SYS-0142</Mono>
        </KeyValue>
        <KeyValue label="Impact level">Moderate (FIPS-199)</KeyValue>
        <KeyValue label="Authorizing official">D. Alvarez</KeyValue>
      </RailGroup>
      <RailGroup title="Key dates">
        <KeyValue label="ATO granted">Jun 02, 2025</KeyValue>
        <KeyValue label="ATO expires">Jun 01, 2028</KeyValue>
        <KeyValue label="Last assessed">Feb 11, 2026</KeyValue>
      </RailGroup>
    </div>
  );
}

export function Collapsed() {
  return (
    <div style={{ width: 300 }}>
      <RailGroup title="Inherited controls" defaultOpen={false}>
        <KeyValue label="Provider">FedRAMP GovCloud</KeyValue>
      </RailGroup>
    </div>
  );
}
