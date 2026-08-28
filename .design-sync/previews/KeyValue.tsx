import { Badge, KeyValue, Mono } from "program-assurance";

export function Properties() {
  return (
    <dl className="max-w-sm">
      <KeyValue label="Status">
        <Badge tone="warning">In remediation</Badge>
      </KeyValue>
      <KeyValue label="Finding">
        <Mono>F-2031</Mono>
      </KeyValue>
      <KeyValue label="Control">AU-6 — Audit Record Review</KeyValue>
      <KeyValue label="Assigned to">M. Chen</KeyValue>
      <KeyValue label="Due">Mar 14, 2026</KeyValue>
      <KeyValue label="System">Payments Gateway (PGW-PROD)</KeyValue>
    </dl>
  );
}
