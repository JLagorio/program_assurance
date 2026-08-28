import { Badge, Button, Field, Input, KeyValue, Modal, Select, Textarea } from "program-assurance";

export function CreateFinding() {
  return (
    <Modal
      open
      onClose={() => {}}
      title="New finding"
      description="Document a weakness identified during assessment."
      footer={
        <>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Create finding</Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Field label="Title">
          <Input placeholder="e.g. Audit logs not forwarded to SIEM" />
        </Field>
        <Field label="Severity">
          <Select defaultValue="Moderate">
            <option>Critical</option>
            <option>High</option>
            <option>Moderate</option>
            <option>Low</option>
          </Select>
        </Field>
        <Field label="Description" hint="Reference the affected control and evidence.">
          <Textarea placeholder="AU-6(1): analysis of audit records is manual only…" />
        </Field>
      </div>
    </Modal>
  );
}

export function WithAside() {
  return (
    <Modal
      open
      onClose={() => {}}
      width="lg"
      title="Finding F-2031"
      description="Audit logs not forwarded to SIEM"
      aside={
        <dl>
          <KeyValue label="Status">
            <Badge tone="warning">In remediation</Badge>
          </KeyValue>
          <KeyValue label="Control">AU-6</KeyValue>
          <KeyValue label="Assigned to">M. Chen</KeyValue>
          <KeyValue label="Due">Mar 14, 2026</KeyValue>
        </dl>
      }
      footer={<Button variant="primary">Save changes</Button>}
    >
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        Audit records from the application tier are retained locally but are not forwarded to the
        enterprise SIEM. Correlation and weekly review required by AU-6 cannot be performed against
        the full record set.
      </p>
    </Modal>
  );
}
