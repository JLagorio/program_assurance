import { Select } from "program-assurance";

export function Severity() {
  return (
    <div style={{ maxWidth: 384 }}>
      <Select defaultValue="High">
        <option>Critical</option>
        <option>High</option>
        <option>Moderate</option>
        <option>Low</option>
        <option>Informational</option>
      </Select>
    </div>
  );
}

export function Families() {
  return (
    <div style={{ maxWidth: 384 }}>
      <Select defaultValue="AU — Audit and Accountability">
        <option>AC — Access Control</option>
        <option>AU — Audit and Accountability</option>
        <option>CM — Configuration Management</option>
        <option>IR — Incident Response</option>
        <option>SC — System and Communications Protection</option>
      </Select>
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ maxWidth: 384 }}>
      <Select disabled defaultValue="Moderate — inherited">
        <option>Moderate — inherited</option>
      </Select>
    </div>
  );
}
