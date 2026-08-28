import { Input } from "program-assurance";

export function Placeholder() {
  return (
    <div style={{ maxWidth: 384 }}>
      <Input placeholder="Search controls, findings, evidence…" />
    </div>
  );
}

export function Filled() {
  return (
    <div style={{ maxWidth: 384 }}>
      <Input defaultValue="GovCloud Payroll — ATO package v2" />
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ maxWidth: 384 }}>
      <Input disabled defaultValue="Inherited from FedRAMP baseline" />
    </div>
  );
}
