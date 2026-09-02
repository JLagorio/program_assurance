import { Textarea } from "program-assurance";

export function Placeholder() {
  return (
    <div style={{ maxWidth: 512 }}>
      <Textarea placeholder="Describe the weakness, affected assets, and planned remediation…" />
    </div>
  );
}

export function Filled() {
  return (
    <div style={{ maxWidth: 512 }}>
      <Textarea
        defaultValue={
          "Milestone 1: deploy log forwarder to app tier (complete).\nMilestone 2: enable TLS syslog to enterprise SIEM by Mar 14.\nMilestone 3: validate AU-6 weekly review against full record set."
        }
      />
    </div>
  );
}
