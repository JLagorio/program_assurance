import {
  Badge,
  Button,
  Card,
  CardHeader,
  Mono,
  PageHeader,
  Shell,
  Table,
  Td,
  Th,
  Tr,
} from "program-assurance";

export function AppFrame() {
  return (
    <Shell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Programs"
          title="GovCloud Payroll"
          description="Moderate baseline · Agency ATO · Continuous monitoring"
          actions={
            <>
              <Button variant="secondary">Export SSP</Button>
              <Button variant="primary">Submit for authorization</Button>
            </>
          }
        />
        <Card>
          <CardHeader
            title="Open findings"
            description="Weaknesses awaiting remediation or risk acceptance."
            action={<Button variant="secondary" size="sm">Add finding</Button>}
          />
          <Table>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Finding</Th>
                <Th>Severity</Th>
                <Th>Due</Th>
              </tr>
            </thead>
            <tbody>
              <Tr>
                <Td>
                  <Mono>F-2031</Mono>
                </Td>
                <Td>Audit logs not forwarded to SIEM</Td>
                <Td>
                  <Badge tone="warning">Moderate</Badge>
                </Td>
                <Td>Mar 14, 2026</Td>
              </Tr>
              <Tr>
                <Td>
                  <Mono>F-2027</Mono>
                </Td>
                <Td>Shared service account on build runner</Td>
                <Td>
                  <Badge tone="danger">High</Badge>
                </Td>
                <Td>Feb 06, 2026</Td>
              </Tr>
            </tbody>
          </Table>
        </Card>
      </div>
    </Shell>
  );
}
