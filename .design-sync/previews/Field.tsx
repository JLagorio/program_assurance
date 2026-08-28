import { Field, Input, Select } from "program-assurance";

export function WithHint() {
  return (
    <div style={{ maxWidth: 384 }}>
      <Field label="POA&M item" hint="Weakness title as it will appear in the POA&M export.">
        <Input placeholder="e.g. Audit logs not forwarded to SIEM" />
      </Field>
    </div>
  );
}

export function FormGrid() {
  return (
    <div className="grid grid-cols-2 gap-3" style={{ maxWidth: 512 }}>
      <Field label="Assigned to">
        <Input defaultValue="M. Chen" />
      </Field>
      <Field label="Due date">
        <Input type="date" defaultValue="2026-03-14" />
      </Field>
      <Field label="Severity">
        <Select defaultValue="Moderate">
          <option>Critical</option>
          <option>High</option>
          <option>Moderate</option>
          <option>Low</option>
        </Select>
      </Field>
      <Field label="Affected control" hint="NIST SP 800-53 control ID.">
        <Input defaultValue="AU-6" />
      </Field>
    </div>
  );
}
